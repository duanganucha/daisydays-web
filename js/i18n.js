/**
 * i18n.js — ระบบหลายภาษา
 *
 * ออกแบบให้นักแปลแตะไฟล์เดียว (js/locales/<code>.js) แล้วมาลงทะเบียนที่นี่ 2 บรรทัด
 * ถ้าภาษาไหนแปลไม่ครบ คีย์ที่ขาดจะถอยไปใช้ภาษาไทยอัตโนมัติ — แปลครึ่งทางก็ใช้ได้
 *
 * ใช้ static import (ไม่ใช่ dynamic) เพราะ:
 *   1. ไม่ต้องยิง network ตอนสลับภาษา → ออฟไลน์ทำงานได้ทันที
 *   2. service worker แคชได้ตรงไปตรงมา
 * แลกกับการต้องแก้ไฟล์นี้ตอนเพิ่มภาษา ซึ่งเป็นการแลกที่คุ้ม
 */

import th from './locales/th.js';
import en from './locales/en.js';
// ── เพิ่มภาษาใหม่: import ที่นี่ ──
// import lo from './locales/lo.js';

/** ภาษาที่ลงทะเบียนแล้ว คีย์คือรหัสภาษา */
export const LOCALES = {
  th,
  en,
  // ── แล้วใส่ที่นี่ ──
  // lo,
};

/** ภาษาสำรองเมื่อคีย์ขาด — ไทยเป็นภาษาอ้างอิงที่ครบที่สุด */
const FALLBACK = 'th';

let current = FALLBACK;

/** รายการภาษาสำหรับตัวเลือกภาษา: [{ code, name }] */
export const localeList = () =>
  Object.values(LOCALES).map((l) => ({ code: l.code, name: l.name }));

export const getLocale = () => current;

/** ตั้งภาษา คืนรหัสภาษาที่ใช้จริง (ถอยไป fallback ถ้าไม่รู้จัก) */
export function setLocale(code) {
  current = LOCALES[code] ? code : FALLBACK;
  const L = LOCALES[current];
  if (typeof document !== 'undefined') {
    document.documentElement.lang = current;
    document.documentElement.dir = L.dir || 'ltr';
  }
  return current;
}

const active = () => LOCALES[current] || LOCALES[FALLBACK];

