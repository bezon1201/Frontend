# Toast Notifications - Usage Guide

## Overview

Система тост-уведомлений для мобильного приложения с поддержкой двух типов уведомлений: success и error.

**NEW:** Теперь с интегрированным Message Resolver для управления сообщениями через API/локальные файлы.

## Компоненты

### 1. Toast Component (`/components/Toast.tsx`)
Основной компонент для отображения уведомлений.

### 2. useToast Hook (`/hooks/useToast.ts`)
Кастомный хук для управления состоянием тостов.

### 3. Message Resolver (`/messages/messageResolver.ts`)
**NEW:** Система резолвинга сообщений с 3-уровневым fallback:
1. API Messages (из Message Catalog)
2. Local Defaults (`/messages/toastMessages.ts`)
3. Unknown Fallback (`"Unknown message: CODE"`)

### 4. ToastDemo (`/components/ToastDemo.tsx`)
Демонстрационный компонент с примерами использования.

## Использование

### ✅ Рекомендуемый способ (с Message Resolver)

```tsx
import { useToast } from '../hooks/useToast';
import { resolveToastMessage } from '../messages/messageResolver';
import Toast from './Toast';

function MyComponent() {
  const { toast, showToast, hideToast } = useToast();

  const handleSuccess = () => {
    const msg = resolveToastMessage('ACCOUNT_ADDED');
    showToast(msg.title, msg.description, msg.type);
  };

  return (
    <>
      {/* Добавить компонент Toast */}
      <Toast
        title={toast.title}
        description={toast.description}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />

      {/* Вызвать тост при событии */}
      <button onClick={handleSuccess}>
        Add Account
      </button>
    </>
  );
}
```

### ⚠️ Старый способ (hardcoded, не рекомендуется)

```tsx
// ❌ DON'T: Hardcoded text
showToast('Account added', 'New crypto account successfully created', 'success');
```

### API

#### useToast()
Возвращает:
- `toast` - текущее состояние тоста
- `showToast(title, description?, type)` - показать тост
- `hideToast()` - скрыть тост

#### Toast Component Props
- `title: string` - основной текст (обязательно)
- `description?: string` - дополнительный текст (опционально)
- `type: 'success' | 'error'` - тип уведомления
- `isVisible: boolean` - видимость тоста
- `onClose: () => void` - обработчик закрытия
- `duration?: number` - длительность показа в мс (по умолчанию 3000)

## Примеры использования

### ✅ С Message Resolver (рекомендуется)

```tsx
// Success тост
const msg = resolveToastMessage('ACCOUNT_ADDED');
showToast(msg.title, msg.description, msg.type);

// Error тост
const msg = resolveToastMessage('ACCOUNT_EXISTS');
showToast(msg.title, msg.description, msg.type);

// MOCK mode warning
const msg = resolveToastMessage('MOCK_MODE_WARNING');
showToast(msg.title, msg.description, msg.type);
```

### ⚠️ Без resolver (старый способ, не рекомендуется)

### Success тост с описанием
```tsx
showToast(
  'Account added',
  'New crypto account successfully created',
  'success'
);
```

### Error тост с описанием
```tsx
showToast(
  'Cannot add account',
  'Account name already exists',
  'error'
);
```

### Success тост без описания
```tsx
showToast('Asset updated', undefined, 'success');
```

### Error тост без описания
```tsx
showToast('Invalid amount', undefined, 'error');
```

## Дизайн

### Success Toast
- **Фон:** `#D7F5DF` (мягкий зелёный)
- **Иконка:** CheckCircle (зелёная `#10b981`)
- **Заголовок:** `#111111` (тёмный), 16px, bold
- **Описание:** `#555555` (серый), 14px, regular

### Error Toast
- **Фон:** `#FCE5E5` (мягкий красный)
- **Иконка:** XCircle (красная `#ef4444`)
- **Заголовок:** `#111111` (тёмный), 16px, bold
- **Описание:** `#555555` (серый), 14px, regular

