import React from 'react';
import { ShieldAlert, Terminal, Activity, FileText } from 'lucide-react';

export default function Navbar({ onReset, hasData }) {
  return (
    <header className="border-b border-gray-800 bg-[#0B0F19]/80 backdrop-blur sticky top-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onReset}>
          <div className="p-2 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white">LogLens</span>
              <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-mono">
                SIEM-Lite
              </span>
            </div>
            <p className="text-xs text-gray-400">Automated Security Log Analysis & Threat Detection</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1.5 rounded-md font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Regex Engine Active</span>
          </div>

          {hasData && (
            <button
              onClick={onReset}
              className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-md border border-gray-700 transition"
            >
              Analyze New Log
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
