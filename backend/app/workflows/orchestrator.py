import json
import asyncio
from google.cloud import firestore
from google import genai
from app.db.database import get_db
from app.schemas.enums import WorkflowStatus
from app.schemas.agents import WorkflowContextData, DecisionAction, ActionDetails
from app.streaming.sse_manager import sse_manager
from app.agents.intake import analyze_input
from app.agents.insight import generate_insights
from app.agents.decision import make_decision
from app.agents.execution import execute_action
from app.tools import business_tools

client = genai.Client()

async def run_ai_pipeline(workflow_id: str, combined_input: str, category: str = None):
    str_id = str(workflow_id)
    db = next(get_db())
    doc_ref = db.collection("workflows").document(str_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        return
            
    try:
        await sse_manager.emit(str_id, "Parsing report...")
        # 1. Intake
        classification = analyze_input(client, combined_input, category)
        domain = classification.domain
        
        await sse_manager.emit(str_id, "Understanding business context...")
        
        # 2. Tool Calling based on Domain
        tool_results = {}
        city = None
        if classification.entities and classification.entities.cities:
            city = classification.entities.cities[0]
            
        if domain == 'sales':
            tool_results["sales_summary"] = business_tools.get_sales_summary(db, city)
            tool_results["campaign_performance"] = business_tools.get_campaign_performance(db)
        elif domain == 'inventory':
            tool_results["inventory_status"] = business_tools.get_inventory_status(db, city)
            tool_results["sales_summary"] = business_tools.get_sales_summary(db, city) # to correlate
        elif domain == 'pricing':
            tool_results["sales_summary"] = business_tools.get_sales_summary(db, city)
            tool_results["inventory_status"] = business_tools.get_inventory_status(db, city)
        elif domain == 'external_news':
            tool_results["delivery_fee"] = business_tools.get_delivery_fee(db)
            tool_results["sales_summary"] = business_tools.get_sales_summary(db, city)
        else:
            # General: grab a bit of everything
            tool_results["sales_summary"] = business_tools.get_sales_summary(db)
            tool_results["inventory_status"] = business_tools.get_inventory_status(db)

        await sse_manager.emit(str_id, "Detecting anomalies...")
        
        # 3. Insight
        await sse_manager.emit(str_id, "Generating insights...")
        insight = generate_insights(client, classification, tool_results, combined_input)
        
        await sse_manager.emit(str_id, "Creating recommendations...")
        
        # 4. Decision
        decision = make_decision(client, insight, domain)
        
        # Save structured context
        context_data = WorkflowContextData(insight=insight, decision=decision)
        
        doc_ref.update({
            "context_data": context_data.model_dump(),
            "status": WorkflowStatus.PENDING_APPROVAL.value
        })
        
        await sse_manager.emit(str_id, "Waiting for approval...")
        await sse_manager.emit(str_id, "Workflow paused")
        
    except Exception as e:
        print(f"Workflow {str_id} failed: {str(e)}")
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
        
        # Extract decision from context_data
        context_data_raw = workflow_data.get("context_data", {})
        decision_raw = context_data_raw.get("decision", {})
        
        # Re-construct DecisionAction
        action_details = ActionDetails(**decision_raw.get("details", {}))
        decision = DecisionAction(
            action_type=decision_raw.get("action_type", "no_action"),
            details=action_details,
            justification=decision_raw.get("justification", ""),
            expected_impact=decision_raw.get("expected_impact", "")
        )
        
        result_msg = await execute_action(db, decision)
        
        # Log action
        doc_ref.update({
            "status": WorkflowStatus.EXECUTED.value,
            "action_log": {
                "action_category": decision.action_type,
                "log_message": result_msg
            }
        })
        
        # Prepare before/after metrics for the frontend response (can just use log message)
        # Note: SSE just says completed. The frontend calls endpoints to get state diff if needed.
        await sse_manager.emit(str_id, "Workflow completed")
        
    except Exception as e:
        print(f"Execution {str_id} failed: {str(e)}")
        doc_ref.update({"status": WorkflowStatus.REJECTED.value})
        await sse_manager.emit(str_id, f"Error: {str(e)}")
