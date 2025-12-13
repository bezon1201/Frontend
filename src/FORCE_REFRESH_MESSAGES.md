# Force Refresh Messages - Always Fresh Data

## 🎯 Goal

When opening **Message Catalog**, always fetch fresh messages from the database and update localStorage cache.

---

## 🏗️ Implementation

### **1. MessagesContext - `refreshMessages({ force: true })`**

**File:** `/context/MessagesContext.tsx`

**Function:**
```tsx
/**
 * Refresh messages with optional force flag
 * 
 * @param options.force - If true, always fetch from API (ignoring cache/TTL)
 * 
 * Usage:
 * - refreshMessages() → Uses cache if valid
 * - refreshMessages({ force: true }) → Always fetches from API
 */
const refreshMessages = async (options?: { force?: boolean }) => {
  // In MOCK mode, do nothing
  if (mode === 'MOCK') {
    return;
  }

  // Force refresh: ignore cache and TTL
  if (options?.force) {
    setResolverMode('API');
    setIsLoading(true);
    
    try {
      // Always fetch from API
      const items = await getMessages();
      
      if (!Array.isArray(items)) {
        console.error('getMessages() did not return an array:', items);
        return;
      }
      
      // Update state and cache
      setMessages(items);
      setApiMessages(items);
      saveToCache(items); // ← Overwrites cache with fresh data
    } catch (error) {
      console.error('Failed to refresh messages:', error);
    } finally {
      setIsLoading(false);
    }
  } else {
    // Normal refresh: use existing loadMessages logic
    await loadMessages();
  }
};
```

**Key Points:**
- ✅ `force: true` → **Always** fetches from API
- ✅ Ignores cache TTL
- ✅ Overwrites `app_messages_cache` with fresh data
- ✅ Updates `app_messages_cache_timestamp`
- ✅ Does nothing in MOCK mode

---

### **2. MessageCatalogScreen - Force Refresh on Mount**

**File:** `/components/MessageCatalogScreen.tsx`

**Implementation:**
```tsx
// Load messages on mount
useEffect(() => {
  if (isOpen && mode === "API") {
    // ✅ Force refresh from API when opening Message Catalog
    messagesContext.refreshMessages({ force: true });
  }
}, [isOpen, mode]);

// Update local messages when context messages change
useEffect(() => {
  if (isOpen) {
    if (mode === "API") {
      // Use messages from context
      setLocalMessages(messagesContext.messages);
    } else {
      // Load mock data in MOCK mode
      setLocalMessages(MOCK_MESSAGES);
    }
  }
}, [isOpen, mode, messagesContext.messages]);
```

**Why Two useEffects?**

1. **First useEffect** - Triggers force refresh when screen opens
   - Dependency: `[isOpen, mode]`
   - Starts async fetch from API
   
2. **Second useEffect** - Updates local state when context updates
   - Dependency: `[isOpen, mode, messagesContext.messages]`
   - Reacts to fresh data from API

---

## 🔄 Flow Diagram

### **Normal Load (with cache):**
```
User opens app
  ↓
MessagesContext.loadMessages()
  ↓
Check cache TTL (1 hour)
  ├─ Valid? → Use cache
  └─ Expired? → Fetch from API
```

### **Force Refresh (Message Catalog):**
```
User opens Message Catalog
  ↓
messagesContext.refreshMessages({ force: true })
  ↓
⚠️ ALWAYS fetch from API (ignore cache)
  ↓
Update state: setMessages(items)
  ↓
Update resolver: setApiMessages(items)
  ↓
Overwrite cache: saveToCache(items)
  ↓
UI updates: messagesContext.messages changes
  ↓
Local state updates: setLocalMessages(...)
```

---

## 📦 API Behavior

### **GET /api/messages**

**Request:**
```tsx
const items = await getMessages(); // Returns Message[]
```

**Response:**
```json
{
  "ok": true,
  "data": [
    { "code": "MSG_SAVED", "kind": "toast", "text": "Message saved" },
    { "code": "API_UNAVAILABLE", "kind": "alert", "text": "API connection failed..." }
  ]
}
```

**Function Logic:**
```tsx
export async function getMessages(): Promise<Message[]> {
  const response = await fetch(`${API_BASE_URL}/api/messages`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch messages");
  }
  
  const json = await response.json();
  
  // ✅ Validate response format
  if (!json.ok) {
    throw new Error(json.error || "API returned error");
  }
  
  // ✅ Ensure we have an array
  if (!Array.isArray(json.data)) {
    return [];
  }
  
  return json.data; // ← Returns Message[]
}
```

