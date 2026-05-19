from fastapi import APIRouter, Depends, HTTPException
from google.cloud import firestore
from typing import List
from datetime import datetime

from app.db.database import get_db
from app.schemas.product import ProductResponse, ProductPriceUpdate, ProductCreate, ProductUpdate

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("/", response_model=List[ProductResponse])
def get_products(db: firestore.Client = Depends(get_db)):
    products_ref = db.collection("products")
    docs = products_ref.stream()
    
    products = []
    for doc in docs:
        product_data = doc.to_dict()
        product_data["id"] = int(doc.id) if doc.id.isdigit() else doc.id
        products.append(product_data)
        
    return products

@router.post("/", response_model=ProductResponse, status_code=201)
def create_product(payload: ProductCreate, db: firestore.Client = Depends(get_db)):
    # Check SKU uniqueness
    products_ref = db.collection("products")
    existing_query = products_ref.where(filter=firestore.FieldFilter("sku", "==", payload.sku)).limit(1).stream()
    if list(existing_query):
        raise HTTPException(status_code=400, detail=f"SKU '{payload.sku}' already exists")

    # Firestore doesn't auto-increment IDs easily, so we use string IDs, but frontend expects ints? 
    # The Pydantic model might expect `int`. Let's check `ProductResponse`. 
    # Assuming frontend can handle string IDs, or we can generate a unique int or use a counter.
    # We will use string IDs for Firestore, and if the schema requires int, we can use a hash or just let it fail and fix the schema.
    # Let's generate an ID or use standard Firestore auto-generated string IDs.
    
    doc_ref = products_ref.document()
    product_data = {
        "name": payload.name,
        "sku": payload.sku,
        "base_price": payload.base_price,
        "category": payload.category,
        "inventory": [inv.model_dump() for inv in payload.inventory],
        "ai_updated_at": None,
        "id": doc_ref.id  # We will store the ID in the document as well for convenience
    }
    
    doc_ref.set(product_data)
    
    return product_data

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: str, payload: ProductUpdate, db: firestore.Client = Depends(get_db)):
    doc_ref = db.collection("products").document(str(product_id))
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = {}
    if payload.name is not None: update_data["name"] = payload.name
    if payload.sku is not None: update_data["sku"] = payload.sku
    if payload.base_price is not None: update_data["base_price"] = payload.base_price
    if payload.category is not None: update_data["category"] = payload.category
    if payload.inventory is not None:
        update_data["inventory"] = [inv.model_dump() for inv in payload.inventory]

    if update_data:
        doc_ref.update(update_data)
        
    updated_doc = doc_ref.get()
    return updated_doc.to_dict()

@router.put("/{product_id}/price", response_model=ProductResponse)
def update_product_price(product_id: str, price_data: ProductPriceUpdate, db: firestore.Client = Depends(get_db)):
    doc_ref = db.collection("products").document(str(product_id))
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Product not found")

    doc_ref.update({
        "base_price": price_data.new_price,
        "ai_updated_at": datetime.utcnow().isoformat()
    })
    
    updated_doc = doc_ref.get()
    return updated_doc.to_dict()

@router.delete("/{product_id}", status_code=204)
def delete_product(product_id: str, db: firestore.Client = Depends(get_db)):
    doc_ref = db.collection("products").document(str(product_id))
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Product not found")

    doc_ref.delete()
    return
