import React, { useState, useRef } from 'react';
import { UploadCloud, FileCode, Zap, AlertCircle, Loader2 } from 'lucide-react';

export default function UploadDropzone({ onAnalyzeSync, onAnalyzeAsync, onLoadDemo, isLoading }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [useAsyncQueue, setUseAsyncQueue] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file) => {
    setSelectedFile(file);
  };

  const triggerUpload = () => {
    if (!selectedFile) return;
    if (useAsyncQueue) {
      onAnalyzeAsync(selectedFile);
    } else {
      onAnalyzeSync(selectedFile);
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-10 px-4">
      {/* Hero Welcome */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl mb-3">
          Instant Threat Detection for Web Server Logs
        </h1>
        <p className="text-base text-gray-400 max-w-2xl mx-auto">
          Upload Nginx or Apache access logs to instantly uncover SQL injection attempts, XSS payloads, directory traversals, and brute-force scans.
        </p>
      </div>

      {/* Main Upload Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
          isDragOver
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-gray-700 hover:border-gray-600 bg-[#111827]/60'
        } backdrop-blur shadow-xl`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".log,.txt,text/plain"
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-gray-800/80 rounded-full border border-gray-700 text-blue-400">
            <UploadCloud className="w-10 h-10" />
          </div>

          <div>
            <p className="text-lg font-medium text-white mb-1">
              {selectedFile ? selectedFile.name : 'Drag & drop your web server log file here'}
            </p>
            <p className="text-xs text-gray-400">
              Supports Apache & Nginx Common Log Format (CLF) & Combined Format (.log, .txt)
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => fileInputRef.current.click()}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium rounded-lg border border-gray-700 transition"
            >
              Browse Local File
            </button>

            {selectedFile && (
              <button
                onClick={triggerUpload}
                disabled={isLoading}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition shadow-lg shadow-blue-500/20 flex items-center space-x-2"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Analyze File</span>
              </button>
            )}
          </div>

          {/* Phase 4 Async Queue Checkbox */}
          <div className="pt-2 flex items-center space-x-2 text-xs text-gray-400">
            <input
              type="checkbox"
              id="asyncQueueToggle"
              checked={useAsyncQueue}
              onChange={(e) => setUseAsyncQueue(e.target.checked)}
              className="rounded bg-gray-800 border-gray-700 text-blue-500 focus:ring-0"
            />
            <label htmlFor="asyncQueueToggle" className="cursor-pointer">
              Enable Async Job Queue (Recommended for files &gt; 50MB)
            </label>
          </div>
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#111827] px-3 text-gray-500 font-mono">or test without a file</span>
          </div>
        </div>

        {/* One Click Load Demo Log Button */}
        <div className="flex flex-col items-center">
          <button
            onClick={onLoadDemo}
            disabled={isLoading}
            className="group flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border border-blue-500/30 hover:border-blue-500/50 rounded-xl text-blue-300 transition duration-200 shadow-lg"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
            ) : (
              <Zap className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            )}
            <div className="text-left">
              <span className="block text-sm font-semibold text-white">Load Demo Log File</span>
              <span className="block text-xs text-gray-400">
                Pre-loaded with live SQLi, XSS, Path Traversal, and Scanners
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