/** แทนค่า {key} ในสตริง */
function interpolate(s, vars) {
  if (!vars || typeof s !== 'string') return s;
  return s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

/**
 * อ่านค่าจากภาษาปัจจุบัน ถอยไปภาษาสำรองถ้าขาด
 * path เป็นสตริงจุด เช่น 'ui.save' หรือ 'phases.menstrual'
 */
function lookup(path) {
  const parts = path.split('.');
  for (const src of [active(), LOCALES[FALLBACK]]) {
    let v = src;
    for (const p of parts) {
      if (v === null || v === undefined) break;
      v = v[p];
    }
    if (v !== null && v !== undefined && v !== '') return v;
  }
  return undefined;
}

/** ข้อความใน UI: t('save') หรือ t('inDays', { n: 3 }) */
export function t(key, vars) {
  const v = lookup(`ui.${key}`);
  return v === undefined ? key : interpolate(v, vars);
}

/** ค่าที่ไม่ได้อยู่ใต้ ui เช่น raw('phases.menstrual') */
export function raw(path, vars) {
  const v = lookup(path);
  return typeof v === 'string' ? interpolate(v, vars) : v;
}

export const phaseName = (phase) => raw(`phases.${phase}`) ?? phase;
export const phaseShort = (phase) => raw(`phaseShort.${phase}`) ?? phase;
export const phaseTip = (phase) => raw(`phaseTips.${phase}`) ?? '';
export const symptomLabel = (key) => raw(`symptoms.${key}`) ?? key;
export const energyLabel = (level) => (raw('energy') || [])[level] ?? String(level);
export const adviceFor = (key) => raw(`advice.${key}`) ?? raw('advice.default') ?? '';

/* ──────────────────────────── เคล็ดลับ ──────────────────────────── */

const toTip = ([icon, title, summary, detail, source]) =>
  ({ icon, title, summary, detail, source });

/** เคล็ดลับของช่วงนั้นในภาษาปัจจุบัน (ถอยไปไทยถ้าภาษานั้นยังไม่แปล) */
export const tipsFor = (phase) => (raw(`tips.${phase}`) || []).map(toTip);

export const generalTips = () => (raw('generalTips') || []).map(toTip);

/** จำนวนเคล็ดลับทั้งหมด — อย่าฮาร์ดโค้ดตัวเลขนี้ที่อื่น */
export function tipCount(phases) {
  return phases.reduce((n, p) => n + tipsFor(p).length, 0);
}

/**
 * เคล็ดลับประจำวัน หมุนเวียนรายวันภายในช่วงนั้น
 * นับจาก 1 ม.ค. 2020 เพื่อให้ทุกเครื่องได้ข้อเดียวกันในวันเดียวกัน
 */
export function tipOfDay(phase, dayISO) {
  const list = phase ? tipsFor(phase) : generalTips();
  if (list.length === 0) return toTip(['🌼', '', '', '', '']);
  const [y, m, d] = dayISO.split('-').map(Number);
  const days = Math.floor((new Date(y, m - 1, d, 12) - new Date(2020, 0, 1, 12)) / 86400000);
  return list[((days % list.length) + list.length) % list.length];
}

/* ──────────────────────────── วันที่ ──────────────────────────── */

const months = () => raw('months') || [];
const monthsShort = () => raw('monthsShort') || [];
const weekdays = () => raw('weekdays') || [];

export const dowHeaders = () => raw('dow') || [];

/** ปีที่แสดงผล (ไทยเป็น พ.ศ.) */
export const displayYear = (year) => year + (raw('yearOffset') || 0);

function formatWith(pattern, parts) {
  return interpolate(pattern, parts);
}

function dateParts(dayISO) {
  const [y, m, d] = dayISO.split('-').map(Number);
  const js = new Date(y, m - 1, d, 12);
  // JS: อาทิตย์ = 0 / รายการ weekdays เริ่มที่จันทร์ จึงต้องแปลง
  const mondayIndex = (js.getDay() + 6) % 7;
  return {
    weekday: weekdays()[mondayIndex] ?? '',
    day: d,
    month: months()[m - 1] ?? '',
    monthShort: monthsShort()[m - 1] ?? '',
    year: displayYear(y),
  };
}

/** วันที่แบบเต็ม เช่น 'อังคาร 7 ตุลาคม' */
export const formatFull = (dayISO) =>
  formatWith(raw('dateFormats.full') || '{day} {month}', dateParts(dayISO));

/** วันที่แบบสั้น เช่น '7 ต.ค.' */
export const formatShort = (dayISO) =>
  formatWith(raw('dateFormats.short') || '{day} {monthShort}', dateParts(dayISO));

/** หัวปฏิทิน เช่น 'ตุลาคม 2569' */
export const formatMonthYear = (year, month) =>
  formatWith(raw('dateFormats.monthYear') || '{month} {year}', {
    month: months()[month] ?? '',
    monthShort: monthsShort()[month] ?? '',
    year: displayYear(year),
  });

/* ──────────────────────────── ตรวจความครบ ──────────────────────────── */

/**
 * หาคีย์ที่ภาษานั้นยังขาดเทียบกับภาษาไทย — ใช้ใน CI และเทสต์
 * คืนรายการ path ที่ขาด
 */
export function missingKeys(code) {
  const target = LOCALES[code];
  if (!target) throw new Error(`ไม่รู้จักภาษา: ${code}`);
  const out = [];

  const walk = (ref, cur, path) => {
    for (const [k, v] of Object.entries(ref)) {
      const p = path ? `${path}.${k}` : k;
      const got = cur?.[k];
      if (Array.isArray(v)) {
        if (!Array.isArray(got)) out.push(p);
        else if (got.length !== v.length) out.push(`${p} (ยาว ${got.length} ควรเป็น ${v.length})`);
      } else if (v && typeof v === 'object') {
        if (!got || typeof got !== 'object') out.push(p);
        else walk(v, got, p);
      } else if (got === undefined || got === '') {
        out.push(p);
      }
    }
  };

  walk(LOCALES[FALLBACK], target, '');
  return out;
}
