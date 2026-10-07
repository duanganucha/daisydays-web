/**
 * app.js — UI ทั้งหมด วานิลลา JS ไม่มี framework ไม่มี build step
 *
 * โครงหน้า: 4 แท็บ (วันนี้ / ปฏิทิน / สถิติ / ฉัน)
 * + ปุ่ม + กลางแถบที่เปิดหน้าบันทึก และหน้าเคล็ดลับซ้อนทับ
 *
 * ไฟล์นี้ต้องไม่มีข้อความที่ผู้ใช้อ่านฝังอยู่ — เรียกผ่าน t() / raw() เท่านั้น
 * และต้องไม่คำนวณรอบเดือนเอง ให้เรียกจาก cycle.js
 */

import {
  getState, getSettings, setSettings, subscribe,
  dayOf, putLog, isEmptyLog, loggedDayCount,
  exportJSON, importJSON, replaceAllLogs, eraseAll,
  today, addDays, daysBetween,
} from './store.js';

import { engine, monthInfo, demoLogs, DEMO_CYCLE_LENGTHS } from './cycle.js';

import {
  PHASES, SYMPTOMS, symptomOf, SYMPTOMS_OFF_CHART,
  ENERGY_MAX, LIMITS, PATTERN_MIN_DAYS,
} from './data.js';

import {
  t, raw, setLocale, getLocale, localeList,
  phaseName, phaseShort, phaseTip, symptomLabel, energyLabel, adviceFor,
  tipsFor, tipOfDay, tipCount, dowHeaders,
  formatFull, formatShort, formatMonthYear,
} from './i18n.js';

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

/* ──────────────────────────────── สถานะ UI ──────────────────────────────── */

const now = new Date();

const ui = {
  tab: 'home',        // home | calendar | stats | me
  month: now.getMonth(),
  year: now.getFullYear(),
  overlay: null,      // null | { kind:'log', day } | { kind:'tips' }
  openTip: null,      // คีย์เคล็ดลับที่กางอยู่
  draft: null,        // บันทึกที่กำลังแก้ ยังไม่กดบันทึก
};

/* ───────────────────────── ส่วนประกอบที่ใช้ซ้ำ ───────────────────────── */

function card(attrs, ...children) {
  const cls = ['card', attrs.class].filter(Boolean).join(' ');
  return el('section', { ...attrs, class: cls }, ...children);
}

function cycleRing(day, length) {
  return el('div', { class: 'ring', style: `--p:${Math.min(1, day / length)}` },
    el('div', { class: 'ring-inner' },
      el('div', { class: 'ring-cap' }, t('ringCap')),
      el('div', { class: 'ring-day' }, day),
      el('div', { class: 'ring-sub' }, t('ringSub', { n: length })),
    ),
  );
}

