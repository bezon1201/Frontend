# Toast Notifications - Usage Guide

## Overview

Система тост-уведомлений для мобильного приложения с поддержкой двух типов уведомлений: success и error.

## Компоненты

### 1. Toast Component (`/components/Toast.tsx`)
Основной компонент для отображения уведомлений.

### 2. useToast Hook (`/hooks/useToast.ts`)
Кастомный хук для управления состоянием тостов.

### 3. ToastDemo (`/components/ToastDemo.tsx`)
Демонстрационный компонент с примерами использования.

## Использование

### Базовый пример

```tsx
import { useToast } from '../hooks/useToast';
import Toast from './Toast';

function MyComponent() {
  const { toast, showToast, hideToast } = useToast();

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
      <button onClick={() => 
        showToast('Account added', 'New crypto account successfully created', 'success')
      }>
        Add Account
      </button>
    </>
  );
}
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
import Toast from './Toast';

export default function FinanceScreen() {
  const { toast, showToast, hideToast } = useToast();

  const handleAddAccount = (account) => {
    // ... добавление аккаунта
    showToast('Account added', `${account.title} successfully created`, 'success');
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
