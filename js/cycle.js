/**
 * cycle.js — คำนวณสถิติรอบเดือนและคาดการณ์รอบถัดไป
 *
 * ทุกอย่างคำนวณจากข้อมูลที่ผู้ใช้กรอกเองล้วน ๆ ไม่มีโมเดลภายนอก
 * คาดการณ์เป็นค่าประมาณเท่านั้น — ไม่ใช่การคุมกำเนิดและไม่ใช่คำวินิจฉัย
 */

import { addDays, daysBetween, parseISO, iso, today } from './store.js';

/** ใช้กี่รอบล่าสุดในการเฉลี่ย (รอบเก่ามากมักไม่สะท้อนปัจจุบัน) */
const WINDOW = 6;

/** วันเริ่มประจำเดือนทุกครั้ง เรียงเก่า→ใหม่ */
export function periodStarts(state) {
  return state.periods.map((p) => p.start).sort();
}

/** ความยาวแต่ละรอบ (ระยะห่างระหว่างวันเริ่มที่ติดกัน) */
export function cycleLengths(state) {
  const starts = periodStarts(state);
  const out = [];
  for (let i = 1; i < starts.length; i++) {
    const len = daysBetween(starts[i - 1], starts[i]);
    // กรองค่าที่เป็นไปไม่ได้ทางสรีรวิทยา กันข้อมูลกรอกผิดทำสถิติเพี้ยน
    if (len >= 15 && len <= 90) out.push(len);
  }
  return out;
}

/** ความยาวประจำเดือนแต่ละครั้ง (นับเฉพาะช่วงที่ปิดแล้ว) */
export function periodLengths(state) {
  return state.periods
    .filter((p) => p.end)
    .map((p) => daysBetween(p.start, p.end) + 1)
    .filter((n) => n >= 1 && n <= 15);
}

function mean(a) {
  return a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
}

function stdev(a) {
  if (a.length < 2) return null;
  const m = mean(a);
  return Math.sqrt(mean(a.map((x) => (x - m) ** 2)));
}

/**
 * สรุปสถิติทั้งหมด
 * confidence: 'none' ยังไม่มีข้อมูล | 'low' 1-2 รอบ | 'medium' 3-4 รอบ | 'high' 5 รอบขึ้นไป
 */
export function stats(state) {
  const all = cycleLengths(state);
  const recent = all.slice(-WINDOW);
  const pLens = periodLengths(state);
  const starts = periodStarts(state);

  const avgCycle = recent.length ? Math.round(mean(recent)) : state.settings.cycleLength;
  const avgPeriod = pLens.length ? Math.round(mean(pLens)) : state.settings.periodLength;
  const variation = recent.length >= 2 ? Math.round(stdev(recent)) : null;

  let confidence = 'none';
  if (recent.length >= 5) confidence = 'high';
  else if (recent.length >= 3) confidence = 'medium';
  else if (recent.length >= 1) confidence = 'low';

  return {
    avgCycle,
    avgPeriod,
    variation,
    shortest: recent.length ? Math.min(...recent) : null,
    longest: recent.length ? Math.max(...recent) : null,
    cyclesTracked: all.length,
    periodsLogged: starts.length,
    lastStart: starts.length ? starts[starts.length - 1] : null,
    confidence,
    /** สม่ำเสมอ = ความแปรปรวนไม่เกิน 4 วัน */
    regular: variation === null ? null : variation <= 4,
  };
}

/** วันที่ของรอบปัจจุบัน (วันที่ 1 = วันแรกที่มีประจำเดือน) */
export function cycleDay(state, day = today()) {
  const s = stats(state);
  if (!s.lastStart || day < s.lastStart) return null;
  return daysBetween(s.lastStart, day) + 1;
}

/**
 * คาดการณ์วันเริ่มประจำเดือน n ครั้งข้างหน้า
 * ยึดวันเริ่มครั้งล่าสุด + ความยาวรอบเฉลี่ย แล้วทบไปเรื่อย ๆ
 */
