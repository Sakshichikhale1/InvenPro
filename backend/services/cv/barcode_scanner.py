import cv2
import numpy as np
try:
    from pyzbar import pyzbar
except Exception:
    pyzbar = None

try:
    import zxingcpp
except Exception:
    zxingcpp = None

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
    
    # We proceed even if pyzbar is None because we have OpenCV fallbacks


    # Helper function to try decoding
    def attempt_decode(img, stage_name):
        # 1. Try zxing-cpp (The most robust)
        if zxingcpp is not None:
            try:
                # zxingcpp likes grayscale or RGB
                results = zxingcpp.read_barcodes(img)
                for res in results:
                    if res.text:
                        print(f"DEBUG: zxing-cpp found: {res.text} at stage {stage_name}")
                        return res.text
            except Exception as e:
                print(f"DEBUG: zxing-cpp error at stage {stage_name}: {e}")

        # 2. Try pyzbar if available
        if pyzbar is not None:
            try:
                barcodes = pyzbar.decode(img)
                if barcodes:
                    for barcode in barcodes:
                        data = barcode.data.decode("utf-8")
                        if data: 
                            print(f"DEBUG: pyzbar found barcode: {data} at stage {stage_name}")
                            return data
            except Exception as e:
                # print(f"DEBUG: pyzbar error at stage {stage_name}: {e}")
                pass
        
        # 3. Try OpenCV Barcode Detector (Fallback)
        try:
            barcode_detector = cv2.barcode.BarcodeDetector()
            results = barcode_detector.detectAndDecode(img)
            if results[0]:
                info = results[1]
                if isinstance(info, (list, tuple)) and len(info) > 0 and info[0]:
                    print(f"DEBUG: OpenCV found: {info[0]} at stage {stage_name}")
                    return info[0]
                if isinstance(info, str) and info:
                    print(f"DEBUG: OpenCV found: {info} at stage {stage_name}")
                    return info
        except Exception:
            pass
            
        return None

    print("DEBUG: Starting barcode scan pipeline...")
    # Try original image
    result = attempt_decode(image, "Original")
    if result: return result

    # --- Preprocessing Pipeline ---
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # A. Try scaling up
    for scale in [1.5, 2.0]:
        scaled = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
        result = attempt_decode(scaled, f"Scaled_{scale}x")
        if result: return result

    # B. Try Contrast Enhancement (CLAHE)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
    enhanced = clahe.apply(gray)
    result = attempt_decode(enhanced, "CLAHE")
    if result: return result

    # C. Try Sharpening
    kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
    sharpened = cv2.filter2D(gray, -1, kernel)
    result = attempt_decode(sharpened, "Sharpened")
    if result: return result

    # D. Try Thresholding
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
    result = attempt_decode(thresh, "Thresholded")
    if result: return result
    
    print("DEBUG: Barcode scan pipeline finished - no barcode found.")

    return None
