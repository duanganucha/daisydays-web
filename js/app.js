/**
 * app.js — UI ทั้งหมด วานิลลา JS ไม่มี framework ไม่มี build step
 *
 * โครงหน้าตามแอป Flutter: 4 แท็บ (วันนี้ / ปฏิทิน / สถิติ / ฉัน)
 * + ปุ่ม + กลางแถบที่เปิดหน้าบันทึก และหน้าเคล็ดลับซ้อนทับ
 */

import {
  getState, getSettings, setSettings, subscribe,
  dayOf, putLog, isEmptyLog, loggedDayCount,
  exportJSON, importJSON, replaceAllLogs, eraseAll,
  today, iso, addDays, daysBetween, parseISO,
} from './store.js';

import { engine, monthInfo, demoLogs } from './cycle.js';

import {
  PHASES, phaseLabels, phaseNames, phaseTips,
  SYMPTOMS, symptomOf, ENERGY_LABELS, ADVICE,
  MONTHS_TH, MONTHS_SHORT, WEEKDAYS_TH, DOW_SHORT,
  tipsByPhase, asTip, tipOfDay,
} from './data.js';

/* ───────────────────────────── ตัวช่วยสร้าง DOM ───────────────────────────── */

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'style') node.setAttribute('style', v);
    else if (k === 'value') node.value = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat(3)) {
    if (c === null || c === undefined || c === false || c === '') continue;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
}

const $ = (s) => document.querySelector(s);

/** หน่วงให้อนิเมชัน pop-in ไหลเป็นลำดับ */
const stagger = (i, step = 40, base = 0) => `animation-delay:${base + i * step}ms`;

/* ──────────────────────────── วันที่แบบไทย ──────────────────────────── */

/** 'อังคาร 7 ตุลาคม' */
function fullDate(dayISO) {
  const d = parseISO(dayISO);
  const dartWeekday = d.getDay() === 0 ? 7 : d.getDay();
  return `${WEEKDAYS_TH[dartWeekday - 1]} ${d.getDate()} ${MONTHS_TH[d.getMonth()]}`;
}

