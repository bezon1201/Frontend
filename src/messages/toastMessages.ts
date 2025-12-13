/**
 * Local fallback messages for toasts
 * Used when message is not found in API catalog
 * 
 * Naming convention:
 * - API_*  → API/connection errors
 * - CFG_*  → Configuration operations
 * - MSG_*  → Message catalog operations
 */

export interface ToastMessage {
  title: string;
  description?: string;
  type: 'success' | 'error';
}

export const toastMessages: Record<string, ToastMessage> = {
  // ===== API Errors =====
  API_UNAVAILABLE: {
    title: 'API is not available',
    description: 'Switched to MOCK mode',
    type: 'error'
  },
  API_MODE_REQUIRED: {
    title: 'API mode required',
    description: 'This feature requires API connection',
    type: 'error'
  },

  // ===== MOCK Mode Warning =====
  MOCK_MODE_WARNING: {
    title: 'MOCK Mode',
    description: 'Changes are NOT saved to database',
    type: 'error'
  },

  // ===== Configuration Operations =====
  CFG_SAVED: {
    title: 'Configuration saved',
    type: 'success'
  },
  CFG_SAVE_FAILED: {
    title: 'Failed to save configuration',
    description: 'Try again later',
    type: 'error'
  },

  // ===== Message Catalog Operations =====
  MSG_SAVED: {
    title: 'MOCK Mode',
    description: 'Not saved to DB',
    type: 'error'
  },
  MSG_SAVE_FAILED: {
    title: 'Failed to save message',
    description: 'Try again later',
    type: 'error'
  },
  MSG_DELETED: {
    title: 'Message deleted',
    type: 'success'
  },
  MSG_DELETE_FAILED: {
    title: 'Failed to delete message',
    description: 'Try again later',
    type: 'error'
  },
  MSG_NOT_FOUND: {
    title: 'Message not found',
    type: 'error'
  },
  MSG_INVALID: {
    title: 'Invalid message',
    description: 'Code and text are required',
    type: 'error'
  },
  MSG_FETCH_FAILED: {
    title: 'Failed to load messages',
    description: 'Try again later',
    type: 'error'
  },
};