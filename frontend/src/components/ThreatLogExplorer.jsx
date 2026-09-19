import React, { useState, useMemo } from 'react';
import { Search, Terminal, Filter, AlertCircle } from 'lucide-react';

export default function ThreatLogExplorer({ logs }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    return logs.filter(entry => {
      const matchesSearch =
        entry.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.threats.some(t => t.type.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesSeverity =
        selectedSeverity === 'ALL' ||
        entry.severity?.toLowerCase() === selectedSeverity.toLowerCase();

      return matchesSearch && matchesSeverity;
    });
  }, [logs, searchTerm, selectedSeverity]);

  if (!logs || logs.length === 0) {
    return null;
  }

  const getSeverityBadge = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'medium':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
    }
  };

  return (
    <div className="bg-[#111827] rounded-xl border border-gray-800 shadow-lg overflow-hidden">
      <div className="p-5 border-b border-gray-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-semibold text-white">Threat Log Inspector</h3>
          <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full font-mono">
            {filteredLogs.length} events
          </span>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search IP, Path, Attack..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-[#0B0F19] border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center space-x-1 bg-[#0B0F19] p-1 rounded-lg border border-gray-700 text-xs font-medium">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(sev => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-2.5 py-1 rounded-md transition ${
                  selectedSeverity === sev
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[480px]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0B0F19] text-gray-400 font-mono uppercase border-b border-gray-800 sticky top-0 z-10">
            <tr>
              <th className="px-5 py-3">Severity</th>
              <th className="px-5 py-3">Time</th>
              <th className="px-5 py-3">Attacker IP</th>
              <th className="px-5 py-3">Method & Path</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Threat Detection Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 font-mono">
            {filteredLogs.map((entry, idx) => (
              <tr key={idx} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-5 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getSeverityBadge(entry.severity)}`}>
                    {entry.severity}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-400 whitespace-nowrap">
                  {entry.timestamp?.replace('T', ' ') || entry.timestamp_raw}
                </td>
                <td className="px-5 py-3 text-red-400 font-semibold whitespace-nowrap">
                  {entry.ip}
                </td>
                <td className="px-5 py-3 max-w-xs truncate text-gray-200" title={entry.decoded_path || entry.path}>
                  <span className="font-bold text-blue-400 mr-1.5">{entry.method}</span>
                  <span>{entry.decoded_path || entry.path}</span>
                </td>
                <td className="px-5 py-3">
                  <span className={`font-bold ${entry.status_code >= 400 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {entry.status_code}
                  </span>
                </td>
                <td className="px-5 py-3">
                  {entry.threats?.map((t, tIdx) => (
                    <div key={tIdx} className="mb-0.5">
                      <span className="text-white font-medium">{t.type}:</span>{' '}
                      <span className="text-gray-400">{t.description}</span>
                    </div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
