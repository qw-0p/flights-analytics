import { google } from "googleapis";
import { cfg } from "../config.js";
import { saveTokens, loadTokens } from "../db.js";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];

export function makeClient() {
  const c = new google.auth.OAuth2(
    cfg.google.clientId,
    cfg.google.clientSecret,
    cfg.google.redirectUri
  );
  // будь-яке оновлення (в т.ч. авто-рефреш access token) -> зберігаємо
  c.on("tokens", (t) => {
    const existing = loadTokens() ?? {};
    saveTokens({ ...existing, ...t });
  });
  return c;
}

export function authUrl() {
  return makeClient().generateAuthUrl({
    access_type: "offline",   // щоб отримати refresh_token
    prompt: "consent",        // гарантує refresh_token навіть при повторному вході
    scope: SCOPES,
  });
}

export async function exchangeCode(code: string) {
  const c = makeClient();
  const { tokens } = await c.getToken(code);
  saveTokens(tokens);        // тут лежить refresh_token
  return tokens;
}

/** Клієнт із підвантаженими токенами для фонового читання. null якщо ще не авторизувались. */
export function authedClient() {
  const tokens = loadTokens();
  if (!tokens?.refresh_token) return null;
  const c = makeClient();
  c.setCredentials(tokens);
  return c;
}

export function isAuthed() {
  return Boolean(loadTokens()?.refresh_token);
}
