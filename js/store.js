/**
 * store.js — ชั้นข้อมูลทั้งหมดของ Daisy Days
 *
 * ข้อมูลอยู่ใน localStorage ของเครื่องผู้ใช้เท่านั้น ไม่มีการส่งออกไปที่ไหน
 * โครงสร้างตรงกับแอป Flutter (lib/data/repository.dart):
 *   logs: { 'YYYY-MM-DD': { period, symptoms: [], energy: 0..5, note } }
 */

const K_LOGS = 'dd.logs.v1';
const K_SETTINGS = 'dd.settings.v1';

const DEFAULT_SETTINGS = {
  name: '',
  cycleLength: 28,
  periodLength: 5,
};

/* ────────────────────────────── วันที่ (เวลาท้องถิ่น) ───────────────────────────── */

/** 'YYYY-MM-DD' ของ Date — ใช้เวลาท้องถิ่น ห้ามใช้ toISOString() เพราะวันจะเลื่อนในไทย */
export function iso(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Date จาก 'YYYY-MM-DD' ตั้งเวลาเที่ยงวันเพื่อกัน DST เลื่อนวัน */
export function parseISO(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export const today = () => iso(new Date());

export function addDays(isoStr, n) {
  const d = parseISO(isoStr);
  d.setDate(d.getDate() + n);
  return iso(d);
}

/** จำนวนวันจาก a ถึง b (b − a) */
export function daysBetween(a, b) {
  return Math.round((parseISO(b) - parseISO(a)) / 86400000);
}

/* ──────────────────────────────── สถานะในหน่วยความจำ ───────────────────────────── */

const EMPTY_LOG = { period: false, symptoms: [], energy: 0, note: '' };

function normalizeLog(raw) {
  return {
    period: raw?.period === true,
    symptoms: Array.isArray(raw?.symptoms) ? [...raw.symptoms] : [],
    energy: Number.isInteger(raw?.energy) ? Math.max(0, Math.min(5, raw.energy)) : 0,
    note: typeof raw?.note === 'string' ? raw.note : '',
  };
}

function loadLogs() {
  try {
    const raw = localStorage.getItem(K_LOGS);
    if (!raw) return {};
    const out = {};
    for (const [day, log] of Object.entries(JSON.parse(raw))) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(day)) out[day] = normalizeLog(log);
    }
    return out;
  } catch (e) {
    console.warn('อ่านบันทึกเดิมไม่ได้ เริ่มใหม่:', e);
    return {};
  }
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(K_SETTINGS);
    return { ...DEFAULT_SETTINGS, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

let logs = loadLogs();
let settings = loadSettings();

const listeners = new Set();

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function commit() {
  try {
    localStorage.setItem(K_LOGS, JSON.stringify(logs));
    localStorage.setItem(K_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    // โหมดส่วนตัวของ Safari เขียนไม่ได้ — ให้แอปทำงานต่อในหน่วยความจำ
    console.warn('บันทึกลงเครื่องไม่สำเร็จ:', e);
  }
  listeners.forEach((fn) => fn());
}

/** state ที่ cycle.js ใช้คำนวณ */
export const getState = () => ({ logs, settings });

export const getSettings = () => settings;

export function setSettings(patch) {
  settings = { ...settings, ...patch };
  commit();
}

/* ─────────────────────────────── บันทึกรายวัน ─────────────────────────────── */

/** บันทึกของวันนั้น (คืนค่าว่างถ้ายังไม่มี โดยไม่สร้างของจริงในที่เก็บ) */
export function dayOf(day) {
  const hit = logs[day];
  return hit ? { ...hit, symptoms: [...hit.symptoms] } : { ...EMPTY_LOG, symptoms: [] };
}

export function isEmptyLog(log) {
  return !log.period && log.symptoms.length === 0 && log.energy === 0 && log.note.trim() === '';
}

/** เขียนบันทึกของวันนั้น ถ้าว่างเปล่าจะลบทิ้งเพื่อไม่ให้ที่เก็บบวม */
export function putLog(day, log) {
  const next = normalizeLog(log);
  if (isEmptyLog(next)) delete logs[day];
  else logs[day] = next;
  commit();
}

export function loggedDayCount() {
  return Object.keys(logs).length;
}

/* ──────────────────────────── นำเข้า / ส่งออก / ลบ ──────────────────────────── */

export function exportJSON() {
  return JSON.stringify({ app: 'daisydays', version: 1, settings, logs }, null, 2);
}

/** นำเข้าไฟล์สำรอง โยน Error ถ้ารูปแบบไม่ถูก */
export function importJSON(text) {
  const raw = JSON.parse(text);
  if (!raw || typeof raw !== 'object') throw new Error('ไฟล์ไม่ถูกต้อง');
  if (!raw.logs || typeof raw.logs !== 'object') throw new Error('ไม่พบข้อมูล Daisy Days ในไฟล์นี้');

  const next = {};
  for (const [day, log] of Object.entries(raw.logs)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(day)) next[day] = normalizeLog(log);
  }
  logs = next;
  settings = { ...DEFAULT_SETTINGS, ...(raw.settings || {}) };
  commit();
}

/** แทนที่บันทึกทั้งหมด (ใช้กับข้อมูลตัวอย่าง) */
export function replaceAllLogs(next) {
  logs = {};
  for (const [day, log] of Object.entries(next)) logs[day] = normalizeLog(log);
  commit();
}

export function eraseAll() {
  logs = {};
  settings = { ...DEFAULT_SETTINGS };
  try {
    localStorage.removeItem(K_LOGS);
    localStorage.removeItem(K_SETTINGS);
  } catch { /* ไม่เป็นไร */ }
  commit();
}
