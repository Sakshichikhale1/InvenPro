from fastapi import APIRouter, UploadFile, File, HTTPException
from services.cv.barcode_scanner import scan_barcode_from_image

router = APIRouter()

@router.post("/scan-barcode")
async def scan_barcode(file: UploadFile = File(...)):
    """
    Endpoint to receive an image file and return detected barcode.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")

    try:
        # Read file contents
        contents = await file.read()
        
        # Scan barcode
        barcode_value = scan_barcode_from_image(contents)
        
        if barcode_value:
            return {
                "success": True,
                "barcode": barcode_value
            }
        else:
            return {
                "success": False,
                "message": "No barcode detected"
            }
            
    except Exception as e:
        return {
            "success": False,
            "message": f"Error processing image: {str(e)}"
        }
    finally:
        await file.close()
