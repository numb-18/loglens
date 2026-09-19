import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import { Crosshair } from 'lucide-react';

const COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#EC4899'];

export default function AttackDistribution({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="p-6 bg-[#111827] rounded-xl border border-gray-800 text-center text-gray-400">
        <p className="text-sm">No threat categories detected.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#111827] rounded-xl border border-gray-800 shadow-lg">
      <div className="flex items-center space-x-2 mb-4">
        <Crosshair className="w-5 h-5 text-amber-400" />
        <h3 className="text-base font-semibold text-white">Threat Types Breakdown</h3>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
            <XAxis type="number" stroke="#6B7280" fontSize={11} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="type"
              stroke="#9CA3AF"
              fontSize={11}
              width={120}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', fontSize: '12px' }}
              cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
