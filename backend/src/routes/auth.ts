import { Router } from "express";
import { authUrl, exchangeCode, isAuthed } from "../google/oauth.js";
import { runSync } from "../sync/sync.js";
import { cfg } from "../config.js";

export const authRouter = Router();

authRouter.get("/url", (_req, res) => res.json({ url: authUrl() }));

authRouter.get("/status", (_req, res) => res.json({ authed: isAuthed() }));

authRouter.get("/callback", async (req, res) => {
  const code = req.query.code as string | undefined;
  if (!code) return res.status(400).send("no code");
  try {
    await exchangeCode(code);
    runSync(); // одразу перший синк, не чекаємо крон
    res.redirect(cfg.frontendUrl);
  } catch (e: any) {
    res.status(500).send("OAuth error: " + (e?.message ?? e));
  }
});
