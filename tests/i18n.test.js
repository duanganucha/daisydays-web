/**
 * เทสต์ระบบหลายภาษา
 *
 * เทสต์ชุดนี้วนทุกภาษาที่ลงทะเบียนไว้โดยอัตโนมัติ
 * เพิ่มภาษาใหม่แล้วไม่ต้องแก้ไฟล์นี้ — มันจะตรวจภาษาใหม่ให้เอง
 * ถ้าแปลตกคีย์ไหน หรืออาร์เรย์ยาวไม่ครบ CI จะฟ้องทันที
 *
 * รัน: node --test tests/
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  LOCALES, localeList, setLocale, getLocale, t, raw,
  phaseName, phaseShort, symptomLabel, energyLabel, adviceFor,
  tipsFor, tipOfDay, tipCount, dowHeaders, displayYear,
  formatFull, formatShort, formatMonthYear, missingKeys,
} from '../js/i18n.js';

import { PHASES, SYMPTOMS, ENERGY_MAX } from '../js/data.js';

const CODES = Object.keys(LOCALES);

/* ═════════════════════════ ความครบของทุกภาษา ═════════════════════════ */

describe('ความครบของไฟล์ภาษา', () => {
  test('มีภาษาไทยเป็นภาษาอ้างอิง', () => {
    assert.ok(LOCALES.th, 'ภาษาไทยคือภาษาสำรอง จะหายไปไม่ได้');
  });

  for (const code of CODES) {
    describe(`ภาษา: ${code}`, () => {
      const L = LOCALES[code];

      test('รหัสภาษาในไฟล์ตรงกับคีย์ที่ลงทะเบียน', () => {
        assert.equal(L.code, code, `ไฟล์ประกาศ code:'${L.code}' แต่ลงทะเบียนเป็น '${code}'`);
      });

      test('มีชื่อภาษาเป็นภาษาของตัวเอง', () => {
        assert.equal(typeof L.name, 'string');
        assert.ok(L.name.length > 0, 'name ใช้โชว์ในตัวเลือกภาษา ต้องไม่ว่าง');
      });

      test('ทิศทางการอ่านถูกต้อง', () => {
        assert.ok(['ltr', 'rtl'].includes(L.dir || 'ltr'), `dir เพี้ยน: ${L.dir}`);
      });

      test('yearOffset เป็นตัวเลข', () => {
        assert.equal(typeof (L.yearOffset ?? 0), 'number');
      });

      test('มี 12 เดือน (ทั้งแบบเต็มและย่อ)', () => {
        assert.equal(L.months?.length, 12, 'months ต้องมี 12 ค่า');
        assert.equal(L.monthsShort?.length, 12, 'monthsShort ต้องมี 12 ค่า');
      });

      test('มี 7 วันในสัปดาห์ และหัวปฏิทิน 7 ช่อง', () => {
        assert.equal(L.weekdays?.length, 7, 'weekdays ต้องมี 7 ค่า เริ่มจากวันจันทร์');
        assert.equal(L.dow?.length, 7, 'dow ต้องมี 7 ค่า เริ่มจากวันอาทิตย์');
      });

      test('ไม่มีเดือนหรือวันที่เป็นค่าว่าง', () => {
        for (const [key, arr] of Object.entries({
          months: L.months, monthsShort: L.monthsShort, weekdays: L.weekdays, dow: L.dow,
        })) {
          (arr || []).forEach((v, i) => {
            assert.ok(typeof v === 'string' && v.trim() !== '', `${key}[${i}] ว่าง`);
          });
        }
      });

      test('ครบทุกช่วงของรอบ', () => {
        for (const p of PHASES) {
          assert.ok(L.phases?.[p], `ขาด phases.${p}`);
          assert.ok(L.phaseShort?.[p], `ขาด phaseShort.${p}`);
          assert.ok(L.phaseTips?.[p], `ขาด phaseTips.${p}`);
        }
      });

      test('ครบทุกอาการ', () => {
        for (const s of SYMPTOMS) {
          assert.ok(L.symptoms?.[s.key], `ขาดคำแปลอาการ: ${s.key}`);
        }
      });

      test(`ระดับพลังงานมี ${ENERGY_MAX + 1} ค่า (รวม "ยังไม่เลือก")`, () => {
        assert.equal(L.energy?.length, ENERGY_MAX + 1);
      });

      test('มีคำแนะนำสำรอง (advice.default)', () => {
        assert.ok(L.advice?.default, 'ต้องมี advice.default ไว้ใช้กับอาการที่ไม่มีคำแนะนำเฉพาะ');
      });

      test('รูปแบบวันที่มีตัวแทนค่าที่จำเป็น', () => {
        assert.ok(L.dateFormats?.full?.includes('{day}'), 'dateFormats.full ต้องมี {day}');
        assert.ok(L.dateFormats?.short?.includes('{day}'), 'dateFormats.short ต้องมี {day}');
        assert.ok(
          L.dateFormats?.monthYear?.includes('{year}'),
          'dateFormats.monthYear ต้องมี {year}',
        );
      });

      test('ไม่มีคีย์ไหนขาดเมื่อเทียบกับภาษาไทย', () => {
        const missing = missingKeys(code);
        assert.deepEqual(missing, [],
          `ภาษา ${code} ยังขาด ${missing.length} คีย์:\n  ${missing.join('\n  ')}`);
      });
    });
  }
});

