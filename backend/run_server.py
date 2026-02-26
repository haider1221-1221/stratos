"""Entry point to run the FastAPI app via uvicorn.
This script is used as PyInstaller entrypoint when building a Windows app.
"""
import os
import sys
from pathlib import Path

# If running inside a PyInstaller one-dir bundle, the files added with
# --add-data will be available under sys._MEIPASS. Set FRONTEND_BUILD_DIR
# so `backend.stratos` can mount static files correctly.
if getattr(sys, "_MEIPASS", None):
    # _MEIPASS is the root of the temporary bundle directory
    meipass = Path(sys._MEIPASS)  # type: ignore
    # Try a couple of likely locations for the bundled frontend build.
    # In an Electron package, the frontend might be in the resources folder
    # relative to the backend executable.
    exe_dir = Path(sys.executable).parent
    possible_frontend_builds = [
        meipass / "frontend" / "build",
        meipass / "backend" / "frontend" / "build",
        exe_dir / "frontend" / "build",
        exe_dir / "backend" / "frontend" / "build",
    ]
    for frontend_build in possible_frontend_builds:
        if frontend_build.exists():
            os.environ["FRONTEND_BUILD_DIR"] = str(frontend_build)
            print(f"Bundled frontend build found at: {frontend_build}")
            break

def main():
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "127.0.0.1")
    # Try to import the FastAPI `app` object directly so the frozen
    # executable can locate it whether it's packaged as a package
    # (`backend.stratos`) or as a top-level module (`stratos`).
    app = None
    try:
        from backend.stratos import app as _app  # type: ignore
        app = _app
    except Exception:
        try:
            from stratos import app as _app  # type: ignore
            app = _app
        except Exception as exc:
            print(f"Failed to import FastAPI app: {exc}", file=sys.stderr)
            raise

    import socket
    import subprocess

    def kill_process_on_port(p):
        try:
            # Find PID using netstat
            output = subprocess.check_output(f'netstat -ano | findstr :{p}', shell=True).decode()
            for line in output.strip().split('\n'):
                if 'LISTENING' in line:
                    pid = line.strip().split()[-1]
                    print(f"Terminating existing process {pid} on port {p}...")
                    subprocess.run(f'taskkill /F /PID {pid} /T', shell=True, capture_output=True)
        except Exception:
            pass

    # Try to clean up the port first
    kill_process_on_port(port)

    # Run with minimal logging - disable access logs to reduce output spam
    print(f"Backend starting on http://{host}:{port}")
    uvicorn.run(app, host=host, port=port, access_log=False)

if __name__ == "__main__":
    main()
