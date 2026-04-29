import os
import sys
import ctypes

path = r'C:\Users\Tejaswini\Downloads\smart-stock-keeper-main\backend\venv\Lib\site-packages\pyzbar\libzbar-64.dll'
print(f"Checking if file exists: {os.path.exists(path)}")

try:
    print("Trying to load DLL manually...")
    handle = ctypes.WinDLL(path)
    print("Successfully loaded DLL manually!")
except Exception as e:
    print(f"Failed to load DLL manually: {e}")