/* ═════════════════════════ ตัวแทนค่าใน UI ═════════════════════════ */

describe('ตัวแทนค่าในข้อความ', () => {
  // คีย์ที่ "ต้อง" มีตัวแทนค่า ไม่งั้นข้อความจะอ่านไม่รู้เรื่อง
  const REQUIRED = {
    ringSub: ['{n}'],
    inDays: ['{n}'],
    aroundDate: ['{date}'],
    miniEnergy: ['{n}', '{max}'],
    energyAria: ['{n}'],
    unitDays: ['{n}'],
    statsKicker: ['{days}', '{cycles}'],
    statsNeedMore: ['{n}'],
    patternDetail: ['{symptom}', '{phase}', '{pct}'],
    averageDays: ['{n}'],
    meSummary: ['{days}', '{avg}'],
    tipsSub: ['{n}'],
    importFailed: ['{msg}'],
    demoBtn: ['{n}'],
    demoDone: ['{n}'],
    tipSource: ['{source}'],
    calSaysDefault: ['{day}', '{len}'],
  };

  for (const code of CODES) {
    test(`ภาษา ${code} เก็บตัวแทนค่าไว้ครบ`, () => {
      const ui = LOCALES[code].ui || {};
      for (const [key, holders] of Object.entries(REQUIRED)) {
        const s = ui[key];
        if (s === undefined) continue; // ขาดคีย์ ให้เทสต์ชุด missingKeys ฟ้องเอง
        for (const h of holders) {
          assert.ok(s.includes(h),
            `${code}: ui.${key} ขาดตัวแทนค่า ${h} — ได้ "${s}"`);
        }
      }
    });
  }

  test('แทนค่าแล้วไม่เหลือปีกกาค้าง', () => {
    setLocale('th');
    assert.equal(t('inDays', { n: 3 }).includes('{'), false);
    assert.equal(t('unitDays', { n: 28 }), '28 วัน');
    assert.equal(t('statsKicker', { days: 165, cycles: 6 }).includes('{'), false);
  });

  test('ไม่ส่งตัวแปรมา → ปีกกาคงอยู่ ไม่พัง', () => {
    setLocale('th');
    assert.ok(t('inDays').includes('{n}'));
  });

  test('คีย์ที่ไม่รู้จักคืนชื่อคีย์ ไม่โยน error', () => {
    setLocale('th');
    assert.equal(t('คีย์ที่ไม่มีอยู่จริง'), 'คีย์ที่ไม่มีอยู่จริง');
  });
});

/* ═════════════════════════ การสลับภาษา ═════════════════════════ */

describe('setLocale()', () => {
  test('สลับไปภาษาที่ลงทะเบียนไว้ได้', () => {
    for (const code of CODES) {
      assert.equal(setLocale(code), code);
      assert.equal(getLocale(), code);
    }
  });

  test('ภาษาที่ไม่รู้จักถอยไปภาษาไทย', () => {
    assert.equal(setLocale('zz'), 'th');
    assert.equal(setLocale(undefined), 'th');
    assert.equal(setLocale(''), 'th');
  });

  test('localeList() คืนทุกภาษาพร้อมชื่อ', () => {
    const list = localeList();
    assert.equal(list.length, CODES.length);
    for (const item of list) {
      assert.ok(item.code && item.name, `รายการภาษาไม่สมบูรณ์: ${JSON.stringify(item)}`);
    }
  });

  test('ข้อความเปลี่ยนจริงเมื่อสลับภาษา', () => {
    setLocale('th');
    const th = t('save');
    setLocale('en');
    assert.notEqual(t('save'), th, 'ข้อความอังกฤษไม่ควรเหมือนไทย');
    assert.equal(t('save'), 'Save');
  });
});

/* ═════════════════════════ ระบบ fallback ═════════════════════════ */

