import { google } from "googleapis";
import { cfg } from "../config.js";
import { authedClient } from "./oauth.js";

export async function fetchRows(): Promise<any[][]> {
  const auth = authedClient();
  if (!auth) throw new Error("NOT_AUTHED");
  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: cfg.sheet.id,
    range: cfg.sheet.range,
    valueRenderOption: "UNFORMATTED_VALUE",
    dateTimeRenderOption: "FORMATTED_STRING",
  });
  return (res.data.values ?? []) as any[][];
}
