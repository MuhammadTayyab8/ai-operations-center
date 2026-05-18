import json
from google.cloud import firestore
from app.schemas.agents import DecisionAction

async def execute_action(db: firestore.Client, action: DecisionAction) -> str:
    """
    Translates the Pydantic JSON decisions into database mutations.
    Returns a success message.
    """
    action_type = action.action_type
    details = action.details
    
    if action_type == 'update_price':
        # Expects: product_id or product_name, new_price
        product_name = details.get('product_name')
        new_price = details.get('new_price')
        
        # Find product by name
        products_docs = db.collection("products").stream()
        product_ref = None
        for doc in products_docs:
            if product_name and product_name.lower() in doc.to_dict().get("name", "").lower():
                product_ref = doc.reference
                break
                
        if product_ref and new_price is not None:
            product_ref.update({"base_price": float(new_price)})
            return f"Updated price for {product_name} to {new_price}."
        return "Product not found or missing details."
        
    elif action_type == 'create_campaign':
        # Expects: name, discount_percent, region
        campaign = {
            "name": details.get('name', 'AI Auto Campaign'),
            "coupon_code": details.get('coupon_code', 'AI-SALE'),
            "discount_percent": float(details.get('discount_percent', 10.0)),
            "region": details.get('region', 'All'),
            "ai_generated": True,
            "projected_impact": action.justification,
            "is_active": True
        }
        
        doc_ref = db.collection("campaigns").document()
        campaign["id"] = doc_ref.id
        doc_ref.set(campaign)
        
        return f"Created campaign {campaign['name']} for {campaign['region']}."
        
    elif action_type == 'reorder_stock':
        product_name = details.get('product_name')
        city = details.get('city')
        quantity = int(details.get('quantity', 50))
        
        # Find product by name and update inventory
        products_docs = db.collection("products").stream()
        product_ref = None
        inventory = []
        for doc in products_docs:
            data = doc.to_dict()
            if product_name and product_name.lower() in data.get("name", "").lower():
                product_ref = doc.reference
                inventory = data.get("inventory", [])
                break
                
        if product_ref:
            found = False
            for inv in inventory:
                if inv.get("city") == city:
                    inv["quantity"] += quantity
                    found = True
                    break
            
            if not found:
                inventory.append({
                    "city": city,
                    "quantity": quantity,
                    "low_stock_threshold": 5
                })
                
            product_ref.update({"inventory": inventory})
            return f"Reordered {quantity} units of {product_name} for {city}."
            
        return "Inventory location not found."
        
    elif action_type == 'update_delivery_fee':
        new_fee = details.get('new_fee')
        city = details.get('city', 'Global')
        if new_fee is not None:
            doc_ref = db.collection("settings").document("delivery")
            doc_ref.set({"default_delivery_fee": float(new_fee), "city": city}, merge=True)
            return f"Updated delivery fee to ₨{new_fee} for {city}."
        return "Missing new_fee parameter."
        
    elif action_type == 'no_action':
        return "No action required based on current insights."
        
    return f"Unknown action type: {action_type}"