function fairyCard(text, fairy = '🧚‍♀️') {
  return card({},
    el('div', { class: 'empty-row' },
      el('span', { class: 'empty-fairy' }, fairy),
      el('p', { class: 'grow', style: 'white-space:pre-line' }, text),
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
  const greet = hour < 12 ? t('greetMorning') : hour < 17 ? t('greetAfternoon') : t('greetEvening');

  const hero = el('div', { class: 'hero' },
    el('div', { class: 'hero-top' },
      el('div', { class: 'hero-greet' }, [greet, set.name].filter(Boolean).join(' ') + ' 🌼'),
      el('div', { class: 'hero-date' }, formatFull(day)),
    ),
    el('div', { class: 'hero-bubble' }, st ? phaseTip(st.phase) : t('heroNoData')),
    el('div', { class: 'hero-fairy' }, '🧚‍♀️'),
  );

  const statusCard = st === null
    ? fairyCard(t('statusEmpty'))
    : card({},
      el('div', { class: 'row' },
        cycleRing(st.cycleDay, st.cycleLength),
        el('div', { class: 'grow' },
          el('span', { class: 'phase-chip' }, phaseName(st.phase)),
          el('div', { class: 'next-label' }, t('nextPeriod')),
          next && el('div', { class: 'next-days' }, t('inDays', { n: daysBetween(day, next) })),
          next && el('div', { class: 'next-date' }, t('aroundDate', { date: formatShort(next) })),
        ),
      ),
    );

  // สรุปบันทึกวันนี้
  const minis = [];
  if (log.period) minis.push({ icon: '📅', label: t('miniPeriod') });
  for (const k of log.symptoms) {
    const s = symptomOf(k);
    if (s) minis.push({ icon: s.icon, label: symptomLabel(k) });
  }
  if (log.energy > 0) {
    minis.push({ icon: '⚡', label: t('miniEnergy', { n: log.energy, max: ENERGY_MAX }) });
  }

  const todayBlock = isEmptyLog(log)
    ? card({}, el('p', { class: 'muted' }, t('nothingLoggedToday')))
    : el('div', { class: 'minis' },
      ...minis.map((m, i) => el('span', { class: 'mini', style: stagger(i, 90, 300) },
        el('span', { class: 'mini-icon' }, m.icon), m.label)),
    );

  const tip = tipOfDay(st?.phase ?? null, day);
  const tipCard = el('button', { class: 'card tip-card', onclick: () => openOverlay({ kind: 'tips' }) },
    el('div', { class: 'row' },
      el('span', { class: 'tip-drop' }, '💧'),
      el('div', { class: 'grow' },
        el('div', { class: 'bold' }, t('tipOfDay')),
        el('div', { class: 'muted' }, `${tip.title} · ${tip.summary}`),
        el('div', { class: 'tip-more' }, t('seeAllTips')),
      ),
      el('span', { class: 'chevron' }, '›'),
    ),
  );

  return el('div', {},
    hero,
    el('div', { class: 'content' },
      statusCard,
      el('div', { class: 'section-head' },
        el('h2', {}, t('logToday')),
        el('button', {
          class: 'text-btn',
          onclick: () => openOverlay({ kind: 'log', day }),
        }, isEmptyLog(log) ? t('startLogging') : t('edit')),
      ),
      todayBlock,
      el('div', { style: 'height:14px' }),
      tipCard,
    ),
  );
}

/* ═══════════════════════════════ ปฏิทิน ═══════════════════════════════ */

function viewCalendar() {
  const cyc = engine(getState());
  const todayISO = today();
  const { lead, days, dayISO } = monthInfo(ui.year, ui.month);

  const grid = el('div', { class: 'cal-grid' },
    ...dowHeaders().map((h) => el('div', { class: 'cal-dow' }, h)),
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
      'aria-label': formatFull(day),
      onclick: () => openOverlay({ kind: 'log', day }),
    },
      d,
      !isEmptyLog(log) && el('span', { class: 'cal-dot' }),
    ));
  }

  const legend = el('div', { class: 'legend' },
    legendItem('var(--pink)', t('legendPeriod')),
    legendItem('var(--pink2)', t('legendPredicted')),
    legendItem('var(--mint2)', t('legendFertile')),
    legendItem('var(--mint)', t('legendOvulation')),
    legendItem('var(--lav)', t('legendLogged'), true),
  );

  const st = cyc.statusOn(todayISO);
  const says = !st ? t('calSaysNone')
    : st.phase === 'menstrual' ? t('calSaysMenstrual')
      : st.phase === 'ovulation' ? t('calSaysOvulation')
        : st.phase === 'pms' ? t('calSaysPms')
          : t('calSaysDefault', { day: st.cycleDay, len: st.cycleLength });

  return el('div', { class: 'content' },
    el('div', { class: 'page-kicker' }, t('calendarKicker')),
    el('div', { class: 'cal-head' },
      el('div', { class: 'page-title grow' }, formatMonthYear(ui.year, ui.month)),
      el('button', { class: 'icon-btn', 'aria-label': t('prevMonth'), onclick: () => shiftMonth(-1) }, '‹'),
      el('button', { class: 'icon-btn', 'aria-label': t('nextMonth'), onclick: () => shiftMonth(1) }, '›'),
    ),
    card({}, grid, legend),
    el('div', { style: 'height:14px' }),
    fairyCard(says),
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
  const cyc = engine(getState());
  const todayISO = today();

  const rows = SYMPTOMS.filter((s) => !SYMPTOMS_OFF_CHART.includes(s.key));
  const hm = cyc.heatmap(rows.map((s) => s.key), todayISO);
  const best = hm.strongest(SYMPTOMS.filter((s) => s.negative).map((s) => s.key));
  const enough = hm.totalLogged >= PATTERN_MIN_DAYS;

  const lens = cyc.lengths.slice(-6);
  const lo = lens.length ? Math.min(...lens) : 0;
  const hi = lens.length ? Math.max(...lens) : 0;

  const blocks = [];

  if (!enough) {
    blocks.push(fairyCard(t('statsNeedMore', { n: PATTERN_MIN_DAYS })));
  } else {
    blocks.push(card({ style: 'padding:12px 10px' }, heatTable(rows, hm, best)));

    if (best) {
      blocks.push(card({ class: 'grad-pattern' },
        el('div', { class: 'row' },
          el('span', { class: 'empty-fairy' }, '🧚‍♀️'),
          el('div', { class: 'grow' },
            t('patternFound'),
            el('span', { class: 'pink' }, t('patternDetail', {
              symptom: symptomLabel(best.symptom),
              phase: phaseName(best.phase),
              pct: best.pct,
            })),
            el('div', {}, adviceFor(best.symptom)),
          ),
        ),
      ));
    }
  }

  blocks.push(card({},
    el('div', { class: 'row' },
      el('div', { class: 'bold grow' }, t('cycleLengthTitle')),
      el('div', { class: 'muted' }, t('averageDays', { n: cyc.avgLength })),
    ),
    el('div', { style: 'height:12px' }),
    lens.length === 0
      ? el('p', { class: 'muted' }, t('needTwoCycles'))
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
      t('statsKicker', { days: hm.totalLogged, cycles: cyc.starts.length })),
    el('div', { class: 'page-title' }, t('statsTitle')),
    el('div', { style: 'height:12px' }),
    el('div', { class: 'stack' }, ...blocks),
  );
}

