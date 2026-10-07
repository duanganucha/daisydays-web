/**
 * i18n.js — ข้อความไทย/อังกฤษ และตัวช่วยจัดรูปแบบวันที่
 * ภาษาไทยเป็นภาษาหลัก
 */

import { parseISO } from './store.js';

export const SYMPTOMS = [
  'cramps', 'headache', 'bloating', 'backache', 'tender', 'acne',
  'nausea', 'fatigue', 'insomnia', 'craving', 'dizzy', 'discharge',
];

export const MOODS = ['happy', 'calm', 'tired', 'irritable', 'sad', 'anxious'];
export const FLOWS = ['spotting', 'light', 'medium', 'heavy'];

const STR = {
  th: {
    appName: 'Daisy Days',
    tagline: 'บันทึกรอบเดือนแบบออฟไลน์ ข้อมูลอยู่ในเครื่องคุณเท่านั้น',

    navCalendar: 'ปฏิทิน',
    navToday: 'บันทึก',
    navInsights: 'สถิติ',
    navSettings: 'ตั้งค่า',

    // สถานะวันนี้
    cycleDay: 'วันที่ {n} ของรอบ',
    noDataYet: 'ยังไม่มีข้อมูล',
    noDataHint: 'กดวันที่ในปฏิทินเพื่อบันทึกวันแรกที่ประจำเดือนมา แล้วแอปจะเริ่มคาดการณ์ให้',
    dueIn: 'อีก {n} วันประจำเดือนจะมา',
    dueToday: 'คาดว่าประจำเดือนจะมาวันนี้',
    overdue: 'เลยกำหนดมา {n} วัน',
    onPeriod: 'กำลังมีประจำเดือน วันที่ {n}',

    phase_period: 'ช่วงมีประจำเดือน',
    phase_follicular: 'ช่วงก่อนไข่ตก',
    phase_fertile: 'ช่วงเจริญพันธุ์',
    phase_luteal: 'ช่วงหลังไข่ตก',
    phase_late: 'เลยกำหนด',
    phase_unknown: 'ยังประเมินไม่ได้',

    // ปฏิทิน
    weekdays: ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'],
    months: ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'],
    prevMonth: 'เดือนก่อน',
    nextMonth: 'เดือนถัดไป',
    jumpToday: 'วันนี้',
    legendPeriod: 'มีประจำเดือน',
    legendPredicted: 'คาดการณ์',
    legendFertile: 'เจริญพันธุ์',
    legendLogged: 'มีบันทึก',

    // แผ่นบันทึก
    markPeriod: 'มีประจำเดือนวันนี้',
    unmarkPeriod: 'ยกเลิกวันมีประจำเดือน',
    flow: 'ปริมาณ',
    flow_spotting: 'กระปริดกระปรอย',
    flow_light: 'น้อย',
    flow_medium: 'ปกติ',
    flow_heavy: 'มาก',
    mood: 'อารมณ์',
    mood_happy: 'สดใส',
    mood_calm: 'สงบ',
    mood_tired: 'เพลีย',
    mood_irritable: 'หงุดหงิด',
    mood_sad: 'เศร้า',
    mood_anxious: 'กังวล',
    symptoms: 'อาการ',
    sym_cramps: 'ปวดท้องน้อย',
    sym_headache: 'ปวดหัว',
    sym_bloating: 'ท้องอืด',
    sym_backache: 'ปวดหลัง',
    sym_tender: 'เจ็บเต้านม',
    sym_acne: 'สิวขึ้น',
    sym_nausea: 'คลื่นไส้',
    sym_fatigue: 'อ่อนเพลีย',
    sym_insomnia: 'นอนไม่หลับ',
    sym_craving: 'อยากของหวาน',
    sym_dizzy: 'เวียนหัว',
    sym_discharge: 'ตกขาว',
    note: 'โน้ต',
    notePlaceholder: 'อยากจดอะไรเพิ่ม...',
    close: 'ปิด',
    clearDay: 'ลบบันทึกวันนี้',

    // สถิติ
    insightsTitle: 'สถิติของคุณ',
    avgCycle: 'รอบเฉลี่ย',
    avgPeriod: 'ประจำเดือนเฉลี่ย',
    variation: 'ความแปรปรวน',
    range: 'สั้นสุด–ยาวสุด',
    cyclesTracked: 'รอบที่บันทึกแล้ว',
    days: 'วัน',
    plusMinus: '± {n} วัน',
    regular: 'รอบค่อนข้างสม่ำเสมอ',
    irregular: 'รอบยังไม่สม่ำเสมอ',
    confidence: 'ความแม่นของการคาดการณ์',
    conf_none: 'ยังคาดการณ์ไม่ได้',
    conf_low: 'ต่ำ — ต้องการข้อมูลอีก 2-3 รอบ',
    conf_medium: 'พอใช้',
    conf_high: 'ดี',
    historyTitle: 'ความยาวรอบย้อนหลัง',
    topSymptomsTitle: 'อาการที่พบบ่อย',
    times: '{n} ครั้ง',
    needMore: 'บันทึกอีก 2 รอบ แอปจะเริ่มคำนวณสถิติให้',

    // ตั้งค่า
    language: 'ภาษา',
    theme: 'ธีม',
    theme_auto: 'ตามระบบ',
    theme_light: 'สว่าง',
    theme_dark: 'มืด',
    defaults: 'ค่าตั้งต้น',
    defaultsHint: 'ใช้ตอนที่ยังไม่มีข้อมูลจริงมากพอ',
    cycleLengthLabel: 'ความยาวรอบ (วัน)',
    periodLengthLabel: 'ความยาวประจำเดือน (วัน)',
    dataTitle: 'ข้อมูลของคุณ',
    dataHint: 'ข้อมูลเก็บอยู่ในเบราว์เซอร์นี้เท่านั้น ถ้าล้างข้อมูลเบราว์เซอร์หรือเปลี่ยนเครื่อง ข้อมูลจะไม่ตามไป ส่งออกเก็บไว้เป็นระยะได้',
    exportBtn: 'ส่งออกไฟล์สำรอง',
    importBtn: 'นำเข้าไฟล์สำรอง',
    eraseBtn: 'ลบข้อมูลทั้งหมด',
    eraseConfirm: 'ลบข้อมูลทั้งหมดถาวร? กู้คืนไม่ได้นะ',
    imported: 'นำเข้าข้อมูลเรียบร้อย',
    importFailed: 'นำเข้าไม่สำเร็จ: {msg}',
    erased: 'ลบข้อมูลทั้งหมดแล้ว',
    aboutTitle: 'เกี่ยวกับ',
    privacyNote: 'แอปนี้ไม่มีเซิร์ฟเวอร์ ไม่มีบัญชีผู้ใช้ ไม่มีการติดตาม ข้อมูลไม่เคยออกจากเครื่องคุณ',
    sourceLink: 'ดูซอร์สโค้ดบน GitHub',
    disclaimer: 'ไม่ใช่คำแนะนำทางการแพทย์ การคาดการณ์เป็นค่าประมาณจากข้อมูลที่คุณกรอก ใช้คุมกำเนิดไม่ได้ หากมีข้อกังวลด้านสุขภาพ กรุณาปรึกษาแพทย์',
  },

  en: {
    appName: 'Daisy Days',
    tagline: 'Offline period tracking. Your data never leaves your device.',

    navCalendar: 'Calendar',
    navToday: 'Log',
    navInsights: 'Insights',
    navSettings: 'Settings',

    cycleDay: 'Day {n} of your cycle',
    noDataYet: 'No data yet',
    noDataHint: 'Tap a date on the calendar to log your first period day, then predictions begin.',
    dueIn: 'Period expected in {n} days',
    dueToday: 'Period expected today',
    overdue: '{n} days late',
    onPeriod: 'On your period, day {n}',

    phase_period: 'Menstrual phase',
    phase_follicular: 'Follicular phase',
    phase_fertile: 'Fertile window',
    phase_luteal: 'Luteal phase',
    phase_late: 'Late',
    phase_unknown: 'Not enough data',

    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    months: ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'],
    prevMonth: 'Previous month',
    nextMonth: 'Next month',
    jumpToday: 'Today',
    legendPeriod: 'Period',
    legendPredicted: 'Predicted',
    legendFertile: 'Fertile',
    legendLogged: 'Logged',

    markPeriod: 'Period on this day',
    unmarkPeriod: 'Remove period day',
    flow: 'Flow',
    flow_spotting: 'Spotting',
    flow_light: 'Light',
    flow_medium: 'Medium',
    flow_heavy: 'Heavy',
    mood: 'Mood',
    mood_happy: 'Happy',
    mood_calm: 'Calm',
    mood_tired: 'Tired',
    mood_irritable: 'Irritable',
    mood_sad: 'Sad',
    mood_anxious: 'Anxious',
    symptoms: 'Symptoms',
    sym_cramps: 'Cramps',
    sym_headache: 'Headache',
    sym_bloating: 'Bloating',
    sym_backache: 'Backache',
    sym_tender: 'Tender breasts',
    sym_acne: 'Acne',
    sym_nausea: 'Nausea',
    sym_fatigue: 'Fatigue',
    sym_insomnia: 'Insomnia',
    sym_craving: 'Cravings',
    sym_dizzy: 'Dizziness',
    sym_discharge: 'Discharge',
    note: 'Note',
    notePlaceholder: 'Anything else to remember...',
    close: 'Close',
    clearDay: 'Clear this day',

    insightsTitle: 'Your insights',
    avgCycle: 'Average cycle',
    avgPeriod: 'Average period',
    variation: 'Variation',
    range: 'Shortest–longest',
    cyclesTracked: 'Cycles tracked',
    days: 'days',
    plusMinus: '± {n} days',
    regular: 'Fairly regular cycles',
    irregular: 'Cycles still irregular',
    confidence: 'Prediction confidence',
    conf_none: 'Not enough to predict',
    conf_low: 'Low — needs 2-3 more cycles',
    conf_medium: 'Moderate',
    conf_high: 'Good',
    historyTitle: 'Cycle length history',
    topSymptomsTitle: 'Most common symptoms',
    times: '{n}×',
    needMore: 'Log 2 more cycles and insights will appear.',

    language: 'Language',
    theme: 'Theme',
    theme_auto: 'System',
    theme_light: 'Light',
    theme_dark: 'Dark',
    defaults: 'Defaults',
    defaultsHint: 'Used until there is enough of your own data.',
    cycleLengthLabel: 'Cycle length (days)',
    periodLengthLabel: 'Period length (days)',
    dataTitle: 'Your data',
    dataHint: 'Data is stored in this browser only. Clearing browser data or switching devices will not carry it over — export a backup now and then.',
    exportBtn: 'Export backup',
    importBtn: 'Import backup',
    eraseBtn: 'Erase all data',
    eraseConfirm: 'Permanently erase all data? This cannot be undone.',
    imported: 'Data imported',
    importFailed: 'Import failed: {msg}',
    erased: 'All data erased',
    aboutTitle: 'About',
    privacyNote: 'No server, no account, no tracking. Your data never leaves your device.',
    sourceLink: 'View source on GitHub',
    disclaimer: 'Not medical advice. Predictions are estimates from the data you enter and cannot be used as contraception. Consult a clinician about any health concern.',
  },
};

let lang = 'th';

export function setLang(next) {
  lang = STR[next] ? next : 'th';
  document.documentElement.lang = lang;
}

export function getLang() {
  return lang;
}

/** แปลข้อความ รองรับแทนค่า {n} / {msg} */
export function t(key, vars) {
  const table = STR[lang] || STR.th;
  let s = table[key];
  if (s === undefined) s = STR.th[key] !== undefined ? STR.th[key] : key;
  if (vars && typeof s === 'string') {
    for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  }
  return s;
}

/** 'YYYY-MM-DD' → '7 ตุลาคม 2026' / 'October 7, 2026' */
export function formatLong(isoStr) {
  const d = parseISO(isoStr);
  const m = t('months')[d.getMonth()];
  const y = d.getFullYear();
  return lang === 'th' ? `${d.getDate()} ${m} ${y}` : `${m} ${d.getDate()}, ${y}`;
}

/** หัวปฏิทิน 'ตุลาคม 2026' */
export function formatMonth(year, month) {
  return `${t('months')[month]} ${year}`;
}
