import React, { useState } from 'react';
import Navbar from './components/Navbar';
import UploadDropzone from './components/UploadDropzone';
import MetricCards from './components/MetricCards';
import AttackTimeline from './components/AttackTimeline';
import AttackDistribution from './components/AttackDistribution';
import TopAttackersTable from './components/TopAttackersTable';
import ThreatLogExplorer from './components/ThreatLogExplorer';
import { Download, AlertTriangle, CheckCircle2 } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

export default function App() {
  const [reportData, setReportData] = useState(null);
  const [sourceName, setSourceName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);

  // 1. Load Pre-seeded Demo Log
  const handleLoadDemo = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage('Loading demo access log...');

    try {
      const response = await fetch(`${API_BASE}/api/demo`);
      if (!response.ok) {
        throw new Error(`Demo log failed with status ${response.status}`);
      }
      const data = await response.json();
      setReportData(data.report);
      setSourceName(data.source);
    } catch (err) {
      setErrorMessage(`Failed to load demo log: ${err.message}. Make sure the backend server is running.`);
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  // 2. Synchronous File Analysis
  const handleAnalyzeSync = async (file) => {
    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage('Uploading and parsing log file...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Analysis failed with status ${response.status}`);
      }

      const data = await response.json();
      setReportData(data.report);
      setSourceName(data.filename);
    } catch (err) {
      setErrorMessage(`Upload failed: ${err.message}`);
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  // 3. Asynchronous Job Queue Analysis (Phase 4)
  const handleAnalyzeAsync = async (file) => {
    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage('Uploading to background job queue...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadRes = await fetch(`${API_BASE}/api/jobs/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error(`Job submission failed with status ${uploadRes.status}`);
      }

      const { job_id } = await uploadRes.json();
      setStatusMessage(`Job #${job_id.slice(0, 8)} queued. Processing...`);

      // Poll job status every 1.5 seconds
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`${API_BASE}/api/jobs/${job_id}`);
          if (!statusRes.ok) return;

          const jobData = await statusRes.json();
          if (jobData.status === 'completed') {
            clearInterval(pollInterval);
            setReportData(jobData.result);
            setSourceName(jobData.filename);
            setIsLoading(false);
            setStatusMessage('');
          } else if (jobData.status === 'failed') {
            clearInterval(pollInterval);
            setIsLoading(false);
            setErrorMessage(`Background job failed: ${jobData.error}`);
          } else {
            setStatusMessage(`Job status: ${jobData.status}...`);
          }
        } catch (pollErr) {
          console.error("Polling error:", pollErr);
        }
      }, 1500);

    } catch (err) {
      setIsLoading(false);
      setErrorMessage(`Async queue error: ${err.message}`);
    }
  };

  const handleExportJSON = () => {
    if (!reportData) return;
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LogLens_Report_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setReportData(null);
    setSourceName('');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090D16]">
      <Navbar onReset={handleReset} hasData={!!reportData} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Status / Loading Toast */}
        {isLoading && (
          <div className="mb-6 p-4 rounded-xl bg-blue-950/40 border border-blue-800/60 text-blue-300 text-sm flex items-center space-x-3 shadow-lg">
            <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin"></div>
            <span>{statusMessage || 'Processing security log...'}</span>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-sm flex items-center space-x-3 shadow-lg">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {!reportData ? (
          <UploadDropzone
            onAnalyzeSync={handleAnalyzeSync}
            onAnalyzeAsync={handleAnalyzeAsync}
            onLoadDemo={handleLoadDemo}
            isLoading={isLoading}
          />
        ) : (
          <div>
            {/* Report Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-gray-800 mb-6 gap-3">
              <div>
                <span className="text-xs font-mono uppercase text-blue-400 tracking-wider">Analysis Complete</span>
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <span>Report for: <span className="text-blue-400 font-mono">{sourceName}</span></span>
                </h2>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleExportJSON}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium rounded-lg border border-gray-700 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Export JSON</span>
                </button>
              </div>
            </div>

            {/* Metric KPI Cards */}
            <MetricCards summary={reportData.summary} />

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <AttackTimeline data={reportData.timeline} />
              <AttackDistribution data={reportData.attack_types} />
            </div>

            {/* Top Attackers Table */}
            <TopAttackersTable attackers={reportData.top_attackers} />

            {/* Threat Log Inspector */}
            <ThreatLogExplorer logs={reportData.flagged_entries} />
          </div>
        )}
      </main>

      <footer className="border-t border-gray-800/60 py-6 text-center text-xs text-gray-400">
        <p>LogLens • Simplified Security Log Analysis & Threat Detection Engine</p>
      </footer>
    </div>
  );
}
