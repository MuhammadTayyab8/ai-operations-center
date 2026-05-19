from fastapi import APIRouter, Depends, HTTPException
from google.cloud import firestore
from typing import List
from datetime import datetime

from app.db.database import get_db
from app.schemas.sale import SaleCreate, SaleResponse
from app.services.inventory import reduce_inventory

router = APIRouter(prefix="/sales", tags=["Sales"])

@router.get("/", response_model=List[SaleResponse])
def get_sales(db: firestore.Client = Depends(get_db)):
    sales_ref = db.collection("sales")
    # Order by created_at desc
    docs = sales_ref.order_by("created_at", direction=firestore.Query.DESCENDING).stream()
    
    sales = []
    for doc in docs:
        sale_data = doc.to_dict()
        sale_data["id"] = int(doc.id) if doc.id.isdigit() else doc.id
        sales.append(sale_data)
        
    return sales

@router.get("/delivery-fee")
def get_delivery_fee_setting(db: firestore.Client = Depends(get_db)):
    delivery_ref = db.collection("settings").document("delivery").get()
    delivery_fee = 200.0
    if delivery_ref.exists:
        delivery_fee = delivery_ref.to_dict().get("default_delivery_fee", 200.0)
    return {"delivery_fee": delivery_fee}

@router.post("/", response_model=SaleResponse)
def create_sale(sale_data: SaleCreate, db: firestore.Client = Depends(get_db)):
    # Calculate total and reduce inventory
    total_amount = 0.0
    
    for item in sale_data.items:
        # Reduce inventory
        reduce_inventory(db, str(item.product_id), sale_data.city, item.quantity)
        total_amount += (item.quantity * item.unit_price)
        
    total_amount -= sale_data.discount_applied
    
    # Apply delivery fee if online delivery
    from app.schemas.enums import OrderType
    if sale_data.type == OrderType.ONLINE:
        delivery_ref = db.collection("settings").document("delivery").get()
        delivery_fee = 200.0 # Default fallback
        if delivery_ref.exists:
            delivery_fee = delivery_ref.to_dict().get("default_delivery_fee", 200.0)
        total_amount += delivery_fee
    
    # Create Sale
    sales_ref = db.collection("sales")
    doc_ref = sales_ref.document()
    
    created_at_str = None
    if sale_data.created_at:
        try:
            created_at_val = sale_data.created_at
            if len(created_at_val) == 10:  # YYYY-MM-DD
                created_at_val = f"{created_at_val}T12:00:00"
            created_at_str = datetime.fromisoformat(created_at_val.replace("Z", "+00:00")).isoformat()
        except Exception:
            pass
            
    if not created_at_str:
        created_at_str = datetime.utcnow().isoformat()
    
    new_sale = {
        "customer_id": sale_data.customer_id,
        "type": sale_data.type,
        "total_amount": total_amount,
        "discount_applied": sale_data.discount_applied,
        "city": sale_data.city,
        "created_at": created_at_str,
        "id": doc_ref.id,
        "items": [],
        "customer_name": sale_data.customer_name,
        "delivery_address": sale_data.delivery_address,
        "customer_phone": sale_data.customer_phone,
        "customer_email": sale_data.customer_email
    }
    
    # Add Sale Items into the sale document
    for item in sale_data.items:
        sale_item = {
            "sale_id": doc_ref.id,
            "product_id": item.product_id,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "id": f"{doc_ref.id}_{item.product_id}" # Simple item id
        }
        new_sale["items"].append(sale_item)
        
    doc_ref.set(new_sale)
    
    # Simulated SMS/Email Notification for Online Delivery
    if sale_data.type == OrderType.ONLINE and sale_data.customer_email:
        print(f"\n======================================================\n"
              f"[SMS/Email Notification] Dispatched successfully to {sale_data.customer_email}\n"
              f"Subject: Order Placed Successfully - Invoice #{doc_ref.id}\n"
              f"Details: Your delivery to {sale_data.delivery_address} of PKR {total_amount} is on the way!\n"
              f"======================================================\n")
    
    return new_sale

@router.put("/{sale_id}", response_model=SaleResponse)
def update_sale(sale_id: str, sale_data: SaleCreate, db: firestore.Client = Depends(get_db)):
    doc_ref = db.collection("sales").document(str(sale_id))
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Sale not found")
        
    old_sale = doc.to_dict()
    
    # 1. Restore old inventory
    from app.services.inventory import restore_inventory
    for item in old_sale.get("items", []):
        try:
            restore_inventory(db, str(item["product_id"]), old_sale["city"], item["quantity"])
        except Exception:
            pass # Soft handle if product was deleted
            
    # 2. Process new inventory reduction and total amount calculation
    total_amount = 0.0
    for item in sale_data.items:
        # Reduce inventory
        reduce_inventory(db, str(item.product_id), sale_data.city, item.quantity)
        total_amount += (item.quantity * item.unit_price)
        
    total_amount -= sale_data.discount_applied
    
    # Apply delivery fee if online delivery
    from app.schemas.enums import OrderType
    if sale_data.type == OrderType.ONLINE:
        delivery_ref = db.collection("settings").document("delivery").get()
        delivery_fee = 200.0 # Default fallback
        if delivery_ref.exists:
            delivery_fee = delivery_ref.to_dict().get("default_delivery_fee", 200.0)
        total_amount += delivery_fee
        
    # 3. Update sale document
    created_at_str = None
    if sale_data.created_at:
        try:
            created_at_val = sale_data.created_at
            if len(created_at_val) == 10:  # YYYY-MM-DD
                created_at_val = f"{created_at_val}T12:00:00"
            created_at_str = datetime.fromisoformat(created_at_val.replace("Z", "+00:00")).isoformat()
        except Exception:
            pass
            
    if not created_at_str:
        created_at_str = old_sale.get("created_at", datetime.utcnow().isoformat())

    updated_sale = {
        "customer_id": sale_data.customer_id,
        "type": sale_data.type,
        "total_amount": total_amount,
        "discount_applied": sale_data.discount_applied,
        "city": sale_data.city,
        "created_at": created_at_str,
        "id": sale_id,
        "items": [],
        "customer_name": sale_data.customer_name,
        "delivery_address": sale_data.delivery_address,
        "customer_phone": sale_data.customer_phone,
        "customer_email": sale_data.customer_email
    }
    
    for item in sale_data.items:
        sale_item = {
            "sale_id": sale_id,
            "product_id": item.product_id,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "id": f"{sale_id}_{item.product_id}"
        }
        updated_sale["items"].append(sale_item)
        
    doc_ref.set(updated_sale)
    
    # Send simulated notification if delivery order email exists
    if sale_data.type == OrderType.ONLINE and sale_data.customer_email:
        print(f"\n======================================================\n"
              f"[SMS/Email Notification] Dispatched successfully to {sale_data.customer_email}\n"
              f"Subject: Order Updated Successfully - Invoice #{sale_id}\n"
              f"Details: Your updated delivery to {sale_data.delivery_address} of PKR {total_amount} is confirmed!\n"
              f"======================================================\n")
              
    return updated_sale

@router.delete("/{sale_id}", status_code=204)
def delete_sale(sale_id: str, db: firestore.Client = Depends(get_db)):
    doc_ref = db.collection("sales").document(str(sale_id))
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Sale not found")
        
    old_sale = doc.to_dict()
    
    # Restore inventory
    from app.services.inventory import restore_inventory
    for item in old_sale.get("items", []):
        try:
            restore_inventory(db, str(item["product_id"]), old_sale["city"], item["quantity"])
        except Exception:
            pass
            
    doc_ref.delete()
    return

