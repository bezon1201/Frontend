# Message Resolver System

## Overview

The Message Resolver provides a **3-layer fallback chain** for displaying toast/alert messages throughout the application:

1. **API Messages** (from Message Catalog via `/api/messages`)
2. **Local Defaults** (`/messages/toastMessages.ts`)
3. **Unknown Fallback** (`"Unknown message: CODE"`)

---

## Architecture

### 📁 Files

```
/messages/
├── toastMessages.ts       → Local fallback messages
└── messageResolver.ts     → Resolver with 3-layer fallback

/context/
└── MessagesContext.tsx    → API message cache + localStorage
```

---

## Usage

### ✅ **Step 1: Import the resolver**

```tsx
import { resolveToastMessage } from '../messages/messageResolver';
import { useToast } from '../hooks/useToast';
```

### ✅ **Step 2: Resolve message by CODE**

```tsx
const { showToast } = useToast();

// ❌ DON'T: Hardcoded text
showToast("Message saved", undefined, "success");

// ✅ DO: Resolve by code
const msg = resolveToastMessage('MESSAGE_SAVED');
showToast(msg.title, msg.description, msg.type);
```

### ✅ **Step 3: Add new codes to local defaults**

Edit `/messages/toastMessages.ts`:

```tsx
export const toastMessages: Record<string, ToastMessage> = {
  // ... existing codes ...
  
  MY_NEW_CODE: {
    title: 'Operation completed',
    description: 'Your changes were saved successfully',
    type: 'success'
  },
};
```

---

## Fallback Chain

### **Example: `resolveToastMessage('MESSAGE_SAVED')`**

```
1. Check API Messages (from /api/messages)
   ├─ Found? → Return API text (kind: 'toast')
   └─ Not found? → Go to step 2

2. Check Local Defaults (toastMessages.ts)
   ├─ Found? → Return local message
   └─ Not found? → Go to step 3

3. Unknown Fallback
   └─ Return: "Unknown message: MESSAGE_SAVED" (type: error)
```

---

## API vs Local

### **When to use each:**

| Source | Use Case |
|--------|----------|
| **API Messages** | Dynamic, editable messages via UI (Message Catalog) |
| **Local Defaults** | Static fallback messages for critical codes |
| **Unknown Fallback** | Development helper to catch missing messages |

### **Example Flow:**

**API Mode:**
```tsx
// User edited "MSG_SAVED" in Message Catalog
resolveToastMessage('MSG_SAVED')
// → Returns API version: "Сообщение сохранено"
```

**MOCK Mode or API fails:**
```tsx
resolveToastMessage('MSG_SAVED')
// → Returns local default: "Message saved"
```

**Code not defined:**
```tsx
resolveToastMessage('TYPO_CODE')
// → Returns: "Unknown message: TYPO_CODE"
```

### **Cache Updates:**

After successful PUT/DELETE, cache is updated immediately (no need to wait for TTL):

```tsx
// In MessageEditSheet after successful save
await updateMessage(code, data);
updateMessageCache(updatedMessage); // ← Cache updated instantly
```

---

## Context: MessagesContext

### **Features:**

- ✅ Loads messages from `/api/messages` on app start (API mode only)
- ✅ Caches in memory + localStorage (1 hour TTL)
- ✅ Auto-reloads when switching modes (API ↔ MOCK)
- ✅ No API calls in MOCK mode

### **Usage:**

```tsx
import { useMessages } from '../context/MessagesContext';

function MyComponent() {
  const { messages, isLoading, reload } = useMessages();
  
  // Force refresh cache
  const handleRefresh = async () => {
    await reload();
  };
  
  return <button onClick={handleRefresh}>Refresh Messages</button>;
}
```

---

## Toast Types

### **Success Toast** ✅
- Positive actions, confirmations
- Green background (`#D7F5DF`)
- CheckCircle icon

```tsx
resolveToastMessage('MESSAGE_SAVED')
// → type: 'success'
```

### **Error Toast** ❌
- Errors, warnings, MOCK mode alerts
- Red background (`#FCE5E5`)
- XCircle icon

```tsx
resolveToastMessage('API_ERROR')
// → type: 'error'
```

---

## Common Codes (Backend Format)

### **API Errors (API_*)**
```tsx
API_UNAVAILABLE    → "API is not available" + "Switched to MOCK mode"
API_MODE_REQUIRED  → "API mode required" + "This feature requires API connection"
```

### **MOCK Mode**
```tsx
MOCK_MODE_WARNING  → "MOCK Mode" + "Changes are NOT saved to database"
```

### **Configuration (CFG_*)**
```tsx
CFG_SAVED          → "Configuration saved"
CFG_SAVE_FAILED    → "Failed to save configuration" + "Try again later"
```

### **Messages (MSG_*)**
```tsx
MSG_SAVED          → "Message saved"
MSG_SAVE_FAILED    → "Failed to save message" + "Try again later"
MSG_DELETED        → "Message deleted"
MSG_DELETE_FAILED  → "Failed to delete message" + "Try again later"
MSG_NOT_FOUND      → "Message not found"
MSG_INVALID        → "Invalid message" + "Code and text are required"
MSG_FETCH_FAILED   → "Failed to load messages" + "Try again later"
```

### **Naming Convention**
- `API_*` → API/connection errors
- `CFG_*` → Configuration operations
- `MSG_*` → Message catalog operations
- `ORD_*` → Order operations (add as needed)
- `TRD_*` → Trade operations (add as needed)
- `ACC_*` → Account operations (add as needed)

---

## Best Practices

### ✅ **DO:**

1. **Always use codes**, not hardcoded strings
2. **Add fallback** to `toastMessages.ts` for critical messages
3. **Use descriptive codes** (e.g. `ORDER_CANCELLED` not `MSG_1`)
4. **Test unknown codes** to catch typos early

### ❌ **DON'T:**

1. **Don't hardcode** toast text directly
2. **Don't assume** API messages exist (always have local fallback)
3. **Don't use codes** for dynamic content (use parameters if needed)

---

## Migration Checklist

To convert existing hardcoded toasts to resolver:

1. Find all `showToast("hardcoded text", ...)` calls
2. Create a unique CODE for each message
3. Add CODE to `/messages/toastMessages.ts`
4. Replace with `resolveToastMessage('CODE')`
5. Test in both API and MOCK modes

---

## Debugging

### **Unknown message appears:**

```
"Unknown message: CFG_SAVED"
```

**Cause:** Code `CFG_SAVED` not found in API or local defaults

**Fix:** Add to `/messages/toastMessages.ts`:
```tsx
CFG_SAVED: {
  title: 'Configuration saved',
  type: 'success'
}
```

### **API messages not loading:**

1. Check `mode` in DataSourceContext (must be "API")
2. Check browser console for API errors
3. Check localStorage: `app_messages_cache`
4. Force reload: `useMessages().reload()`

---

## Summary

```tsx
// Old way ❌
showToast("Message saved", undefined, "success");

// New way ✅
const msg = resolveToastMessage('MESSAGE_SAVED');
showToast(msg.title, msg.description, msg.type);
```

**Benefits:**
- ✅ Centralized message management
- ✅ Editable via UI (Message Catalog)
- ✅ Fallback for offline/MOCK mode
- ✅ Catch missing messages early
- ✅ i18n-ready (API can return translated text)
