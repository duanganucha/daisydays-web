/**
 * เทสต์ตรรกะรอบเดือน
 *
 * cycle.js เป็นฟังก์ชันบริสุทธิ์ ไม่แตะ DOM และไม่แตะ localStorage
 * จึงเทสต์ใน Node ได้ตรง ๆ โดยไม่ต้อง shim อะไรเลย
 *
 * รัน: node --test tests/
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { engine, phaseFor, monthInfo, demoLogs, DEMO_CYCLE_LENGTHS } from '../js/cycle.js';
import { addDays } from '../js/date.js';
import { PHASES, CYCLE_RANGE } from '../js/data.js';

/* ───────────────────────────── ตัวช่วยสร้าง state ───────────────────────────── */

const SETTINGS = { cycleLength: 28, periodLength: 5 };

/** สร้าง state จากวันเริ่มรอบหลายวัน โดยแต่ละรอบมีประจำเดือน periodLength วันติดกัน */
function stateFromStarts(starts, settings = SETTINGS) {
  const logs = {};
  for (const s of starts) {
    for (let i = 0; i < settings.periodLength; i++) {
      logs[addDays(s, i)] = { period: true, symptoms: [], energy: 0, note: '' };
    }
  }
  return { logs, settings };
}

/* ═════════════════════════════════ phaseFor ═════════════════════════════════ */

describe('phaseFor()', () => {
  test('วันแรก ๆ ของรอบเป็นช่วงมีประจำเดือน', () => {
    for (let d = 1; d <= 5; d++) assert.equal(phaseFor(d, 28, 5), 'menstrual');
  });

  test('วันถัดจากประจำเดือนไม่ใช่เมนส์แล้ว', () => {
    assert.notEqual(phaseFor(6, 28, 5), 'menstrual');
  });

  test('5 วันท้ายรอบเป็น PMS', () => {
    for (let d = 24; d <= 28; d++) assert.equal(phaseFor(d, 28, 5), 'pms');
  });

  test('ไข่ตกอยู่ที่ len-14 บวกลบ 1 วัน', () => {
    // รอบ 28 วัน → ไข่ตกวันที่ 14
    assert.equal(phaseFor(13, 28, 5), 'ovulation');
    assert.equal(phaseFor(14, 28, 5), 'ovulation');
    assert.equal(phaseFor(15, 28, 5), 'ovulation');
    assert.equal(phaseFor(12, 28, 5), 'follicular');
    assert.equal(phaseFor(16, 28, 5), 'luteal');
  });

  test('ไข่ตกเลื่อนตามความยาวรอบ ไม่ใช่ตรึงที่วันที่ 14', () => {
    // รอบ 35 วัน → ไข่ตกวันที่ 21
    assert.equal(phaseFor(21, 35, 5), 'ovulation');
    assert.equal(phaseFor(14, 35, 5), 'follicular');
  });

  test('คืนค่าที่อยู่ใน PHASES เสมอ', () => {
    for (let len = CYCLE_RANGE.min; len <= CYCLE_RANGE.max; len++) {
      for (let d = 1; d <= len; d++) {
        assert.ok(PHASES.includes(phaseFor(d, len, 5)), `วันที่ ${d} ของรอบ ${len} ให้ค่าแปลก`);
      }
    }
  });

  test('ประจำเดือนยาวชนะ PMS เมื่อทับกัน (รอบสั้นมาก)', () => {
    // รอบ 18 วัน ประจำเดือน 10 วัน: วันที่ 10 ยังต้องเป็นเมนส์ แม้จะเข้าเขต PMS (>13)
    assert.equal(phaseFor(10, 18, 10), 'menstrual');
  });
});

/* ═══════════════════════════ หาวันเริ่มรอบ (starts) ═══════════════════════════ */

