from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class BarcodeRequest(BaseModel):
    barcode: str

import httpx

@router.post("/product-by-barcode")
async def get_product_by_barcode(request: BarcodeRequest):
    """
    Endpoint to receive a barcode and return product details.
    Searches in mock DB first, then tries OpenFoodFacts API.
    """
    barcode = request.barcode
    print(f"Searching for barcode: {barcode}")
    
    # 1. Check Mock Database
    mock_products = {
        "123456789": {"name": "Premium Coffee (500g)", "price": 549, "category": "Beverages"},
        "987654321": {"name": "Organic Green Tea", "price": 389, "category": "Beverages"},
        "8901234567890": {"name": "Daawat Basmati Rice (5kg)", "price": 899, "category": "Grains"}
    }
    
    if barcode in mock_products:
        product = mock_products[barcode]
        return {
            "success": True,
            "product": product,
            "message": f"Product found in local database: {product['name']}"
        }

    # 2. Try External API (OpenFoodFacts)
    try:
        async with httpx.AsyncClient() as client:
            url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
            response = await client.get(url, timeout=5.0)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == 1:
                    off_product = data["product"]
                    # Extract useful fields
                    name = off_product.get("product_name") or off_product.get("product_name_en") or "Unknown Product"
                    category = off_product.get("categories", "").split(",")[0] or "General"
                    # OpenFoodFacts doesn't have prices, so we leave it to user or mock it
                    return {
                        "success": True,
                        "barcode": barcode,
                        "product": {
                            "name": name,
                            "category": category,
                            "price": 0, # To be filled by user
                            "sku": barcode
                        },
                        "message": f"Product details fetched from OpenFoodFacts: {name}"
                    }
    except Exception as e:
        print(f"External API error: {e}")

    # 3. Not found anywhere
    return {
        "success": False,
        "barcode": barcode,
        "message": "Product not found. Please enter details manually."
    }