describe('fallback ไปภาษาไทย', () => {
  test('ภาษาที่แปลไม่ครบยังได้ข้อความ ไม่ใช่ค่าว่าง', () => {
    // จำลองภาษาที่แปลแค่คีย์เดียว
    LOCALES.__test = { code: '__test', name: 'Test', dir: 'ltr', ui: { save: 'SAVE!' } };
    try {
      setLocale('__test');
      assert.equal(t('save'), 'SAVE!', 'คีย์ที่แปลแล้วต้องใช้ของภาษานั้น');
      assert.equal(t('close'), LOCALES.th.ui.close, 'คีย์ที่ขาดต้องถอยไปใช้ไทย');
      assert.equal(phaseName('menstrual'), LOCALES.th.phases.menstrual);
      assert.equal(symptomLabel('cramps'), LOCALES.th.symptoms.cramps);
      assert.ok(tipsFor('menstrual').length > 0, 'เคล็ดลับต้องถอยไปใช้ไทย ไม่ใช่ว่างเปล่า');
      assert.equal(dowHeaders().length, 7, 'หัวปฏิทินต้องถอยไปใช้ไทย');
    } finally {
      delete LOCALES.__test;
      setLocale('th');
    }
  });

  test('missingKeys() ตรวจจับคีย์ที่ขาดได้จริง', () => {
    LOCALES.__test = { code: '__test', name: 'Test', ui: { save: 'x' } };
    try {
      const missing = missingKeys('__test');
      assert.ok(missing.length > 10, 'ภาษาที่แปลคีย์เดียวต้องมีรายการขาดเยอะ');
      assert.ok(missing.includes('ui.close'), 'ควรรายงาน ui.close ว่าขาด');
      assert.ok(missing.some((m) => m.startsWith('months')), 'ควรรายงาน months ว่าขาด');
    } finally {
      delete LOCALES.__test;
    }
  });

  test('missingKeys() ของภาษาไทยต้องว่าง', () => {
    assert.deepEqual(missingKeys('th'), []);
  });

  test('missingKeys() โยน error เมื่อไม่รู้จักภาษา', () => {
    assert.throws(() => missingKeys('zz'));
  });

  test('missingKeys() จับอาร์เรย์ยาวไม่ครบ', () => {
    LOCALES.__test = JSON.parse(JSON.stringify(LOCALES.th));
    LOCALES.__test.code = '__test';
    LOCALES.__test.months = ['ม.ค.']; // เหลือเดือนเดียว
    try {
      assert.ok(missingKeys('__test').some((m) => m.startsWith('months')),
        'ต้องจับได้ว่า months ยาวไม่ครบ');
    } finally {
      delete LOCALES.__test;
    }
  });
});

/* ═════════════════════════ ตัวช่วยอ่านค่า ═════════════════════════ */

describe('ตัวช่วยอ่านค่า', () => {
  test('ชื่อช่วงและชื่อย่อมีค่าทุกช่วง ทุกภาษา', () => {
    for (const code of CODES) {
      setLocale(code);
      for (const p of PHASES) {
        assert.ok(phaseName(p), `${code}: phaseName(${p}) ว่าง`);
        assert.ok(phaseShort(p), `${code}: phaseShort(${p}) ว่าง`);
      }
    }
    setLocale('th');
  });

  test('energyLabel() ครอบคลุม 0 ถึง ENERGY_MAX', () => {
    for (const code of CODES) {
      setLocale(code);
      for (let i = 0; i <= ENERGY_MAX; i++) {
        assert.ok(energyLabel(i), `${code}: energyLabel(${i}) ว่าง`);
      }
    }
    setLocale('th');
  });

  test('adviceFor() คืนค่าสำรองเมื่ออาการไม่มีคำแนะนำเฉพาะ', () => {
    setLocale('th');
    assert.equal(adviceFor('ไม่มีอาการนี้'), LOCALES.th.advice.default);
    assert.equal(adviceFor('cramps'), LOCALES.th.advice.cramps);
  });

  test('tipCount() ตรงกับจำนวนเคล็ดลับจริง', () => {
    setLocale('th');
    const manual = PHASES.reduce((n, p) => n + LOCALES.th.tips[p].length, 0);
    assert.equal(tipCount(PHASES), manual);
    assert.ok(manual > 0);
  });
});

/* ═════════════════════════ เคล็ดลับ ═════════════════════════ */

