import json
from google.cloud import firestore
from app.schemas.agents import DecisionAction
from app.tools import business_tools

async def execute_action(db: firestore.Client, action: DecisionAction) -> str:
    """
    Executes the chosen decision action by delegating to the appropriate business tool.
    Returns a success/failure message for the execution log.
    """
    action_type = action.action_type
    details = action.details
    
    if action_type == 'update_price':
        if details.product_name and details.new_price is not None:
            return business_tools.update_price(db, details.product_name, details.new_price)
        return "Missing product_name or new_price for update_price action."
        
    elif action_type == 'create_campaign':
        if details.name and details.discount_percent and details.region:
            return business_tools.create_campaign(
                db,
                name=details.name,
                discount_percent=details.discount_percent,
                region=details.region,
                coupon_code=details.coupon_code,
                projected_impact=action.expected_impact
            )
        return "Missing required fields (name, discount_percent, region) for create_campaign action."
        
    elif action_type == 'reorder_stock' or action_type == 'redistribute_inventory':
        if details.product_name and details.to_city and details.quantity:
            # We treat reorder_stock and redistribute similarly; from_city may be 'Warehouse' or missing
            from_city = details.from_city or "Warehouse"
            return business_tools.redistribute_inventory(
                db,
                product_name=details.product_name,
                from_city=from_city,
                to_city=details.to_city,
                quantity=details.quantity
            )
        return "Missing required fields for inventory redistribution."
        
    elif action_type == 'update_delivery_fee':
        if details.new_fee is not None:
            return business_tools.update_delivery_fee(db, details.new_fee, details.city or "Global")
        return "Missing new_fee parameter for update_delivery_fee action."
        
    elif action_type == 'create_notification':
        if details.message:
            return business_tools.create_notification(db, details.message, details.city)
        return "Missing message for create_notification action."
        
    elif action_type == 'no_action':
        return "No action required based on current insights."
        
    return f"Unknown action type: {action_type}"
