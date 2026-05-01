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
    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if image is None:
        print("DEBUG: Failed to decode image bytes.")
        return None

    def attempt_decode(img, stage_name):
        """
        Try all available decoders on a given image (grayscale or BGR).
        zxingcpp requires RGB; pyzbar works with grayscale or RGB;
        OpenCV BarcodeDetector works with BGR or grayscale.
        """
        # --- 1. zxingcpp (most robust, needs RGB) ---
        if zxingcpp is not None:
            try:
                # Convert to RGB regardless of input type
                if len(img.shape) == 2:
                    rgb = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)
                else:
                    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

                results = zxingcpp.read_barcodes(rgb)
                for res in results:
                    if res.text:
                        print(f"DEBUG: zxingcpp found '{res.text}' at stage [{stage_name}]")
                        return res.text
            except Exception as e:
                print(f"DEBUG: zxingcpp error at stage [{stage_name}]: {e}")

        # --- 2. pyzbar (works best with grayscale) ---
        if pyzbar is not None:
            try:
                # pyzbar prefers grayscale
                if len(img.shape) == 3:
                    gray_input = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                else:
                    gray_input = img

                barcodes = pyzbar.decode(gray_input)
                for barcode in barcodes:
                    data = barcode.data.decode("utf-8")
                    if data:
                        print(f"DEBUG: pyzbar found '{data}' at stage [{stage_name}]")
                        return data
            except Exception as e:
                print(f"DEBUG: pyzbar error at stage [{stage_name}]: {e}")

        # --- 3. OpenCV BarcodeDetector (fallback) ---
        try:
            detector = cv2.barcode.BarcodeDetector()
            ok, decoded_info, decoded_type, points = detector.detectAndDecodeMulti(img)
            if ok and decoded_info:
                for text in decoded_info:
                    if text:
                        print(f"DEBUG: OpenCV found '{text}' at stage [{stage_name}]")
                        return text
        except AttributeError:
            # Older OpenCV: detectAndDecode returns (retval, decoded_info, points)
            try:
                detector = cv2.barcode.BarcodeDetector()
                retval, decoded_info, points = detector.detectAndDecode(img)
                if retval and decoded_info:
                    text = decoded_info[0] if isinstance(decoded_info, (list, tuple)) else decoded_info
                    if text:
                        print(f"DEBUG: OpenCV (legacy) found '{text}' at stage [{stage_name}]")
                        return text
            except Exception as e:
                print(f"DEBUG: OpenCV error at stage [{stage_name}]: {e}")
        except Exception as e:
            print(f"DEBUG: OpenCV error at stage [{stage_name}]: {e}")

        return None

    def try_rotations(img, label):
        """Try the image at 0°, 90°, 180°, 270° — barcodes at odd angles often fail."""
        for angle in [0, 90, 180, 270]:
            if angle == 0:
                rotated = img
            else:
                rotated = cv2.rotate(img, {
                    90:  cv2.ROTATE_90_CLOCKWISE,
                    180: cv2.ROTATE_180,
                    270: cv2.ROTATE_90_COUNTERCLOCKWISE,
                }[angle])
            result = attempt_decode(rotated, f"{label}_rot{angle}")
            if result:
                return result
        return None

    print("DEBUG: Starting barcode scan pipeline...")

    # ── Stage 1: Original image (all rotations) ──────────────────────────────
    result = try_rotations(image, "Original")
    if result:
        return result

    # ── Stage 2: Grayscale ───────────────────────────────────────────────────
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    result = try_rotations(gray, "Gray")
    if result:
        return result

    # ── Stage 3: Denoised (helps with camera noise / blurry images) ──────────
    denoised = cv2.fastNlMeansDenoising(gray, h=10)
    result = try_rotations(denoised, "Denoised")
    if result:
        return result

    # ── Stage 4: Scale up (helps with small/distant barcodes) ───────────────
    for scale in [1.5, 2.0]:
        scaled = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
        result = try_rotations(scaled, f"Scaled_{scale}x")
        if result:
            return result

    # ── Stage 5: CLAHE contrast enhancement ─────────────────────────────────
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)
    result = try_rotations(enhanced, "CLAHE")
    if result:
        return result

    # ── Stage 6: Sharpening ──────────────────────────────────────────────────
    kernel = np.array([[-1, -1, -1],
                       [-1,  9, -1],
                       [-1, -1, -1]])
    sharpened = cv2.filter2D(gray, -1, kernel)
    result = try_rotations(sharpened, "Sharpened")
    if result:
        return result

    # ── Stage 7: Otsu threshold ──────────────────────────────────────────────
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
    result = try_rotations(thresh, "OtsuThresh")
    if result:
        return result

    # ── Stage 8: Adaptive threshold (handles uneven lighting) ────────────────
    adaptive = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 11, 2
    )
    result = try_rotations(adaptive, "AdaptiveThresh")
    if result:
        return result

    print("DEBUG: Barcode scan pipeline finished — no barcode found.")
    return None