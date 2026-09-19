import React from 'react';
import { Globe, Skull } from 'lucide-react';

export default function TopAttackersTable({ attackers }) {
  if (!attackers || attackers.length === 0) {
    return (
      <div className="p-6 bg-[#111827] rounded-xl border border-gray-800 text-center text-gray-400">
        <p className="text-sm">No malicious IPs identified.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#111827] rounded-xl border border-gray-800 shadow-lg overflow-hidden mb-6">
      <div className="p-5 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Skull className="w-5 h-5 text-red-400" />
          <h3 className="text-base font-semibold text-white">Top Malicious Attackers</h3>
        </div>
        <span className="text-xs font-mono text-gray-400 bg-gray-800/80 px-2.5 py-1 rounded-md border border-gray-700">
          Ranked by Threat Frequency
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0B0F19] text-gray-400 font-mono uppercase border-b border-gray-800">
            <tr>
              <th className="px-5 py-3">Rank</th>
              <th className="px-5 py-3">Attacker IP</th>
              <th className="px-5 py-3">Location (GeoIP)</th>
              <th className="px-5 py-3">Threats Flagged</th>
              <th className="px-5 py-3">Total Requests</th>
              <th className="px-5 py-3">Detected Vectors</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 font-mono">
            {attackers.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-800/40 transition-colors">
                <td className="px-5 py-3 text-gray-500 font-bold">#{idx + 1}</td>
                <td className="px-5 py-3 font-semibold text-red-400">
                  {item.ip}
                </td>
                <td className="px-5 py-3 text-gray-300">
                  <span className="inline-flex items-center space-x-1.5 bg-gray-800 px-2 py-0.5 rounded border border-gray-700">
                    <Globe className="w-3 h-3 text-blue-400" />
                    <span>{item.country || 'Unknown'}</span>
                    {item.country_code && item.country_code !== 'LAN' && (
                      <span className="text-gray-400 text-[10px]">({item.country_code})</span>
                    )}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className="bg-red-500/20 text-red-400 font-bold px-2 py-0.5 rounded border border-red-500/30">
                    {item.threat_count}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-400">
                  {item.total_requests}
                </td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-1">
                    {item.attack_types && item.attack_types.map((type, tIdx) => (
                      <span
                        key={tIdx}
                        className="bg-purple-950/40 text-purple-300 border border-purple-800/40 px-2 py-0.5 rounded text-[10px]"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