### Расположение
- Верхняя часть экрана
- Отступ от верха: `max(48px, calc(env(safe-area-inset-top) + 16px))`
- Ширина: 90% от ширины экрана (max-width)
- Анимация: slide-down (0.3s ease-out)

## Интеграция в существующие экраны

### FinanceScreen
```tsx
import { useToast } from '../hooks/useToast';
import { resolveToastMessage } from '../messages/messageResolver';
import Toast from './Toast';

export default function FinanceScreen() {
  const { toast, showToast, hideToast } = useToast();

  const handleAddAccount = (account) => {
    // ... добавление аккаунта
    const msg = resolveToastMessage('ACCOUNT_ADDED');
    showToast(msg.title, `${account.title} successfully created`, 'success');
  };

  return (
    <>
      <Toast {...toast} isVisible={toast.isVisible} onClose={hideToast} />
      {/* Остальной UI */}
    </>
  );
}
```

## Демо

Для просмотра демонстрации откройте компонент `ToastDemo`:
```tsx
import ToastDemo from './components/ToastDemo';
```

---

## Message Resolver System

### Зачем нужен?

- ✅ **Централизованное управление** сообщениями
- ✅ **Редактирование через UI** (Message Catalog в Settings)
- ✅ **Fallback для MOCK режима** (локальные дефолты)
- ✅ **Отлов ошибок** (Unknown message: CODE)
- ✅ **Готовность к i18n** (API может возвращать переводы)

### Как работает?

**3-уровневый fallback:**

1. **API Messages** → Загружаются из `/api/messages` при старте приложения
2. **Local Defaults** → Из `/messages/toastMessages.ts`
3. **Unknown Fallback** → `"Unknown message: CODE"` (тип: error)

### Доступные коды (Backend Format)

См. полный список в `/messages/toastMessages.ts`:

**API Errors (API_*):**
```tsx
API_UNAVAILABLE     // "API is not available" + "Switched to MOCK mode"
API_MODE_REQUIRED   // "API mode required" + "This feature requires API connection"
```

**MOCK Mode:**
```tsx
MOCK_MODE_WARNING   // "MOCK Mode" + "Changes are NOT saved to database"
```

**Configuration (CFG_*):**
```tsx
CFG_SAVED           // "Configuration saved"
CFG_SAVE_FAILED     // "Failed to save configuration" + "Try again later"
```

**Messages (MSG_*):**
```tsx
MSG_SAVED           // "Message saved"
MSG_SAVE_FAILED     // "Failed to save message" + "Try again later"
MSG_DELETED         // "Message deleted"
MSG_DELETE_FAILED   // "Failed to delete message" + "Try again later"
MSG_NOT_FOUND       // "Message not found"
MSG_INVALID         // "Invalid message" + "Code and text are required"
MSG_FETCH_FAILED    // "Failed to load messages" + "Try again later"
```

### Добавление новых сообщений

1. Откройте `/messages/toastMessages.ts`
2. Добавьте новый код (следуйте backend формату):

```tsx
export const toastMessages: Record<string, ToastMessage> = {
  // ... existing codes ...
  
  // Follow naming: ORD_*, TRD_*, ACC_*, etc.
  ORD_PLACED: {
    title: 'Order placed',
    description: 'Your order is being processed',
    type: 'success'
  },
};
```

3. Используйте в коде:

```tsx
const msg = resolveToastMessage('ORD_PLACED');
showToast(msg.title, msg.description, msg.type);
```

**Naming Convention:**
- `API_*` → API/connection errors
- `CFG_*` → Configuration operations
- `MSG_*` → Message catalog operations
- `ORD_*` → Order operations
- `TRD_*` → Trade operations
- `ACC_*` → Account operations

### Подробная документация

См. `/MESSAGE_RESOLVER.md` для полной документации по Message Resolver System.