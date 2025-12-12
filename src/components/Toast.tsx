import { useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

export type ToastType = 'success' | 'error';

interface ToastProps {
  title: string;
  description?: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ 
  title, 
  description, 
  type, 
  isVisible, 
  onClose,
  duration = 3000 
}: ToastProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const styles = {
    success: {
      bg: '#D7F5DF',
      iconColor: '#10b981',
      titleColor: '#111111',
      descColor: '#555555'
    },
    error: {
      bg: '#FCE5E5',
      iconColor: '#ef4444',
      titleColor: '#111111',
      descColor: '#555555'
    }
  };

  const currentStyle = styles[type];
  const Icon = type === 'success' ? CheckCircle : XCircle;

  return (
    <>
      <div 
        className="fixed left-0 right-0 z-50 animate-slide-down"
        style={{
          top: 'max(48px, calc(env(safe-area-inset-top) + 16px))',
          paddingLeft: '1rem',
          paddingRight: '1rem'
        }}
      >
        <div 
          className="mx-auto rounded-xl shadow-lg"
          style={{
            backgroundColor: currentStyle.bg,
            maxWidth: '90%',
            padding: '12px 16px'
          }}
        >
          <div className="flex items-start gap-3">
            <Icon 
              className="w-5 h-5 flex-shrink-0 mt-0.5" 
              style={{ color: currentStyle.iconColor }}
            />
            <div className="flex-1 min-w-0">
              <div 
                className="text-[16px] font-bold mb-0.5"
                style={{ color: currentStyle.titleColor }}
              >
                {title}
              </div>
              {description && (
                <div 
                  className="text-[14px]"
                  style={{ 
                    color: currentStyle.descColor,
                    fontWeight: 'normal'
                  }}
                >
                  {description}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-down {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