/** '7 ต.ค.' */
function shortDate(dayISO) {
  const d = parseISO(dayISO);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

/** 'ตุลาคม 2569' — ปีพุทธศักราชเหมือนแอป */
const monthYear = (year, month) => `${MONTHS_TH[month]} ${year + 543}`;

/* ──────────────────────────────── สถานะ UI ──────────────────────────────── */

const now = new Date();

const ui = {
  tab: 'home',                 // home | calendar | stats | me
  month: now.getMonth(),
  year: now.getFullYear(),
  overlay: null,               // null | { kind:'log', day } | { kind:'tips' }
  openTip: null,               // คีย์เคล็ดลับที่กางอยู่
  draft: null,                 // บันทึกที่กำลังแก้ในหน้าบันทึก (ยังไม่กดบันทึก)
};

/* ───────────────────────── ส่วนประกอบที่ใช้ซ้ำ ───────────────────────── */

function card(attrs, ...children) {
  const cls = ['card', attrs.class].filter(Boolean).join(' ');
  return el('section', { ...attrs, class: cls }, ...children);
}

function phaseChip(phase) {
  return el('span', { class: 'phase-chip' }, phaseNames[phase]);
}

function cycleRing(day, length) {
  return el('div', { class: 'ring', style: `--p:${Math.min(1, day / length)}` },
    el('div', { class: 'ring-inner' },
      el('div', { class: 'ring-cap' }, 'วันที่'),
      el('div', { class: 'ring-day' }, day),
      el('div', { class: 'ring-sub' }, `ของรอบ ${length} วัน`),
    ),
  );
}

function emptyFairyCard(text, fairy = '🧚‍♀️') {
  return card({},
    el('div', { class: 'empty-row' },
      el('span', { class: 'empty-fairy' }, fairy),
      el('p', { class: 'grow' }, text),
    ),
  );
}

/* ═══════════════════════════════ หน้าแรก (วันนี้) ═══════════════════════════════ */

function viewHome() {
  const state = getState();
  const set = getSettings();
  const cyc = engine(state);
  const day = today();
  const st = cyc.statusOn(day);
  const next = cyc.nextPeriod(day);
  const log = dayOf(day);

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'สวัสดีตอนเช้า' : hour < 17 ? 'สวัสดีตอนบ่าย' : 'สวัสดีตอนเย็น';

  const hero = el('div', { class: 'hero' },
    el('div', { class: 'hero-top' },
      el('div', { class: 'hero-greet' }, `${greet} ${set.name} 🌼`.replace('  ', ' ')),
      el('div', { class: 'hero-date' }, fullDate(day)),
    ),
    el('div', { class: 'hero-bubble' },
      st ? phaseTips[st.phase] : 'เริ่มบันทึกวันมีประจำเดือน แล้วฉันจะช่วยคำนวณรอบให้นะ'),
    el('div', { class: 'hero-fairy' }, '🧚‍♀️'),
  );

  // การ์ดสถานะรอบ
  const statusCard = st === null
    ? emptyFairyCard('ยังไม่มีข้อมูลรอบเดือน\nกด + แล้วเปิด "ประจำเดือนมา" เพื่อเริ่ม', '🧚‍♀️')
    : card({},
      el('div', { class: 'row' },
        cycleRing(st.cycleDay, st.cycleLength),
        el('div', { class: 'grow' },
          phaseChip(st.phase),
          el('div', { class: 'next-label' }, 'ประจำเดือนรอบหน้า'),
          next && el('div', { class: 'next-days' }, `อีก ${daysBetween(day, next)} วัน`),
          next && el('div', { class: 'next-date' }, `ประมาณ ${shortDate(next)}`),
        ),
      ),
    );

  // สรุปบันทึกวันนี้
  const minis = [];
  if (log.period) minis.push({ icon: '📅', label: 'ประจำเดือน' });
  for (const k of log.symptoms) {
    const s = symptomOf(k);
    if (s) minis.push({ icon: s.icon, label: s.label });
  }
  if (log.energy > 0) minis.push({ icon: '⚡', label: `พลังงาน ${log.energy}/5` });

  const todayBlock = isEmptyLog(log)
    ? card({}, el('p', { class: 'muted' }, 'วันนี้ยังไม่ได้บันทึก กด + เพื่อจดว่ารู้สึกยังไง'))
    : el('div', { class: 'minis' },
      ...minis.map((m, i) => el('span', { class: 'mini', style: stagger(i, 90, 300) },
        el('span', { class: 'mini-icon' }, m.icon), m.label)),
    );

  // การ์ดเคล็ดลับวันนี้
  const tip = tipOfDay(st?.phase ?? null, day);
  const tipCard = el('button', { class: 'card tip-card', onclick: () => openOverlay({ kind: 'tips' }) },
    el('div', { class: 'row' },
      el('span', { class: 'tip-drop' }, '💧'),
      el('div', { class: 'grow' },
        el('div', { class: 'bold' }, 'เคล็ดลับวันนี้'),
        el('div', { class: 'muted' }, `${tip.title} · ${tip.summary}`),
        el('div', { class: 'tip-more' }, 'ดูเคล็ดลับทั้งหมด ›'),
      ),
      el('span', { class: 'chevron' }, '›'),
    ),
  );

  return el('div', {},
    hero,
    el('div', { class: 'content' },
      statusCard,
      el('div', { class: 'section-head' },
        el('h2', {}, 'บันทึกวันนี้'),
        el('button', {
          class: 'text-btn',
          onclick: () => openOverlay({ kind: 'log', day }),
        }, isEmptyLog(log) ? 'เริ่มบันทึก' : 'แก้ไข'),
      ),
      todayBlock,
      el('div', { style: 'height:14px' }),
      tipCard,
    ),
  );
}

/* ═══════════════════════════════ ปฏิทิน ═══════════════════════════════ */

function viewCalendar() {
  const state = getState();
  const cyc = engine(state);
  const todayISO = today();
  const { lead, days, dayISO } = monthInfo(ui.year, ui.month);

  const grid = el('div', { class: 'cal-grid' },
    ...DOW_SHORT.map((h) => el('div', { class: 'cal-dow' }, h)),
    ...Array.from({ length: lead }, () => el('span', { class: 'cal-cell blank' })),
  );

  for (let d = 1; d <= days; d++) {
    const day = dayISO(d);
    const log = dayOf(day);
    const st = cyc.statusOn(day);

    const cls = ['cal-cell'];
    if (st?.fertile) cls.push('fertile');
    if (st?.ovulationDay) cls.push('ovulation');
    if (cyc.isPredictedPeriod(day, todayISO)) cls.push('predicted');
    if (log.period) cls.push('period');
    if (day === todayISO) cls.push('today');
    if (day > todayISO && cls.length === 1) cls.push('dim');

    grid.append(el('button', {
      class: cls.join(' '),
      dataset: { day },
      style: stagger(lead + d, 8),
      'aria-label': fullDate(day),
      onclick: () => openOverlay({ kind: 'log', day }),
    },
      d,
      !isEmptyLog(log) && el('span', { class: 'cal-dot' }),
    ));
  }

  const legend = el('div', { class: 'legend' },
    legendItem('var(--pink)', 'ประจำเดือน'),
    legendItem('var(--pink2)', 'คาดการณ์'),
    legendItem('var(--mint2)', 'ช่วงเจริญพันธุ์'),
    legendItem('var(--mint)', 'ไข่ตก'),
    legendItem('var(--lav)', 'มีบันทึก', true),
  );

  const st = cyc.statusOn(todayISO);
  const says = !st
    ? 'กดวันไหนก็ได้เพื่อเริ่มบันทึก เมื่อมี 2 รอบขึ้นไปฉันจะคาดการณ์ให้แม่นขึ้น'
    : st.phase === 'menstrual' ? 'ช่วงนี้พักเยอะ ๆ นะ ประคบอุ่นช่วยได้'
      : st.phase === 'ovulation' ? 'ช่วงไข่ตก ร่างกายกำลังพีค ดื่มน้ำให้ครบ'
        : st.phase === 'pms' ? 'ใกล้รอบใหม่แล้ว ใจดีกับตัวเองหน่อยนะ'
          : `ตอนนี้วันที่ ${st.cycleDay} ของรอบ ${st.cycleLength} วัน`;

  return el('div', { class: 'content' },
    el('div', { class: 'page-kicker' }, 'ปฏิทินรอบเดือน'),
    el('div', { class: 'cal-head' },
      el('div', { class: 'page-title grow' }, monthYear(ui.year, ui.month)),
      el('button', { class: 'icon-btn', 'aria-label': 'เดือนก่อน', onclick: () => shiftMonth(-1) }, '‹'),
      el('button', { class: 'icon-btn', 'aria-label': 'เดือนถัดไป', onclick: () => shiftMonth(1) }, '›'),
    ),
    card({}, grid, legend),
    el('div', { style: 'height:14px' }),
    emptyFairyCard(says),
  );
}

function legendItem(color, label, dot = false) {
  return el('span', { class: 'legend-item' },
    el('i', { class: dot ? 'swatch dot' : 'swatch', style: `background:${color}` }), label);
}

function shiftMonth(delta) {
  let m = ui.month + delta;
  let y = ui.year;
  if (m < 0) { m = 11; y -= 1; }
  if (m > 11) { m = 0; y += 1; }
  ui.month = m;
  ui.year = y;
  render();
}

/* ═══════════════════════════════ สถิติ ═══════════════════════════════ */

function viewStats() {
  const state = getState();
  const cyc = engine(state);
  const todayISO = today();

  // แถวของตาราง: ตัดดื่มน้ำ/ออกกำลังกายออก เหมือนแอป
  const rows = SYMPTOMS.filter((s) => s.key !== 'water' && s.key !== 'exercise');
  const hm = cyc.heatmap(rows.map((s) => s.key), todayISO);
  const best = hm.strongest(SYMPTOMS.filter((s) => s.negative).map((s) => s.key));
  const enough = hm.totalLogged >= 10;

  const lens = cyc.lengths.slice(-6);
  const lo = lens.length ? Math.min(...lens) : 0;
  const hi = lens.length ? Math.max(...lens) : 0;

  const blocks = [];

  if (!enough) {
    blocks.push(emptyFairyCard(
      'บันทึกอาการให้ครบอย่างน้อย 10 วัน (ยิ่งครบ 2–3 รอบยิ่งแม่น) แล้ว Daisy Days จะจับ pattern ให้เอง'));
  } else {
    blocks.push(card({ style: 'padding:12px 10px' }, heatTable(rows, hm, best)));

    if (best) {
      blocks.push(card({ class: 'grad-pattern' },
        el('div', { class: 'row' },
          el('span', { class: 'empty-fairy' }, '🧚‍♀️'),
          el('div', { class: 'grow' },
            'เจอ pattern แล้ว! ',
            el('span', { class: 'pink' },
              `${symptomOf(best.symptom).label} บ่อยสุด${phaseNames[best.phase]} (${best.pct}%)`),
            el('div', {}, ADVICE[best.symptom] || 'สังเกตตัวเองต่อไปนะ'),
          ),
        ),
      ));
    }
  }

  // การ์ดกราฟความยาวรอบ
  blocks.push(card({},
    el('div', { class: 'row' },
      el('div', { class: 'bold grow' }, 'ความยาวรอบเดือน'),
      el('div', { class: 'muted' }, `เฉลี่ย ${cyc.avgLength} วัน`),
    ),
    el('div', { style: 'height:12px' }),
    lens.length === 0
      ? el('p', { class: 'muted' }, 'ต้องมีอย่างน้อย 2 รอบ ถึงจะแสดงกราฟได้')
      : el('div', { class: 'len-chart' },
        ...lens.map((l) => {
          const h = 0.45 + 0.55 * (hi - lo === 0 ? 1 : (l - lo) / (hi - lo));
          return el('div', { class: 'len-col' },
            el('div', { class: 'len-val' }, l),
            el('div', { class: 'len-bar', style: `height:${Math.round(90 * h)}px` }),
          );
        }),
      ),
  ));

  return el('div', { class: 'content' },
    el('div', { class: 'page-kicker' },
      `จากบันทึก ${hm.totalLogged} วัน · ${cyc.starts.length} รอบเดือน`),
    el('div', { class: 'page-title' }, 'อาการตามช่วงรอบเดือน'),
    el('div', { style: 'height:12px' }),
    el('div', { class: 'stack' }, ...blocks),
  );
}

/** ตารางความถี่ อาการ × ช่วงรอบ */
function heatTable(rows, hm, best) {
  const head = el('tr', {}, el('th', {}),
    ...PHASES.map((p) => el('th', { class: best?.phase === p ? 'hl' : '' }, phaseLabels[p])));

  const body = rows.map((s, ri) => el('tr', {},
    el('td', {},
      el('div', { class: 'heat-name' },
        el('span', { class: 'ico' }, s.icon),
        el('span', {}, s.label),
      ),
    ),
    ...PHASES.map((p, ci) => {
      const v = hm.pct[s.key][p];
      // ความเข้มของสี: 0.06 เมื่อไม่มีข้อมูล ไม่เกิน 1.0
      const a = v === null ? 0.06 : Math.min(1, Math.max(0.12, 0.12 + v / 55));
      const hl = best?.symptom === s.key && best?.phase === p;
      const cls = ['heat-cell'];
      if ((v ?? 0) > 28) cls.push('strong');
      if (hl) cls.push('hl');
      return el('td', {},
        el('div', {
          class: cls.join(' '),
          style: `background:rgba(242,122,166,${a});${stagger(ci * 3 + ri, 35, 200)}`,
        }, v === null ? '–' : `${v}%`),
      );
    }),
  ));

  return el('table', { class: 'heat' }, el('thead', {}, head), el('tbody', {}, ...body));
}

/* ═══════════════════════════════ ฉัน ═══════════════════════════════ */

function viewMe() {
  const set = getSettings();
  const cyc = engine(getState());

  const stepper = (label, key, min, max, unit = 'วัน') => el('div', { class: 'stepper' },
    el('span', { class: 'label' }, label),
    el('button', {
      class: 'step-btn', 'aria-label': 'ลด', disabled: set[key] <= min,
      onclick: () => { setSettings({ [key]: set[key] - 1 }); render(); },
    }, '−'),
    el('span', { class: 'value' }, `${set[key]} ${unit}`),
    el('button', {
      class: 'step-btn', 'aria-label': 'เพิ่ม', disabled: set[key] >= max,
      onclick: () => { setSettings({ [key]: set[key] + 1 }); render(); },
    }, '+'),
  );

  const fileInput = el('input', {
    type: 'file', accept: 'application/json,.json', class: 'hidden',
    onchange: async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        importJSON(await file.text());
        toast('นำเข้าข้อมูลเรียบร้อย 🌼');
      } catch (err) {
        toast(`นำเข้าไม่สำเร็จ: ${err.message}`);
      }
      e.target.value = '';
      render();
    },
  });

  return el('div', { class: 'content' },
    el('div', { class: 'me-head' },
      el('span', { class: 'me-logo' }, '🌼'),
      el('div', { class: 'grow' },
        el('div', { class: 'page-title' }, set.name || 'ฉัน'),
        el('div', { class: 'muted' },
          `บันทึกแล้ว ${loggedDayCount()} วัน · รอบเฉลี่ย ${cyc.avgLength} วัน`),
      ),
    ),

    // ชื่อเล่น
    card({},
      el('div', { class: 'bold' }, 'ชื่อที่อยากให้เรียก'),
      el('input', {
        class: 'note-input', type: 'text', value: set.name, maxlength: 20,
        placeholder: 'เช่น ออม',
        onchange: (e) => { setSettings({ name: e.target.value.trim() }); render(); },
      }),
    ),

    // ค่าตั้งต้นของรอบ
    card({ style: 'padding:6px 16px' },
      stepper('รอบเดือนตั้งต้น', 'cycleLength', 21, 40),
      el('hr', { class: 'divider' }),
      stepper('มีประจำเดือน', 'periodLength', 2, 10),
    ),
    el('p', { class: 'muted', style: 'padding:0 4px' },
      'เมื่อบันทึกครบ 2 รอบขึ้นไป แอปจะใช้ค่าเฉลี่ยจริงแทนค่าตั้งต้น'),

    // เคล็ดลับ
    card({ style: 'padding:8px' },
      el('button', { class: 'tile', onclick: () => openOverlay({ kind: 'tips' }) },
        el('span', { class: 't-icon' }, '📖'),
        el('div', { class: 'grow' },
          el('div', { class: 't-title' }, 'เคล็ดลับดูแลตัวเอง'),
          el('div', { class: 't-sub' }, '19 เรื่องแยกตามช่วงรอบเดือน'),
        ),
        el('span', { class: 'chevron' }, '›'),
      ),
    ),

    // สำรองข้อมูล
    card({ style: 'padding:8px' },
      el('button', { class: 'tile', onclick: doExport },
        el('span', { class: 't-icon' }, '⬇️'),
        el('div', { class: 'grow' },
          el('div', { class: 't-title' }, 'ส่งออกไฟล์สำรอง'),
          el('div', { class: 't-sub' }, 'เก็บไว้เองเป็นไฟล์ JSON'),
        ),
      ),
      el('hr', { class: 'divider' }),
      el('button', { class: 'tile', onclick: () => fileInput.click() },
        el('span', { class: 't-icon' }, '⬆️'),
        el('div', { class: 'grow' },
          el('div', { class: 't-title' }, 'นำเข้าไฟล์สำรอง'),
          el('div', { class: 't-sub' }, 'กู้ข้อมูลจากไฟล์ที่ส่งออกไว้'),
        ),
      ),
      fileInput,
    ),

    // ความเป็นส่วนตัว
    card({},
      el('div', { class: 'row' },
        el('span', { style: 'font-size:22px;color:var(--mint-ink)' }, '🔒'),
        el('p', { class: 'grow', style: 'font-size:13px' },
          'ข้อมูลทั้งหมดเก็บในเครื่องนี้เท่านั้น ไม่มีการส่งขึ้นเซิร์ฟเวอร์'),
      ),
    ),

    el('div', { style: 'height:16px' }),
    el('button', {
      class: 'outline-btn',
      onclick: () => {
        if (!confirm('ใส่ข้อมูลตัวอย่าง?\nข้อมูลที่บันทึกไว้จะถูกแทนที่ด้วยข้อมูลตัวอย่าง')) return;
        replaceAllLogs(demoLogs(today(), getSettings().periodLength));
        ui.tab = 'stats';
        toast('ใส่ข้อมูลตัวอย่าง 6 รอบแล้ว ✨');
        render();
      },
    }, '✨', 'ใส่ข้อมูลตัวอย่าง 6 รอบเดือน'),

    el('div', { style: 'height:8px' }),
    el('button', {
      class: 'text-btn danger', style: 'width:100%',
      onclick: () => {
        if (!confirm('ลบข้อมูลทั้งหมด?\nบันทึกและการตั้งค่าทั้งหมดในเครื่องนี้จะหายไป')) return;
        eraseAll();
        ui.tab = 'home';
        toast('ลบข้อมูลทั้งหมดแล้ว');
        render();
      },
    }, '🗑 ลบข้อมูลทั้งหมด'),
  );
}

