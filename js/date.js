/**
 * date.js — ตัวช่วยวันที่ ไม่มี dependency และไม่แตะ localStorage
 *
 * แยกออกมาจาก store.js เพื่อให้ cycle.js เทสต์ใน Node ได้โดยไม่ต้อง shim localStorage
 *
 * กฎเหล็ก: ทุกอย่างคิดด้วย "เวลาท้องถิ่น" เสมอ
 * ห้ามใช้ toISOString() เพราะมันแปลงเป็น UTC แล้ววันจะเลื่อนในไทย (UTC+7)
 */

/** 'YYYY-MM-DD' ของ Date ตามเวลาท้องถิ่น */
export function iso(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Date จาก 'YYYY-MM-DD' ตั้งเวลาเที่ยงวันเพื่อกัน DST เลื่อนวัน */
export function parseISO(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

/** วันนี้เป็น 'YYYY-MM-DD' */
export const today = () => iso(new Date());

/** บวก n วัน (ติดลบได้) คืนเป็น 'YYYY-MM-DD' */
export function addDays(isoStr, n) {
  const d = parseISO(isoStr);
  d.setDate(d.getDate() + n);
  return iso(d);
}

/** จำนวนวันจาก a ถึง b (b − a) ติดลบได้ */
export function daysBetween(a, b) {
  return Math.round((parseISO(b) - parseISO(a)) / 86400000);
}

/** ตรวจรูปแบบคีย์วันที่ ใช้กรองข้อมูลที่นำเข้ามา */
export const isDateKey = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
