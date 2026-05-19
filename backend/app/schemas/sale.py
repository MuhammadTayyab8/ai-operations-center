from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Union
from datetime import datetime
from app.schemas.enums import OrderType

class SaleItemCreate(BaseModel):
    product_id: Union[int, str]
    quantity: int
    unit_price: float

class SaleCreate(BaseModel):
    customer_id: Optional[Union[int, str]] = None
    type: OrderType
    discount_applied: float = 0.0
    city: str
    items: List[SaleItemCreate]
    customer_name: Optional[str] = None
    delivery_address: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    created_at: Optional[str] = None

class SaleItemResponse(SaleItemCreate):
    id: Union[int, str]
    sale_id: Union[int, str]
    model_config = ConfigDict(from_attributes=True)

class SaleResponse(BaseModel):
    id: Union[int, str]
    customer_id: Optional[Union[int, str]]
    type: OrderType
    total_amount: float
    discount_applied: float
    city: str
    created_at: datetime
    items: List[SaleItemResponse]
    customer_name: Optional[str] = None
    delivery_address: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

