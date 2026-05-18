"""
business_tools.py — All agent-accessible business tool functions.

These are the named tools the AI agent calls to interact with the database.
Each read-tool returns a clean dict/list for the agent to reason over.
Each write-tool mutates the DB and returns a human-readable result string.

Tool inventory (as per operations-center-spec.md):
  READ:  get_sales_summary, get_inventory_status, get_campaign_performance, get_delivery_fee
  WRITE: update_price, create_campaign, update_delivery_fee, create_notification, redistribute_inventory
"""

import json
from typing import Optional
from google.cloud import firestore
from datetime import datetime


# ─── READ TOOLS ───────────────────────────────────────────────────────────────

def get_sales_summary(db: firestore.Client, city: Optional[str] = None) -> dict:
    """
    Agent tool: Fetch and summarize sales data from the database.
    
    Args:
        city: Optional city filter (Lahore, Karachi, Islamabad). None = all cities.
    
    Returns:
        Structured dict with revenue totals, order counts, and city breakdown.
    """
    try:
        import pandas as pd
        query = db.collection("sales")
        docs = query.stream()
        
        sales_data = []
        for doc in docs:
            data = doc.to_dict()
            rec_city = data.get("city", "Unknown")
            if city and rec_city.lower() != city.lower():
                continue
            sales_data.append({
                "city": rec_city,
                "total_amount": data.get("total_amount", 0.0),
                "type": data.get("type", "Unknown"),
                "discount_applied": data.get("discount_applied", 0.0),
                "created_at": str(data.get("created_at", "")),
            })
        
        if not sales_data:
            return {"status": "no_data", "city": city or "All", "total_revenue": 0, "order_count": 0}
        
        df = pd.DataFrame(sales_data)
        
        result = {
            "city_filter": city or "All",
            "total_revenue": round(df["total_amount"].sum(), 2),
            "total_orders": len(df),
            "total_discount_applied": round(df["discount_applied"].sum(), 2),
            "by_city": df.groupby("city")["total_amount"].sum().round(2).to_dict(),
            "by_type": df.groupby("type")["total_amount"].sum().round(2).to_dict(),
        }
        
        # Revenue trend: group by date if timestamps exist
        if "created_at" in df.columns and df["created_at"].str.len().gt(0).any():
            try:
                df["date"] = pd.to_datetime(df["created_at"], errors="coerce").dt.date
                daily = df.dropna(subset=["date"]).groupby("date")["total_amount"].sum()
                if len(daily) >= 2:
                    latest = daily.iloc[-1]
                    previous = daily.iloc[-2]
                    pct_change = round(((latest - previous) / max(previous, 1)) * 100, 1)
                    result["recent_trend_pct"] = pct_change
                    result["trend_direction"] = "up" if pct_change > 0 else "down" if pct_change < 0 else "flat"
            except Exception:
                pass
        
        return result
    except Exception as e:
        return {"error": str(e), "city": city or "All"}


def get_inventory_status(db: firestore.Client, city: Optional[str] = None) -> dict:
    """
    Agent tool: Fetch inventory levels across all products/cities.
    
    Args:
        city: Optional city filter.
    
    Returns:
        Dict with product inventory levels, low-stock alerts, and overstock flags.
    """
    try:
        import pandas as pd
        products_docs = db.collection("products").stream()
        inventory_items = []
        
        for doc in products_docs:
            product = doc.to_dict()
            product_name = product.get("name", "Unknown")
            base_price = product.get("base_price", 0)
            
            for inv in product.get("inventory", []):
                inv_city = inv.get("city", "Unknown")
                if city and inv_city.lower() != city.lower():
                    continue
                qty = inv.get("quantity", 0)
                threshold = inv.get("low_stock_threshold", 5)
                inventory_items.append({
                    "product": product_name,
                    "city": inv_city,
                    "quantity": qty,
                    "low_stock_threshold": threshold,
                    "base_price": base_price,
                    "is_low_stock": qty <= threshold,
                    "is_overstock": qty > threshold * 10,
                    "stock_value": round(qty * base_price, 2),
                })
        
        if not inventory_items:
            return {"status": "no_data", "city": city or "All"}
        
        df = pd.DataFrame(inventory_items)
        low_stock = df[df["is_low_stock"]][["product", "city", "quantity"]].to_dict("records")
        overstock = df[df["is_overstock"]][["product", "city", "quantity"]].to_dict("records")
        
        return {
            "city_filter": city or "All",
            "total_products_tracked": len(df),
            "low_stock_alerts": low_stock,
            "overstock_alerts": overstock,
            "total_stock_value_pkr": round(df["stock_value"].sum(), 2),
            "by_city_total_units": df.groupby("city")["quantity"].sum().to_dict(),
        }
    except Exception as e:
        return {"error": str(e)}


def get_campaign_performance(db: firestore.Client) -> dict:
    """
    Agent tool: Retrieve active campaigns and their performance metadata.
    
    Returns:
        Dict listing active campaigns with discount details and regions.
    """
    try:
        campaigns = []
        docs = db.collection("campaigns").stream()
        for doc in docs:
            data = doc.to_dict()
            campaigns.append({
                "id": doc.id,
                "name": data.get("name", "Unknown"),
                "coupon_code": data.get("coupon_code", ""),
                "discount_percent": data.get("discount_percent", 0),
                "region": data.get("region", "All"),
                "is_active": data.get("is_active", False),
                "ai_generated": data.get("ai_generated", False),
                "projected_impact": data.get("projected_impact", ""),
            })
        
        active = [c for c in campaigns if c["is_active"]]
        return {
            "total_campaigns": len(campaigns),
            "active_campaigns": len(active),
            "campaigns": campaigns,
            "active_regions": list({c["region"] for c in active}),
        }
    except Exception as e:
        return {"error": str(e)}