export function predictedStarts(state, n = 6) {
  const s = stats(state);
  if (!s.lastStart) return [];
  const out = [];
  let cursor = s.lastStart;
  for (let i = 0; i < n; i++) {
    cursor = addDays(cursor, s.avgCycle);
    out.push(cursor);
  }
  return out;
}

/** ช่วงวันที่คาดว่าจะมีประจำเดือน (เซ็ตของ 'YYYY-MM-DD') */
export function predictedPeriodDays(state, n = 6) {
  const s = stats(state);
  const set = new Set();
  for (const start of predictedStarts(state, n)) {
    for (let i = 0; i < s.avgPeriod; i++) set.add(addDays(start, i));
  }
  return set;
}

/**
 * ช่วงเจริญพันธุ์โดยประมาณ — ไข่ตกราว 14 วันก่อนรอบถัดไป
 * นับช่วง 5 วันก่อน ถึง 1 วันหลังไข่ตก
 */
export function fertileDays(state, n = 6) {
  const set = new Set();
  const s = stats(state);
  if (!s.lastStart) return set;

  const anchors = [s.lastStart, ...predictedStarts(state, n)];
  for (let i = 0; i < anchors.length - 1; i++) {
    const ovulation = addDays(anchors[i + 1], -14);
    for (let d = -5; d <= 1; d++) set.add(addDays(ovulation, d));
  }
  return set;
}

/** วันไข่ตกโดยประมาณ (เซ็ตของวันที่) */
export function ovulationDays(state, n = 6) {
  const set = new Set();
  const s = stats(state);
  if (!s.lastStart) return set;
  for (const start of predictedStarts(state, n)) set.add(addDays(start, -14));
  return set;
}

/** อีกกี่วันประจำเดือนจะมา (ติดลบ = เลยกำหนดมาแล้วกี่วัน) */
export function daysUntilNext(state) {
  const next = predictedStarts(state, 1)[0];
  if (!next) return null;
  return daysBetween(today(), next);
}

/**
 * ระยะของรอบตอนนี้ — ใช้โชว์สถานะคร่าว ๆ
 * period | follicular | fertile | luteal | late | unknown
 */
export function currentPhase(state) {
  const day = today();
  const s = stats(state);
  if (!s.lastStart) return 'unknown';

  const cd = cycleDay(state, day);
  if (cd === null) return 'unknown';
  if (cd <= s.avgPeriod) return 'period';
  if (cd > s.avgCycle + 1) return 'late';
  if (fertileDays(state).has(day)) return 'fertile';
  if (cd < s.avgCycle - 14) return 'follicular';
  return 'luteal';
}

/** อาการที่พบบ่อยสุด n อันดับ พร้อมจำนวนครั้ง */
export function topSymptoms(state, n = 6) {
  const count = {};
  for (const log of Object.values(state.logs)) {
    for (const sym of log.symptoms || []) count[sym] = (count[sym] || 0) + 1;
  }
  return Object.entries(count)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, times]) => ({ key, times }));
}

/** ประวัติรอบล่าสุดสำหรับวาดกราฟแท่ง: [{ start, length }] */
export function recentCycles(state, n = WINDOW) {
  const starts = periodStarts(state);
  const out = [];
  for (let i = 1; i < starts.length; i++) {
    const length = daysBetween(starts[i - 1], starts[i]);
    if (length >= 15 && length <= 90) out.push({ start: starts[i - 1], length });
  }
  return out.slice(-n);
}

/** ตารางเดือนสำหรับปฏิทิน: อาร์เรย์ 6 สัปดาห์ × 7 วัน (null = ช่องว่างนอกเดือน) */
export function monthGrid(year, month) {
  const first = new Date(year, month, 1, 12);
  const lead = first.getDay(); // 0 = อาทิตย์
  const total = new Date(year, month + 1, 0).getDate();

  const cells = Array(lead).fill(null);
  for (let d = 1; d <= total; d++) cells.push(iso(new Date(year, month, d, 12)));
  while (cells.length % 7) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export { parseISO };
