import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { KeyRound, User, ChevronRight, Factory, Monitor } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [employeeId, setEmployeeId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay for realism
    setTimeout(() => {
      const success = login(employeeId.trim(), pin);
      if (!success) {
        setError('Invalid Employee ID or PIN. Please try again.');
      }
      setIsLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Factory className="text-white" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">ApexFlow Technologies</h1>
        <p className="text-gray-500 mt-1">Pallavan Precision Works MES</p>
      </div>

      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Employee Sign In</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. OP-01"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="pl-10 w-full border-gray-300 rounded-lg shadow-xs focus:ring-blue-500 focus:border-blue-500 p-2.5 border sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Security PIN</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound size={18} className="text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="Enter your PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="pl-10 w-full border-gray-300 rounded-lg shadow-xs focus:ring-blue-500 focus:border-blue-500 p-2.5 border sm:text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-md text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !employeeId || !pin}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Secure Login
                  <ChevronRight size={16} className="ml-1" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="bg-gray-50 p-4 border-t border-gray-100">
          <div className="text-xs text-gray-500 text-center">
            <span className="font-semibold block mb-1 text-gray-700">Demo Credentials</span>
            <div><span className="font-mono bg-gray-200 px-1 py-0.5 rounded">OP-01</span> or <span className="font-mono bg-gray-200 px-1 py-0.5 rounded">OP-02</span> (Operators)</div>
            <div className="mt-1"><span className="font-mono bg-gray-200 px-1 py-0.5 rounded">SUP-01</span> (Supervisor) | <span className="font-mono bg-gray-200 px-1 py-0.5 rounded">MGR-01</span> (Manager)</div>
            <div className="mt-2 text-blue-600 font-semibold">Universal PIN: apex123</div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <span className="font-semibold block mb-2 text-gray-700 text-xs text-center">Download Desktop Application</span>
            <div className="flex flex-col gap-2">
              <a 
                href="/downloads/Pallavan-MES-Windows.exe" 
                download
                className="w-full flex items-center justify-center py-1.5 px-3 border border-gray-300 rounded-md shadow-sm bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Monitor size={14} className="mr-2 text-blue-600" />
                Windows (.exe)
              </a>
              <a 
                href="/downloads/Pallavan-MES-Mac.dmg" 
                download
                className="w-full flex items-center justify-center py-1.5 px-3 border border-gray-300 rounded-md shadow-sm bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Monitor size={14} className="mr-2 text-gray-800" />
                macOS (.dmg)
              </a>
              <a 
                href="/downloads/Pallavan-MES-Linux.AppImage" 
                download
                className="w-full flex items-center justify-center py-1.5 px-3 border border-gray-300 rounded-md shadow-sm bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Monitor size={14} className="mr-2 text-orange-600" />
                Linux (.AppImage)
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-xs text-gray-400">
        &copy; {new Date().getFullYear()} ApexFlow Technologies. All rights reserved.
      </div>
    </div>
  );
}
