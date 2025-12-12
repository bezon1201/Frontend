import { useTheme } from '../context/ThemeContext';

// Sheet: DeleteAccountSheet
//
// Шторка подтверждения удаления аккаунта.
// Показывает: название аккаунта и предупреждение, что операция необратима.
//
// API (Finance):
// - DELETE /api/finance/accounts/{account_id}
//   Успех: { "deleted": true }
//   Возможные ошибки:
//   - ACCOUNT_NOT_FOUND
//   - ACCOUNT_HAS_LINKED_OPERATIONS (у аккаунта есть связанные операции/кампании).

interface DeleteAccountSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void; // TODO API (Finance): При подтверждении удаления: 1) Вызвать DELETE /api/finance/accounts/{account_id}. 2) При успехе: - закрыть DeleteAccountSheet, - инициировать перезагрузку списка на FinanceScreen (GET /api/finance/accounts), - показать toast об успешном удалении (например, "ACCOUNT_DELETED"). 3) При ошибке ACCOUNT_HAS_LINKED_OPERATIONS: - не закрывать шторку автоматически, - показать alert/toast с пояснением (текст будет из словаря по error_code).
  accountName: string;
}

export default function DeleteAccountSheet({ 
  isOpen, 
  onClose, 
  onConfirm, 
  accountName 
}: DeleteAccountSheetProps) {
  const { theme } = useTheme();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        style={{
          touchAction: 'none',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none'
        }}
      />
      
      {/* Sheet */}
      <div 
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 animate-slide-up"
        style={{
          touchAction: 'none',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none'
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Content */}
        <div className="px-6 py-8 space-y-6">
          <div className="text-center">
            <h2 className="text-[24px] font-bold text-black mb-3">
              Delete Account
            </h2>
            <p className="text-[16px] text-gray-600">
              Are you sure you want to delete <span className="font-bold">{accountName}</span>?
              <br />
              This action cannot be undone.
            </p>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={onConfirm}
              className="w-full py-4 rounded-xl text-white text-[20px] font-bold"
              style={{ backgroundColor: '#ef4444' }}
            >
              Delete
            </button>
            <button
              onClick={onClose}
              className="w-full py-4 rounded-xl text-[20px] font-bold"
              style={{ 
                backgroundColor: '#10b98120',
                color: '#10b981'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}