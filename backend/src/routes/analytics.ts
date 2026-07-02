import { Router } from "express";
import { db } from "../db.js";
import { getSyncStatus, runSync } from "../sync/sync.js";
import { isAuthed } from "../google/oauth.js";

export const apiRouter = Router();

// --- фільтри -> WHERE ---
function buildWhere(q: any): { sql: string; params: any[] } {
  const clauses: string[] = [];
  const params: any[] = [];
  const eq = (col: string, val: any) => {
    if (val !== undefined && val !== "" && val !== "all") {
      clauses.push(`${col} = ?`);
      params.push(val);
    }
  };
  if (q.from) { clauses.push("ts >= ?"); params.push(new Date(q.from).toISOString()); }
  if (q.to)   { clauses.push("ts <= ?"); params.push(new Date(q.to).toISOString()); }
  eq("crew", q.crew);
  eq("dron_type", q.dronType);
  eq("control_type", q.controlType);
  eq("day_night", q.dayNight);
  eq("result", q.result);
  eq("location", q.location);
  return { sql: clauses.length ? "WHERE " + clauses.join(" AND ") : "", params };
}

// значення для випадаючих списків
apiRouter.get("/filters", (_req, res) => {
  const distinct = (col: string) =>
    (db.prepare(`SELECT DISTINCT ${col} v FROM records WHERE ${col} <> '' ORDER BY ${col}`).all() as any[])
      .map((r) => r.v);
  res.json({
    crew: distinct("crew"),
    dronType: distinct("dron_type"),
    result: distinct("result"),
    location: distinct("location"),
  });
});

apiRouter.get("/summary", (req, res) => {
  const { sql, params } = buildWhere(req.query);
  const row = db.prepare(`
    SELECT
      COUNT(*)                                         AS records,
      COALESCE(SUM(wounded),0)                         AS wounded,
      COALESCE(SUM(died),0)                            AS died,
      SUM(CASE WHEN control_type='fiber' THEN 1 ELSE 0 END) AS fiber,
      SUM(CASE WHEN control_type='radio' THEN 1 ELSE 0 END) AS radio,
      SUM(CASE WHEN day_night='day'   THEN 1 ELSE 0 END)    AS day,
      SUM(CASE WHEN day_night='night' THEN 1 ELSE 0 END)    AS night,
      COALESCE(SUM(video_confirmed),0)                 AS video_confirmed,
      COUNT(DISTINCT crew)                             AS crews
    FROM records ${sql}
  `).get(...params);
  res.json(row);
});

// таймсерія по днях
apiRouter.get("/timeseries", (req, res) => {
  const { sql, params } = buildWhere(req.query);
  const rows = db.prepare(`
    SELECT substr(ts,1,10) AS day,
           COUNT(*)                 AS records,
           COALESCE(SUM(wounded),0) AS wounded,
           COALESCE(SUM(died),0)    AS died
    FROM records ${sql}
    ${sql ? "AND" : "WHERE"} ts IS NOT NULL
    GROUP BY day ORDER BY day
  `).all(...params);
  res.json(rows);
});

// розріз по будь-якому виміру
const DIMS: Record<string, string> = {
  crew: "crew", result: "result", dronType: "dron_type",
  location: "location", inch: "inch", controlType: "control_type",
  dayNight: "day_night", craftName: "craft_name",
};
apiRouter.get("/breakdown", (req, res) => {
  const col = DIMS[String(req.query.dim)];
  if (!col) return res.status(400).json({ error: "bad dim" });
  const { sql, params } = buildWhere(req.query);
  const rows = db.prepare(`
    SELECT ${col} AS label, COUNT(*) AS value,
           COALESCE(SUM(wounded),0) AS wounded, COALESCE(SUM(died),0) AS died
    FROM records ${sql}
    ${sql ? "AND" : "WHERE"} ${col} <> ''
    GROUP BY ${col} ORDER BY value DESC LIMIT 50
  `).all(...params);
  res.json(rows);
});

apiRouter.get("/status", (_req, res) =>
  res.json({ authed: isAuthed(), sync: getSyncStatus() }));

apiRouter.post("/sync", async (_req, res) => res.json(await runSync()));
