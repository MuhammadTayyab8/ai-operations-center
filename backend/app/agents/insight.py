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
    Generate a highly structured business insight report. You must populate the structured fields:
    1. understanding: Fill out source (e.g. "Production DB"), scope, time range, records analyzed (estimate a realistic number), and key signals.
    2. key_insight: "What happened?" — a powerful 1-sentence plain-English summary.
    3. evidence: Extract EXACT numbers from the data as before/after MetricComparisons (e.g. label='Lahore Revenue', before='₨200K', after='₨150K', trend='down').
    4. affected_entities: List specific products or regions impacted (e.g. name='Rolex Black', impact='↓ 18%').
    5. risk_level: Classify as 'High', 'Medium', or 'Low'.
    6. business_impact: Explain the concrete business consequences (revenue risk, stockout risk).
    
    Rules:
    - Be specific with numbers from the data (e.g., "₨450,000 revenue in Lahore")
    - Do NOT invent numbers not present in the data for evidence.
    - Write in business language, not technical language
    - If data is empty or unavailable, still generate insights based on the user's stated concern
    - Focus on actionable insights and explicitly populate the metric comparisons for the UI to render.
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
