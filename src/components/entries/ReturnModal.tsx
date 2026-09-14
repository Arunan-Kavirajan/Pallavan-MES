import React, { useState } from 'react';
import Modal from '../common/Modal';
import { AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (remark: string) => void;
}

export default function ReturnModal({ isOpen, onClose, onConfirm }: Props) {
  const [remark, setRemark] = useState('');
  const [error, setError] = useState(false);

  const handleConfirm = () => {
    if (!remark.trim()) {
      setError(true);
      return;
    }
    onConfirm(remark);
    setRemark('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Return Entry" maxWidth="max-w-md">
      <div className="flex items-start mb-4">
        <AlertCircle className="text-warning mr-3 mt-0.5" size={20} />
        <p className="text-sm text-gray-600">
          Returning this entry will send it back to the operator as a Draft for correction. 
          A remark explaining what needs to be fixed is mandatory.
        </p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Mandatory Remark *</label>
        <textarea 
          rows={3}
          value={remark}
          onChange={(e) => { setRemark(e.target.value); setError(false); }}
          className={`w-full rounded-md shadow-sm sm:text-sm p-2 border ${error ? 'border-red-300 ring-red-300' : 'border-gray-300 focus:ring-primary focus:border-primary'}`}
          placeholder="E.g. Please check rejected quantity, it seems too high."
        />
        {error && <p className="mt-1 text-xs text-red-600">You must provide a remark to return the entry.</p>}
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
          Cancel
        </button>
        <button onClick={handleConfirm} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700">
          Return Entry
        </button>
      </div>
    </Modal>
  );
}
