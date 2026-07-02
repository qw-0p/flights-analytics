# Drone Ops Dashboard

Fullstack аналітика по логу СЕЛЕКТОРа.

Sheet (OAuth) -> node-cron sync -> SQLite -> Express API -> Vue 3 dashboard.

## Стек
- **back**: Express + TS, better-sqlite3, googleapis (OAuth2), node-cron, zod
- **front**: Vue 3 + TS + Vite, Naive UI, vue-echarts, @tanstack/vue-query, pinia
- **deploy**: docker-compose (2 контейнери: backend + nginx-frontend)

## Запуск
1. Google Cloud Console -> OAuth 2.0 Client (type: Web application).
   Authorized redirect URI: `http://<host>:3000/auth/callback`
   Scope додається кодом: `spreadsheets.readonly`.
2. `cp backend/.env.example backend/.env`, заповни `GOOGLE_CLIENT_ID/SECRET`, `SHEET_ID`, `SHEET_RANGE`, `BACKEND_URL`.
3. `docker compose up --build`
4. Відкрий фронт (`:8080`), натисни **Увійти через Google** — один раз. Refresh token ляже в `./data`, крон далі синкає сам.

## Де крутити під себе (позначено `TODO:TUNE`)
- `backend/src/sheet/parser.ts` — правило **радіо/файбер** і межа **день/ніч**.
- `backend/src/routes/analytics.ts` — набір KPI/розрізів.
- `SYNC_CRON` в `.env` — розклад синку (за замовч. кожні 5 хв).
