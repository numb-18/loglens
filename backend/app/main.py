import os
import uuid
import time
import shutil
import threading
from typing import Dict, Any, Optional
from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse

from app.parser import stream_parse_lines
from app.detector import LogAggregator
from app.geo import get_ip_location

STATIC_INDEX = os.path.join(os.path.dirname(__file__), "static", "index.html")

app = FastAPI(
    title="LogLens SIEM API",
    description="Automated Security Log Analysis & Threat Detection Engine",
    version="1.0.0"
)

# Enable CORS for React frontend (Vite default: 5173, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEMO_LOG_PATH = os.path.join(os.path.dirname(__file__), "sample_logs", "demo_access.log")
TEMP_UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "temp_uploads")
os.makedirs(TEMP_UPLOADS_DIR, exist_ok=True)

# In-memory store for async jobs (Phase 4: Job Queues)
JOBS: Dict[str, Dict[str, Any]] = {}

def enrich_report_with_geo(report: Dict[str, Any]) -> Dict[str, Any]:
    """Enriches top attackers and flagged threats with GeoIP country and code."""
    for attacker in report.get("top_attackers", []):
        geo = get_ip_location(attacker["ip"])
        attacker["country"] = geo["country"]
        attacker["country_code"] = geo["code"]
        attacker["city"] = geo["city"]

    for entry in report.get("flagged_entries", []):
        geo = get_ip_location(entry["ip"])
        entry["country"] = geo["country"]
        entry["country_code"] = geo["code"]

    return report

def process_log_file(file_path: str) -> Dict[str, Any]:
    """Processes a log file line by line using streaming generator."""
    aggregator = LogAggregator()

    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        for entry in stream_parse_lines(f):
            aggregator.process_entry(entry)

    report = aggregator.finalize()
    return enrich_report_with_geo(report)

def async_worker_task(job_id: str, file_path: str):
    """Background task to parse large log files asynchronously."""
    try:
        JOBS[job_id]["status"] = "processing"
        JOBS[job_id]["progress"] = 25

        report = process_log_file(file_path)

        JOBS[job_id]["status"] = "completed"
        JOBS[job_id]["progress"] = 100
        JOBS[job_id]["result"] = report
    except Exception as e:
        JOBS[job_id]["status"] = "failed"
        JOBS[job_id]["error"] = str(e)
    finally:
        # Clean up temporary uploaded file
        if os.path.exists(file_path) and file_path != DEMO_LOG_PATH:
            try:
                os.remove(file_path)
            except Exception:
                pass

@app.get("/")
def root():
    if os.path.exists(STATIC_INDEX):
        return FileResponse(
            STATIC_INDEX,
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )
    return {
        "status": "online",
        "service": "LogLens SIEM API",
        "endpoints": {
            "demo": "/api/demo",
            "upload_sync": "/api/analyze",
            "upload_async": "/api/jobs/upload",
            "job_status": "/api/jobs/{job_id}"
        }
    }

@app.get("/api/health")
def health():
    return {"status": "healthy", "service": "LogLens"}

@app.get("/api/demo")
def get_demo_analysis():
    """
    Instantly returns security analysis of the pre-loaded demo log.
    Allows instant one-click testing without uploading files.
    """
    if not os.path.exists(DEMO_LOG_PATH):
        raise HTTPException(status_code=404, detail="Demo log file missing.")

    report = process_log_file(DEMO_LOG_PATH)
    return {
        "source": "demo_access.log",
        "report": report
    }

@app.post("/api/analyze")
async def analyze_log_sync(file: UploadFile = File(...)):
    """
    Synchronous analysis endpoint for small-to-medium log files.
    Streams the upload directly into the parser.
    """
    temp_filename = f"{uuid.uuid4().hex}_{file.filename}"
    temp_path = os.path.join(TEMP_UPLOADS_DIR, temp_filename)

    try:
        # Save file to disk in chunks to avoid memory spikes
        with open(temp_path, "wb") as buffer:
            while content := await file.read(1024 * 1024): # 1MB chunks
                buffer.write(content)

        report = process_log_file(temp_path)
        return {
            "filename": file.filename,
            "report": report
        }
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

@app.post("/api/jobs/upload")
async def create_async_job(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """
    Phase 4 Requirement: Async Job Queue.
    User Flow: Upload -> Get Job ID -> Poll status -> View Report.
    """
    job_id = str(uuid.uuid4())
    temp_filename = f"{job_id}_{file.filename}"
    temp_path = os.path.join(TEMP_UPLOADS_DIR, temp_filename)

    # Stream write upload
    with open(temp_path, "wb") as buffer:
        while content := await file.read(1024 * 1024):
            buffer.write(content)

    JOBS[job_id] = {
        "job_id": job_id,
        "filename": file.filename,
        "status": "queued",
        "progress": 0,
        "created_at": time.time(),
        "result": None,
        "error": None
    }

    background_tasks.add_task(async_worker_task, job_id, temp_path)

    return {
        "job_id": job_id,
        "status": "queued",
        "message": "File uploaded. Use /api/jobs/{job_id} to poll progress."
    }

@app.get("/api/jobs/{job_id}")
def get_job_status(job_id: str):
    """
    Poll status for an asynchronous parsing job.
    """
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "job_id": job_id,
        "status": job["status"],
        "filename": job.get("filename"),
        "result": job.get("result"),
        "error": job.get("error")
    }