/** ตารางความถี่ อาการ × ช่วงรอบ */
function heatTable(rows, hm, best) {
  const head = el('tr', {}, el('th', {}),
    ...PHASES.map((p) => el('th', {
      class: best?.phase === p ? 'hl' : '',
      scope: 'col',
    }, phaseShort(p))));

  const body = rows.map((s, ri) => el('tr', {},
    el('th', { scope: 'row', style: 'font-weight:600' },
      el('div', { class: 'heat-name' },
        el('span', { class: 'ico' }, s.icon),
        el('span', {}, symptomLabel(s.key)),
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
      const label = v === null ? '–' : `${v}%`;
      return el('td', {},
        el('div', {
          class: cls.join(' '),
          style: `background:rgba(242,122,166,${a});${stagger(ci * 3 + ri, 35, 200)}`,
          'aria-label': `${symptomLabel(s.key)} · ${phaseName(p)} · ${label}`,
        }, label),
      );
    }),
  ));

  return el('table', { class: 'heat' }, el('thead', {}, head), el('tbody', {}, ...body));
}

/* ═══════════════════════════════ ฉัน ═══════════════════════════════ */

function viewMe() {
  const set = getSettings();
  const cyc = engine(getState());

  const stepper = (label, key) => {
    const { min, max } = LIMITS[key];
    return el('div', { class: 'stepper' },
      el('span', { class: 'label' }, label),
      el('button', {
        class: 'step-btn', 'aria-label': t('decrease'), disabled: set[key] <= min,
        onclick: () => { setSettings({ [key]: set[key] - 1 }); render(); },
      }, '−'),
      el('span', { class: 'value' }, t('unitDays', { n: set[key] })),
      el('button', {
        class: 'step-btn', 'aria-label': t('increase'), disabled: set[key] >= max,
        onclick: () => { setSettings({ [key]: set[key] + 1 }); render(); },
      }, '+'),
    );
  };

  const fileInput = el('input', {
    type: 'file', accept: 'application/json,.json', class: 'hidden',
    onchange: async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        importJSON(await file.text());
        applyLocale();
        toast(t('importDone'));
      } catch (err) {
        toast(t('importFailed', { msg: err.message }));
      }
      e.target.value = '';
      render();
    },
  });

  return el('div', { class: 'content' },
    el('div', { class: 'me-head' },
      el('span', { class: 'me-logo' }, '🌼'),
      el('div', { class: 'grow' },
        el('div', { class: 'page-title' }, set.name || t('meTitle')),
        el('div', { class: 'muted' },
          t('meSummary', { days: loggedDayCount(), avg: cyc.avgLength })),
      ),
    ),

    card({},
      el('div', { class: 'bold' }, t('nameLabel')),
      el('input', {
        class: 'note-input', type: 'text', value: set.name, maxlength: 20,
        placeholder: t('namePlaceholder'),
        onchange: (e) => { setSettings({ name: e.target.value.trim() }); render(); },
      }),
    ),

    // ตัวเลือกภาษา
    card({},
      el('div', { class: 'bold' }, t('language')),
      el('div', { class: 'chips', style: 'margin-top:8px' },
        ...localeList().map(({ code, name }) => el('button', {
          class: `chip${getLocale() === code ? ' on' : ''}`,
          onclick: () => {
            setSettings({ locale: code });
            setLocale(code);
            render();
          },
        }, name)),
      ),
    ),

    card({ style: 'padding:6px 16px' },
      stepper(t('defaultCycle'), 'cycleLength'),
      el('hr', { class: 'divider' }),
      stepper(t('defaultPeriod'), 'periodLength'),
    ),
    el('p', { class: 'muted', style: 'padding:0 4px' }, t('defaultsNote')),

    card({ style: 'padding:8px' },
      el('button', { class: 'tile', onclick: () => openOverlay({ kind: 'tips' }) },
        el('span', { class: 't-icon' }, '📖'),
        el('div', { class: 'grow' },
          el('div', { class: 't-title' }, t('tipsTitle')),
          el('div', { class: 't-sub' }, t('tipsSub', { n: tipCount(PHASES) })),
        ),
        el('span', { class: 'chevron' }, '›'),
      ),
    ),

    card({ style: 'padding:8px' },
      el('button', { class: 'tile', onclick: doExport },
        el('span', { class: 't-icon' }, '⬇️'),
        el('div', { class: 'grow' },
          el('div', { class: 't-title' }, t('exportTitle')),
          el('div', { class: 't-sub' }, t('exportSub')),
        ),
      ),
      el('hr', { class: 'divider' }),
      el('button', { class: 'tile', onclick: () => fileInput.click() },
        el('span', { class: 't-icon' }, '⬆️'),
        el('div', { class: 'grow' },
          el('div', { class: 't-title' }, t('importTitle')),
          el('div', { class: 't-sub' }, t('importSub')),
        ),
      ),
      fileInput,
    ),

    card({},
      el('div', { class: 'row' },
        el('span', { style: 'font-size:22px' }, '🔒'),
        el('p', { class: 'grow', style: 'font-size:13px' }, t('privacyNote')),
      ),
    ),

    el('div', { style: 'height:16px' }),
    el('button', {
      class: 'outline-btn',
      onclick: () => {
        if (!confirm(t('demoConfirm'))) return;
        replaceAllLogs(demoLogs(today(), getSettings().periodLength));
        ui.tab = 'stats';
        toast(t('demoDone', { n: DEMO_CYCLE_LENGTHS.length }));
        render();
      },
    }, '✨', t('demoBtn', { n: DEMO_CYCLE_LENGTHS.length })),

    el('div', { style: 'height:8px' }),
    el('button', {
      class: 'text-btn danger', style: 'width:100%',
      onclick: () => {
        if (!confirm(t('eraseConfirm'))) return;
        eraseAll();
        applyLocale();
        ui.tab = 'home';
        toast(t('eraseDone'));
        render();
      },
    }, '🗑 ' + t('eraseBtn')),

    el('p', { style: 'text-align:center;margin-top:14px' },
      el('a', {
        href: 'https://github.com/duanganucha/daisydays-web',
        target: '_blank', rel: 'noopener',
      }, t('sourceLink')),
    ),
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
  toast(t('exportDone'));
}

