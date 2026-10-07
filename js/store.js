/**
 * store.js — ชั้นข้อมูลทั้งหมดของ Daisy Days
 *
 * ข้อมูลอยู่ใน localStorage ของเครื่องผู้ใช้เท่านั้น ไม่มีการส่งออกไปที่ไหน
 * All data lives in the user's own localStorage. Nothing is ever sent anywhere.
 */

const KEY = 'daisydays.v1';

/** รูปแบบข้อมูลเริ่มต้น */
const DEFAULTS = {
  version: 1,
  settings: {
    lang: 'th',
    theme: 'auto',      // auto | light | dark
    cycleLength: 28,    // ค่าตั้งต้นก่อนมีข้อมูลจริงพอ
    periodLength: 5,
  },
  /** ช่วงที่มีประจำเดือน: [{ start: 'YYYY-MM-DD', end: 'YYYY-MM-DD'|null }] เรียงจากเก่าไปใหม่ */
  periods: [],
  /** บันทึกรายวัน: { 'YYYY-MM-DD': { flow, symptoms: [], mood, note } } */
  logs: {},
};

/* ────────────────────────────── วันที่ (local timezone) ───────────────────────────── */

/** 'YYYY-MM-DD' ของ Date (ใช้เวลาท้องถิ่น ไม่ใช่ UTC — สำคัญสำหรับไทย UTC+7) */
export function iso(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Date จาก 'YYYY-MM-DD' ตั้งเวลาเที่ยงวันเพื่อกัน DST/timezone เลื่อนวัน */
export function parseISO(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function today() {
  return iso(new Date());
}

/** บวกวัน แล้วคืนเป็น 'YYYY-MM-DD' */
export function addDays(isoStr, n) {
  const d = parseISO(isoStr);
  d.setDate(d.getDate() + n);
  return iso(d);
}

/** จำนวนวันจาก a ถึง b (b - a) */
export function daysBetween(a, b) {
  return Math.round((parseISO(b) - parseISO(a)) / 86400000);
}

/* ──────────────────────────────── โหลด / บันทึก ───────────────────────────────── */

function migrate(raw) {
  const data = {
    ...structuredClone(DEFAULTS),
    ...raw,
    settings: { ...DEFAULTS.settings, ...(raw.settings || {}) },
    periods: Array.isArray(raw.periods) ? raw.periods : [],
    logs: raw.logs && typeof raw.logs === 'object' ? raw.logs : {},
  };
  data.version = DEFAULTS.version;
  return data;
}

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULTS);
    return migrate(JSON.parse(raw));
  } catch (e) {
    console.warn('อ่านข้อมูลเดิมไม่ได้ เริ่มใหม่:', e);
    return structuredClone(DEFAULTS);
  }
}

const listeners = new Set();

/** สมัครรับการเปลี่ยนแปลงข้อมูล คืนฟังก์ชันยกเลิก */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function commit() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    // โหมดส่วนตัวของ Safari เขียนไม่ได้ — ให้แอปทำงานต่อในหน่วยความจำ
    console.warn('บันทึกลงเครื่องไม่สำเร็จ:', e);
  }
  listeners.forEach((fn) => fn(state));
}

/** อ่านข้อมูลทั้งหมด (อ่านอย่างเดียว อย่าแก้ตรง ๆ) */
export function getState() {
  return state;
}

/* ──────────────────────────────── ตั้งค่า ───────────────────────────────── */

export function setSetting(key, value) {
  state.settings[key] = value;
  commit();
}

/* ──────────────────────────── ประจำเดือน (periods) ──────────────────────────── */

function sortPeriods() {
  state.periods.sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
}

/** ช่วงประจำเดือนที่ครอบวันนั้นอยู่ (ถ้ามี) */
export function periodAt(day) {
  return state.periods.find((p) => {
    if (day < p.start) return false;
    if (p.end) return day <= p.end;
    // ช่วงที่ยังไม่จบ: นับไปไม่เกินค่าความยาวที่ตั้งไว้ + กันเหลือ 2 วัน
    return daysBetween(p.start, day) <= state.settings.periodLength + 2;
  });
}

/** วันนั้นเป็นวันมีประจำเดือนหรือไม่ */
export function isPeriodDay(day) {
  return Boolean(periodAt(day));
}

/**
 * สลับสถานะ "วันนี้มีประจำเดือน" ของวันที่ระบุ
 * - ถ้าไม่มี → สร้างช่วงใหม่ หรือขยายช่วงที่ต่อเนื่องกัน
 * - ถ้ามีแล้ว → ตัดวันนั้นออก (ย่อหรือลบช่วง)
 */
export function togglePeriodDay(day) {
  const hit = periodAt(day);

  if (hit) {
    const start = hit.start;
    const end = hit.end || day;
    if (start === end) {
      state.periods = state.periods.filter((p) => p !== hit);
    } else if (day === start) {
      hit.start = addDays(day, 1);
    } else if (day === end) {
      hit.end = addDays(day, -1);
    } else {
      // เจาะกลาง → แยกเป็นสองช่วง
      const tail = { start: addDays(day, 1), end };
      hit.end = addDays(day, -1);
      state.periods.push(tail);
    }
  } else {
    const before = state.periods.find((p) => (p.end || p.start) === addDays(day, -1));
    const after = state.periods.find((p) => p.start === addDays(day, 1));

    if (before && after) {
      before.end = after.end || after.start;
      state.periods = state.periods.filter((p) => p !== after);
    } else if (before) {
      before.end = day;
    } else if (after) {
      after.start = day;
    } else {
      state.periods.push({ start: day, end: day });
    }
  }

  sortPeriods();
  commit();
}

/* ───────────────────────────── บันทึกรายวัน (logs) ───────────────────────────── */

export function getLog(day) {
  return state.logs[day] || { flow: null, symptoms: [], mood: null, note: '' };
}

export function setLog(day, patch) {
  const next = { ...getLog(day), ...patch };
  const empty = !next.flow && !next.mood && !next.note && (next.symptoms || []).length === 0;
  if (empty) delete state.logs[day];
  else state.logs[day] = next;
  commit();
}

export function toggleSymptom(day, symptom) {
  const log = getLog(day);
  const symptoms = log.symptoms.includes(symptom)
    ? log.symptoms.filter((s) => s !== symptom)
    : [...log.symptoms, symptom];
  setLog(day, { symptoms });
}

/* ──────────────────────────── นำเข้า / ส่งออก / ลบ ──────────────────────────── */

export function exportJSON() {
  return JSON.stringify(state, null, 2);
}

/** นำเข้าข้อมูลจากไฟล์ที่ส่งออกไว้ โยน Error ถ้ารูปแบบไม่ถูก */
export function importJSON(text) {
  const raw = JSON.parse(text);
  if (!raw || typeof raw !== 'object') throw new Error('ไฟล์ไม่ถูกต้อง');
  if (!('periods' in raw) && !('logs' in raw)) throw new Error('ไม่พบข้อมูล Daisy Days ในไฟล์นี้');
  state = migrate(raw);
  sortPeriods();
  commit();
}

export function eraseAll() {
  state = structuredClone(DEFAULTS);
  try {
    localStorage.removeItem(KEY);
  } catch { /* ไม่เป็นไร */ }
  commit();
}
