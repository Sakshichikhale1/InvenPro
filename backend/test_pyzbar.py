import os
import sys
import importlib.util

if sys.platform == 'win32':
    spec = importlib.util.find_spec('pyzbar')
    if spec and spec.submodule_search_locations:
        path = spec.submodule_search_locations[0]
        print(f"Adding DLL directory: {path}")
        os.add_dll_directory(path)
        os.environ['PATH'] = path + os.pathsep + os.environ['PATH']

try:
    from pyzbar import pyzbar
    print("Successfully imported pyzbar")
except Exception as e:
    print(f"Error importing pyzbar: {e}")
    import traceback
    traceback.print_exc()
