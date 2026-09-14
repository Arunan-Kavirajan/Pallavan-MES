import React from 'react';

interface MetricsProps {
  accepted: number;
  rejectionPct: number;
  achievementPct: number;
  runningTime: number;
  oee?: {
    oee: number;
    availability: number;
    performance: number;
    quality: number;
  }
}

export default function LiveMetricsCard({ accepted, rejectionPct, achievementPct, runningTime, oee }: MetricsProps) {
  // SVG Circle parameters for OEE gauge
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = oee ? circumference - (oee.oee / 100) * circumference : circumference;

  return (
    <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Live Calculations</h3>
      
      <div className="grid grid-cols-2 gap-4 flex-grow">
        
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
          <div className={`text-2xl font-bold ${achievementPct >= 100 ? 'text-green-600' : 'text-gray-900'}`}>
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

      {/* OEE Gauge Section */}
      {oee && (
        <div className="mt-4 bg-white p-4 rounded-lg border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* Background Circle */}
            <svg className="transform -rotate-90 w-24 h-24">
              <circle
                cx="48"
                cy="48"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-gray-100"
              />
              {/* Progress Circle */}
              <circle
                cx="48"
                cy="48"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className={`${oee.oee >= 85 ? 'text-green-500' : oee.oee >= 60 ? 'text-amber-500' : 'text-red-500'} transition-all duration-700 ease-in-out`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-gray-900">{oee.oee.toFixed(1)}%</span>
              <span className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold">OEE</span>
            </div>
          </div>
          
          <div className="flex-1 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Availability</span>
              <span className="font-semibold">{oee.availability.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Performance</span>
              <span className="font-semibold">{oee.performance.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Quality</span>
              <span className="font-semibold">{oee.quality.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      {rejectionPct > 10 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700">
          <strong className="block mb-1">High Rejection Rate</strong>
          Since rejection exceeds 10%, a mandatory remark is required before submission.
        </div>
      )}
    </div>
  );
}
