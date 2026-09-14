import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import Modal from '../common/Modal';

interface Props {
  onClose: () => void;
  onSign: (dataUrl: string) => void;
}

export default function SignaturePadModal({ onClose, onSign }: Props) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [error, setError] = useState(false);

  const handleClear = () => {
    sigCanvas.current?.clear();
    setError(false);
  };

  const handleApprove = () => {
    if (sigCanvas.current?.isEmpty()) {
      setError(true);
      return;
    }
    const dataUrl = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
    if (dataUrl) {
      onSign(dataUrl);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Supervisor Signature" maxWidth="max-w-md">
      <div className="mb-2 text-sm text-gray-600">
        Please sign below to approve this production entry.
      </div>
      
      <div className={`border-2 rounded-lg bg-gray-50 overflow-hidden ${error ? 'border-red-400' : 'border-gray-300'}`}>
        <SignatureCanvas 
          ref={sigCanvas}
          canvasProps={{
            className: 'signature-canvas w-full h-48',
            style: { width: '100%', height: '200px' }
          }}
          backgroundColor="rgb(249, 250, 251)"
        />
      </div>
      
      {error && <p className="mt-1 text-xs text-red-600">Signature is required to approve.</p>}
      
      <div className="flex justify-between items-center mt-6">
        <button onClick={handleClear} className="text-sm text-gray-500 hover:text-gray-700 underline">
          Clear Signature
        </button>
        <div className="flex space-x-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleApprove} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
            Sign & Approve
          </button>
        </div>
      </div>
    </Modal>
  );
}
