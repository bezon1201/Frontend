import { useState } from 'react';
import Toast from './Toast';
import { useToast } from '../hooks/useToast';

export default function ToastDemo() {
  const { toast, showToast, hideToast } = useToast();

  return (
    <div className="min-h-screen bg-black p-4">
      {/* Toast Component */}
      <Toast
        title={toast.title}
        description={toast.description}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />

      {/* Demo Controls */}
      <div className="pt-20 space-y-4">
        <h1 className="text-white text-[24px] font-bold mb-6">Toast Notifications Demo</h1>
        
        <button
          onClick={() => showToast('Account added', 'New crypto account successfully created', 'success')}
          className="w-full py-4 rounded-xl text-white text-[20px] font-bold"
          style={{ backgroundColor: '#10b981' }}
        >
          Show Success Toast
        </button>

        <button
          onClick={() => showToast('Cannot add account', 'Account name already exists', 'error')}
          className="w-full py-4 rounded-xl text-white text-[20px] font-bold"
          style={{ backgroundColor: '#ef4444' }}
        >
          Show Error Toast
        </button>

        <button
          onClick={() => showToast('Asset updated', undefined, 'success')}
          className="w-full py-4 rounded-xl text-white text-[20px] font-bold"
          style={{ backgroundColor: '#10b981' }}
        >
          Show Success (No Description)
        </button>

        <button
          onClick={() => showToast('Invalid amount', undefined, 'error')}
          className="w-full py-4 rounded-xl text-white text-[20px] font-bold"
          style={{ backgroundColor: '#ef4444' }}
        >
          Show Error (No Description)
        </button>
      </div>
    </div>
  );
}
