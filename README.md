# LogLens - Simplified Security Log Analysis

> **SIEM-Lite Log Analysis & Threat Detection Engine**  
> Automatically parse web server logs (Nginx / Apache), detect attack patterns using pre-compiled regex signatures, and visualize threat intelligence on a real-time dashboard.

---

## 🎯 Features

- **Format Support:** Common Log Format (CLF) and Combined Log Format used by Apache and Nginx.
- **Threat Detection Engine:**
  - **SQL Injection (SQLi):** `' OR 1=1`, `UNION SELECT`, `SLEEP()`, `information_schema`.
  - **Cross-Site Scripting (XSS):** `<script>`, `onerror=`, `javascript:`, DOM handlers.
  - **Directory Traversal / LFI:** `../../etc/passwd`, `win.ini`, `.env`.
  - **Security Scanner Fingerprinting:** Detects `sqlmap`, `Nikto`, `nmap`, `WPScan`, `DirBuster`.
  - **Brute Force Detection:** High frequency of `401 Unauthorized` / `403 Forbidden` responses from a single IP.
- **Performance & Streaming:** Uses Python line-by-line generators (`yield`) to stream 500MB+ files without high RAM consumption.
- **Analysis Dashboard:**
  - Hourly attack activity timeline (Recharts).
  - Threat categories breakdown.
  - GeoIP mapping (Country, ISO code, Flag).
  - Ranked Top Malicious Attackers table.
  - Searchable and filterable threat log inspector.
- **Async Job Queue (Phase 4):** Upload $\rightarrow$ Get Job ID $\rightarrow$ Poll status $\rightarrow$ View Report.
- **One-Click Demo:** Click **"Load Demo Log File"** to immediately preview realistic attack traffic.

---

## 🏗️ Architecture

```
loglens/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI server & endpoints
│   │   ├── parser.py                # Streaming CLF/Nginx regex parser
│   │   ├── detector.py              # Attack signature matcher & aggregator
│   │   ├── geo.py                   # GeoIP resolver
│   │   ├── signatures.json          # Pre-compiled attack signatures
│   │   └── sample_logs/
│   │       └── demo_access.log      # Pre-seeded access log with attacks
│   ├── test_engine.py               # Standalone test suite
│   ├── run.py                       # Server launcher
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/              # React UI components
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 🚀 Getting Started

### 1. Backend Setup (Python)

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run standalone engine test
python test_engine.py

# Start the API server
python run.py
```
* API will be live at: `http://127.0.0.1:8000`
* Interactive API Documentation (Swagger): `http://127.0.0.1:8000/docs`

---

### 2. Frontend Setup (React + Vite)

```bash
cd frontend

# Install node dependencies
npm install

# Start the Vite development server
npm run dev
```
* Open `http://localhost:5173` in your browser.
* Click **"Load Demo Log File"** for an instant interactive report!

---

## ⚡ Performance Note: Large File Processing

When analyzing a 500MB+ log file:
1. **Never load the whole file into RAM:** The backend uses Python generators (`stream_parse_lines`) that process logs one line at a time.
2. **Chunked Uploads:** Files are written to disk in 1MB chunks to prevent memory spikes.
3. **Async Queue:** For large files, users can select **"Enable Async Job Queue"** to process in the background while polling `/api/jobs/{job_id}`.