/* ═══════════════════════════ หน้าบันทึก (ซ้อนทับ) ═══════════════════════════ */

function viewLog(day) {
  const draft = ui.draft;
  const isToday = day === today();

  const periodCard = card({ class: draft.period ? 'grad-pink' : '', style: 'padding:14px 16px' },
    el('div', { class: `switch-row ${draft.period ? 'on' : ''}` },
      el('span', { class: 'sw-icon' }, '📅'),
      el('span', { class: 'grow bold' }, t('periodOn')),
      el('button', {
        class: 'switch', role: 'switch', 'aria-checked': String(draft.period),
        'aria-label': t('periodOn'),
        onclick: () => { draft.period = !draft.period; render(); },
      }),
    ),
  );

  const symGrid = el('div', { class: 'sym-grid' },
    ...SYMPTOMS.map((s, i) => {
      const on = draft.symptoms.includes(s.key);
      return el('button', {
        class: `sym-chip${on ? ' on' : ''}`,
        style: stagger(i, 45, 120),
        'aria-pressed': String(on),
        onclick: () => {
          draft.symptoms = on
            ? draft.symptoms.filter((k) => k !== s.key)
            : [...draft.symptoms, s.key];
          render();
        },
      },
        el('span', { class: 'sym-icon' }, s.icon),
        el('span', { class: 'sym-label' }, symptomLabel(s.key)),
        el('span', { class: 'sym-check' }, '✓'),
      );
    }),
  );

  const energyCard = card({},
    el('div', { class: 'row' },
      el('div', { class: 'bold grow' }, t('energyLevel')),
      el('div', { class: 'muted' }, energyLabel(draft.energy)),
    ),
    el('div', { class: 'energy-bars' },
      ...Array.from({ length: ENERGY_MAX }, (_, idx) => {
        const i = idx + 1;
        return el('button', {
          class: `energy-bar${i <= draft.energy ? ' on' : ''}`,
          'aria-label': t('energyAria', { n: i }),
          'aria-pressed': String(i <= draft.energy),
          onclick: () => { draft.energy = draft.energy === i ? 0 : i; render(); },
        });
      }),
    ),
  );

  const noteCard = card({ style: 'padding:6px 16px' },
    el('textarea', {
      class: 'note-input', rows: 2, value: draft.note,
      placeholder: t('notePlaceholder'),
      'aria-label': t('notePlaceholder'),
      oninput: (e) => { draft.note = e.target.value; },
    }),
  );

  return el('div', { class: 'overlay' },
    el('div', { class: 'overlay-inner' },
      el('div', { class: 'overlay-bar' },
        el('button', { class: 'icon-btn', 'aria-label': t('close'), onclick: closeOverlay }, '✕'),
        el('div', { class: 'ob-title' }, formatFull(day)),
      ),
      el('div', { class: 'page-title' }, isToday ? t('howToday') : t('howThatDay')),
      el('div', { style: 'height:12px' }),
      periodCard,
      el('div', { style: 'height:14px' }),
      symGrid,
      el('div', { style: 'height:14px' }),
      energyCard,
      el('div', { style: 'height:14px' }),
      noteCard,
      el('button', { class: 'filled-btn', onclick: () => saveLog(day) }, t('save')),
    ),
  );
}

