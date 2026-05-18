from google.cloud import firestore
from fastapi import HTTPException

def reduce_inventory(db: firestore.Client, product_id: str, city: str, quantity: int):
    doc_ref = db.collection("products").document(str(product_id))
    
    # Run in a transaction to prevent race conditions
    @firestore.transactional
    def update_in_transaction(transaction, doc_ref):
        snapshot = doc_ref.get(transaction=transaction)
        if not snapshot.exists:
            raise HTTPException(status_code=404, detail=f"Product {product_id} not found")
            
        product_data = snapshot.to_dict()
        inventory = product_data.get("inventory", [])
        
        found = False
        for inv in inventory:
            if inv.get("city") == city:
                found = True
                if inv.get("quantity", 0) < quantity:
                    raise HTTPException(status_code=400, detail=f"Insufficient stock for product {product_id} in {city}")
                inv["quantity"] -= quantity
                break
                
        if not found:
            raise HTTPException(status_code=400, detail=f"No inventory found for product {product_id} in {city}")
            
        transaction.update(doc_ref, {"inventory": inventory})
        return inventory

    transaction = db.transaction()
    return update_in_transaction(transaction, doc_ref)

def restore_inventory(db: firestore.Client, product_id: str, city: str, quantity: int):
    doc_ref = db.collection("products").document(str(product_id))
    
    # Run in a transaction to prevent race conditions
    @firestore.transactional
    def update_in_transaction(transaction, doc_ref):
        snapshot = doc_ref.get(transaction=transaction)
        if not snapshot.exists:
            return None # Ignore restoring if product has been deleted
            
        product_data = snapshot.to_dict()
        inventory = product_data.get("inventory", [])
        
        found = False
        for inv in inventory:
            if inv.get("city") == city:
                found = True
                inv["quantity"] = inv.get("quantity", 0) + quantity
                break
                
        if not found:
            # If the city inventory doesn't exist, recreate it
            inventory.append({
                "city": city,
                "quantity": quantity,
                "low_stock_threshold": 5
            })
            
        transaction.update(doc_ref, {"inventory": inventory})
        return inventory

    transaction = db.transaction()
    return update_in_transaction(transaction, doc_ref)