function doExport() {
  const blob = new Blob([exportJSON()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: `daisydays-backup-${today()}.json` });
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast('ส่งออกไฟล์สำรองแล้ว');
}

/* ═══════════════════════════ หน้าบันทึก (ซ้อนทับ) ═══════════════════════════ */

function viewLog(day) {
  const draft = ui.draft;
  const isToday = day === today();

  const periodCard = card({ class: draft.period ? 'grad-pink' : '', style: 'padding:14px 16px' },
    el('div', { class: `switch-row ${draft.period ? 'on' : ''}` },
      el('span', { class: 'sw-icon' }, '📅'),
      el('span', { class: 'grow bold' }, 'ประจำเดือนมา'),
      el('button', {
        class: 'switch', role: 'switch', 'aria-checked': String(draft.period),
        'aria-label': 'ประจำเดือนมา',
        onclick: () => { draft.period = !draft.period; render(); },
      }),
    ),
  );

  const symGrid = el('div', { class: 'sym-grid' },
    ...SYMPTOMS.map((s, i) => el('button', {
      class: `sym-chip${draft.symptoms.includes(s.key) ? ' on' : ''}`,
      style: stagger(i, 45, 120),
      onclick: () => {
        draft.symptoms = draft.symptoms.includes(s.key)
          ? draft.symptoms.filter((k) => k !== s.key)
          : [...draft.symptoms, s.key];
        render();
      },
    },
      el('span', { class: 'sym-icon' }, s.icon),
      el('span', { class: 'sym-label' }, s.label),
      el('span', { class: 'sym-check' }, '✓'),
    )),
  );

  const energyCard = card({},
    el('div', { class: 'row' },
      el('div', { class: 'bold grow' }, 'ระดับพลังงาน'),
      el('div', { class: 'muted' }, ENERGY_LABELS[draft.energy]),
    ),
    el('div', { class: 'energy-bars' },
      ...[1, 2, 3, 4, 5].map((i) => el('button', {
        class: `energy-bar${i <= draft.energy ? ' on' : ''}`,
        'aria-label': `พลังงานระดับ ${i}`,
        onclick: () => { draft.energy = draft.energy === i ? 0 : i; render(); },
      })),
    ),
  );

  const noteCard = card({ style: 'padding:6px 16px' },
    el('textarea', {
      class: 'note-input', rows: 2, value: draft.note,
      placeholder: '📝 จดโน้ตเพิ่ม… เช่น "ปวดท้องนิดหน่อยช่วงบ่าย"',
      oninput: (e) => { draft.note = e.target.value; },
    }),
  );

  return el('div', { class: 'overlay' },
    el('div', { class: 'overlay-inner' },
      el('div', { class: 'overlay-bar' },
        el('button', { class: 'icon-btn', 'aria-label': 'ปิด', onclick: closeOverlay }, '✕'),
        el('div', { class: 'ob-title' }, fullDate(day)),
      ),
      el('div', { class: 'page-title' }, isToday ? 'วันนี้รู้สึกยังไง?' : 'วันนั้นรู้สึกยังไง?'),
      el('div', { style: 'height:12px' }),
      periodCard,
      el('div', { style: 'height:14px' }),
      symGrid,
      el('div', { style: 'height:14px' }),
      energyCard,
      el('div', { style: 'height:14px' }),
      noteCard,
      el('button', { class: 'filled-btn', onclick: () => saveLog(day) }, 'บันทึก'),
    ),
  );
}

