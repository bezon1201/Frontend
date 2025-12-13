import { useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import ModalSheet from './ModalSheet';

interface AlertProps {
  title?: string;
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

/**
 * Alert Component - Bottom Sheet Modal for Critical Messages
 * 
 * Used for:
 * - API errors
 * - Critical warnings
 * - Confirmation messages
 * 
 * Triggered by ui.alert.code from API responses
 */
export default function Alert({ title = 'Alert', message, isVisible, onClose }: AlertProps) {
  // Auto-close after 10 seconds for better UX
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <ModalSheet isOpen={isVisible} onClose={onClose}>
      <div className="p-6 pb-32">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <h2 
              className="text-gray-900"
              style={{ fontSize: '24px', fontWeight: 'bold' }}
            >
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 flex-shrink-0"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Message */}
        <div 
          className="text-gray-700 whitespace-pre-wrap mb-8"
          style={{ fontSize: '16px', lineHeight: '1.5' }}
        >
          {message}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-4 rounded-xl bg-orange-600 text-white"
          style={{ fontSize: '20px', fontWeight: 'bold' }}
        >
          Got it
        </button>
      </div>
    </ModalSheet>
  );
}
