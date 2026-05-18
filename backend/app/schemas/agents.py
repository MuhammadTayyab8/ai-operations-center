from pydantic import BaseModel, Field
from typing import List, Optional

# ─── Intake ───────────────────────────────────────────────────────────────────

class ExtractedEntities(BaseModel):
    """Typed entity bag — no Dict so Gemini Developer API accepts this schema."""
    cities: List[str] = Field(default_factory=list, description="City names found in input (e.g. Lahore, Karachi)")
    products: List[str] = Field(default_factory=list, description="Product or watch names found in input")
    percentages: List[str] = Field(default_factory=list, description="Any percentage values mentioned (e.g. '12%')")
    keywords: List[str] = Field(default_factory=list, description="Other key business terms (e.g. 'fuel', 'delivery', 'campaign')")

class IntakeClassification(BaseModel):
    domain: str = Field(..., description="Business domain: 'sales' | 'inventory' | 'pricing' | 'external_news' | 'general'")
    intent: str = Field(..., description="Inferred intent, e.g. 'analyze_sales_decline', 'check_inventory', 'update_delivery_fee'")
    confidence: float = Field(..., description="Confidence score from 0.0 to 1.0")
    entities: ExtractedEntities = Field(default_factory=ExtractedEntities, description="Extracted entities from input")

# ─── Insight ──────────────────────────────────────────────────────────────────

class InsightResult(BaseModel):
    summary: str = Field(..., description="What happened? A brief business-language summary of the situation.")
    why_it_matters: str = Field(..., description="Why does it matter? Business impact explanation.")
    anomalies_detected: List[str] = Field(default_factory=list, description="Detected anomalies, e.g. sudden drop in Lahore sales.")
    trends: List[str] = Field(default_factory=list, description="Key trends observed from data.")
    actionable_insights: List[str] = Field(default_factory=list, description="Concrete business actions recommended.")

# ─── Decision ─────────────────────────────────────────────────────────────────

class ActionDetails(BaseModel):
    """All possible action parameters as explicit optional fields — no additionalProperties."""
    # For create_campaign
    name: Optional[str] = Field(None, description="Campaign name, e.g. 'Lahore15'")
    coupon_code: Optional[str] = Field(None, description="Campaign coupon code, e.g. 'LAHORE15'")
    discount_percent: Optional[float] = Field(None, description="Discount percentage for campaign")
    region: Optional[str] = Field(None, description="Target region/city for campaign or inventory action")

    # For update_price
    product_name: Optional[str] = Field(None, description="Product name to update price for")
    new_price: Optional[float] = Field(None, description="New price in PKR")

    # For update_delivery_fee
    new_fee: Optional[float] = Field(None, description="New delivery fee in PKR")
    city: Optional[str] = Field(None, description="City for scoped delivery fee, or 'Global' for all cities")

    # For redistribute_inventory
    from_city: Optional[str] = Field(None, description="City to move stock from")
    to_city: Optional[str] = Field(None, description="City to move stock to")
    quantity: Optional[int] = Field(None, description="Number of units to move or reorder")

    # For create_notification
    message: Optional[str] = Field(None, description="Notification message text")

class DecisionAction(BaseModel):
    action_type: str = Field(
        ...,
        description="Action to take: 'create_campaign' | 'update_price' | 'update_delivery_fee' | 'redistribute_inventory' | 'create_notification' | 'no_action'"
    )
    details: ActionDetails = Field(..., description="Parameters for the chosen action")
    justification: str = Field(..., description="Why this action was chosen based on the insights.")
    expected_impact: str = Field(..., description="Expected business outcome if executed, e.g. 'Recover 8-15% Lahore revenue'")

# ─── Workflow Context (stored in DB) ──────────────────────────────────────────

class WorkflowContextData(BaseModel):
    insight: InsightResult
    decision: DecisionAction
