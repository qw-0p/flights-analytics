import express from "express";
import cors from "cors";
import { cfg } from "./config.js";
import "./db.js";
import { authRouter } from "./routes/auth.js";
import { apiRouter } from "./routes/analytics.js";
import { startSyncSchedule } from "./sync/sync.js";

const app = express();
app.use(cors({ origin: cfg.frontendUrl, credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/auth", authRouter);
app.use("/api", apiRouter);

app.listen(cfg.port, () => {
  console.log(`[backend] http://localhost:${cfg.port}`);
  startSyncSchedule();
});
