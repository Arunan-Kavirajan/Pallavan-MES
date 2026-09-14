import React, { useEffect, useState } from 'react';
import { StorageService } from '../../services/storageService';
import { ProductionEntry } from '../../types/domain';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function SummaryView() {
  const [entries, setEntries] = useState<ProductionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const all = await StorageService.getAllEntries();
      // Only include submitted/approved entries in analytics (exclude drafts/returned)
      setEntries(all.filter(e => e.status === 'Approved' || e.status === 'Submitted'));
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading analytics...</div>;

  if (entries.length === 0) {
    return <div className="p-12 text-center text-gray-500">No approved or submitted data available for analytics.</div>;
  }

  // 1. Rejection Rate by Machine
  const machineStats = entries.reduce((acc, curr) => {
    if (!acc[curr.machineId]) acc[curr.machineId] = { produced: 0, rejected: 0 };
    acc[curr.machineId].produced += curr.producedQuantity;
    acc[curr.machineId].rejected += curr.rejectedQuantity;
    return acc;
  }, {} as Record<string, { produced: number, rejected: number }>);

  const machineData = Object.keys(machineStats).map(machine => ({
    name: machine,
    rejectionRate: machineStats[machine].produced > 0 
      ? Number(((machineStats[machine].rejected / machineStats[machine].produced) * 100).toFixed(1)) 
      : 0
  })).sort((a, b) => b.rejectionRate - a.rejectionRate);

  // 2. Rejection Reasons Pareto (Pie)
  const reasonStats = entries.reduce((acc, curr) => {
    if (curr.rejectedQuantity > 0 && curr.rejectionReason) {
      acc[curr.rejectionReason] = (acc[curr.rejectionReason] || 0) + curr.rejectedQuantity;
    }
    return acc;
  }, {} as Record<string, number>);

  const reasonData = Object.keys(reasonStats).map(reason => ({
    name: reason,
    value: reasonStats[reason]
  })).sort((a, b) => b.value - a.value);

  const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e'];

  // Global totals
  const totalProduced = entries.reduce((sum, e) => sum + e.producedQuantity, 0);
  const totalRejected = entries.reduce((sum, e) => sum + e.rejectedQuantity, 0);
  const globalRejectionRate = totalProduced > 0 ? ((totalRejected / totalProduced) * 100).toFixed(1) : '0.0';

  return (
    <div className="p-6">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div className="text-sm text-gray-500">Total Produced</div>
          <div className="text-3xl font-bold text-gray-900">{totalProduced}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div className="text-sm text-gray-500">Total Rejected</div>
          <div className="text-3xl font-bold text-danger">{totalRejected}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div className="text-sm text-gray-500">Global Rejection Rate</div>
          <div className={`text-3xl font-bold ${Number(globalRejectionRate) > 10 ? 'text-danger' : 'text-gray-900'}`}>{globalRejectionRate}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div className="bg-white border border-gray-200 p-4 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Rejection Rate by Machine (%)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={machineData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis />
                <Tooltip cursor={{fill: '#f3f4f6'}} />
                <Bar dataKey="rejectionRate" fill="#ef4444" radius={[4, 4, 0, 0]} name="Rejection %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-4 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Rejection Reasons Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reasonData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {reasonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
