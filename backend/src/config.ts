export const cfg = {
  backendUrl: process.env.BACKEND_URL ?? "http://localhost:3000",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:8080",
  port: Number(process.env.PORT ?? 3000),
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    get redirectUri() {
      return `${process.env.BACKEND_URL ?? "http://localhost:3000"}/auth/callback`;
    },
  },
  sheet: {
    id: process.env.SHEET_ID ?? "",
    range: process.env.SHEET_RANGE ?? "СЕЛЕКТОР!A1:Z100000",
  },
  syncCron: process.env.SYNC_CRON ?? "*/5 * * * *",
  dbPath: process.env.DB_PATH ?? "./data/app.db",
};
