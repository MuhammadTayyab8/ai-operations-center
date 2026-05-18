"""
insight.py — Insight Agent

Analyzes structured business data fetched by tools and generates a rich InsightResult.
Answers: What happened? Why does it matter? What are the anomalies and trends?
"""

from google import genai
from google.genai import types
from app.schemas.agents import IntakeClassification, InsightResult
import json


def generate_insights(
    client: genai.Client,
    classification: IntakeClassification,
    tool_results: dict,
    combined_input: str,
    model: str = "gemini-2.5-flash"
) -> InsightResult:
    """
    Step 2 of the AI pipeline: generate rich business insights.

    Args:
        classification: Output from the intake agent (domain, intent, entities)
        tool_results: Dict of results from business tools {tool_name: result}
        combined_input: Original user text/file content for context
        model: Gemini model to use
    """
    tool_results_str = json.dumps(tool_results, indent=2)

    prompt = f"""
    You are the Insight Agent for an AI Operations Center that manages a watch retail business in Pakistan.
    
    The business operates in Karachi, Lahore, and Islamabad. Currency is PKR.
    Products include luxury and mid-range watches. Sales happen walk-in and online.
    
    === USER INTENT ===
    Domain: {classification.domain}
    Intent: {classification.intent}
    User Input: {combined_input}
    
    === LIVE DATA FROM BUSINESS DATABASE ===
    (Fetched by business tools based on the user's request)
    {tool_results_str}
    
    === YOUR TASK ===
    Generate a business insight report that answers:
    1. summary: "What happened?" — a 2-3 sentence plain-English summary of the situation
    2. why_it_matters: "Why does it matter?" — business impact explanation (revenue risk, stockout risk, etc.)
    3. anomalies_detected: List any concerning patterns (e.g., "Lahore revenue dropped 35% vs other cities")
    4. trends: List observable patterns (e.g., "Online delivery orders growing", "Casio Silver underperforming")
    5. actionable_insights: List specific business actions recommended (e.g., "Launch Lahore campaign", "Increase delivery fee due to fuel cost")
    
    Rules:
    - Be specific with numbers from the data (e.g., "₨450,000 revenue in Lahore vs ₨820,000 in Karachi")
    - Do NOT invent numbers not present in the data
    - Write in business language, not technical language
    - If data is empty or unavailable, still generate insights based on the user's stated concern
    - Focus on actionable insights, not just observations
    """

    response = client.models.generate_content(
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=InsightResult,
            temperature=0.2,
        ),
    )

    return InsightResult.model_validate_json(response.text)
