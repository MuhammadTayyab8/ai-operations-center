from pydantic import BaseModel
from typing import List, Optional, Union

class DashboardMetrics(BaseModel):
    total_revenue: float
    orders_today: int
    active_campaigns: int
    low_stock_alerts: int

class MonthlySalesPoint(BaseModel):
    month: str   # e.g. "Jan", "Feb"
    revenue: float
    orders: int

class MonthlySalesResponse(BaseModel):
    data: List[MonthlySalesPoint]
    selected_month: Optional[str] = None

class LowStockItem(BaseModel):
    product_id: Union[int, str]
    product_name: str
    sku: str
    city: str
    quantity: int
    threshold: int

class LowStockResponse(BaseModel):
    items: List[LowStockItem]

class HighDemandItem(BaseModel):
    product_id: Union[int, str]
    product_name: str
    sku: str
    category: str
    total_sold: int
    total_revenue: float

class HighDemandResponse(BaseModel):
    items: List[HighDemandItem]

class WeeklySalesPoint(BaseModel):
    day: str  # e.g. "Mon", "Tue"
    revenue: float
    orders: int

class WeeklySalesResponse(BaseModel):
    data: List[WeeklySalesPoint]

