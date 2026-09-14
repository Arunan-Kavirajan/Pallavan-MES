import React, { useEffect, useState, useMemo } from 'react';
import { StorageService } from '../../services/storageService';
import { ProductionEntry } from '../../types/domain';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { format, subDays, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Calendar, Filter, AlertTriangle, CheckCircle, TrendingUp, Clock } from 'lucide-react';

import { useLiveQuery } from 'dexie-react-hooks';

export default function SummaryView() {
  // Date range filter: default to last 30 days
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const thirtyDaysAgoStr = format(subDays(new Date(), 30), 'yyyy-MM-dd');
  
  const [startDate, setStartDate] = useState(thirtyDaysAgoStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [selectedMachine, setSelectedMachine] = useState<string>('ALL');

  const entries = useLiveQuery(async () => {
    return await StorageService.getAllEntries();
  });
  
  if (entries === undefined) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
          <div className="flex gap-4">
            <div className="h-10 bg-gray-200 rounded w-1/3 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-lg shadow p-5 border-l-4 border-gray-200 h-28 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }
  
  const loading = entries === undefined;

  // Filter entries across chosen date range and status (Approved or Submitted)
  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      // Must be submitted or approved to be counted in official analytics
      if (e.status !== 'Approved' && e.status !== 'Submitted') return false;
      
      // Machine filter
      if (selectedMachine !== 'ALL' && e.machineId !== selectedMachine) return false;

      // Date range filter
      try {
        const entryDate = parseISO(e.entryDate);
        const start = startOfDay(parseISO(startDate));
        const end = endOfDay(parseISO(endDate));
        return isWithinInterval(entryDate, { start, end });
      } catch {
        return true;
      }
    });
  }, [entries, startDate, endDate, selectedMachine]);

  // 1. Rejection Rate by Machine
  const machineStats = useMemo(() => {
    const stats: Record<string, { produced: number; rejected: number; accepted: number }> = {};
    filteredEntries.forEach(curr => {
      if (!stats[curr.machineId]) stats[curr.machineId] = { produced: 0, rejected: 0, accepted: 0 };
      stats[curr.machineId].produced += curr.producedQuantity;
      stats[curr.machineId].rejected += curr.rejectedQuantity;
      stats[curr.machineId].accepted += curr.acceptedQuantity;
    });

    return Object.keys(stats).map(machine => ({
      name: machine,
      rejectionRate: stats[machine].produced > 0 
        ? Number(((stats[machine].rejected / stats[machine].produced) * 100).toFixed(1)) 
        : 0,
      produced: stats[machine].produced,
      rejected: stats[machine].rejected,
      accepted: stats[machine].accepted
    })).sort((a, b) => b.rejectionRate - a.rejectionRate);
  }, [filteredEntries]);

  // 2. Rejection Rate by Part Number (SPEC REQUIREMENT)
  const partStats = useMemo(() => {
    const stats: Record<string, { produced: number; rejected: number; accepted: number }> = {};
    filteredEntries.forEach(curr => {
      if (!stats[curr.partNumber]) stats[curr.partNumber] = { produced: 0, rejected: 0, accepted: 0 };
      stats[curr.partNumber].produced += curr.producedQuantity;
      stats[curr.partNumber].rejected += curr.rejectedQuantity;
      stats[curr.partNumber].accepted += curr.acceptedQuantity;
    });

    return Object.keys(stats).map(part => ({
      name: part,
      rejectionRate: stats[part].produced > 0 
        ? Number(((stats[part].rejected / stats[part].produced) * 100).toFixed(1)) 
        : 0,
      produced: stats[part].produced,
      rejected: stats[part].rejected,
      accepted: stats[part].accepted
    })).sort((a, b) => b.rejectionRate - a.rejectionRate);
  }, [filteredEntries]);

  // 3. Rejection Reasons Breakdown
  const reasonStats = useMemo(() => {
    const stats: Record<string, number> = {};
    filteredEntries.forEach(curr => {
      if (curr.rejectedQuantity > 0 && curr.rejectionReason) {
        stats[curr.rejectionReason] = (stats[curr.rejectionReason] || 0) + curr.rejectedQuantity;
      }
    });

    return Object.keys(stats).map(reason => ({
      name: reason,
      value: stats[reason]
    })).sort((a, b) => b.value - a.value);
  }, [filteredEntries]);

  // 4. Overall KPIs
  const kpis = useMemo(() => {
    const planned = filteredEntries.reduce((sum, e) => sum + e.plannedQuantity, 0);
    const produced = filteredEntries.reduce((sum, e) => sum + e.producedQuantity, 0);
    const rejected = filteredEntries.reduce((sum, e) => sum + e.rejectedQuantity, 0);
    const accepted = filteredEntries.reduce((sum, e) => sum + e.acceptedQuantity, 0);
    const downtime = filteredEntries.reduce((sum, e) => sum + e.downtimeMinutes, 0);

    const rejectionRate = produced > 0 ? Number(((rejected / produced) * 100).toFixed(1)) : 0;
    const achievementRate = planned > 0 ? Number(((accepted / planned) * 100).toFixed(1)) : 0;

    return { planned, produced, rejected, accepted, downtime, rejectionRate, achievementRate };
  }, [filteredEntries]);

  const PIE_COLORS = ['#ef4444', '#f97316', '#eab308', '#06b6d4', '#8b5cf6', '#ec4899'];

  if (loading) return <div className="p-8 text-center text-gray-500">Loading summary view...</div>;

  return (
    <div className="p-6 space-y-6">
      
      {/* Date Range & Filter Controls */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-gray-700 font-semibold">
          <Filter size={18} className="text-primary" />
          <span>Analytics Filter:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 font-medium">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white border border-gray-300 rounded-md text-xs p-1.5 focus:ring-primary focus:border-primary shadow-sm"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 font-medium">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white border border-gray-300 rounded-md text-xs p-1.5 focus:ring-primary focus:border-primary shadow-sm"
            />
          </div>

          {/* Preset Buttons */}
          <div className="flex space-x-1">
            <button
              onClick={() => { setStartDate(todayStr); setEndDate(todayStr); }}
              className="text-xs px-2.5 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-gray-700"
            >
              Today
            </button>
            <button
              onClick={() => { setStartDate(format(subDays(new Date(), 7), 'yyyy-MM-dd')); setEndDate(todayStr); }}
              className="text-xs px-2.5 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-gray-700"
            >
              7 Days
            </button>
            <button
              onClick={() => { setStartDate(format(subDays(new Date(), 30), 'yyyy-MM-dd')); setEndDate(todayStr); }}
              className="text-xs px-2.5 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-gray-700"
            >
              30 Days
            </button>
          </div>
        </div>
      </div>

      {filteredEntries.length === 0 ? (
        <div className="p-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-gray-200">
          <AlertTriangle className="mx-auto mb-3 text-amber-500" size={32} />
          <p className="font-medium text-gray-700">No approved or submitted entries found for the selected date range.</p>
          <p className="text-sm text-gray-400 mt-1">Try expanding the date filter or approve pending shift records.</p>
        </div>
      ) : (
        <>
          {/* Key Metric KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Target Planned</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{kpis.planned.toLocaleString()}</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Produced</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{kpis.produced.toLocaleString()}</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Accepted Good</div>
              <div className="text-2xl font-bold text-green-600 mt-1">{kpis.accepted.toLocaleString()}</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Rejected Scrap</div>
              <div className="text-2xl font-bold text-red-600 mt-1">{kpis.rejected.toLocaleString()}</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Rejection Rate</div>
              <div className={`text-2xl font-bold mt-1 ${kpis.rejectionRate > 10 ? 'text-red-600' : 'text-gray-900'}`}>
                {kpis.rejectionRate}%
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Downtime</div>
              <div className="text-2xl font-bold text-amber-600 mt-1">{kpis.downtime} <span className="text-xs font-normal text-gray-500">min</span></div>
            </div>
          </div>

          {/* Analytics Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Rejection Rate by Machine */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">Rejection Percentage by Machine</h3>
                  <p className="text-xs text-gray-500">Target benchmark: &le; 10.0% threshold</p>
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">5 Machines</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={machineStats} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis unit="%" domain={[0, 'dataMax + 5']} />
                    <Tooltip 
                      formatter={(val: any) => [`${val}%`, 'Rejection Rate']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                    />
                    <Bar dataKey="rejectionRate" fill="#ef4444" radius={[4, 4, 0, 0]} name="Rejection %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Rejection Rate by Part (EXPLICIT SPEC REQUIREMENT) */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">Rejection Percentage by Part Number</h3>
                  <p className="text-xs text-gray-500">Quality failure rate per manufactured part</p>
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">5 Parts</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={partStats} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis unit="%" domain={[0, 'dataMax + 5']} />
                    <Tooltip 
                      formatter={(val: any) => [`${val}%`, 'Rejection Rate']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                    />
                    <Bar dataKey="rejectionRate" fill="#f97316" radius={[4, 4, 0, 0]} name="Rejection %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Rejection Reasons Pareto Breakdown */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
              <h3 className="font-bold text-gray-900 mb-1">Rejection Causes Breakdown (Scrap Count)</h3>
              <p className="text-xs text-gray-500 mb-4">Pareto distribution of reported defect categories</p>
              <div className="h-64">
                {reasonStats.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-gray-400">
                    No defects reported in this timeframe.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reasonStats}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={40}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      >
                        {reasonStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => [`${val} pieces`, 'Rejected']} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Table: Breakdown Data Grid */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs overflow-hidden">
              <h3 className="font-bold text-gray-900 mb-1">Part Quality Detail Table</h3>
              <p className="text-xs text-gray-500 mb-4">Tabular view of volume and rejection rate</p>
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="min-w-full text-xs divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">Part</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-600">Produced</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-600">Rejected</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-600">Accepted</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-600">Rej %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {partStats.map(p => (
                      <tr key={p.name} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-900">{p.name}</td>
                        <td className="px-3 py-2 text-right text-gray-600">{p.produced}</td>
                        <td className="px-3 py-2 text-right text-red-600 font-medium">{p.rejected}</td>
                        <td className="px-3 py-2 text-right text-green-600 font-medium">{p.accepted}</td>
                        <td className={`px-3 py-2 text-right font-bold ${p.rejectionRate > 10 ? 'text-red-600' : 'text-gray-900'}`}>
                          {p.rejectionRate}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
}
