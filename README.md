# Frontend

## Quick start
```
npm install
npm run dev
```

## Data source mode
- Settings → "MOC & API mode": переключение между MOCK и API, режим хранится в localStorage.
- В API режиме проверяется `/health`; при успехе дополнительно грузится `/api/config/global` (display_currency/auto_refresh). При недоступности API показывается toast и режим откатывается в MOCK.

## Dev server
- Vite dev server на :3000, прокси `/api` и `/health` → `http://127.0.0.1:8000` для работы без CORS.

## Build
- `npm run build` -> `./build`
