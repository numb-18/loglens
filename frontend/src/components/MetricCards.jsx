import React from 'react';
import { ShieldAlert, AlertTriangle, Users, Database } from 'lucide-react';

export default function MetricCards({ summary }) {
  if (!summary) return null;

  const cards = [
    {
      label: "Total Requests Parsed",
      value: summary.total_requests.toLocaleString(),
      subtext: `${summary.unique_ips} unique client IPs`,
      icon: Database,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20"
    },
    {
      label: "Total Threats Flagged",
      value: summary.total_threats.toLocaleString(),
      subtext: "Matching known attack signatures",
      icon: ShieldAlert,
      color: summary.total_threats > 0 ? "text-red-400" : "text-emerald-400",
      bg: summary.total_threats > 0 ? "bg-red-500/10" : "bg-emerald-500/10",
      border: summary.total_threats > 0 ? "border-red-500/20" : "border-emerald-500/20"
    },
    {
      label: "Critical Severity Events",
      value: (summary.severity_breakdown?.critical || 0).toLocaleString(),
      subtext: "SQLi & Directory Traversals",
      icon: AlertTriangle,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20"
    },
    {
      label: "Malicious Attacker IPs",
      value: (summary.malicious_ips || 0).toLocaleString(),
      subtext: "Identified threat sources",
      icon: Users,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-5 rounded-xl bg-[#111827] border ${card.border} shadow-lg relative overflow-hidden`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{card.label}</p>
                <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${card.bg} border ${card.border}`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">{card.subtext}</p>
          </div>
        );
      })}
    </div>
  );
}