async function saveLog(day) {
  const wasPeriod = ui.draft.period;
  putLog(day, ui.draft);
  closeOverlay();
  await celebrate(wasPeriod ? '🧚‍♀️💗' : '🧚‍♀️', t('saved'));
  render();
}

/** ป๊อปอัปฉลองสั้น ๆ หลังกดบันทึก */
function celebrate(fairy, text) {
  return new Promise((resolve) => {
    const node = el('div', { class: 'celebrate', role: 'status' },
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
    blocks.push(el('div', { class: 'phase-head' }, phaseName(phase)));

    tipsFor(phase).forEach((tip, i) => {
      const key = `${phase}-${i}`;
      const open = ui.openTip === key;

      blocks.push(el('button', {
        class: 'card tip-item',
        style: `margin-top:${i ? 10 : 0}px`,
        'aria-expanded': String(open),
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
          el('div', { class: 'tip-source' }, t('tipSource', { source: tip.source })),
        ),
      ));
    });
  }

  return el('div', { class: 'overlay' },
    el('div', { class: 'overlay-inner' },
      el('div', { class: 'overlay-bar' },
        el('button', { class: 'icon-btn', 'aria-label': t('close'), onclick: closeOverlay }, '✕'),
        el('div', { class: 'ob-title', style: 'color:var(--ink);font-weight:800' }, t('tipsTitle')),
      ),
      el('p', { class: 'muted' }, t('tipsDisclaimer')),
      ...blocks,
    ),
  );
}

/* ═══════════════════════════ แถบนำทาง + ปุ่ม + ═══════════════════════════ */

function tabbar() {
  const tabs = [
    ['home', '🌼', t('tabHome')],
    ['calendar', '📅', t('tabCalendar')],
    null, // ปุ่ม + ตรงกลาง
    ['stats', '📊', t('tabStats')],
    ['me', '💗', t('tabMe')],
  ];

  return el('nav', { class: 'tabbar' },
    ...tabs.map((tab) => tab === null
      ? el('button', {
        class: 'fab', 'aria-label': t('fabLabel'),
        onclick: () => openOverlay({ kind: 'log', day: today() }),
      }, '+')
      : el('button', {
        class: `tab${ui.tab === tab[0] ? ' on' : ''}`,
        'aria-current': ui.tab === tab[0] ? 'page' : null,
        onclick: () => { ui.tab = tab[0]; render(); },
      },
        el('span', { class: 't-ico' }, tab[1]),
        el('span', {}, tab[2]),
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
  document.querySelectorAll('.toast').forEach((n) => n.remove());
  const node = el('div', { class: 'toast', role: 'status', 'aria-live': 'polite' }, msg);
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

/** ตั้งภาษาตามค่าที่บันทึกไว้ ถ้ายังไม่เคยเลือกให้เดาจากภาษาเบราว์เซอร์ */
function applyLocale() {
  const saved = getSettings().locale;
  const codes = localeList().map((l) => l.code);
  const guess = (navigator.languages || [navigator.language || ''])
    .map((l) => String(l).slice(0, 2).toLowerCase())
    .find((c) => codes.includes(c));
  setLocale(codes.includes(saved) ? saved : (guess || 'th'));
}

function boot() {
  applyLocale();
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
