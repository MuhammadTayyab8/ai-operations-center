from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class InventoryBase(BaseModel):
    city: str
    quantity: int
    low_stock_threshold: int = 5

class InventoryResponse(InventoryBase):
    id: Optional[str | int] = None
    product_id: Optional[str | int] = None
    model_config = ConfigDict(from_attributes=True)

class ProductBase(BaseModel):
    name: str
    sku: str
    base_price: float
    category: str

class ProductCreate(ProductBase):
    inventory: List[InventoryBase] = []

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    base_price: Optional[float] = None
    category: Optional[str] = None
    inventory: Optional[List[InventoryBase]] = None

class ProductResponse(ProductBase):
    id: str | int
    ai_updated_at: Optional[datetime] = None
    inventory: List[InventoryResponse] = []
    model_config = ConfigDict(from_attributes=True)

class ProductPriceUpdate(BaseModel):
    new_price: float

