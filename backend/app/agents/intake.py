"""
intake.py — Intake Agent

Classifies user input (text or extracted file content) into a domain and intent.
Uses the updated IntakeClassification schema with no Dict fields.
"""

from google import genai
from google.genai import types
from app.schemas.agents import IntakeClassification
from app.core.guardrails import check_guardrails


class GuardrailException(Exception):
    def __init__(self, reason: str):
        self.reason = reason
        super().__init__(f"Guardrail check failed: {reason}")


def analyze_input(
    client: genai.Client,
    user_input: str,
    category: str = None,
    model: str = "gemini-2.5-flash"
) -> IntakeClassification:
    """
    Step 1 of the AI pipeline: classify and validate input.
    
    1. Run guardrails check
    2. Classify domain + intent + entities
    """
    # 1. Guardrails
    guardrail_result = check_guardrails(client, user_input, model)
    if not guardrail_result.is_safe:
        raise GuardrailException(guardrail_result.reason)

    # 2. Classify
    prompt = f"""
    You are the Intake Agent for an AI Operations Center managing a watch retail business in Pakistan.
    Your job is to analyze the user input and classify it.

    The business operates in these cities: Karachi, Lahore, Islamabad.
    It sells watches (Rolex, Casio, Omega, etc.) through walk-in and online delivery channels.

    Requested Workflow Category (if user selected one): "{category or 'Auto-detect'}"
    
    User Input / Extracted File Content:
    {user_input}

    Instructions:
    - domain: one of 'sales' | 'inventory' | 'pricing' | 'external_news' | 'general'
      * If category is 'sales_risk' → domain = 'sales'
      * If category is 'inventory' → domain = 'inventory'
      * If category is 'pricing' → domain = 'pricing'
      * If category is 'external_news' → domain = 'external_news'
      * Otherwise, auto-detect from the input content
    - intent: short description like 'analyze_lahore_sales_decline', 'check_low_stock', 'assess_fuel_price_impact'
    - confidence: 0.0 to 1.0
    - entities: extract any city names, product names, percentages, and key business keywords
    """

    response = client.models.generate_content(
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=IntakeClassification,
            temperature=0.0,
        ),
    )

    return IntakeClassification.model_validate_json(response.text)
