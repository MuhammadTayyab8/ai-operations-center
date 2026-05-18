from google import genai
from google.genai import types
from app.schemas.agents import IntakeClassification, InsightResult
import json

def generate_insights(client: genai.Client, classification: IntakeClassification, sales_data: str, inventory_data: str, combined_input: str, model: str = "gemini-2.5-flash") -> InsightResult:
    prompt = f"""
    You are the Insight Agent. 
    Analyze the classified user intent alongside the current sales and inventory data from the Pandas data warehouse, and any extracted file/text content.
    Identify anomalies, trends, and actionable insights.
    
    User Intent & Domain: {classification.model_dump_json()}
    
    Extracted Context / User Input / File Content:
    {combined_input}
    
    Current Sales Data (Aggregated by City):
    {sales_data}
    
    Current Low Stock Inventory Data:
    {inventory_data}
    
    Generate a summary of the situation, note any anomalies, highlight trends, and provide actionable business insights based solely on the provided data.
    """
    
    response = client.models.generate_content(
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=InsightResult,
            temperature=0.2
        ),
    )
    
    return InsightResult.model_validate_json(response.text)
