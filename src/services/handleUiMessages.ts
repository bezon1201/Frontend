import { resolveToastMessage, resolveAlertMessage } from '../messages/messageResolver';

/**
 * UI Messages Handler
 * 
 * Processes API responses with ui.toast and ui.alert codes
 * 
 * Example API response:
 * {
 *   "success": true,
 *   "data": {...},
 *   "ui": {
 *     "toast": { "code": "MSG_SAVED" },
 *     "alert": { "code": "API_UNAVAILABLE" }
 *   }
 * }
 */

export interface UiMessage {
  toast?: { code: string };
  alert?: { code: string };
}

export interface ApiResponse {
  success?: boolean;
  data?: any;
  ui?: UiMessage;
  error?: string;
  error_code?: string;
}

/**
 * Show toast notification
 * Uses the global toast system (must be called in a component with useToast)
 */
let globalShowToast: ((title: string, description?: string, type?: 'success' | 'error') => void) | null = null;

/**
 * Show alert modal
 * Uses the global alert system
 */
let globalShowAlert: ((message: string, title?: string) => void) | null = null;

/**
 * Register global toast handler
 * Call this in App.tsx or root component
 */
export function registerToastHandler(
  showToast: (title: string, description?: string, type?: 'success' | 'error') => void
) {
  globalShowToast = showToast;
}

/**
 * Register global alert handler
 * Call this in App.tsx or root component
 */
export function registerAlertHandler(
  showAlert: (message: string, title?: string) => void
) {
  globalShowAlert = showAlert;
}

/**
 * Handle UI messages from API response
 * 
 * Usage:
 * ```tsx
 * const response = await fetch('/api/messages');
 * const json = await response.json();
 * handleUiMessages(json);
 * ```
 */
export function handleUiMessages(
  response: ApiResponse,
  options?: {
    showToast?: (title: string, description?: string, type?: 'success' | 'error') => void;
    showAlert?: (message: string, title?: string) => void;
  }
): void {
  const showToast = options?.showToast || globalShowToast;
  const showAlert = options?.showAlert || globalShowAlert;

  if (!response.ui) return;

  // Handle alert first (more critical)
  if (response.ui.alert?.code) {
    const alertMessage = resolveAlertMessage(response.ui.alert.code);
    if (showAlert) {
      showAlert(alertMessage, 'Alert');
    } else {
      console.warn('Alert handler not registered:', alertMessage);
    }
  }

  // Handle toast
  if (response.ui.toast?.code) {
    const toastMsg = resolveToastMessage(response.ui.toast.code);
    if (showToast) {
      showToast(toastMsg.title, toastMsg.description, toastMsg.type);
    } else {
      console.warn('Toast handler not registered:', toastMsg);
    }
  }
}

/**
 * Convenience wrapper for API calls with automatic UI message handling
 * 
 * Usage:
 * ```tsx
 * const data = await apiCallWithUi(
 *   async () => {
 *     const res = await fetch('/api/messages');
 *     return res.json();
 *   },
 *   { showToast, showAlert }
 * );
 * ```
 */
export async function apiCallWithUi<T = any>(
  apiCall: () => Promise<ApiResponse>,
  handlers?: {
    showToast?: (title: string, description?: string, type?: 'success' | 'error') => void;
    showAlert?: (message: string, title?: string) => void;
  }
): Promise<T | null> {
  try {
    const response = await apiCall();
    
    // Handle UI messages
    handleUiMessages(response, handlers);
    
    // Return data if success
    if (response.success !== false) {
      return response.data || response;
    }
    
    return null;
  } catch (error) {
    console.error('API call failed:', error);
    
    // Show generic error toast
    const showToast = handlers?.showToast || globalShowToast;
    if (showToast) {
      const msg = resolveToastMessage('API_ERROR');
      showToast(msg.title, msg.description, msg.type);
    }
    
    return null;
  }
}