async function saveLog(day) {
  putLog(day, ui.draft);
  const fairy = ui.draft.period ? '🧚‍♀️💗' : '🧚‍♀️';
  closeOverlay();
  await celebrate(fairy, 'บันทึกแล้ว 🌼');
  render();
}

/** ป๊อปอัปฉลองสั้น ๆ หลังกดบันทึก (แทน celebrate() ของแอป Flutter) */
function celebrate(fairy, text) {
  return new Promise((resolve) => {
    const node = el('div', { class: 'celebrate' },
      el('div', { class: 'celebrate-box' },
        el('div', { class: 'celebrate-fairy' }, fairy),
        el('div', { class: 'celebrate-text' }, text),
      ),
    );
    document.body.append(node);
    setTimeout(() => { node.remove(); resolve(); }, 1100);
  });
}

/* ═══════════════════════════ หน้าเคล็ดลับ (ซ้อนทับ) ═══════════════════════════ */

function viewTips() {
  const blocks = [];

  for (const phase of PHASES) {
    blocks.push(el('div', { class: 'phase-head' }, phaseNames[phase]));

    for (const [i, raw] of tipsByPhase[phase].entries()) {
      const tip = asTip(raw);
      const key = `${phase}-${i}`;
      const open = ui.openTip === key;

      blocks.push(el('button', {
        class: 'card tip-item',
        style: `margin-top:${i ? 10 : 0}px`,
        onclick: () => { ui.openTip = open ? null : key; render(); },
      },
        el('div', { class: 'row' },
          el('span', { class: 'ti-icon' }, tip.icon),
          el('div', { class: 'grow' },
            el('div', { class: 'ti-title' }, tip.title),
            el('div', { class: 'ti-sum' }, tip.summary),
          ),
          el('span', { class: 'chevron' }, open ? '⌃' : '⌄'),
        ),
        open && el('div', {},
          el('hr', { class: 'divider', style: 'margin:10px 0' }),
          el('p', { class: 'tip-detail' }, tip.detail),
          el('div', { class: 'tip-source' }, `ที่มา: ${tip.source}`),
        ),
      ));
    }
  }

  return el('div', { class: 'overlay' },
    el('div', { class: 'overlay-inner' },
      el('div', { class: 'overlay-bar' },
        el('button', { class: 'icon-btn', 'aria-label': 'ปิด', onclick: closeOverlay }, '✕'),
        el('div', { class: 'ob-title bold', style: 'color:var(--ink);font-weight:800' },
          'เคล็ดลับดูแลตัวเอง'),
      ),
      el('p', { class: 'muted' },
        'ข้อมูลทั่วไปเพื่อการดูแลตัวเอง ไม่ใช่คำแนะนำทางการแพทย์ หากมีข้อกังวลควรปรึกษาแพทย์'),
      ...blocks,
    ),
  );
}