describe('เคล็ดลับ', () => {
  test('ทุกข้อมีครบ 5 ช่องและมีแหล่งอ้างอิง', () => {
    for (const code of CODES) {
      setLocale(code);
      for (const p of PHASES) {
        tipsFor(p).forEach((tip, i) => {
          for (const field of ['icon', 'title', 'summary', 'detail', 'source']) {
            assert.ok(tip[field] && String(tip[field]).trim() !== '',
              `${code}: tips.${p}[${i}] ขาด ${field}`);
          }
          assert.ok(tip.detail.length > tip.summary.length,
            `${code}: tips.${p}[${i}] รายละเอียดควรยาวกว่าสรุป`);
        });
      }
    }
    setLocale('th');
  });

  test('tipOfDay() คงที่ภายในวันเดียวกัน', () => {
    setLocale('th');
    const a = tipOfDay('menstrual', '2026-10-07');
    const b = tipOfDay('menstrual', '2026-10-07');
    assert.deepEqual(a, b);
  });

  test('tipOfDay() เปลี่ยนตามวัน', () => {
    setLocale('th');
    const titles = new Set();
    for (let i = 0; i < 10; i++) {
      titles.add(tipOfDay('menstrual', `2026-10-0${(i % 9) + 1}`).title);
    }
    assert.ok(titles.size > 1, 'เคล็ดลับควรหมุนเวียน ไม่ใช่ค้างข้อเดียว');
  });

  test('tipOfDay() ไม่ส่งช่วงมาก็ได้ (ยังไม่มีข้อมูลรอบ)', () => {
    setLocale('th');
    const tip = tipOfDay(null, '2026-10-07');
    assert.ok(tip.title, 'ต้องคืนเคล็ดลับทั่วไป');
  });

  test('tipOfDay() ทำงานได้ทุกวันของปีโดยไม่ได้ index ติดลบ', () => {
    setLocale('th');
    // วันก่อนจุดอ้างอิง (1 ม.ค. 2020) ต้องไม่ทำให้ index ติดลบ
    for (const day of ['2019-06-15', '2020-01-01', '2026-10-07', '2030-12-31']) {
      const tip = tipOfDay('pms', day);
      assert.ok(tip.title, `tipOfDay พังที่ ${day}`);
    }
  });
});

/* ═════════════════════════ จัดรูปแบบวันที่ ═════════════════════════ */

describe('จัดรูปแบบวันที่', () => {
  test('ไทยใช้ปี พ.ศ.', () => {
    setLocale('th');
    assert.equal(displayYear(2026), 2569);
    assert.equal(formatMonthYear(2026, 9), 'ตุลาคม 2569');
  });

  test('อังกฤษใช้ปี ค.ศ.', () => {
    setLocale('en');
    assert.equal(displayYear(2026), 2026);
    assert.equal(formatMonthYear(2026, 9), 'October 2026');
    setLocale('th');
  });

  test('formatFull() ใส่ชื่อวันถูกต้อง', () => {
    setLocale('th');
    // 7 ต.ค. 2026 เป็นวันพุธ
    assert.equal(formatFull('2026-10-07'), 'พุธ 7 ตุลาคม');
    // 11 ต.ค. 2026 เป็นวันอาทิตย์ — เคสที่แปลง index พลาดได้ง่ายสุด
    assert.equal(formatFull('2026-10-11'), 'อาทิตย์ 11 ตุลาคม');
    // 12 ต.ค. 2026 เป็นวันจันทร์
    assert.equal(formatFull('2026-10-12'), 'จันทร์ 12 ตุลาคม');
  });

  test('formatShort() ใช้ชื่อเดือนย่อ', () => {
    setLocale('th');
    assert.equal(formatShort('2026-10-07'), '7 ต.ค.');
    assert.equal(formatShort('2026-01-01'), '1 ม.ค.');
  });

  test('ชื่อวันครบทุกวันในสัปดาห์ ไม่มีค่าว่าง', () => {
    for (const code of CODES) {
      setLocale(code);
      // 5-11 ต.ค. 2026 = จันทร์ถึงอาทิตย์
      for (let d = 5; d <= 11; d++) {
        const s = formatFull(`2026-10-${String(d).padStart(2, '0')}`);
        assert.ok(s.trim() !== '', `${code}: formatFull ว่างที่วันที่ ${d}`);
        assert.ok(!s.includes('{'), `${code}: formatFull เหลือตัวแทนค่าค้าง: ${s}`);
      }
    }
    setLocale('th');
  });

  test('formatMonthYear() ครบ 12 เดือน ทุกภาษา', () => {
    for (const code of CODES) {
      setLocale(code);
      for (let m = 0; m < 12; m++) {
        const s = formatMonthYear(2026, m);
        assert.ok(s.trim() !== '', `${code}: เดือน ${m} ว่าง`);
        assert.ok(!s.includes('{'), `${code}: เดือน ${m} เหลือตัวแทนค่าค้าง: ${s}`);
      }
    }
    setLocale('th');
  });
});

/* ═════════════════════════ กันข้อความหลุดเข้า data.js ═════════════════════════ */

test('raw() อ่าน path ซ้อนชั้นได้', () => {
  setLocale('th');
  assert.equal(raw('phases.menstrual'), LOCALES.th.phases.menstrual);
  assert.deepEqual(raw('months'), LOCALES.th.months);
  assert.equal(raw('ไม่มี.path.นี้'), undefined);
});
