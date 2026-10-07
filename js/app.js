/**
 * app.js — ประกอบ UI ทั้งหมด
 * วานิลลา JS ไม่มี framework ไม่มี build step — เปิดไฟล์ index.html ก็รันได้เลย
 */

import {
  getState, setSetting, subscribe, togglePeriodDay, isPeriodDay,
  getLog, setLog, toggleSymptom, exportJSON, importJSON, eraseAll,
  today, iso, addDays, daysBetween,
} from './store.js';

import {
  stats, cycleDay, predictedPeriodDays, fertileDays, ovulationDays,
  daysUntilNext, currentPhase, topSymptoms, recentCycles, monthGrid,
} from './cycle.js';

import { t, setLang, getLang, formatLong, formatMonth, SYMPTOMS, MOODS, FLOWS } from './i18n.js';

/* ───────────────────────────── ตัวช่วยสร้าง DOM ───────────────────────────── */

/** สร้าง element: el('div', { class:'x', onclick:fn }, ...children) */
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
}

const $ = (sel) => document.querySelector(sel);

/* ──────────────────────────────── สถานะ UI ──────────────────────────────── */

const ui = {
  view: 'calendar',               // calendar | insights | settings
  month: new Date().getMonth(),
  year: new Date().getFullYear(),
  sheetDay: null,                 // วันที่เปิดแผ่นบันทึกอยู่
};

/* ─────────────────────────── แถบสถานะด้านบน ─────────────────────────── */

function renderHero() {
  const st = getState();
  const s = stats(st);
  const phase = currentPhase(st);

  let headline;
  let sub = t(`phase_${phase}`);

  if (!s.lastStart) {
    headline = t('noDataYet');
    sub = t('noDataHint');
  } else if (phase === 'period') {
    headline = t('onPeriod', { n: cycleDay(st) });
  } else {
    const n = daysUntilNext(st);
    if (n === null) headline = t('noDataYet');
    else if (n > 0) headline = t('dueIn', { n });
    else if (n === 0) headline = t('dueToday');
    else headline = t('overdue', { n: Math.abs(n) });
  }

  const ring = s.lastStart
    ? Math.min(1, (cycleDay(st) || 1) / Math.max(s.avgCycle, 1))
    : 0;

  return el('header', { class: 'hero', dataset: { phase } },
    el('div', { class: 'hero-ring', style: `--p:${ring}` },
      el('span', { class: 'hero-ring-day' }, s.lastStart ? cycleDay(st) : '—'),
    ),
    el('div', { class: 'hero-text' },
      el('h1', {}, headline),
      el('p', {}, sub),
      s.lastStart && el('p', { class: 'hero-meta' },
        `${t('avgCycle')} ${s.avgCycle} ${t('days')}`,
        s.variation !== null ? ` · ${t('plusMinus', { n: s.variation })}` : '',
      ),
    ),
  );
}

/* ──────────────────────────────── ปฏิทิน ──────────────────────────────── */

