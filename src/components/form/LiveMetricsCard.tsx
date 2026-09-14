import React from 'react';

interface MetricsProps {
  accepted: number;
  rejectionPct: number;
  achievementPct: number;
  runningTime: number;
}

export default function LiveMetricsCard({ accepted, rejectionPct, achievementPct, runningTime }: MetricsProps) {
  return (
    <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 h-full">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Live Calculations</h3>
      
      <div className="grid grid-cols-2 gap-4">
        
        <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
          <div className="text-xs text-gray-500 mb-1">Accepted Qty</div>
          <div className="text-2xl font-bold text-gray-900">{accepted}</div>
          <div className="text-[10px] text-gray-400 mt-1">Produced - Rejected</div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
          <div className="text-xs text-gray-500 mb-1">Rejection %</div>
          <div className={`text-2xl font-bold ${rejectionPct > 10 ? 'text-danger' : 'text-gray-900'}`}>
            {rejectionPct.toFixed(1)}%
          </div>
          <div className="text-[10px] text-gray-400 mt-1">(Rejected / Produced) × 100</div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
          <div className="text-xs text-gray-500 mb-1">Achievement %</div>
          <div className={`text-2xl font-bold ${achievementPct >= 100 ? 'text-success' : 'text-gray-900'}`}>
            {achievementPct.toFixed(1)}%
          </div>
          <div className="text-[10px] text-gray-400 mt-1">(Accepted / Planned) × 100</div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
          <div className="text-xs text-gray-500 mb-1">Running Time</div>
          <div className="text-2xl font-bold text-gray-900">{runningTime} <span className="text-sm font-normal text-gray-500">min</span></div>
          <div className="text-[10px] text-gray-400 mt-1">60 - Downtime</div>
        </div>

      </div>

      {rejectionPct > 10 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700">
          <strong className="block mb-1">High Rejection Rate</strong>
          Since rejection exceeds 10%, a mandatory remark is required before submission.
        </div>
      )}
    </div>
  );
}
