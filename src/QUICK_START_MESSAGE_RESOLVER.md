# Message Resolver - Quick Start

## ⚡ TL;DR

```tsx
// ❌ Old way
showToast("Message saved", undefined, "success");

// ✅ New way (backend format: MSG_*, CFG_*, API_*)
const msg = resolveToastMessage('MSG_SAVED');
showToast(msg.title, msg.description, msg.type);
```

---

## 📦 Setup (Already Done)

✅ `/messages/toastMessages.ts` - Local fallback messages  
✅ `/messages/messageResolver.ts` - 3-layer resolver  
✅ `/context/MessagesContext.tsx` - API cache + localStorage  
✅ `App.tsx` - Wrapped in `<MessagesProvider>`

---

## 🚀 Usage

### 1. Import

```tsx
import { resolveToastMessage } from '../messages/messageResolver';
import { useToast } from '../hooks/useToast';
```

### 2. Use

```tsx
const { showToast } = useToast();

// Resolve message by code
const msg = resolveToastMessage('ACCOUNT_ADDED');
showToast(msg.title, msg.description, msg.type);
```

---

## 🎯 Available Codes (Backend Format)

**API Errors:**
| Code | Type | Description |
|------|------|-------------|
| `API_UNAVAILABLE` | error | "API is not available" + "Switched to MOCK mode" |
| `API_MODE_REQUIRED` | error | "API mode required" + "This feature requires API connection" |

**MOCK Mode:**
| Code | Type | Description |
|------|------|-------------|
| `MOCK_MODE_WARNING` | error | "MOCK Mode" + "Changes are NOT saved to database" |

**Configuration (CFG_*):**
| Code | Type | Description |
|------|------|-------------|
| `CFG_SAVED` | success | "Configuration saved" |
| `CFG_SAVE_FAILED` | error | "Failed to save configuration" + "Try again later" |

**Messages (MSG_*):**
| Code | Type | Description |
|------|------|-------------|
| `MSG_SAVED` | success | "Message saved" |
| `MSG_SAVE_FAILED` | error | "Failed to save message" + "Try again later" |
| `MSG_DELETED` | success | "Message deleted" |
| `MSG_DELETE_FAILED` | error | "Failed to delete message" + "Try again later" |
| `MSG_NOT_FOUND` | error | "Message not found" |
| `MSG_INVALID` | error | "Invalid message" + "Code and text are required" |
| `MSG_FETCH_FAILED` | error | "Failed to load messages" + "Try again later" |

---

## ➕ Add New Message

1. Edit `/messages/toastMessages.ts`:

```tsx
export const toastMessages: Record<string, ToastMessage> = {
  // ... existing ...
  
  // Follow backend naming: ORD_*, TRD_*, ACC_*, etc.
  ORD_PLACED: {
    title: 'Order placed',
    description: 'Your order is being processed',
    type: 'success'
  },
};
```

2. Use it:

```tsx
const msg = resolveToastMessage('ORD_PLACED');
showToast(msg.title, msg.description, msg.type);
```

---

## 🔍 How It Works

### Fallback Chain:

```
resolveToastMessage('MESSAGE_SAVED')
  ↓
1. Check API Messages (from /api/messages)
   ├─ Found? → Return API text
   └─ Not found? → Go to step 2
  ↓
2. Check Local Defaults (/messages/toastMessages.ts)
   ├─ Found? → Return local message
   └─ Not found? → Go to step 3
  ↓
3. Return "Unknown message: MESSAGE_SAVED" (type: error)
```

---

## 🎨 Types

### `ToastMessage`

```tsx
interface ToastMessage {
  title: string;           // Main text (required)
  description?: string;    // Secondary text (optional)
  type: 'success' | 'error'; // Toast type
}
```

---

## 🧪 Testing

1. **MOCK Mode**: Uses local defaults from `toastMessages.ts`
2. **API Mode**: Loads from `/api/messages` → fallback to local
3. **Unknown Code**: Shows `"Unknown message: YOUR_CODE"`

---

## 📚 Full Documentation

- `/MESSAGE_RESOLVER.md` - Complete guide
- `/TOAST_USAGE.md` - Toast system + resolver integration
- `/components/ToastDemo.tsx` - Live examples

---

## ✅ Migration Checklist

- [ ] Find all `showToast("hardcoded", ...)` calls
- [ ] Create CODE for each unique message
- [ ] Add CODE to `/messages/toastMessages.ts`
- [ ] Replace with `resolveToastMessage('CODE')`
- [ ] Test in both API and MOCK modes
- [ ] Check for "Unknown message" toasts

---

**Ready to go! 🚀**