function renderCalendar() {
  const st = getState();
  const predicted = predictedPeriodDays(st);
  const fertile = fertileDays(st);
  const ovulation = ovulationDays(st);
  const now = today();

  const weeks = monthGrid(ui.year, ui.month);

  const head = el('div', { class: 'cal-head' },
    el('button', {
      class: 'icon-btn', 'aria-label': t('prevMonth'),
      onclick: () => { shiftMonth(-1); },
    }, '‹'),
    el('div', { class: 'cal-title' }, formatMonth(ui.year, ui.month)),
    el('button', {
      class: 'icon-btn', 'aria-label': t('nextMonth'),
      onclick: () => { shiftMonth(1); },
    }, '›'),
  );

  const dow = el('div', { class: 'cal-dow' },
    ...t('weekdays').map((d) => el('span', {}, d)),
  );

  const grid = el('div', { class: 'cal-grid' });
  for (const week of weeks) {
    for (const day of week) {
      if (!day) { grid.append(el('span', { class: 'cal-cell empty' })); continue; }

      const classes = ['cal-cell'];
      if (isPeriodDay(day)) classes.push('is-period');
      else if (predicted.has(day)) classes.push('is-predicted');
      if (fertile.has(day)) classes.push('is-fertile');
      if (ovulation.has(day)) classes.push('is-ovulation');
      if (day === now) classes.push('is-today');
      if (day > now) classes.push('is-future');

      const log = getLog(day);
      const hasLog = log.flow || log.mood || log.note || log.symptoms.length;

      grid.append(el('button', {
        class: classes.join(' '),
        dataset: { day },
        'aria-label': formatLong(day),
        onclick: () => openSheet(day),
      },
        el('span', { class: 'cal-num' }, Number(day.slice(8))),
        hasLog ? el('span', { class: 'cal-dot' }) : null,
      ));
    }
  }

  const legend = el('div', { class: 'legend' },
    legendItem('period', t('legendPeriod')),
    legendItem('predicted', t('legendPredicted')),
    legendItem('fertile', t('legendFertile')),
    legendItem('logged', t('legendLogged')),
  );

  const jump = el('button', {
    class: 'ghost-btn',
    onclick: () => {
      const d = new Date();
      ui.month = d.getMonth();
      ui.year = d.getFullYear();
      render();
    },
  }, t('jumpToday'));

  return el('section', { class: 'card' }, head, dow, grid, legend, jump);
}

function legendItem(kind, label) {
  return el('span', { class: 'legend-item' },
    el('i', { class: `swatch sw-${kind}` }), label);
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

/* ───────────────────────── แผ่นบันทึกรายวัน (bottom sheet) ───────────────────────── */

function openSheet(day) {
  ui.sheetDay = day;
  render();
  requestAnimationFrame(() => $('.sheet')?.classList.add('open'));
}

function closeSheet() {
  const sheet = $('.sheet');
  if (!sheet) return;
  sheet.classList.remove('open');
  ui.sheetDay = null;
  setTimeout(render, 160);
}

function renderSheet() {
  const day = ui.sheetDay;
  if (!day) return null;

  const log = getLog(day);
  const onPeriod = isPeriodDay(day);

  const chips = (items, selected, onPick, prefix) =>
    el('div', { class: 'chips' },
      ...items.map((key) => el('button', {
        class: 'chip' + (selected(key) ? ' on' : ''),
        onclick: () => onPick(key),
      }, t(prefix + key))),
    );

  return el('div', { class: 'sheet-wrap', onclick: (e) => { if (e.target.classList.contains('sheet-wrap')) closeSheet(); } },
    el('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true' },
      el('div', { class: 'sheet-grip' }),
      el('div', { class: 'sheet-head' },
        el('h2', {}, formatLong(day)),
        el('button', { class: 'icon-btn', 'aria-label': t('close'), onclick: closeSheet }, '✕'),
      ),

      el('button', {
        class: 'period-btn' + (onPeriod ? ' on' : ''),
        onclick: () => { togglePeriodDay(day); render(); },
      }, onPeriod ? t('unmarkPeriod') : t('markPeriod')),

      el('h3', {}, t('flow')),
      chips(FLOWS, (k) => log.flow === k,
        (k) => { setLog(day, { flow: log.flow === k ? null : k }); render(); }, 'flow_'),

      el('h3', {}, t('mood')),
      chips(MOODS, (k) => log.mood === k,
        (k) => { setLog(day, { mood: log.mood === k ? null : k }); render(); }, 'mood_'),

      el('h3', {}, t('symptoms')),
      chips(SYMPTOMS, (k) => log.symptoms.includes(k),
        (k) => { toggleSymptom(day, k); render(); }, 'sym_'),

      el('h3', {}, t('note')),
      el('textarea', {
        class: 'note', rows: 3, placeholder: t('notePlaceholder'),
        oninput: (e) => setLog(day, { note: e.target.value }),
      }, log.note || ''),

      el('button', {
        class: 'ghost-btn danger',
        onclick: () => { setLog(day, { flow: null, mood: null, symptoms: [], note: '' }); render(); },
      }, t('clearDay')),
    ),
  );
}

/* ──────────────────────────────── สถิติ ──────────────────────────────── */