describe('engine() — วันเริ่มรอบ', () => {
  test('วันมีประจำเดือนติดกันนับเป็นรอบเดียว', () => {
    const cyc = engine(stateFromStarts(['2026-09-01']));
    assert.deepEqual(cyc.starts, ['2026-09-01']);
  });

  test('แยกรอบเมื่อมีวันเว้น', () => {
    const cyc = engine(stateFromStarts(['2026-08-01', '2026-09-01', '2026-10-01']));
    assert.deepEqual(cyc.starts, ['2026-08-01', '2026-09-01', '2026-10-01']);
  });

  test('วันเดียวโดด ๆ ก็นับเป็นวันเริ่มรอบ', () => {
    const logs = { '2026-10-01': { period: true, symptoms: [], energy: 0, note: '' } };
    const cyc = engine({ logs, settings: SETTINGS });
    assert.deepEqual(cyc.starts, ['2026-10-01']);
  });

  test('ไม่มีบันทึกเลย → ไม่มีวันเริ่มรอบ และ lastStart เป็น null', () => {
    const cyc = engine({ logs: {}, settings: SETTINGS });
    assert.deepEqual(cyc.starts, []);
    assert.equal(cyc.lastStart, null);
  });

  test('บันทึกที่ไม่ใช่วันมีประจำเดือนไม่ถูกนับ', () => {
    const logs = {
      '2026-10-01': { period: false, symptoms: ['cramps'], energy: 3, note: '' },
      '2026-10-05': { period: true, symptoms: [], energy: 0, note: '' },
    };
    const cyc = engine({ logs, settings: SETTINGS });
    assert.deepEqual(cyc.starts, ['2026-10-05']);
  });
});

/* ═══════════════════════════ ความยาวรอบและค่าเฉลี่ย ═══════════════════════════ */

describe('engine() — ความยาวรอบ', () => {
  test('คำนวณระยะห่างระหว่างวันเริ่มที่ติดกัน', () => {
    // ห่างกัน 28 และ 30 วัน
    const cyc = engine(stateFromStarts(['2026-08-01', '2026-08-29', '2026-09-28']));
    assert.deepEqual(cyc.lengths, [28, 30]);
    assert.equal(cyc.avgLength, 29);
  });

  test('กรองรอบที่สั้นหรือยาวเกินจริงออก', () => {
    // ห่างกัน 3 วัน (สั้นเกิน) — ต้องถูกทิ้ง
    const cyc = engine(stateFromStarts(['2026-10-01', '2026-10-04'], { ...SETTINGS, periodLength: 2 }));
    assert.deepEqual(cyc.lengths, []);
    // ไม่มีข้อมูลใช้ได้ → ถอยไปใช้ค่าตั้งต้น
    assert.equal(cyc.avgLength, 28);
  });

  test('ใช้แค่ 6 รอบล่าสุดในการเฉลี่ย', () => {
    // 7 รอบ: รอบแรกยาว 45 ที่เหลือ 28 — ค่า 45 ต้องไม่ถูกนับ
    let d = '2026-01-01';
    const starts = [d];
    for (const len of [45, 28, 28, 28, 28, 28, 28]) {
      d = addDays(d, len);
      starts.push(d);
    }
    const cyc = engine(stateFromStarts(starts));
    assert.equal(cyc.lengths.length, 7);
    assert.equal(cyc.avgLength, 28, 'รอบ 45 วันที่เก่าที่สุดไม่ควรถูกนับ');
  });

  test('ไม่มีข้อมูลพอ → ใช้ cycleLength จากการตั้งค่า', () => {
    const cyc = engine(stateFromStarts(['2026-10-01'], { cycleLength: 31, periodLength: 5 }));
    assert.equal(cyc.avgLength, 31);
  });
});

/* ═════════════════════════════════ statusOn ═════════════════════════════════ */

