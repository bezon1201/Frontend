import { toastMessages, type ToastMessage } from './toastMessages';
import { alertMessages } from './alertMessages';
import type { Message } from '../services/api';

/**
 * Message Resolver - Fallback chain for displaying messages:
 * 1. API Messages (from Message Catalog) - ONLY in API mode
 * 2. Local defaults (toastMessages.ts / alertMessages.ts)
 * 3. Unknown message fallback
 * 
 * IMPORTANT: In MOCK mode, API messages are IGNORED
 */

// Global cache for API messages
let apiMessagesMap: Record<string, Message> = {};
// Track current mode to enforce MOCK/API separation
let currentMode: 'MOCK' | 'API' = 'MOCK';

/**
 * Set current mode (called from MessagesContext)
 */
export function setResolverMode(mode: 'MOCK' | 'API') {
  currentMode = mode;
}

/**
 * Get current resolver mode
 */
export function getResolverMode(): 'MOCK' | 'API' {
  return currentMode;
}

/**
 * Set API messages cache (called from MessagesContext)
 */
export function setApiMessages(messages: Message[]) {
  apiMessagesMap = {};
  messages.forEach(msg => {
    apiMessagesMap[msg.code] = msg;
  });
}

/**
 * Get API messages cache
 */
export function getApiMessages(): Record<string, Message> {
  return apiMessagesMap;
}

/**
 * Clear API messages cache
 */
export function clearApiMessages() {
  apiMessagesMap = {};
}

/**
 * Resolve toast message by code
 * Fallback chain: API (if API mode) → Local → Unknown
 */
export function resolveToastMessage(code: string): ToastMessage {
  // 1. Try API messages (kind: 'toast') - ONLY in API mode
  if (currentMode === 'API') {
    const apiMsg = apiMessagesMap[code];
    if (apiMsg && apiMsg.kind === 'toast') {
      // Parse API message text to extract title and description
      const parts = apiMsg.text.split('\n');
      return {
        title: parts[0] || apiMsg.text,
        description: parts.length > 1 ? parts.slice(1).join('\n') : undefined,
        type: 'success' // Default to success for API messages
      };
    }
  }

  // 2. Try local defaults
  const localMsg = toastMessages[code];
  if (localMsg) {
    return localMsg;
  }

  // 3. Unknown message fallback
  return {
    title: `Unknown message: ${code}`,
    type: 'error'
  };
}

/**
 * Resolve alert message by code
 * Fallback chain: API (if API mode) → Local → Unknown
 */
export function resolveAlertMessage(code: string): string {
  // 1. Try API messages (kind: 'alert') - ONLY in API mode
  if (currentMode === 'API') {
    const apiMsg = apiMessagesMap[code];
    if (apiMsg && apiMsg.kind === 'alert') {
      return apiMsg.text;
    }
  }

  // 2. Try local defaults
  const localMsg = alertMessages[code];
  if (localMsg) {
    return localMsg;
  }

  // 3. Unknown message fallback
  return `Unknown message: ${code}`;
}

/**
 * Convenience function - resolve and return just the title
 */
export function resolveToastText(code: string): string {
  return resolveToastMessage(code).title;
}