function renderInsights() {
  const st = getState();
  const s = stats(st);

  if (s.confidence === 'none' && s.periodsLogged < 2) {
    return el('section', { class: 'card empty-state' },
      el('p', {}, t('needMore')),
    );
  }

  const stat = (label, value, hint) => el('div', { class: 'stat' },
    el('span', { class: 'stat-label' }, label),
    el('strong', { class: 'stat-value' }, value),
    hint ? el('span', { class: 'stat-hint' }, hint) : null,
  );

  const cycles = recentCycles(st);
  const max = cycles.length ? Math.max(...cycles.map((c) => c.length)) : 1;

  const chart = el('div', { class: 'chart' },
    ...cycles.map((c) => el('div', { class: 'bar-wrap', title: `${formatLong(c.start)} · ${c.length} ${t('days')}` },
      el('div', { class: 'bar', style: `--h:${(c.length / max) * 100}%` },
        el('span', { class: 'bar-val' }, c.length),
      ),
      el('span', { class: 'bar-label' }, c.start.slice(5).replace('-', '/')),
    )),
  );

  const syms = topSymptoms(st);
  const symMax = syms.length ? syms[0].times : 1;

  return el('div', {},
    el('section', { class: 'card' },
      el('h2', {}, t('insightsTitle')),
      el('div', { class: 'stats' },
        stat(t('avgCycle'), `${s.avgCycle} ${t('days')}`,
          s.variation !== null ? t('plusMinus', { n: s.variation }) : null),
        stat(t('avgPeriod'), `${s.avgPeriod} ${t('days')}`),
        stat(t('range'), s.shortest ? `${s.shortest}–${s.longest}` : '—'),
        stat(t('cyclesTracked'), s.cyclesTracked),
      ),
      el('p', { class: 'badge ' + (s.regular === false ? 'warn' : 'good') },
        s.regular === null ? t(`conf_${s.confidence}`) : s.regular ? t('regular') : t('irregular')),
      el('p', { class: 'muted' }, `${t('confidence')}: ${t(`conf_${s.confidence}`)}`),
    ),

    cycles.length > 0 && el('section', { class: 'card' },
      el('h2', {}, t('historyTitle')), chart),

    syms.length > 0 && el('section', { class: 'card' },
      el('h2', {}, t('topSymptomsTitle')),
      el('ul', { class: 'sym-list' },
        ...syms.map((x) => el('li', {},
          el('span', {}, t('sym_' + x.key)),
          el('span', { class: 'sym-bar', style: `--w:${(x.times / symMax) * 100}%` }),
          el('span', { class: 'muted' }, t('times', { n: x.times })),
        )),
      ),
    ),
  );
}

/* ──────────────────────────────── ตั้งค่า ──────────────────────────────── */

function toast(msg) {
  const node = el('div', { class: 'toast' }, msg);
  document.body.append(node);
  requestAnimationFrame(() => node.classList.add('show'));
  setTimeout(() => { node.classList.remove('show'); setTimeout(() => node.remove(), 300); }, 2600);
}

