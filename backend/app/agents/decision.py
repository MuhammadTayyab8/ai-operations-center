from google import genai
from google.genai import types
from app.schemas.agents import InsightResult, DecisionAction

def make_decision(client: genai.Client, insight: InsightResult, model: str = "gemini-2.5-flash") -> DecisionAction:
    prompt = f"""
    You are the Decision Agent.
    Based on the insights generated from recent sales, inventory, external news, and the classified category, determine the best course of action.
    The possible actions could be 'create_campaign', 'update_price', 'reorder_stock', 'update_delivery_fee', 'no_action'.
    
    Insights:
    {insight.model_dump_json()}
    
    Formulate the best business action, specify the parameters in the details dictionary, and provide a clear justification.
    For 'update_delivery_fee', details should contain 'new_fee' (e.g., 500) and 'city' (optional, usually "Global").
    """
    
    response = client.models.generate_content(
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=DecisionAction,
            temperature=0.0
        ),
    )
    
    return DecisionAction.model_validate_json(response.text)
