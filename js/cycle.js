/**
 * cycle.js — ตรรกะรอบเดือนล้วน ๆ ไม่แตะ DOM และไม่แตะที่เก็บข้อมูล
 * พอร์ตจาก lib/data/cycle.dart ของแอป Flutter ให้ได้ผลลัพธ์ตรงกัน
 *
 * คาดการณ์เป็นค่าประมาณเท่านั้น — ไม่ใช่การคุมกำเนิดและไม่ใช่คำวินิจฉัย
 */

import { addDays, daysBetween, iso, parseISO } from './store.js';
import { PHASES } from './data.js';

/**
 * ช่วงของรอบ ณ วันที่ n ของรอบที่ยาว len วัน
 * ลำดับการตัดสินสำคัญ: เมนส์ → PMS → ไข่ตก → ฟอลลิคูลาร์ → ลูเทียล
 */
export function phaseFor(day, len, periodLen) {
  const ov = len - 14;
  if (day <= periodLen) return 'menstrual';
  if (day > len - 5) return 'pms';
  if (Math.abs(day - ov) <= 1) return 'ovulation';
  if (day < ov) return 'follicular';
  return 'luteal';
}

/**
 * สร้างเครื่องคำนวณจาก state
 * starts   = วันแรกของแต่ละรอบ (วันที่มีประจำเดือนซึ่งวันก่อนหน้าไม่ได้บันทึกว่ามี)
 * lengths  = ระยะห่างระหว่าง starts ที่ติดกัน กรองเฉพาะ 18–45 วัน
 * avgLength= เฉลี่ยจาก 6 รอบล่าสุด (ถ้ายังไม่มีข้อมูลใช้ค่าตั้งต้นจากการตั้งค่า)
 */
export function engine(state) {
  const { logs, settings } = state;

  const periodDays = Object.keys(logs).filter((d) => logs[d].period).sort();
  const periodSet = new Set(periodDays);

  // วันเริ่มรอบ = วันมีประจำเดือนที่ "เมื่อวาน" ไม่ได้มี
  const starts = periodDays.filter((d) => !periodSet.has(addDays(d, -1)));

  const lengths = [];
  for (let i = 1; i < starts.length; i++) {
    const len = daysBetween(starts[i - 1], starts[i]);
    if (len >= 18 && len <= 45) lengths.push(len);
  }

  const recent = lengths.slice(-6);
  const avgLength = recent.length
    ? Math.round(recent.reduce((a, b) => a + b, 0) / recent.length)
    : settings.cycleLength;

  const lastStart = starts.length ? starts[starts.length - 1] : null;

  /**
   * วันที่นั้นอยู่ตรงไหนของรอบ
   * คืน null ถ้ายังไม่มีรอบไหนเริ่มก่อนวันนั้น
   * predicted = true เมื่อเลยรอบจริงไปแล้วและต้องวนด้วยค่าเฉลี่ย
   */
  function statusOn(day) {
    let start = null;
    let len = null;

    for (let i = starts.length - 1; i >= 0; i--) {
      if (starts[i] <= day) {
        start = starts[i];
        if (i + 1 < starts.length) len = daysBetween(starts[i], starts[i + 1]);
        break;
      }
    }
    if (start === null) return null;

    let predicted = false;
    let cycleDay = daysBetween(start, day) + 1;

    if (len === null || len < 18 || len > 45) {
      len = avgLength;
      if (cycleDay > len) {
        predicted = true;
        cycleDay = ((cycleDay - 1) % len) + 1;
      }
    }

    const ov = len - 14;
    return {
      cycleDay,
      cycleLength: len,
      phase: phaseFor(cycleDay, len, settings.periodLength),
      predicted,
      fertile: cycleDay >= ov - 5 && cycleDay <= ov + 1,
      ovulationDay: cycleDay === ov,
    };
  }

  /** วันเริ่มประจำเดือนรอบหน้า (หลังวันที่ระบุเท่านั้น) */
  function nextPeriod(day) {
    if (!lastStart) return null;
    let n = addDays(lastStart, avgLength);
    while (n <= day) n = addDays(n, avgLength);
    return n;
  }

  /** วันนั้นเป็น "วันคาดการณ์ว่าประจำเดือนจะมา" หรือไม่ (อนาคต และยังไม่ได้บันทึกจริง) */
  function isPredictedPeriod(day, todayISO) {
    if (logs[day]?.period) return false;
    const st = statusOn(day);
    if (!st) return false;
    return day > todayISO && st.phase === 'menstrual';
  }

  /**
   * ตารางความถี่ อาการ × ช่วงรอบ (เป็น % ของวันที่บันทึกในช่วงนั้น)
   * นับเฉพาะวันที่ไม่ใช่วันคาดการณ์ และมีอาการหรือพลังงานบันทึกไว้
   */
  function heatmap(symptomKeys, todayISO) {
    const totals = Object.fromEntries(PHASES.map((p) => [p, 0]));
    const counts = Object.fromEntries(
      symptomKeys.map((s) => [s, Object.fromEntries(PHASES.map((p) => [p, 0]))]),
    );

    for (const [day, log] of Object.entries(logs)) {
      if (day > todayISO) continue;
      if (log.symptoms.length === 0 && log.energy === 0) continue;
      const st = statusOn(day);
      if (!st || st.predicted) continue;

      totals[st.phase] += 1;
      for (const s of log.symptoms) {
        if (counts[s]) counts[s][st.phase] += 1;
      }
    }

    const pct = Object.fromEntries(
      symptomKeys.map((s) => [
        s,
        Object.fromEntries(PHASES.map((p) => [
          p,
          totals[p] === 0 ? null : Math.round((counts[s][p] * 100) / totals[p]),
        ])),
      ]),
    );

    const totalLogged = Object.values(totals).reduce((a, b) => a + b, 0);

    /** ช่องที่เด่นสุดและมีข้อมูลพอจะเชื่อได้ (ช่วงนั้นต้องมี ≥ 3 วัน และ ≥ 20%) */
    function strongest(among) {
      let best = null;
      for (const s of among) {
        for (const p of PHASES) {
          const v = pct[s]?.[p];
          if (v === null || v === undefined || totals[p] < 3) continue;
          if (!best || v > best.pct) best = { symptom: s, phase: p, pct: v };
        }
      }
      return best && best.pct >= 20 ? best : null;
    }

    return { loggedDays: totals, pct, totalLogged, strongest };
  }

  return {
    starts, lengths, avgLength, lastStart,
    statusOn, nextPeriod, isPredictedPeriod, heatmap,
  };
}

