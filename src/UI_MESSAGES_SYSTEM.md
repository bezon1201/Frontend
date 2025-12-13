# UI Messages System - Toast + Alert with MOCK/API Magic

## 🎯 Overview

Unified system for handling **ui.toast** and **ui.alert** codes from API responses with automatic MOCK/API mode switching.

---

## 🏗️ Architecture

### **Components:**

```
/messages/
├── toastMessages.ts       → Local toast defaults
├── alertMessages.ts       → Local alert defaults
└── messageResolver.ts     → 3-layer fallback resolver

/services/
└── handleUiMessages.ts    → Universal API response handler

/components/
├── Toast.tsx              → Toast notification component
└── Alert.tsx              → Alert modal component

/hooks/
├── useToast.ts            → Toast state management
└── useAlert.ts            → Alert state management

/context/
└── MessagesContext.tsx    → API catalog cache + MOCK/API mode enforcement
```

---

## 🪄 The Magic - MOCK vs API Mode

### **STRICT RULE:**

| Mode | Behavior |
|------|----------|
| **MOCK** | ❌ NEVER use API catalog (even if cached)<br>✅ ONLY use local defaults |
| **API** | ✅ Load catalog from `/api/messages`<br>✅ Cache in localStorage<br>✅ Fallback to local defaults if code not found |

### **Implementation:**

```tsx
// MessagesContext.tsx
if (mode === 'MOCK') {
  clearApiMessages();
  setResolverMode('MOCK');  // ← Enforces local-only
  return;
}

// API mode
setResolverMode('API');
const msgs = await getMessages();
setApiMessages(msgs);
```

### **Resolver Logic:**

```tsx
// messageResolver.ts
export function resolveToastMessage(code: string): ToastMessage {
  // 1. Try API catalog - ONLY in API mode
  if (currentMode === 'API') {
    const apiMsg = apiMessagesMap[code];
    if (apiMsg && apiMsg.kind === 'toast') {
      return parseApiMessage(apiMsg);
    }
  }
  
  // 2. Try local defaults
  const localMsg = toastMessages[code];
  if (localMsg) return localMsg;
  
  // 3. Unknown fallback
  return { title: `Unknown message: ${code}`, type: 'error' };
}
```

---

## 🎭 WOW Demo - Same Code, Different Messages

### **Example: MSG_SAVED**

#### **MOCK Mode:**
```tsx
// toastMessages.ts (local)
MSG_SAVED: {
  title: 'MOCK Mode',
  description: 'Not saved to DB',
  type: 'error'  // ← Red toast
}
```

#### **API Mode:**
```tsx
// API catalog (/api/messages)
{
  code: 'MSG_SAVED',
  kind: 'toast',
  text: 'Message saved'  // ← Green toast (default success type)
}
```

#### **Result:**
- Same code: `resolveToastMessage('MSG_SAVED')`
- Different output based on mode!
- Switch mode → message changes instantly ✨

---

## 📦 API Response Format

```json
{
  "success": true,
  "data": { ... },
  "ui": {
    "toast": { "code": "MSG_SAVED" },
    "alert": { "code": "API_UNAVAILABLE" }
  }
}
```

---

## 🔧 Usage

### **1. Automatic Handler (Recommended)**

```tsx
import { handleUiMessages } from '../services/handleUiMessages';
import { useToast } from '../hooks/useToast';
import { useAlert } from '../hooks/useAlert';

function MyComponent() {
  const { showToast } = useToast();
  const { showAlert } = useAlert();

  const handleSave = async () => {
    const response = await fetch('/api/messages', {
      method: 'POST',
      body: JSON.stringify({ ... })
    });
    
    const json = await response.json();
    
    // ✅ Automatically handles ui.toast and ui.alert
    handleUiMessages(json, { showToast, showAlert });
  };
}
```

### **2. Manual Resolution**

```tsx
import { resolveToastMessage, resolveAlertMessage } from '../messages/messageResolver';

// Toast
const msg = resolveToastMessage('MSG_SAVED');
showToast(msg.title, msg.description, msg.type);

// Alert
const alertMsg = resolveAlertMessage('API_UNAVAILABLE');
showAlert(alertMsg, 'Error');
```

---

## 📋 Available Codes

### **Toast Codes** (13)

#### API Errors:
```
API_UNAVAILABLE      "API is not available" + "Switched to MOCK mode"
API_MODE_REQUIRED    "API mode required" + "This feature requires API connection"
```

#### MOCK Mode:
```
MOCK_MODE_WARNING    "MOCK Mode" + "Changes are NOT saved to database"
```

#### Configuration:
```
CFG_SAVED            "Configuration saved"
CFG_SAVE_FAILED      "Failed to save configuration" + "Try again later"
```

#### Messages:
```
MSG_SAVED            MOCK: "MOCK Mode" + "Not saved to DB" (error)
                     API:  "Message saved" (success)
MSG_SAVE_FAILED      "Failed to save message" + "Try again later"
MSG_DELETED          "Message deleted"
MSG_DELETE_FAILED    "Failed to delete message" + "Try again later"
MSG_NOT_FOUND        "Message not found"
MSG_INVALID          "Invalid message" + "Code and text are required"
MSG_FETCH_FAILED     "Failed to load messages" + "Try again later"
```

### **Alert Codes** (6)

