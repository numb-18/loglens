import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { Clock } from 'lucide-react';

export default function AttackTimeline({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="p-6 bg-[#111827] rounded-xl border border-gray-800 text-center text-gray-400">
        <p className="text-sm">No timeline activity to display.</p>
      </div>
    );
  }

  // Format hour label to look neat
  const formattedData = data.map(item => ({
    ...item,
    formattedHour: item.hour.length > 10 ? item.hour.split('T')[1] || item.hour.split(' ')[1] || item.hour : item.hour
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg shadow-xl text-xs">
          <p className="font-semibold text-gray-200">{label}</p>
          <p className="text-red-400 font-mono mt-1">
            {payload[0].value} threat(s) detected
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 bg-[#111827] rounded-xl border border-gray-800 shadow-lg">
      <div className="flex items-center space-x-2 mb-4">
        <Clock className="w-5 h-5 text-blue-400" />
        <h3 className="text-base font-semibold text-white">Attacks Over Time (Hourly)</h3>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="attackGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
            <XAxis
              dataKey="formattedHour"
              stroke="#6B7280"
              fontSize={11}
              tickLine={false}
            />
            <YAxis
              stroke="#6B7280"
              fontSize={11}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#EF4444"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#attackGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