/* ═══════════════════════════ แถบนำทาง + ปุ่ม + ═══════════════════════════ */

function tabbar() {
  const tabs = [
    ['home', '🌼', 'วันนี้'],
    ['calendar', '📅', 'ปฏิทิน'],
    null, // ปุ่ม + ตรงกลาง
    ['stats', '📊', 'สถิติ'],
    ['me', '💗', 'ฉัน'],
  ];

  return el('nav', { class: 'tabbar' },
    ...tabs.map((t) => t === null
      ? el('button', {
        class: 'fab', 'aria-label': 'บันทึกวันนี้',
        onclick: () => openOverlay({ kind: 'log', day: today() }),
      }, '+')
      : el('button', {
        class: `tab${ui.tab === t[0] ? ' on' : ''}`,
        onclick: () => { ui.tab = t[0]; render(); },
      },
        el('span', { class: 't-ico' }, t[1]),
        el('span', {}, t[2]),
      )),
  );
}

/* ═══════════════════════════════ หน้าซ้อนทับ ═══════════════════════════════ */

function openOverlay(o) {
  ui.overlay = o;
  if (o.kind === 'log') ui.draft = dayOf(o.day);
  if (o.kind === 'tips') ui.openTip = null;
  document.body.style.overflow = 'hidden';
  render();
}