describe('engine() — statusOn()', () => {
  test('วันก่อนรอบแรกคืน null', () => {
    const cyc = engine(stateFromStarts(['2026-10-01']));
    assert.equal(cyc.statusOn('2026-09-30'), null);
  });

  test('วันแรกของรอบคือวันที่ 1', () => {
    const cyc = engine(stateFromStarts(['2026-10-01']));
    assert.equal(cyc.statusOn('2026-10-01').cycleDay, 1);
    assert.equal(cyc.statusOn('2026-10-07').cycleDay, 7);
  });

  test('ใช้ความยาวรอบจริงเมื่อมีรอบถัดไปแล้ว', () => {
    const cyc = engine(stateFromStarts(['2026-09-01', '2026-10-01'])); // ห่าง 30
    const st = cyc.statusOn('2026-09-15');
    assert.equal(st.cycleLength, 30);
    assert.equal(st.predicted, false);
  });

  test('เลยรอบจริง → วนด้วยค่าเฉลี่ยและตั้ง predicted', () => {
    // รอบเดียว ยาวตามค่าเฉลี่ย 28 วัน — วันที่ 29 ต้องวนกลับเป็นวันที่ 1 ของรอบคาดการณ์
    const cyc = engine(stateFromStarts(['2026-10-01']));
    const st = cyc.statusOn(addDays('2026-10-01', 28)); // = วันที่ 29
    assert.equal(st.cycleDay, 1);
    assert.equal(st.predicted, true);
  });

  test('ยังอยู่ในรอบปัจจุบัน → predicted เป็น false', () => {
    const cyc = engine(stateFromStarts(['2026-10-01']));
    assert.equal(cyc.statusOn('2026-10-28').predicted, false);
  });

  test('ธงช่วงเจริญพันธุ์และวันไข่ตกสอดคล้องกัน', () => {
    const cyc = engine(stateFromStarts(['2026-09-01', '2026-09-29'])); // รอบ 28 วัน
    const ovDay = addDays('2026-09-01', 13); // วันที่ 14
    const st = cyc.statusOn(ovDay);
    assert.equal(st.cycleDay, 14);
    assert.ok(st.ovulationDay, 'วันที่ 14 ของรอบ 28 วันควรเป็นวันไข่ตก');
    assert.ok(st.fertile, 'วันไข่ตกต้องอยู่ในช่วงเจริญพันธุ์ด้วย');
  });

  test('ช่วงเจริญพันธุ์กินพื้นที่ 7 วัน (5 ก่อน ถึง 1 หลังไข่ตก)', () => {
    const cyc = engine(stateFromStarts(['2026-09-01', '2026-09-29']));
    const fertile = [];
    for (let i = 0; i < 28; i++) {
      const day = addDays('2026-09-01', i);
      if (cyc.statusOn(day).fertile) fertile.push(i + 1);
    }
    assert.deepEqual(fertile, [9, 10, 11, 12, 13, 14, 15]);
  });
});

/* ═════════════════════════════════ nextPeriod ═════════════════════════════════ */

describe('engine() — nextPeriod()', () => {
  test('ไม่มีข้อมูลคืน null', () => {
    assert.equal(engine({ logs: {}, settings: SETTINGS }).nextPeriod('2026-10-07'), null);
  });

  test('คืนวันเริ่มรอบล่าสุด + ค่าเฉลี่ย', () => {
    const cyc = engine(stateFromStarts(['2026-10-01']));
    assert.equal(cyc.nextPeriod('2026-10-07'), '2026-10-29');
  });

  test('ต้องอยู่หลังวันที่ให้มาเสมอ แม้เลยกำหนดไปหลายรอบ', () => {
    const cyc = engine(stateFromStarts(['2026-01-01']));
    const next = cyc.nextPeriod('2026-10-07');
    assert.ok(next > '2026-10-07', `${next} ต้องอยู่หลัง 2026-10-07`);
  });

  test('ไม่คืนวันเดียวกับวันที่ให้มา', () => {
    const cyc = engine(stateFromStarts(['2026-10-01']));
    assert.ok(cyc.nextPeriod('2026-10-29') > '2026-10-29');
  });
});

/* ═══════════════════════════ isPredictedPeriod ═══════════════════════════ */

describe('engine() — isPredictedPeriod()', () => {
  const todayISO = '2026-10-07';
  const cyc = engine(stateFromStarts(['2026-10-01']));

  test('วันที่บันทึกจริงแล้วไม่ใช่วันคาดการณ์', () => {
    assert.equal(cyc.isPredictedPeriod('2026-10-01', todayISO), false);
  });

  test('วันในอดีตไม่ใช่วันคาดการณ์', () => {
    assert.equal(cyc.isPredictedPeriod('2026-10-03', todayISO), false);
  });

  test('วันแรก ๆ ของรอบถัดไปคือวันคาดการณ์', () => {
    // รอบถัดไปเริ่ม 2026-10-29 ประจำเดือน 5 วัน
    for (let i = 0; i < 5; i++) {
      const day = addDays('2026-10-29', i);
      assert.equal(cyc.isPredictedPeriod(day, todayISO), true, `${day} ควรเป็นวันคาดการณ์`);
    }
  });

  test('วันกลางรอบไม่ใช่วันคาดการณ์', () => {
    assert.equal(cyc.isPredictedPeriod('2026-11-10', todayISO), false);
  });
});

/* ═════════════════════════════════ heatmap ═════════════════════════════════ */

