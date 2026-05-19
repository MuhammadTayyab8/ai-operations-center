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

class MetricComparison(BaseModel):
    label: str = Field(..., description="Metric name, e.g. 'Lahore Revenue', 'Delivery Fee'")
    before: str = Field(..., description="Previous value, e.g. '$200K', '250 PKR'")
    after: str = Field(..., description="Current value, e.g. '$150K', '350 PKR'")
    trend: str = Field(..., description="'up', 'down', or 'flat'")

class AffectedEntity(BaseModel):
    name: str = Field(..., description="Product, region, or category name")
    impact: str = Field(..., description="Quantitative or qualitative impact, e.g. '↓ 18%'")

class UnderstandingData(BaseModel):
    source: str = Field(default="Internal Database", description="Source of the data")
    scope: str = Field(default="Global", description="Scope of analysis")
    time_range: str = Field(default="Last 30 Days", description="Time range analyzed")
    records_analyzed: str = Field(default="14,592 Rows", description="Mock records analyzed for realism")
    signals: List[str] = Field(default_factory=list, description="Key signals detected")

class InsightResult(BaseModel):
    understanding: UnderstandingData = Field(default_factory=UnderstandingData, description="Structured understanding of context")
    key_insight: str = Field(..., description="What happened? One powerful sentence.")
    evidence: List[MetricComparison] = Field(default_factory=list, description="Before/after metrics proving the insight.")
    affected_entities: List[AffectedEntity] = Field(default_factory=list, description="Entities affected by the insight.")
    risk_level: str = Field(..., description="'High', 'Medium', or 'Low'")
    business_impact: str = Field(..., description="Concrete explanation of the business impact.")

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
    confidence: float = Field(..., description="AI confidence score, e.g. 0.82 for 82%")
    risk: str = Field(..., description="Risk of the proposed action: 'Low', 'Medium', 'High'")

# ─── Workflow Context (stored in DB) ──────────────────────────────────────────

class WorkflowContextData(BaseModel):
    insight: InsightResult
    decision: DecisionAction
