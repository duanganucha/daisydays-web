/**
 * เทสต์ตัวช่วยวันที่
 *
 * โฟกัสที่จุดที่เคยพลาดจริง: ถ้าใช้ toISOString() วันจะเลื่อนในเขตเวลา UTC+7
 * เทสต์ชุดนี้จะจับได้ทันทีถ้ามีใครเปลี่ยนกลับไปใช้ UTC
 *
 * รัน: node --test tests/
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { iso, parseISO, addDays, daysBetween, isDateKey } from '../js/date.js';

test('iso() ใช้เวลาท้องถิ่น ไม่ใช่ UTC', () => {
  // เที่ยงคืนตรงตามเวลาท้องถิ่น — ถ้าแปลงเป็น UTC ในไทยจะกลายเป็นวันก่อนหน้า
  assert.equal(iso(new Date(2026, 9, 7, 0, 0, 0)), '2026-10-07');
  // 23:59 ท้องถิ่น — ถ้าแปลงเป็น UTC ในโซนลบจะกลายเป็นวันถัดไป
  assert.equal(iso(new Date(2026, 9, 7, 23, 59, 59)), '2026-10-07');
});

test('iso() เติมศูนย์หน้าเดือนและวัน', () => {
  assert.equal(iso(new Date(2026, 0, 1, 12)), '2026-01-01');
  assert.equal(iso(new Date(2026, 8, 9, 12)), '2026-09-09');
});

test('parseISO() แล้ว iso() กลับได้ค่าเดิม', () => {
  for (const d of ['2026-01-01', '2026-02-28', '2026-10-07', '2026-12-31', '2024-02-29']) {
    assert.equal(iso(parseISO(d)), d, `ไป-กลับไม่ตรงที่ ${d}`);
  }
});

test('parseISO() ตั้งเวลาเที่ยงวันเพื่อกัน DST', () => {
  assert.equal(parseISO('2026-10-07').getHours(), 12);
});

test('addDays() ข้ามเดือน', () => {
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
  assert.equal(addDays('2026-11-01', -1), '2026-10-31');
});

test('addDays() ข้ามปี', () => {
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2027-01-01', -1), '2026-12-31');
});

test('addDays() ปีอธิกสุรทิน', () => {
  assert.equal(addDays('2024-02-28', 1), '2024-02-29');
  assert.equal(addDays('2024-02-29', 1), '2024-03-01');
  // 2026 ไม่ใช่ปีอธิกสุรทิน
  assert.equal(addDays('2026-02-28', 1), '2026-03-01');
});

test('addDays() บวก 0 ได้วันเดิม', () => {
  assert.equal(addDays('2026-10-07', 0), '2026-10-07');
});

test('daysBetween() ทิศทางถูก', () => {
  assert.equal(daysBetween('2026-10-01', '2026-10-08'), 7);
  assert.equal(daysBetween('2026-10-08', '2026-10-01'), -7);
  assert.equal(daysBetween('2026-10-07', '2026-10-07'), 0);
});

test('daysBetween() ข้ามปีและข้ามอธิกสุรทิน', () => {
  assert.equal(daysBetween('2026-12-25', '2027-01-05'), 11);
  assert.equal(daysBetween('2024-02-28', '2024-03-01'), 2); // มี 29 ก.พ.
  assert.equal(daysBetween('2026-02-28', '2026-03-01'), 1); // ไม่มี 29 ก.พ.
});

test('daysBetween() ตรงกับ addDays เสมอ', () => {
  const start = '2026-01-15';
  for (const n of [1, 7, 30, 180, 365, -1, -45]) {
    assert.equal(daysBetween(start, addDays(start, n)), n, `ไม่ตรงที่ n=${n}`);
  }
});

test('isDateKey() รับเฉพาะรูปแบบที่ถูก', () => {
  assert.ok(isDateKey('2026-10-07'));
  assert.ok(!isDateKey('2026-10-7'));
  assert.ok(!isDateKey('07-10-2026'));
  assert.ok(!isDateKey('settings'));
  assert.ok(!isDateKey(''));
  assert.ok(!isDateKey(null));
  assert.ok(!isDateKey(20261007));
});
