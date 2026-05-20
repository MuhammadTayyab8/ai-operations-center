from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException, UploadFile, File, Form
from google.cloud import firestore
from datetime import datetime
import asyncio

from typing import List
from app.db.database import get_db
from app.schemas.enums import WorkflowStatus
from app.schemas.operations import WorkflowApproveRequest, WorkflowStatusResponse
from app.workflows.orchestrator import run_ai_pipeline, run_execution
from app.streaming.sse_manager import sse_manager
from app.utils.file_parser import extract_file_content

router = APIRouter(prefix="/workflows", tags=["Operations Center"])

@router.post("/trigger")
async def trigger_workflow(
    background_tasks: BackgroundTasks,
    db: firestore.Client = Depends(get_db),
    user_input: str = Form(None),
    category: str = Form(None),
    file: UploadFile = File(None)
):
    doc_ref = db.collection("workflows").document()
    
    # Process file if provided
    extracted_text = ""
    if file:
        file_bytes = await file.read()
        extracted_text = extract_file_content(file.filename, file.content_type, file_bytes)
        if "IMAGE_UPLOADED" in extracted_text:
            # For simplicity, pass the bytes or handle image parsing separately inside pipeline
            pass
            
    # Combine context
    combined_input = f"Category: {category}\n" if category else ""
    if user_input: combined_input += f"User Note: {user_input}\n"
    if extracted_text: combined_input += f"Extracted File Content: {extracted_text}\n"
    
    workflow_data = {
        "trigger_source": combined_input,
        "category": category,
        "status": WorkflowStatus.PROCESSING.value,
        "context_data": None,
        "created_at": datetime.utcnow().isoformat(),
        "id": doc_ref.id
    }
    
    doc_ref.set(workflow_data)
    
    # Start the orchestrator in the background
    background_tasks.add_task(run_ai_pipeline, doc_ref.id, combined_input, category)
    
    return {"message": "Workflow started", "workflow_id": doc_ref.id}

@router.get("/{workflow_id}/status", response_model=WorkflowStatusResponse)
def get_workflow_status(workflow_id: str, db: firestore.Client = Depends(get_db)):
    doc = db.collection("workflows").document(str(workflow_id)).get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Workflow not found")
        
    workflow_data = doc.to_dict()
    
    return WorkflowStatusResponse(
        id=workflow_data.get("id", workflow_id),
        status=workflow_data.get("status"),
        context_data=workflow_data.get("context_data"),
        action_log=workflow_data.get("action_log")
    )

@router.post("/{workflow_id}/approve")
def approve_workflow(workflow_id: str, request: WorkflowApproveRequest, background_tasks: BackgroundTasks, db: firestore.Client = Depends(get_db)):
    doc_ref = db.collection("workflows").document(str(workflow_id))
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Workflow not found")
        
    workflow_data = doc.to_dict()
        
    if workflow_data.get("status") != WorkflowStatus.PENDING_APPROVAL.value:
        raise HTTPException(status_code=400, detail="Workflow is not pending approval")
        
    if request.approved:
        doc_ref.update({"status": WorkflowStatus.APPROVED.value})
        
        # Start execution in background
        background_tasks.add_task(run_execution, workflow_id)
        return {"message": "Workflow approved and executing"}
    else:
        doc_ref.update({"status": WorkflowStatus.REJECTED.value})
        # Note: sse_manager.emit is async, we can't await it here unless the route is async.
        # But we made the route sync. We can run it in event loop or background task.
        background_tasks.add_task(emit_rejection, workflow_id)
        return {"message": "Workflow rejected"}

async def emit_rejection(workflow_id: str):
    await sse_manager.emit(str(workflow_id), "Workflow failed") # Closes stream

@router.get("/", response_model=List[dict])
def get_workflows(db: firestore.Client = Depends(get_db)):
    workflows_ref = db.collection("workflows")
    # Stream recent workflows ordered by created_at desc
    docs = workflows_ref.order_by("created_at", direction=firestore.Query.DESCENDING).limit(20).stream()
    
    workflows = []
    for doc in docs:
        w_data = doc.to_dict()
        w_data["id"] = doc.id
        workflows.append(w_data)
        
    return workflows

