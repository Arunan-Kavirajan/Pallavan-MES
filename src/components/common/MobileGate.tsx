import React from 'react';
import { Monitor, AlertCircle } from 'lucide-react';

export default function MobileGate() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Monitor size={32} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Desktop Only Application</h1>
        <p className="text-gray-600 mb-8">
          The Pallavan Precision Works MES system is designed exclusively for desktop environments and industrial kiosks. Mobile devices are not supported.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start text-left">
          <AlertCircle className="text-amber-500 mr-3 shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-amber-800">
            Please access this application from a PC, Mac, or Windows Tablet with a resolution of at least 1024x768.
          </p>
        </div>
      </div>
    </div>
  );
}
