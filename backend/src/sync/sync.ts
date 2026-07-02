import cron from "node-cron";
import { db } from "../db.js";
import { cfg } from "../config.js";
import { fetchRows } from "../google/sheets.js";
import { isAuthed } from "../google/oauth.js";
import { parseRows, type Rec } from "../sheet/parser.js";

let lastSync: { at: string | null; count: number; error: string | null } = {
  at: null,
  count: 0,
  error: null,
};

const COLS = [
  "uuid","ts","date","time","crew","dron_type","target_name","target_no","target_id",
  "description","location","ammo1","result","issue","position","wounded","died",
  "frequency","coordinates","inch","video","video_confirmed","craft_name","number",
  "k1","control_type","day_night","raw",
];

const upsert = db.prepare(`
  INSERT INTO records (${COLS.join(",")})
  VALUES (${COLS.map((c) => "@" + c).join(",")})
  ON CONFLICT(uuid) DO UPDATE SET
  ${COLS.filter((c) => c !== "uuid").map((c) => `${c}=excluded.${c}`).join(",")}
`);

const upsertMany = db.transaction((recs: Rec[]) => {
  for (const r of recs) upsert.run(r);
});

export async function runSync() {
  if (!isAuthed()) {
    lastSync.error = "NOT_AUTHED";
    return lastSync;
  }
  try {
    const rows = await fetchRows();
    const recs = parseRows(rows);
    upsertMany(recs);
    lastSync = { at: new Date().toISOString(), count: recs.length, error: null };
  } catch (e: any) {
    lastSync.error = e?.message ?? String(e);
    console.error("[sync] failed:", lastSync.error);
  }
  return lastSync;
}

export function getSyncStatus() {
  return lastSync;
}

export function startSyncSchedule() {
  cron.schedule(cfg.syncCron, () => {
    runSync().then((s) => console.log("[sync]", s.at ?? s.error, "records:", s.count));
  });
  console.log("[sync] scheduled:", cfg.syncCron);
}