```
API_UNAVAILABLE      "API connection failed. The application has been switched..."
API_MODE_REQUIRED    "This feature requires an active API connection..."
CFG_SAVE_FAILED      "Failed to save configuration to the database..."
MSG_SAVE_FAILED      "Failed to save message to the database..."
MSG_DELETE_FAILED    "Failed to delete message from the database..."
MSG_NOT_FOUND        "The requested message was not found..."
MOCK_MODE_WARNING    "⚠️ MOCK Mode Active\n\nYou are currently in MOCK mode..."
```

---

## 🎨 Components

### **Toast** (Top notification)
- Position: Top of screen
- Duration: 3 seconds
- Auto-close
- Types: success (green), error (red)

### **Alert** (Bottom sheet modal)
- Position: Bottom sheet
- Duration: 10 seconds (auto-close)
- Manual close button
- Icon: AlertCircle (orange)
- For critical messages

---

## 🔄 Fallback Chain

### **Toast:**
```
resolveToastMessage('MSG_SAVED')
  ↓
1. API catalog (only if mode === 'API')
   ├─ Found? → Parse and return
   └─ Not found? → Go to step 2
  ↓
2. Local defaults (toastMessages.ts)
   ├─ Found? → Return local message
   └─ Not found? → Go to step 3
  ↓
3. Unknown fallback
   └─ Return: "Unknown message: MSG_SAVED" (type: error)
```

### **Alert:**
```
resolveAlertMessage('API_UNAVAILABLE')
  ↓
1. API catalog (only if mode === 'API')
   ├─ Found? → Return text
   └─ Not found? → Go to step 2
  ↓
2. Local defaults (alertMessages.ts)
   ├─ Found? → Return local message
   └─ Not found? → Go to step 3
  ↓
3. Unknown fallback
   └─ Return: "Unknown message: API_UNAVAILABLE"
```

---

## 🚀 Integration Examples

### **MessageEditSheet** (Save/Delete)

```tsx
const handleSave = async () => {
  try {
    if (mode === 'MOCK') {
      const msg = resolveToastMessage('MOCK_MODE_WARNING');
      showToast(msg.title, msg.description, msg.type);
      // MOCK: Shows "MOCK Mode" + "Not saved to DB" (error)
    } else {
      const updated = await updateMessage(code, data);
      updateMessageCache(updated);
      
      const msg = resolveToastMessage('MSG_SAVED');
      showToast(msg.title, msg.description, msg.type);
      // API: Shows "Message saved" (success)
    }
  } catch (error) {
    const msg = resolveToastMessage('MSG_SAVE_FAILED');
    showToast(msg.title, msg.description, msg.type);
  }
};
```

### **ModeBlock** (API Health Check)

```tsx
const checkApiAndLoad = async () => {
  try {
    await healthCheck();
    setMode('API');
  } catch {
    setMode('MOCK');
    
    const msg = resolveToastMessage('API_UNAVAILABLE');
    toast.error(msg.title, { description: msg.description });
    // Shows: "API is not available" + "Switched to MOCK mode"
  }
};
```

---

## 📊 Demo Component

`/components/ToastDemo.tsx` includes:

1. **🎭 WOW Demo** - Same code (`MSG_SAVED`), different messages based on mode
2. **Mode indicator** - Shows current MOCK/API mode and resolver mode
3. **Toast examples** - All toast codes
4. **Alert examples** - All alert codes
5. **Unknown code** - Shows fallback behavior

---

## ✅ Best Practices

### **DO:**
1. ✅ Use `handleUiMessages()` for API responses
2. ✅ Define all codes in local defaults (fallback)
3. ✅ Test in both MOCK and API modes
4. ✅ Use descriptive code names (MSG_*, CFG_*, API_*)

### **DON'T:**
1. ❌ Hardcode toast/alert text
2. ❌ Mix API catalog in MOCK mode (enforced by system)
3. ❌ Skip local defaults for critical codes
4. ❌ Use same code for both toast and alert (confusing)

---

## 🧪 Testing

### **Test MOCK → API Switch:**

1. Start in MOCK mode
2. Click "MSG_SAVED" demo button
3. See: Red toast "MOCK Mode" + "Not saved to DB"
4. Switch to API mode (Settings → Data Source Mode)
5. Click "MSG_SAVED" again
6. See: Green toast "Message saved"
7. **Magic!** ✨

---

## 📝 Adding New Codes

### **1. Add to local defaults:**

```tsx
// toastMessages.ts
ORD_PLACED: {
  title: 'Order placed',
  description: 'Your order is being processed',
  type: 'success'
}

// alertMessages.ts
ORD_FAILED: 
  'Order placement failed. Please check your balance and try again.'
```

### **2. Use in code:**

```tsx
// Toast
const msg = resolveToastMessage('ORD_PLACED');
showToast(msg.title, msg.description, msg.type);

// Alert
const alertMsg = resolveAlertMessage('ORD_FAILED');
showAlert(alertMsg, 'Order Error');
```

### **3. (Optional) Add to API catalog:**

In Message Catalog UI, add:
- Code: `ORD_PLACED`
- Kind: `toast`
- Text: `Order placed successfully`

---

## 🎯 Summary

**Before:**
```tsx
// ❌ Hardcoded, no fallback, no mode magic
showToast("Message saved", undefined, "success");
```

**After:**
```tsx
// ✅ Dynamic, fallback chain, MOCK/API magic
const msg = resolveToastMessage('MSG_SAVED');
showToast(msg.title, msg.description, msg.type);

// Result changes based on mode automatically! 🪄
```

---

**System Ready!** 🚀
- ✅ Toast + Alert support
- ✅ MOCK/API mode magic
- ✅ 3-layer fallback chain
- ✅ API response handler
- ✅ WOW demo included
