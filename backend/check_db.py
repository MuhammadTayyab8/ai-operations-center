import sys
import os

# Append current directory to path so it can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import get_db

def main():
    db = next(get_db())
    
    print("\n--- Live Products & Regional Inventory ---")
    products_ref = db.collection("products").stream()
    for doc in products_ref:
        p = doc.to_dict()
        print(f"ID: {doc.id} | Name: {p.get('name')} | SKU: {p.get('sku')} | Price: {p.get('base_price')}")
        inv_list = p.get('inventory', [])
        for inv in inv_list:
            print(f"  - City: {inv.get('city')} | Qty: {inv.get('quantity')} | Min Threshold: {inv.get('low_stock_threshold')}")

    print("\n--- Recent Sales ---")
    sales_ref = db.collection("sales").limit(10).stream()
    for doc in sales_ref:
        s = doc.to_dict()
        print(f"ID: {doc.id} | City: {s.get('city')} | Type: {s.get('type')} | Total: {s.get('total_amount')} | Discount: {s.get('discount_applied')}")
        for item in s.get('items', []):
            print(f"  - Item: ProductID {item.get('product_id')} | Qty: {item.get('quantity')} | Price: {item.get('unit_price')}")

if __name__ == "__main__":
    main()
