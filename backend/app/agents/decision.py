"""
decision.py — Decision Agent

Takes InsightResult and generates a concrete, executable DecisionAction.
Uses the new ActionDetails typed model — no additionalProperties in schema.
"""

from google import genai
from google.genai import types
from app.schemas.agents import InsightResult, DecisionAction


def make_decision(
    client: genai.Client,
    insight: InsightResult,
    domain: str = "general",
    model: str = "gemini-2.5-flash"
) -> DecisionAction:
    """
    Step 3 of the AI pipeline: formulate the best executable business action.

    Args:
        insight: Output from the insight agent
        domain: The classified business domain (sales, inventory, pricing, external_news)
        model: Gemini model to use
    """
    prompt = f"""
    You are the Decision Agent for an AI Operations Center managing a watch retail business in Pakistan.
    Cities: Karachi, Lahore, Islamabad. Currency: PKR.
    
    === INSIGHT REPORT ===
    Key Insight: {insight.key_insight}
    Business Impact: {insight.business_impact}
    Evidence: {[e.model_dump() for e in insight.evidence]}
    Affected Entities: {[e.model_dump() for e in insight.affected_entities]}
    Risk Level: {insight.risk_level}
    
    === DOMAIN ===
    {domain}
    
    === YOUR TASK ===
    Choose ONE best executable action from this list:
    - create_campaign: Launch a discount campaign for a region (fill: name, coupon_code, discount_percent, region)
    - update_price: Adjust a product's base price (fill: product_name, new_price)
    - update_delivery_fee: Change the delivery fee (fill: new_fee, city — use "Global" for all cities)
    - redistribute_inventory: Move stock between cities (fill: product_name, from_city, to_city, quantity)
    - create_notification: Send a business alert (fill: message, city)
    - no_action: No action needed right now (fill nothing in details)
    
    Rules:
    - Pick the single most impactful action based on the insights
    - For create_campaign: discount_percent should be 10-20%, name should be meaningful (e.g. "Lahore15")
    - For update_price: use realistic PKR values based on watch retail (luxury watches ₨10,000-₨200,000)
    - For update_delivery_fee: typical range is ₨150-₨500
    - For redistribute_inventory: quantity should be realistic (10-50 units)
    - Fill ONLY the relevant fields in ActionDetails for the chosen action_type
    - Leave unused fields as null
    - expected_impact: Quantify the expected benefit (e.g., "Recover 10-15% of Lahore revenue within 2 weeks")
    - confidence: Float from 0.0 to 1.0 (e.g. 0.85) indicating how confident you are in this action.
    - risk: 'Low', 'Medium', or 'High' based on the potential downside of the action.
    """

    response = client.models.generate_content(
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=DecisionAction,
            temperature=0.0,
        ),
    )

    return DecisionAction.model_validate_json(response.text)