function renderSettings() {
  const st = getState();
  const set = st.settings;

  const radioRow = (label, key, options, labelFor) => el('div', { class: 'field' },
    el('span', { class: 'field-label' }, label),
    el('div', { class: 'chips' },
      ...options.map((o) => el('button', {
        class: 'chip' + (set[key] === o ? ' on' : ''),
        onclick: () => {
          setSetting(key, o);
          if (key === 'lang') setLang(o);
          if (key === 'theme') applyTheme(o);
          render();
        },
      }, labelFor(o))),
    ),
  );

  const numberRow = (label, key, min, max) => el('label', { class: 'field' },
    el('span', { class: 'field-label' }, label),
    el('input', {
      type: 'number', min, max, value: set[key], class: 'num',
      onchange: (e) => {
        const v = Math.max(min, Math.min(max, Number(e.target.value) || min));
        setSetting(key, v);
        render();
      },
    }),
  );

  const fileInput = el('input', {
    type: 'file', accept: 'application/json', class: 'hidden',
    onchange: async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        importJSON(await file.text());
        toast(t('imported'));
      } catch (err) {
        toast(t('importFailed', { msg: err.message }));
      }
      e.target.value = '';
      render();
    },
  });

  return el('div', {},
    el('section', { class: 'card' },
      radioRow(t('language'), 'lang', ['th', 'en'], (o) => (o === 'th' ? 'ไทย' : 'English')),
      radioRow(t('theme'), 'theme', ['auto', 'light', 'dark'], (o) => t(`theme_${o}`)),
    ),

    el('section', { class: 'card' },
      el('h2', {}, t('defaults')),
      el('p', { class: 'muted' }, t('defaultsHint')),
      numberRow(t('cycleLengthLabel'), 'cycleLength', 15, 90),
      numberRow(t('periodLengthLabel'), 'periodLength', 1, 15),
    ),

    el('section', { class: 'card' },
      el('h2', {}, t('dataTitle')),
      el('p', { class: 'muted' }, t('dataHint')),
      el('div', { class: 'btn-row' },
        el('button', { class: 'ghost-btn', onclick: doExport }, t('exportBtn')),
        el('button', { class: 'ghost-btn', onclick: () => fileInput.click() }, t('importBtn')),
      ),
      fileInput,
      el('button', {
        class: 'ghost-btn danger',
        onclick: () => {
          if (confirm(t('eraseConfirm'))) { eraseAll(); toast(t('erased')); render(); }
        },
      }, t('eraseBtn')),
    ),

    el('section', { class: 'card' },
      el('h2', {}, t('aboutTitle')),
      el('p', {}, t('privacyNote')),
      el('p', {},
        el('a', {
          href: 'https://github.com/duanganucha/daisydays-web',
          target: '_blank', rel: 'noopener',
        }, t('sourceLink')),
      ),
      el('p', { class: 'disclaimer' }, t('disclaimer')),
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
}

/* ──────────────────────────── แถบนำทางล่าง ──────────────────────────── */

function renderNav() {
  const tabs = [
    ['calendar', t('navCalendar'), '📅'],
    ['insights', t('navInsights'), '📊'],
    ['settings', t('navSettings'), '⚙️'],
  ];
  return el('nav', { class: 'tabbar' },
    ...tabs.map(([key, label, icon]) => el('button', {
      class: 'tab' + (ui.view === key ? ' on' : ''),
      onclick: () => { ui.view = key; render(); },
    }, el('span', { class: 'tab-icon' }, icon), el('span', {}, label))),
  );
}

/* ──────────────────────────────── ธีม ──────────────────────────────── */

function applyTheme(mode) {
  const root = document.documentElement;
  if (mode === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', mode);
}

/* ──────────────────────────────── วาดทั้งหน้า ──────────────────────────────── */

function render() {
  const root = $('#app');
  const scroll = root.scrollTop;

  const body =
    ui.view === 'calendar' ? renderCalendar()
      : ui.view === 'insights' ? renderInsights()
        : renderSettings();

  root.replaceChildren(
    ui.view === 'calendar' ? renderHero() : el('header', { class: 'hero slim' },
      el('h1', {}, ui.view === 'insights' ? t('insightsTitle') : t('navSettings'))),
    el('main', { class: 'content' }, body),
    renderNav(),
    renderSheet(),
  );

  root.scrollTop = scroll;
}

/* ──────────────────────────────── เริ่มทำงาน ──────────────────────────────── */

function boot() {
  const set = getState().settings;
  setLang(set.lang);
  applyTheme(set.theme);
  render();

  // ปิดแผ่นบันทึกด้วย Esc
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && ui.sheetDay) closeSheet();
  });

  // เปลี่ยนแท็บ/หน้าต่างอื่นแก้ข้อมูล → ซิงก์ตาม
  window.addEventListener('storage', () => render());

  // Service worker สำหรับใช้งานออฟไลน์ (เฉพาะเมื่อเสิร์ฟผ่าน http/https)
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* ออฟไลน์ไม่ได้ก็ยังใช้แอปได้ */ });
  }
}

subscribe(() => { /* ข้อมูลเปลี่ยนแล้ว — ผู้เรียกจะสั่ง render() เอง */ });

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
