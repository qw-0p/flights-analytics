// Мапінг заголовків 1-в-1 з логом СЕЛЕКТОРа.
// Увага: заголовки 300 і 200 у листі — числові (коди поранений/загиблий),
// тому шукаємо їх і як число, і як рядок.

const HEADER_MAP: Record<string, string | number> = {
  date: "Дата",
  time: "Час",
  crew: "Назва розрахунку",
  dronType: "БпЛА",
  targetName: "Ціль",
  targetNo: "Ціль No",
  targetID: "Ціль ID",
  description: "Примітки",
  location: "НП",
  ammo1: "БК1",
  result: "Результат",
  issue: "Проблема",
  position: "Позиції",
  wounded: 300,
  died: 200,
  frequency: "Частота керування",
  coordinates: "Точка",
  inch: "Дюйм",
  video: "Відео",
  videoConfirmation: "Відеопідтвердження",
  uuid: "Ключ запису",
  craftName: "Крафтнейм",
  number: "No",
  k1: "К1",
};

export type Idx = Record<keyof typeof HEADER_MAP, number>;

export function buildIndexes(headers: any[]): Idx {
  const norm = headers.map((h) => (typeof h === "string" ? h.trim() : h));
  const out = {} as Idx;
  for (const [key, header] of Object.entries(HEADER_MAP)) {
    let i = norm.indexOf(header as any);
    if (i === -1 && typeof header === "number") i = norm.indexOf(String(header));
    (out as any)[key] = i;
  }
  return out;
}

const at = (row: any[], i: number) => (i >= 0 && i < row.length ? row[i] : "");
const str = (v: any) => (v === null || v === undefined ? "" : String(v).trim());
const num = (v: any) => {
  const n = parseInt(str(v).replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
};

// dd.MM.yyyy (+ HH:mm) -> ISO. Sheets може віддати вже готовий рядок.
function toISO(date: string, time: string): string | null {
  const d = str(date);
  const t = str(time) || "00:00";
  const m = d.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})$/);
  if (m) {
    const [, dd, mm, yy] = m;
    const year = yy.length === 2 ? "20" + yy : yy;
    const iso = `${year}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}T${t.padStart(5, "0")}:00`;
    const parsed = new Date(iso);
    return isNaN(+parsed) ? null : parsed.toISOString();
  }
  const parsed = new Date(`${d} ${t}`);
  return isNaN(+parsed) ? null : parsed.toISOString();
}

// TODO:TUNE — правило радіо/файбер. Зараз: порожня частота / згадка «файбер|оптик» => fiber.
function controlType(frequency: string): "fiber" | "radio" {
  const f = frequency.toLowerCase();
  if (!f || /файбер|фібер|fiber|оптик|опто/.test(f)) return "fiber";
  return "radio";
}

// TODO:TUNE — межа день/ніч. Зараз: 06:00–20:59 = день.
function dayNight(iso: string | null, time: string): "day" | "night" {
  let hour = NaN;
  const tm = str(time).match(/^(\d{1,2}):/);
  if (tm) hour = parseInt(tm[1], 10);
  else if (iso) hour = new Date(iso).getHours();
  if (!Number.isFinite(hour)) return "day";
  return hour >= 6 && hour < 21 ? "day" : "night";
}

function videoConfirmed(v: any): number {
  const s = str(v).toLowerCase();
  return s && !/^(ні|no|0|-|нема|немає)$/.test(s) ? 1 : 0;
}

export interface Rec { [k: string]: any }

export function parseRows(rows: any[][]): Rec[] {
  if (!rows.length) return [];
  const idx = buildIndexes(rows[0]);
  const out: Rec[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const uuid = str(at(row, idx.uuid));
    if (!uuid) continue; // рядки без ключа пропускаємо
    const date = str(at(row, idx.date));
    const time = str(at(row, idx.time));
    const frequency = str(at(row, idx.frequency));
    const ts = toISO(date, time);
    out.push({
      uuid,
      ts,
      date,
      time,
      crew: str(at(row, idx.crew)),
      dron_type: str(at(row, idx.dronType)),
      target_name: str(at(row, idx.targetName)),
      target_no: str(at(row, idx.targetNo)),
      target_id: str(at(row, idx.targetID)),
      description: str(at(row, idx.description)),
      location: str(at(row, idx.location)),
      ammo1: str(at(row, idx.ammo1)),
      result: str(at(row, idx.result)),
      issue: str(at(row, idx.issue)),
      position: str(at(row, idx.position)),
      wounded: num(at(row, idx.wounded)),
      died: num(at(row, idx.died)),
      frequency,
      coordinates: str(at(row, idx.coordinates)),
      inch: str(at(row, idx.inch)),
      video: str(at(row, idx.video)),
      video_confirmed: videoConfirmed(at(row, idx.videoConfirmation)),
      craft_name: str(at(row, idx.craftName)),
      number: str(at(row, idx.number)),
      k1: str(at(row, idx.k1)),
      control_type: controlType(frequency),
      day_night: dayNight(ts, time),
      raw: JSON.stringify(row),
    });
  }
  return out;
}