describe('engine() — heatmap()', () => {
  test('ไม่มีข้อมูลก็ไม่พัง', () => {
    const cyc = engine({ logs: {}, settings: SETTINGS });
    const hm = cyc.heatmap(['cramps'], '2026-10-07');
    assert.equal(hm.totalLogged, 0);
    assert.equal(hm.pct.cramps.menstrual, null);
    assert.equal(hm.strongest(['cramps']), null);
  });

  test('นับเป็นเปอร์เซ็นต์ของวันที่บันทึกในช่วงนั้น', () => {
    const state = stateFromStarts(['2026-09-01', '2026-09-29']);
    // วันที่ 1-4 ของรอบ (ช่วงเมนส์): ใส่ cramps 2 ใน 4 วัน
    state.logs['2026-09-01'].symptoms = ['cramps'];
    state.logs['2026-09-02'].symptoms = ['cramps'];
    state.logs['2026-09-03'].symptoms = ['happy'];
    state.logs['2026-09-04'].symptoms = ['happy'];

    const cyc = engine(state);
    const hm = cyc.heatmap(['cramps', 'happy'], '2026-10-07');
    assert.equal(hm.loggedDays.menstrual, 4);
    assert.equal(hm.pct.cramps.menstrual, 50);
    assert.equal(hm.pct.happy.menstrual, 50);
  });

  test('ไม่นับวันที่ยังไม่ถึง', () => {
    const state = stateFromStarts(['2026-10-01']);
    state.logs['2026-10-01'].symptoms = ['cramps'];
    state.logs['2026-10-20'] = { period: false, symptoms: ['cramps'], energy: 0, note: '' };

    const cyc = engine(state);
    const hm = cyc.heatmap(['cramps'], '2026-10-07');
    assert.equal(hm.totalLogged, 1, 'วันที่ 20 ต.ค. อยู่ในอนาคต ไม่ควรถูกนับ');
  });

  test('ไม่นับวันที่ไม่มีทั้งอาการและพลังงาน', () => {
    const state = stateFromStarts(['2026-10-01']);
    const cyc = engine(state);
    const hm = cyc.heatmap(['cramps'], '2026-10-07');
    assert.equal(hm.totalLogged, 0, 'วันมีประจำเดือนเปล่า ๆ ไม่นับเข้าตาราง');
  });

  test('นับวันที่มีแต่พลังงาน', () => {
    const state = stateFromStarts(['2026-10-01']);
    state.logs['2026-10-01'].energy = 3;
    const cyc = engine(state);
    assert.equal(cyc.heatmap(['cramps'], '2026-10-07').totalLogged, 1);
  });

  test('strongest() ต้องมีข้อมูลในช่วงนั้นถึงเกณฑ์ก่อน', () => {
    const state = stateFromStarts(['2026-09-01', '2026-09-29']);
    // ใส่ cramps 100% แต่มีแค่ 2 วัน (ต่ำกว่าเกณฑ์ 3 วัน)
    state.logs['2026-09-01'].symptoms = ['cramps'];
    state.logs['2026-09-02'].symptoms = ['cramps'];
    const cyc = engine(state);
    assert.equal(cyc.heatmap(['cramps'], '2026-10-07').strongest(['cramps']), null,
      'ข้อมูล 2 วันยังน้อยเกินจะสรุป pattern');
  });

  test('strongest() คืนช่องที่เด่นสุดเมื่อข้อมูลพอ', () => {
    const state = stateFromStarts(['2026-09-01', '2026-09-29']);
    for (let i = 0; i < 4; i++) state.logs[addDays('2026-09-01', i)].symptoms = ['cramps'];
    const cyc = engine(state);
    const best = cyc.heatmap(['cramps'], '2026-10-07').strongest(['cramps']);
    assert.ok(best, 'ควรเจอ pattern');
    assert.equal(best.symptom, 'cramps');
    assert.equal(best.phase, 'menstrual');
    assert.equal(best.pct, 100);
  });

  test('strongest() ไม่คืนช่องที่ความถี่ต่ำกว่าเกณฑ์', () => {
    // ประจำเดือน 6 วัน → ช่วงเมนส์มี 6 วัน ใส่ cramps วันเดียว = 17% ต่ำกว่าเกณฑ์ 20%
    const settings = { cycleLength: 28, periodLength: 6 };
    const state = stateFromStarts(['2026-09-01', '2026-09-29'], settings);
    for (let i = 0; i < 6; i++) state.logs[addDays('2026-09-01', i)].energy = 3;
    state.logs['2026-09-01'].symptoms = ['cramps'];

    const cyc = engine(state);
    const hm = cyc.heatmap(['cramps'], '2026-10-07');
    assert.equal(hm.loggedDays.menstrual, 6);
    assert.equal(hm.pct.cramps.menstrual, 17);
    assert.equal(hm.strongest(['cramps']), null);
  });

  test('strongest() รับค่าที่เท่ากับเกณฑ์พอดี (ขอบเขตเป็นแบบรวม)', () => {
    // 1 ใน 5 วัน = 20% เท่าเกณฑ์พอดี ต้องนับว่าเจอ
    const state = stateFromStarts(['2026-09-01', '2026-09-29']);
    for (let i = 0; i < 5; i++) state.logs[addDays('2026-09-01', i)].energy = 3;
    state.logs['2026-09-01'].symptoms = ['cramps'];

    const cyc = engine(state);
    const best = cyc.heatmap(['cramps'], '2026-10-07').strongest(['cramps']);
    assert.ok(best, '20% ควรถึงเกณฑ์');
    assert.equal(best.pct, 20);
  });
});

