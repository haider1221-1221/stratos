import sys
import os
from pathlib import Path

# Fix: add the project root to the path so we can import 'backend'
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    from backend.stratos import app
except ImportError as e:
    # If the import above fails, we might be in an environment where 
    # 'backend' is directly in the path or has a different name
    print(f"ImportError: {e}")
    # Handle the case where we might need to search or handle it differently
    raise e

# Vercel needs the FastAPI instance named 'app'
# This satisfies the requirement
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
