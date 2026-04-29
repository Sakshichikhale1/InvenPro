import cv2
try:
    detector = cv2.barcode.BarcodeDetector()
    print("cv2.barcode is available!")
except AttributeError:
    print("cv2.barcode is NOT available")
except Exception as e:
    print(f"Error: {e}")
