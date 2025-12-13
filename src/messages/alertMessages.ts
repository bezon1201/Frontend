/**
 * Local fallback messages for alerts (bottom sheets)
 * Used when message is not found in API catalog
 * 
 * Naming convention:
 * - API_*  → API/connection errors
 * - CFG_*  → Configuration operations
 * - MSG_*  → Message catalog operations
 */

export const alertMessages: Record<string, string> = {
  // ===== API Errors =====
  API_UNAVAILABLE: 
    'API connection failed. The application has been switched to MOCK mode. ' +
    'Please check your internet connection or try again later.',
  
  API_MODE_REQUIRED: 
    'This feature requires an active API connection. ' +
    'Please switch to API mode and ensure the backend is available.',

  // ===== Configuration Operations =====
  CFG_SAVE_FAILED:
    'Failed to save configuration to the database. ' +
    'Your changes have not been persisted. Please try again.',

  // ===== Message Catalog Operations =====
  MSG_SAVE_FAILED:
    'Failed to save message to the database. ' +
    'The message code may already exist or the database is unavailable. ' +
    'Please check your input and try again.',

  MSG_DELETE_FAILED:
    'Failed to delete message from the database. ' +
    'The message may be in use or the database is unavailable. ' +
    'Please try again later.',

  MSG_NOT_FOUND:
    'The requested message was not found in the database. ' +
    'It may have been deleted by another user.',

  // ===== MOCK Mode Warning =====
  MOCK_MODE_WARNING:
    '⚠️ MOCK Mode Active\n\n' +
    'You are currently in MOCK mode. Changes will NOT be saved to the database. ' +
    'All operations are simulated locally.\n\n' +
    'To persist changes, please switch to API mode.',
};