/* ═════════════════════════════════ monthInfo ═════════════════════════════════ */

describe('monthInfo()', () => {
  test('จำนวนวันในเดือนถูกต้อง', () => {
    assert.equal(monthInfo(2026, 0).days, 31);  // มกราคม
    assert.equal(monthInfo(2026, 1).days, 28);  // กุมภาพันธ์ 2026
    assert.equal(monthInfo(2024, 1).days, 29);  // กุมภาพันธ์ 2024 (อธิกสุรทิน)
    assert.equal(monthInfo(2026, 3).days, 30);  // เมษายน
  });

  test('lead อยู่ในช่วง 0-6 และตรงกับวันในสัปดาห์แบบอาทิตย์ขึ้นต้น', () => {
    for (let m = 0; m < 12; m++) {
      const { lead } = monthInfo(2026, m);
      assert.ok(lead >= 0 && lead <= 6, `lead ของเดือน ${m} ออกนอกช่วง`);
      assert.equal(lead, new Date(2026, m, 1).getDay());
    }
  });

  test('dayISO() คืนคีย์วันที่ของเดือนนั้น', () => {
    const { dayISO } = monthInfo(2026, 9);
    assert.equal(dayISO(1), '2026-10-01');
    assert.equal(dayISO(31), '2026-10-31');
  });
});

/* ═════════════════════════════════ demoLogs ═════════════════════════════════ */

describe('demoLogs()', () => {
  test('ให้ผลเหมือนกันทุกครั้ง (สุ่มแบบกำหนดเมล็ด)', () => {
    const a = demoLogs('2026-10-07', 5);
    const b = demoLogs('2026-10-07', 5);
    assert.deepEqual(a, b);
  });

  test('ไม่สร้างบันทึกในอนาคต', () => {
    const todayISO = '2026-10-07';
    for (const day of Object.keys(demoLogs(todayISO, 5))) {
      assert.ok(day <= todayISO, `${day} อยู่ในอนาคต`);
    }
  });

  test('สร้างรอบได้ตามจำนวนที่ประกาศไว้', () => {
    const cyc = engine({ logs: demoLogs('2026-10-07', 5), settings: SETTINGS });
    assert.equal(cyc.starts.length, DEMO_CYCLE_LENGTHS.length);
  });

  test('ความยาวรอบตรงกับที่ประกาศไว้', () => {
    const cyc = engine({ logs: demoLogs('2026-10-07', 5), settings: SETTINGS });
    assert.deepEqual(cyc.lengths, DEMO_CYCLE_LENGTHS.slice(0, -1));
  });

  test('ข้อมูลตัวอย่างพอให้หน้าสถิติจับ pattern ได้', () => {
    const cyc = engine({ logs: demoLogs('2026-10-07', 5), settings: SETTINGS });
    const hm = cyc.heatmap(['acne', 'cramps', 'moody', 'insomnia', 'craving'], '2026-10-07');
    assert.ok(hm.totalLogged >= 10, 'ควรมีวันบันทึกมากพอ');
    assert.ok(hm.strongest(['acne', 'cramps', 'moody', 'insomnia', 'craving']),
      'ข้อมูลตัวอย่างควรมี pattern ให้เจอ ไม่งั้นหน้าสถิติจะโล่ง');
  });

  test('พลังงานอยู่ในช่วง 1-5 และอาการเป็นคีย์ที่รู้จัก', () => {
    const logs = demoLogs('2026-10-07', 5);
    const known = new Set(['happy', 'energy', 'acne', 'cramps', 'moody',
      'insomnia', 'craving', 'water', 'exercise']);
    for (const [day, log] of Object.entries(logs)) {
      assert.ok(log.energy >= 1 && log.energy <= 5, `พลังงานเพี้ยนที่ ${day}: ${log.energy}`);
      for (const s of log.symptoms) assert.ok(known.has(s), `อาการไม่รู้จัก: ${s}`);
    }
  });
});
