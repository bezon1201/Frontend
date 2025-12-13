import Toast from './Toast';
import Alert from './Alert';
import { useToast } from '../hooks/useToast';
import { useAlert } from '../hooks/useAlert';
import { resolveToastMessage, resolveAlertMessage, getResolverMode } from '../messages/messageResolver';
import { useDataSource } from '../context/DataSourceContext';

export default function ToastDemo() {
  const { toast, showToast, hideToast } = useToast();
  const { alert, showAlert, hideAlert } = useAlert();
  const { mode } = useDataSource();

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

      {/* Alert Component */}
      <Alert
        title={alert.title}
        message={alert.message}
        isVisible={alert.isVisible}
        onClose={hideAlert}
      />

      {/* Demo Controls */}
      <div className="pt-20 space-y-4">
        <h1 className="text-white text-[24px] font-bold mb-2">Toast & Alert Demo</h1>
        <p className="text-gray-400 text-[14px] mb-6">
          Current Mode: <span className="font-bold text-white">{mode}</span> | 
          Resolver: <span className="font-bold text-white">{getResolverMode()}</span>
        </p>

        {/* WOW Demo - Same code, different messages */}
        <div className="bg-yellow-900 border-2 border-yellow-500 rounded-xl p-4 mb-4">
          <h2 className="text-yellow-200 text-[16px] font-bold mb-2">
            🎭 WOW Demo - Same Code, Different Messages!
          </h2>
          <p className="text-yellow-300 text-[14px] mb-3">
            Click below to see how <code className="bg-yellow-800 px-2 py-1 rounded">MSG_SAVED</code> changes 
            based on MOCK vs API mode
          </p>
          <button
            onClick={() => {
              const msg = resolveToastMessage('MSG_SAVED');
              showToast(msg.title, msg.description, msg.type);
            }}
            className="w-full py-3 rounded-xl text-white text-[16px] font-bold"
            style={{ backgroundColor: '#fbbf24' }}
          >
            Test MSG_SAVED (switches with mode!)
          </button>
          <div className="mt-3 text-[12px] text-yellow-200">
            <div className="font-bold">MOCK Mode:</div>
            <div>• Title: "MOCK Mode"</div>
            <div>• Description: "Not saved to DB"</div>
            <div>• Type: error (red)</div>
            <div className="mt-2 font-bold">API Mode:</div>
            <div>• Title: "Message saved"</div>
            <div>• Type: success (green)</div>
          </div>
        </div>

        <button
          onClick={() => {
            const msg = resolveToastMessage('CFG_SAVED');
            showToast(msg.title, msg.description, msg.type);
          }}
          className="w-full py-4 rounded-xl text-white text-[20px] font-bold"
          style={{ backgroundColor: '#10b981' }}
        >
          Show Success (CFG_SAVED)
        </button>

        <button
          onClick={() => {
            const msg = resolveToastMessage('MSG_SAVE_FAILED');
            showToast(msg.title, msg.description, msg.type);
          }}
          className="w-full py-4 rounded-xl text-white text-[20px] font-bold"
          style={{ backgroundColor: '#ef4444' }}
        >
          Show Error (MSG_SAVE_FAILED)
        </button>

        <button
          onClick={() => {
            const msg = resolveToastMessage('API_UNAVAILABLE');
            showToast(msg.title, msg.description, msg.type);
          }}
          className="w-full py-4 rounded-xl text-white text-[20px] font-bold"
          style={{ backgroundColor: '#ef4444' }}
        >
          Show Error (API_UNAVAILABLE)
        </button>

        <button
          onClick={() => {
            const msg = resolveToastMessage('MOCK_MODE_WARNING');
            showToast(msg.title, msg.description, msg.type);
          }}
          className="w-full py-4 rounded-xl text-white text-[20px] font-bold"
          style={{ backgroundColor: '#fbbf24' }}
        >
          Show Warning (MOCK_MODE_WARNING)
        </button>

        <button
          onClick={() => {
            const msg = resolveToastMessage('UNKNOWN_TEST_CODE');
            showToast(msg.title, msg.description, msg.type);
          }}
          className="w-full py-4 rounded-xl text-white text-[20px] font-bold"
          style={{ backgroundColor: '#6b7280' }}
        >
          Show Unknown (UNKNOWN_TEST_CODE)
        </button>

        <button
          onClick={() => {
            const msg = resolveAlertMessage('ALERT_TEST');
            showAlert(msg.title, msg.message);
          }}
          className="w-full py-4 rounded-xl text-white text-[20px] font-bold"
          style={{ backgroundColor: '#fbbf24' }}
        >
          Show Alert (ALERT_TEST)
        </button>

        <button
          onClick={() => {
            const msg = resolveAlertMessage('API_UNAVAILABLE');
            showAlert(msg, 'Alert Demo');
          }}
          className="w-full py-4 rounded-xl text-white text-[20px] font-bold"
          style={{ backgroundColor: '#f97316' }}
        >
          Show Alert (API_UNAVAILABLE)
        </button>

        <button
          onClick={() => {
            const msg = resolveAlertMessage('MOCK_MODE_WARNING');
            showAlert(msg, 'Warning');
          }}
          className="w-full py-4 rounded-xl text-white text-[20px] font-bold"
          style={{ backgroundColor: '#f97316' }}
        >
          Show Alert (MOCK_MODE_WARNING)
        </button>
      </div>
    </div>
  );
}