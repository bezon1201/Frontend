# API Response Format - Standard Structure

## 🎯 Overview

All API endpoints follow a unified response format with proper validation and error handling.

---

## 📦 Standard Response Format

### **Success Response:**
```json
{
  "ok": true,
  "data": <result>
}
```

### **Error Response:**
```json
{
  "ok": false,
  "error": "Error message",
  "error_code": "ERROR_CODE"
}
```

---

## 🔧 API Functions

### **GET /api/messages**

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "code": "MSG_SAVED",
      "kind": "toast",
      "text": "Message saved"
    },
    {
      "code": "API_UNAVAILABLE",
      "kind": "alert",
      "text": "API connection failed..."
    }
  ]
}
```

**Client Code:**
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

**Usage:**
```tsx
const items = await getMessages();  // ✅ Message[]
setApiMessages(items);              // ✅ Correct
```

---

### **PUT /api/messages/:code**

**Request:**
```json
{
  "kind": "toast",
  "text": "Message saved successfully"
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "code": "MSG_SAVED",
    "kind": "toast",
    "text": "Message saved successfully"
  }
}
```

**Client Code:**
```tsx
export async function updateMessage(
  code: string,
  data: MessageUpdate
): Promise<Message> {
  const response = await fetch(`${API_BASE_URL}/api/messages/${code}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error("Failed to update message");
  }
  
  const json = await response.json();
  
  // ✅ Validate response format
  if (!json.ok) {
    throw new Error(json.error || "API returned error");
  }
  
  // ✅ Return the message data
  return json.data; // ← Returns Message
}
```

**Usage:**
```tsx
const updated = await updateMessage(code, data); // ✅ Message
updateMessageCache(updated);                     // ✅ Correct
```

---

### **DELETE /api/messages/:code**

**Response:**
```json
{
  "ok": true,
  "data": null
}
```

**Client Code:**
```tsx
export async function deleteMessage(code: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/messages/${code}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  
  if (!response.ok) {
    throw new Error("Failed to delete message");
  }
  
  const json = await response.json();
  
  // ✅ Validate response format
  if (!json.ok) {
    throw new Error(json.error || "API returned error");
  }
}
```

**Usage:**
```tsx
await deleteMessage(message.code);  // ✅ void
deleteMessageCache(message.code);   // ✅ Correct
```

---

## ✅ Best Practices

### **DO:**

1. ✅ **Always validate `json.ok`**
   ```tsx
   if (!json.ok) {
     throw new Error(json.error || "API returned error");
   }
   ```

2. ✅ **Return clean data types**
   ```tsx
   return json.data; // Message[] or Message
   ```

3. ✅ **Use proper typing**
   ```tsx
   const items: Message[] = await getMessages();
   ```

4. ✅ **Handle arrays safely**
   ```tsx
   if (!Array.isArray(json.data)) {
     return [];
   }
   ```

### **DON'T:**

1. ❌ **Don't return raw json**
   ```tsx
   // ❌ Wrong
   return response.json();
   
   // ✅ Correct
   const json = await response.json();
   if (!json.ok) throw new Error(json.error);
   return json.data;
   ```

2. ❌ **Don't skip validation**
   ```tsx
   // ❌ Wrong
   const json = await response.json();
   return json.data; // What if json.ok === false?
   
   // ✅ Correct
   const json = await response.json();
   if (!json.ok) throw new Error(json.error);
   return json.data;
   ```

3. ❌ **Don't use json/response directly in state**
   ```tsx
   // ❌ Wrong
   setApiMessages(json);
   setApiMessages(response);
   
   // ✅ Correct
   const items = await getMessages();
   setApiMessages(items);
   ```

---

## 🔄 MessagesContext Integration

### **loadMessages() - Correct Pattern:**

```tsx
const loadMessages = async () => {
  if (mode === 'MOCK') {
    clearApiMessages();
    setResolverMode('MOCK');
    setMessages([]);
    return;
  }

  setResolverMode('API');
  setIsLoading(true);
  
  try {
    // ✅ Get array from API
    const items = await getMessages(); // Returns Message[]
    
    // ✅ Validate array (extra safety)
    if (!Array.isArray(items)) {
      console.error('getMessages() did not return an array:', items);
      return;
    }
    
    // ✅ Use array directly
    setMessages(items);
    setApiMessages(items);
    saveToCache(items);
  } catch (error) {
    console.error('Failed to load messages:', error);
  } finally {
    setIsLoading(false);
  }
};
```

### **updateMessageCache() - Correct Pattern:**

```tsx
const handleSave = async () => {
  try {
    // ✅ Get message object from API
    const updated = await updateMessage(code, data); // Returns Message
    
    // ✅ Update cache with message object
    updateMessageCache(updated);
    
    const msg = resolveToastMessage('MSG_SAVED');
    showToast(msg.title, msg.description, msg.type);
  } catch (error) {
    const msg = resolveToastMessage('MSG_SAVE_FAILED');
    showToast(msg.title, msg.description, msg.type);
  }
};
```

---

## 📊 Summary

| Function | Returns | Usage |
|----------|---------|-------|
| `getMessages()` | `Message[]` | `const items = await getMessages()` |
| `updateMessage()` | `Message` | `const updated = await updateMessage(...)` |
| `deleteMessage()` | `void` | `await deleteMessage(code)` |

### **Key Points:**

1. ✅ All functions return **clean data types** (not raw json)
2. ✅ All functions **validate `json.ok`** before returning
3. ✅ Arrays are **validated** with `Array.isArray()`
4. ✅ Errors throw with **descriptive messages**
5. ✅ Context uses **arrays directly**, not json/response objects

---

**API Response Format - Unified & Type-Safe!** ✅