def get_delivery_fee(db: firestore.Client) -> dict:
    """
    Agent tool: Get the current global delivery fee configuration.
    
    Returns:
        Dict with current default_delivery_fee and any city-specific overrides.
    """
    try:
        doc = db.collection("settings").document("delivery").get()
        if doc.exists:
            data = doc.to_dict()
            return {
                "default_delivery_fee": data.get("default_delivery_fee", 200),
                "city": data.get("city", "Global"),
                "last_updated": data.get("updated_at", "unknown"),
            }
        return {"default_delivery_fee": 200, "city": "Global", "note": "Using system default"}
    except Exception as e:
        return {"error": str(e)}


# ─── WRITE TOOLS ──────────────────────────────────────────────────────────────

def update_price(db: firestore.Client, product_name: str, new_price: float) -> str:
    """
    Agent execution tool: Update a product's base price in the database.
    
    Args:
        product_name: Product name (case-insensitive partial match)
        new_price: New price in PKR
    
    Returns:
        Human-readable result string for the execution log.
    """
    try:
        products_docs = db.collection("products").stream()
        for doc in products_docs:
            data = doc.to_dict()
            if product_name and product_name.lower() in data.get("name", "").lower():
                old_price = data.get("base_price", 0)
                doc.reference.update({"base_price": float(new_price)})
                return f"✓ Price updated: {data['name']} — ₨{old_price:,.0f} → ₨{new_price:,.0f}"
        return f"✗ Product not found: '{product_name}'"
    except Exception as e:
        return f"✗ Error updating price: {str(e)}"


def create_campaign(
    db: firestore.Client,
    name: str,
    discount_percent: float,
    region: str,
    coupon_code: Optional[str] = None,
    projected_impact: str = ""
) -> str:
    """
    Agent execution tool: Create a new marketing campaign in the database.
    
    Returns:
        Human-readable result string.
    """
    try:
        if not coupon_code:
            coupon_code = name.upper().replace(" ", "")[:12]
        
        campaign = {
            "name": name,
            "coupon_code": coupon_code,
            "discount_percent": float(discount_percent),
            "region": region,
            "ai_generated": True,
            "projected_impact": projected_impact,
            "is_active": True,
            "created_at": datetime.utcnow().isoformat(),
        }
        doc_ref = db.collection("campaigns").document()
        campaign["id"] = doc_ref.id
        doc_ref.set(campaign)
        return f"✓ Campaign created: '{name}' ({coupon_code}) — {discount_percent}% off for {region}"
    except Exception as e:
        return f"✗ Error creating campaign: {str(e)}"


def update_delivery_fee(db: firestore.Client, new_fee: float, city: str = "Global") -> str:
    """
    Agent execution tool: Update the delivery fee setting.
    
    Returns:
        Human-readable result string.
    """
    try:
        doc_ref = db.collection("settings").document("delivery")
        existing = doc_ref.get()
        old_fee = existing.to_dict().get("default_delivery_fee", 200) if existing.exists else 200
        
        doc_ref.set({
            "default_delivery_fee": float(new_fee),
            "city": city,
            "updated_at": datetime.utcnow().isoformat(),
        }, merge=True)
        return f"✓ Delivery fee updated: ₨{old_fee:,.0f} → ₨{new_fee:,.0f} ({city})"
    except Exception as e:
        return f"✗ Error updating delivery fee: {str(e)}"


def create_notification(db: firestore.Client, message: str, city: Optional[str] = None) -> str:
    """
    Agent execution tool: Store a business notification/alert.
    
    Returns:
        Human-readable result string.
    """
    try:
        notification = {
            "message": message,
            "city": city or "All",
            "created_at": datetime.utcnow().isoformat(),
            "is_read": False,
            "ai_generated": True,
        }
        doc_ref = db.collection("notifications").document()
        doc_ref.set(notification)
        return f"✓ Notification sent: '{message}' → {city or 'All cities'}"
    except Exception as e:
        return f"✗ Error creating notification: {str(e)}"


def redistribute_inventory(
    db: firestore.Client,
    product_name: str,
    from_city: str,
    to_city: str,
    quantity: int
) -> str:
    """
    Agent execution tool: Move inventory units from one city to another.
    
    Returns:
        Human-readable result string.
    """
    try:
        products_docs = db.collection("products").stream()
        for doc in products_docs:
            data = doc.to_dict()
            if product_name and product_name.lower() in data.get("name", "").lower():
                inventory = data.get("inventory", [])
                from_inv = next((i for i in inventory if i.get("city", "").lower() == from_city.lower()), None)
                to_inv = next((i for i in inventory if i.get("city", "").lower() == to_city.lower()), None)
                
                if not from_inv:
                    return f"✗ No inventory found in {from_city} for '{product_name}'"
                if from_inv["quantity"] < quantity:
                    quantity = from_inv["quantity"]  # Move whatever is available
                
                from_inv["quantity"] -= quantity
                if to_inv:
                    to_inv["quantity"] += quantity
                else:
                    inventory.append({"city": to_city, "quantity": quantity, "low_stock_threshold": 5})
                
                doc.reference.update({"inventory": inventory})
                return f"✓ Redistributed {quantity} units of '{data['name']}': {from_city} → {to_city}"
        
        return f"✗ Product not found: '{product_name}'"
    except Exception as e:
        return f"✗ Error redistributing inventory: {str(e)}"