/* ──────────────────────────────── ปฏิทิน ──────────────────────────────── */

/**
 * ตารางเดือนแบบอาทิตย์ขึ้นต้น
 * คืน { lead, days } — lead = ช่องว่างก่อนวันที่ 1, days = จำนวนวันในเดือน
 */
export function monthInfo(year, month) {
  const first = new Date(year, month, 1, 12);
  return {
    lead: first.getDay(), // 0 = อาทิตย์
    days: new Date(year, month + 1, 0).getDate(),
    dayISO: (d) => iso(new Date(year, month, d, 12)),
  };
}

/* ─────────────────────────── ข้อมูลตัวอย่าง 6 รอบ ─────────────────────────── */

/** สุ่มแบบกำหนดเมล็ดได้ (mulberry32) เพื่อให้ข้อมูลตัวอย่างเหมือนกันทุกครั้ง */
function seeded(seed) {
  return function rand() {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * บันทึกตัวอย่าง 6 รอบย้อนหลังแบบสมจริง เพื่อให้เปิดหน้าสถิติดูได้ทันที
 * ความยาวรอบและความน่าจะเป็นของอาการยกมาจาก demoLogs() ในแอป Flutter
 */
export function demoLogs(todayISO, periodLen = 5) {
  const rand = seeded(42);
  const lens = [27, 29, 28, 28, 27, 28];
  const out = {};

  let start = addDays(todayISO, -lens.reduce((a, b) => a + b, 0) + 3);

  for (const len of lens) {
    for (let d = 1; d <= len; d++) {
      const date = addDays(start, d - 1);
      if (date > todayISO) break;

      const ph = phaseFor(d, len, periodLen);
      const p = (x) => rand() < x;
      const pick = (table, fallback) => p(table[ph] ?? fallback);

      const symptoms = [];
      if (pick({ ovulation: 0.6, follicular: 0.5, luteal: 0.35 }, 0.15)) symptoms.push('happy');
      if (pick({ ovulation: 0.55, luteal: 0.4, follicular: 0.4 }, 0.15)) symptoms.push('energy');
      if (pick({ pms: 0.45, menstrual: 0.25 }, 0.1)) symptoms.push('acne');
      if (pick({ menstrual: 0.45, pms: 0.2 }, 0.05)) symptoms.push('cramps');
      if (pick({ pms: 0.4, menstrual: 0.2 }, 0.08)) symptoms.push('moody');
      if (pick({ pms: 0.28, luteal: 0.15 }, 0.07)) symptoms.push('insomnia');
      if (pick({ pms: 0.35, menstrual: 0.3 }, 0.1)) symptoms.push('craving');
      if (p(0.5)) symptoms.push('water');
      if (p(ph === 'menstrual' ? 0.1 : 0.3)) symptoms.push('exercise');

      const energy = ph === 'menstrual' ? 2
        : ph === 'pms' ? 2 + Math.floor(rand() * 2)
          : ph === 'ovulation' ? 4 + Math.floor(rand() * 2)
            : 3 + Math.floor(rand() * 2);

      out[date] = { period: d <= periodLen, symptoms, energy, note: '' };
    }
    start = addDays(start, len);
  }
  return out;
}

export { parseISO };