---

## 🎯 Use Cases

### **1. Message Catalog Screen**

**Scenario:** User opens Message Catalog to edit messages

**Behavior:**
- ✅ Always fetches latest messages from DB
- ✅ Updates localStorage cache
- ✅ User sees fresh data immediately

**Code:**
```tsx
useEffect(() => {
  if (isOpen && mode === "API") {
    messagesContext.refreshMessages({ force: true });
  }
}, [isOpen, mode]);
```

---

### **2. Normal App Usage**

**Scenario:** User navigates around the app

**Behavior:**
- ✅ Uses cached messages (if TTL valid)
- ✅ Reduces API calls
- ✅ Faster performance

**Code:**
```tsx
// In MessagesContext
useEffect(() => {
  loadMessages(); // ← Uses cache if valid
}, [mode]);
```

---

### **3. Manual Reload**

**Scenario:** User clicks "Reload" button

**Behavior:**
- ✅ Clears cache
- ✅ Fetches from API
- ✅ Updates state

**Code:**
```tsx
const reload = async () => {
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(CACHE_TIMESTAMP_KEY);
  await loadMessages();
};
```

---

## 📋 Comparison Table

| Scenario | Function | Cache Behavior | API Call |
|----------|----------|----------------|----------|
| **App startup** | `loadMessages()` | Check TTL | Only if cache expired |
| **Message Catalog open** | `refreshMessages({ force: true })` | ⚠️ **Ignore TTL** | ✅ **Always** |
| **Manual reload** | `reload()` | Clear cache | ✅ Always |
| **Mode switch** | `loadMessages()` | Check TTL | Only if cache expired |

---

## 🔧 Context API

### **MessagesContextType:**

```tsx
interface MessagesContextType {
  messages: Message[];              // Current messages
  isLoading: boolean;               // Loading state
  reload: () => Promise<void>;      // Clear cache + reload
  refreshMessages: (options?: { force?: boolean }) => Promise<void>; // ← NEW!
  updateMessageCache: (message: Message) => void;
  deleteMessageCache: (code: string) => void;
}
```

### **Usage:**

```tsx
const messagesContext = useMessages();

// Normal refresh (uses cache)
await messagesContext.refreshMessages();

// Force refresh (ignores cache)
await messagesContext.refreshMessages({ force: true });

// Reload (clears cache first)
await messagesContext.reload();
```

---

## ✅ Benefits

| Feature | Benefit |
|---------|---------|
| **Always Fresh Data** | Message Catalog shows latest DB state |
| **Cache Overwrite** | Fresh data updates localStorage |
| **No Stale Data** | Users see changes immediately |
| **Performance** | Normal navigation still uses cache |
| **MOCK Safe** | Does nothing in MOCK mode |

---

## 🚨 Edge Cases

### **1. API Error During Force Refresh**

```tsx
try {
  const items = await getMessages();
  // Update state...
} catch (error) {
  console.error('Failed to refresh messages:', error);
  // State remains unchanged (shows old data)
}
```

**Behavior:**
- Error logged to console
- UI shows previous messages
- No crash

---

### **2. MOCK Mode**

```tsx
if (mode === 'MOCK') {
  return; // ← Exit early
}
```

**Behavior:**
- No API call
- No cache update
- MOCK data used instead

---

### **3. Invalid Response**

```tsx
if (!Array.isArray(items)) {
  console.error('getMessages() did not return an array:', items);
  return;
}
```

**Behavior:**
- Error logged
- State unchanged
- No crash

---

## 🎯 Summary

**Before:**
```tsx
// Message Catalog used cache (might be stale)
useEffect(() => {
  setLocalMessages(messagesContext.messages);
}, [messagesContext.messages]);
```

**After:**
```tsx
// ✅ Message Catalog ALWAYS fetches fresh data
useEffect(() => {
  if (isOpen && mode === "API") {
    messagesContext.refreshMessages({ force: true });
  }
}, [isOpen, mode]);
```

**Result:**
- 🎯 **Always fresh data** in Message Catalog
- 💾 **Cache updated** with latest DB state
- ⚡ **Fast navigation** for rest of app (uses cache)
- 🔒 **Safe** - No effect in MOCK mode

---

**Force Refresh System Ready!** 🚀
