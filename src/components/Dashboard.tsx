import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import EntryList from './entries/EntryList';
import ProductionEntryForm from './form/ProductionEntryForm';
import ExportPanel from './export/ExportPanel';
import SummaryView from './analytics/SummaryView';
import { PlusCircle, List, FileDown, PieChart } from 'lucide-react';

export default function Dashboard() {
  const { currentUser } = useAuth();
  
  // Views: 'list' | 'form' | 'export' | 'analytics'
  const [activeView, setActiveView] = useState<'list' | 'form' | 'export' | 'analytics'>('list');
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  const handleNewEntry = () => {
    setEditingEntryId(null);
    setActiveView('form');
  };

  const handleEditEntry = (id: string) => {
    setEditingEntryId(id);
    setActiveView('form');
  };

  const handleFormClose = () => {
    setActiveView('list');
    setEditingEntryId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {activeView === 'list' && 'Production Entries'}
            {activeView === 'form' && (editingEntryId ? 'Edit Entry' : 'New Shift Entry')}
            {activeView === 'export' && 'Export Reports'}
            {activeView === 'analytics' && 'Production Analytics'}
          </h2>
          <p className="text-sm text-gray-500">
            {activeView === 'list' && (currentUser.role === 'Operator' ? 'Manage your shift production records.' : 'Review plant-wide production records.')}
          </p>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex bg-white shadow-sm rounded-lg p-1 border border-gray-200">
          <button
            onClick={() => setActiveView('list')}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeView === 'list' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <List size={16} className="mr-2" />
            Entries
          </button>
          
          {currentUser.role === 'Operator' && (
            <button
              onClick={handleNewEntry}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeView === 'form' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <PlusCircle size={16} className="mr-2" />
              New Entry
            </button>
          )}

          {currentUser.role === 'Manager' && (
            <>
              <button
                onClick={() => setActiveView('analytics')}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeView === 'analytics' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <PieChart size={16} className="mr-2" />
                Analytics
              </button>
              <button
                onClick={() => setActiveView('export')}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeView === 'export' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FileDown size={16} className="mr-2" />
                Export
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px]">
        {activeView === 'list' && <EntryList onEdit={handleEditEntry} />}
        {activeView === 'form' && <ProductionEntryForm entryId={editingEntryId} onClose={handleFormClose} />}
        {activeView === 'export' && <ExportPanel />}
        {activeView === 'analytics' && <SummaryView />}
      </div>
    </div>
  );
}
