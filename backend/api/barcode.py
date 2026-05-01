from fastapi import APIRouter, UploadFile, File, HTTPException
from services.cv.barcode_scanner import scan_barcode_from_image

router = APIRouter()


@router.post("/scan-barcode")
async def scan_barcode(file: UploadFile = File(...)):
    """
    Receives an image file and returns the detected barcode value.
    The 'barcode' field can be used to fill a name/identifier field
    in your database or form.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")

    try:
        contents = await file.read()

        if not contents:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        barcode_value = scan_barcode_from_image(contents)

        if barcode_value:
            return {
                "success": True,
                "barcode": barcode_value,
                # Use this field to populate your form / DB name column directly
                "product_name": barcode_value,
            }
        else:
            return {
                "success": False,
                "barcode": None,
                "product_name": None,
                "message": "No barcode detected. Try a clearer or closer image.",
            }

    except HTTPException:
        raise
    except Exception as e:
        return {
            "success": False,
            "barcode": None,
            "product_name": None,
            "message": f"Error processing image: {str(e)}",
        }
    finally:
        await file.close()