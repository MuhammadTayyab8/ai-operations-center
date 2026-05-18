import requests
import json

def test_sale(payload, description):
    print(f"\n--- Testing Sale: {description} ---")
    url = "http://127.0.0.1:8000/api/v1/sales/"
    try:
        r = requests.post(url, json=payload)
        print(f"Status Code: {r.status_code}")
        try:
            print("Response:", json.dumps(r.json(), indent=2))
        except:
            print("Response text:", r.text)
    except Exception as e:
        print("Request failed:", e)

def main():
    # 1. Valid sale with sufficient stock: Product 'Timezone in' (sNLCY7s5telNiOuTdZHg) in Karachi (stock: 8)
    valid_payload = {
        "type": "Walk-in",
        "city": "Karachi",
        "discount_applied": 0.0,
        "items": [
            {
                "product_id": "sNLCY7s5telNiOuTdZHg",
                "quantity": 1,
                "unit_price": 5000.0
            }
        ]
    }
    test_sale(valid_payload, "Valid Sale (Sufficient Stock)")

    # 2. Invalid sale: Product 'Rolex watch' (CueEdQspFrss3dAWB6su) in Karachi (no inventory document)
    invalid_no_inv = {
        "type": "Walk-in",
        "city": "Karachi",
        "discount_applied": 0.0,
        "items": [
            {
                "product_id": "CueEdQspFrss3dAWB6su",
                "quantity": 1,
                "unit_price": 20000.0
            }
        ]
    }
    test_sale(invalid_no_inv, "Invalid Sale (Product with No Inventory)")

    # 3. Invalid sale: Product 'Itar' (zYNHK4zPlDSFxMD4HDr2) in Lahore (stock: 0)
    invalid_insufficient = {
        "type": "Walk-in",
        "city": "Lahore",
        "discount_applied": 0.0,
        "items": [
            {
                "product_id": "zYNHK4zPlDSFxMD4HDr2",
                "quantity": 1,
                "unit_price": 2000.0
            }
        ]
    }
    test_sale(invalid_insufficient, "Invalid Sale (Insufficient Stock)")

if __name__ == "__main__":
    main()