function closeOverlay() {
  ui.overlay = null;
  ui.draft = null;
  document.body.style.overflow = '';
  render();
}

/* ═══════════════════════════════ Toast ═══════════════════════════════ */

function toast(msg) {
  document.querySelectorAll('.toast').forEach((t) => t.remove());
  const node = el('div', { class: 'toast' }, msg);
  document.body.append(node);
  requestAnimationFrame(() => node.classList.add('show'));
  setTimeout(() => {
    node.classList.remove('show');
    setTimeout(() => node.remove(), 300);
  }, 2600);
}

/* ═══════════════════════════════ วาดทั้งหน้า ═══════════════════════════════ */

function render() {
  const root = $('#app');
  const scroll = window.scrollY;

  const body =
    ui.tab === 'home' ? viewHome()
      : ui.tab === 'calendar' ? viewCalendar()
        : ui.tab === 'stats' ? viewStats()
          : viewMe();

  root.replaceChildren(body, tabbar());

  // หน้าซ้อนอยู่นอก #app เพื่อไม่ให้ถูกวาดทับ
  document.querySelectorAll('.overlay').forEach((o) => o.remove());
  if (ui.overlay?.kind === 'log') document.body.append(viewLog(ui.overlay.day));
  if (ui.overlay?.kind === 'tips') document.body.append(viewTips());

  if (!ui.overlay) window.scrollTo(0, scroll);
}

/* ═══════════════════════════════ เริ่มทำงาน ═══════════════════════════════ */

function boot() {
  render();

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && ui.overlay) closeOverlay();
  });

  // แท็บอื่นแก้ข้อมูล → วาดใหม่ตาม
  window.addEventListener('storage', render);

  // ใช้งานออฟไลน์ (เฉพาะเมื่อเสิร์ฟผ่าน http/https)
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* ออฟไลน์ไม่ได้ก็ยังใช้แอปได้ */ });
  }
}

subscribe(() => { /* ผู้เรียกสั่ง render() เองหลังแก้ข้อมูล */ });

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
