import json
import asyncio
import os
from google.cloud import firestore
from google import genai
from app.db.database import get_db
from app.schemas.enums import WorkflowStatus
from app.streaming.sse_manager import sse_manager
from app.agents.intake import analyze_input
from app.agents.insight import generate_insights
from app.agents.decision import make_decision
from app.agents.execution import execute_action
from app.tools.analytics import get_regional_sales_summary, get_low_stock_summary

# It's recommended to initialize the client explicitly or let it pick up GEMINI_API_KEY from environment
client = genai.Client()

async def run_ai_pipeline(workflow_id: str, combined_input: str, category: str = None):
    str_id = str(workflow_id)
    
    # We use next(get_db()) to get the firestore client
    db = next(get_db())
    doc_ref = db.collection("workflows").document(str_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        return
            
    try:
        await sse_manager.emit(str_id, "Parsing report...")
        # 1. Intake
        classification = analyze_input(client, combined_input, category)
        
        await sse_manager.emit(str_id, "Understanding business context...")
        await sse_manager.emit(str_id, "Detecting anomalies...")
        # 2. Insight
        sales_data = get_regional_sales_summary(db)
        inventory_data = get_low_stock_summary(db)
        
        await sse_manager.emit(str_id, "Generating insights...")
        insight = generate_insights(client, classification, sales_data, inventory_data, combined_input)
        
        await sse_manager.emit(str_id, "Creating recommendations...")
        # 3. Decision
        decision = make_decision(client, insight)
        
        # Save decision to context
        doc_ref.update({
            "context_data": decision.model_dump(),
            "status": WorkflowStatus.PENDING_APPROVAL.value
        })
        
        await sse_manager.emit(str_id, "Waiting for approval...")
        await sse_manager.emit(str_id, "Workflow paused")
        
    except Exception as e:
        doc_ref.update({"status": WorkflowStatus.REJECTED.value})
        await sse_manager.emit(str_id, f"Error: {str(e)}")

async def run_execution(workflow_id: str):
    str_id = str(workflow_id)
    
    db = next(get_db())
    doc_ref = db.collection("workflows").document(str_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        return
        
    workflow_data = doc.to_dict()
    if workflow_data.get("status") != WorkflowStatus.APPROVED.value:
        return
        
    try:
        await sse_manager.emit(str_id, "Executing actions...")
        
        # Re-construct DecisionAction from JSON
        from app.schemas.agents import DecisionAction
        decision = DecisionAction(**workflow_data.get("context_data", {}))
        
        result_msg = await execute_action(db, decision)
        
        # Log action inside workflow document
        doc_ref.update({
            "status": WorkflowStatus.EXECUTED.value,
            "action_log": {
                "action_category": decision.action_type,
                "log_message": result_msg
            }
        })
        
        await sse_manager.emit(str_id, "Workflow completed")
        
    except Exception as e:
        doc_ref.update({"status": WorkflowStatus.REJECTED.value})
        await sse_manager.emit(str_id, f"Error: {str(e)}")
