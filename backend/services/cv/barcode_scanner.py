import cv2
import numpy as np
try:
    from pyzbar import pyzbar
except Exception:
    pyzbar = None

def scan_barcode_from_image(image_bytes: bytes):
    """
    Detects and decodes a barcode from image bytes.
    Returns the barcode data as a string if found, else None.
    """
    # Convert image bytes to numpy array
    nparr = np.frombuffer(image_bytes, np.uint8)
    
    # Decode image
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if image is None:
        return None

    if pyzbar is None:
        print("Warning: pyzbar not available. Barcode scanning from image disabled.")
        return None

    # Find barcodes and QR codes
    barcodes = pyzbar.decode(image)

    # Loop over detected barcodes
    for barcode in barcodes:
        # Extract the string data
        barcode_data = barcode.data.decode("utf-8")
        # Return the first one found for this simple implementation
        return barcode_data

    return None
