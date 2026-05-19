import sys
import os

# Append current directory to path so it can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import get_db

def truncate_db():
    db = next(get_db())
    collections = ["sales", "products", "campaigns", "notifications", "workflows"]
    
    for coll_name in collections:
        print(f"Deleting documents in '{coll_name}'...")
        docs = db.collection(coll_name).stream()
        count = 0
        for doc in docs:
            doc.reference.delete()
            count += 1
        print(f"  -> Deleted {count} documents.")

    print("\nDatabase truncated successfully. Settings (delivery fee) were kept intact.")

if __name__ == "__main__":
    truncate_db()
