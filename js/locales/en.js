/**
 * en.js — English
 *
 * ── COPY THIS FILE TO ADD A LANGUAGE ──
 * 1. Copy to js/locales/<code>.js  (e.g. lo.js, km.js, my.js, vi.js, id.js)
 * 2. Translate every VALUE. Never change the KEYS on the left.
 * 3. Keep placeholders exactly as they are: {n} {date} {day} {len} {pct} {msg} ...
 * 4. Register it in js/i18n.js (one import line + one entry in LOCALES)
 * 5. Add the file to ASSETS in sw.js and bump CACHE
 *
 * Anything you omit falls back to Thai automatically, so a partial
 * translation still ships without breaking the app.
 */

export default {
  code: 'en',
  name: 'English',
  dir: 'ltr',

  /** Added to the Gregorian year for display. Thailand uses the Buddhist era (+543). */
  yearOffset: 0,

  months: ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'],

  monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],

  /** Full weekday names, starting with Monday */
  weekdays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],

  /** Calendar column headers, starting with Sunday. Keep these as short as readable. */
  dow: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],

  /** Reorder the placeholders to match how your language writes dates. */
  dateFormats: {
    full: '{weekday}, {month} {day}',
    short: '{monthShort} {day}',
    monthYear: '{month} {year}',
  },

  phases: {
    menstrual: 'Menstrual phase',
    follicular: 'Follicular phase',
    ovulation: 'Ovulation',
    luteal: 'Luteal phase',
    pms: 'PMS',
  },

  phaseShort: {
    menstrual: 'Period',
    follicular: 'Follic.',
    ovulation: 'Ovul.',
    luteal: 'Luteal',
    pms: 'PMS',
  },

  phaseTips: {
    menstrual: 'Rest up — a warm compress really helps with cramps.',
    follicular: 'Your energy is coming back. Good time to start something new.',
    ovulation: 'Skin often looks its best now. Keep the water coming.',
    luteal: 'Pick snacks with protein and fibre to keep your mood steady.',
    pms: 'PMS is close. Sleep enough and go easy on the sugar.',
  },

  symptoms: {
    happy: 'Good mood',
    energy: 'Energetic',
    acne: 'Acne / skin',
    cramps: 'Cramps',
    moody: 'Mood swings',
    insomnia: 'Trouble sleeping',
    craving: 'Sweet cravings',
    water: 'Drank enough water',
    exercise: 'Exercised',
  },

  /** Six values. The first one means "not set". */
  energy: ['Not set', 'Drained', 'Low', 'Okay', 'Good', 'Great'],

  advice: {
    acne: 'Try drinking more water and sleeping earlier before this phase.',
    cramps: 'Keep a hot water bottle handy and plan for more rest.',
    moody: 'Be kind to yourself. A walk in daylight helps.',
    insomnia: 'Cut afternoon caffeine and keep a steady bedtime.',
    craving: 'Stock good snacks — fruit, dark chocolate.',
    default: 'Keep tracking and see how it goes.',
  },

  ui: {
    tabHome: 'Today',
    tabCalendar: 'Calendar',
    tabStats: 'Insights',
    tabMe: 'Me',
    fabLabel: 'Log today',
    close: 'Close',

    greetMorning: 'Good morning',
    greetAfternoon: 'Good afternoon',
    greetEvening: 'Good evening',
    heroNoData: 'Log your first period day and I will start working out your cycle.',
    statusEmpty: 'No cycle data yet.\nTap + and turn on "Period started" to begin.',
    ringCap: 'Day',
    ringSub: 'of a {n}-day cycle',
    nextPeriod: 'Next period',
    inDays: 'in {n} days',
    aroundDate: 'around {date}',
    logToday: "Today's log",
    startLogging: 'Start logging',
    edit: 'Edit',
    nothingLoggedToday: 'Nothing logged today. Tap + to note how you feel.',
    miniPeriod: 'Period',
    miniEnergy: 'Energy {n}/{max}',
    tipOfDay: 'Tip of the day',
    seeAllTips: 'See all tips ›',

    calendarKicker: 'Cycle calendar',
    prevMonth: 'Previous month',
    nextMonth: 'Next month',
    legendPeriod: 'Period',
    legendPredicted: 'Predicted',
    legendFertile: 'Fertile window',
    legendOvulation: 'Ovulation',
    legendLogged: 'Logged',
    calSaysNone: 'Tap any day to start logging. After 2 cycles the predictions get much better.',
    calSaysMenstrual: 'Take it easy this week — a warm compress helps.',
    calSaysOvulation: 'Ovulation window. Your body is at its peak — drink up.',
    calSaysPms: 'A new cycle is close. Be gentle with yourself.',
    calSaysDefault: 'Day {day} of a {len}-day cycle',

    howToday: 'How do you feel today?',
    howThatDay: 'How did you feel that day?',
    periodOn: 'Period started',
    energyLevel: 'Energy level',
    energyAria: 'Energy level {n}',
    notePlaceholder: '📝 Add a note… e.g. "mild cramps in the afternoon"',
    save: 'Save',
    saved: 'Saved 🌼',

    statsKicker: 'From {days} logged days · {cycles} cycles',
    statsTitle: 'Symptoms by cycle phase',
    statsNeedMore: 'Log symptoms on at least {n} days (2–3 full cycles is better) and Daisy Days will find your patterns.',
    patternFound: 'Pattern found! ',
    patternDetail: '{symptom} peaks during {phase} ({pct}%)',
    cycleLengthTitle: 'Cycle length',
    averageDays: 'avg {n} days',
    needTwoCycles: 'At least 2 cycles are needed to draw this chart.',

    meTitle: 'Me',
    meSummary: '{days} days logged · {avg}-day average cycle',
    nameLabel: 'What should I call you?',
    namePlaceholder: 'e.g. Aom',
    language: 'Language',
    defaultCycle: 'Default cycle',
    defaultPeriod: 'Period length',
    unitDays: '{n} days',
    decrease: 'Decrease',
    increase: 'Increase',
    defaultsNote: 'Once you have logged 2 or more cycles, your real average replaces these defaults.',
    tipsTitle: 'Self-care tips',
    tipsSub: '{n} tips grouped by cycle phase',
    exportTitle: 'Export a backup',
    exportSub: 'Keep it yourself as a JSON file',
    exportDone: 'Backup exported',
    importTitle: 'Import a backup',
    importSub: 'Restore from a file you exported',
    importDone: 'Data imported 🌼',
    importFailed: 'Import failed: {msg}',
    privacyNote: 'All data stays on this device. Nothing is ever sent to a server.',
    demoBtn: 'Load {n} cycles of sample data',
    demoConfirm: 'Load sample data?\nAnything you have logged will be replaced.',
    demoDone: 'Loaded {n} cycles of sample data ✨',
    eraseBtn: 'Erase all data',
    eraseConfirm: 'Erase all data?\nEvery log and setting on this device will be gone.',
    eraseDone: 'All data erased',
    sourceLink: 'View source on GitHub',

    tipsDisclaimer: 'General self-care information, not medical advice. Talk to a clinician about any concern.',
    tipSource: 'Source: {source}',

    errBadFile: 'Invalid file',
    errNoData: 'No Daisy Days data found in this file',
  },

  /* ─────────────────────────── Tips ───────────────────────────
   * Format: [icon, title, one-line summary, full detail, source]
   * Every tip MUST cite a real source and must never diagnose or
   * prescribe treatment.
   * ─────────────────────────────────────────────────────────── */

  tips: {
    menstrual: [
      ['🩸', 'Heat helps cramps', 'A hot water bottle on your lower belly for 15–20 minutes',
        'Heat relaxes the uterine muscle and eases cramping. Use a hot water bottle or heat pad on your lower abdomen; a warm bath works too. Do not let it get hot enough to burn, and do not fall asleep on it.',
        'MedlinePlus (medlineplus.gov)'],
      ['🏃', 'Move gently', 'Walking, stretching or yoga can ease symptoms',
        'Light movement improves circulation and lowers stress. A 10–20 minute walk or some easy stretches is plenty — no need for a hard workout.',
        'MedlinePlus (medlineplus.gov)'],
      ['😴', 'Get enough rest', 'Lying on your side with knees bent eases abdominal tension',
        'Your body tires more easily during your period. Aim for 7–9 hours. Side-lying with bent knees, or elevating your legs, can feel more comfortable.',
        'MedlinePlus (medlineplus.gov)'],
      ['💗', 'Know when to see a clinician', 'Severe pain, fever, or unusually heavy bleeding',
        'See a clinician if you soak through a pad or tampon every 1–2 hours, bleed for more than 7 days, have severe or sudden pain, run a fever, or self-care has not helped after 3 months.',
        'ACOG (acog.org)'],
    ],

    follicular: [
      ['⚡', 'Your energy returns', 'A good window for starting things',
        'After your period many people feel fresher and more energetic. It is a good time to plan, try a new form of exercise, or take on work that needs focus.',
        'MedlinePlus (medlineplus.gov)'],
      ['🍎', 'Eat iron-rich food', 'Replaces what you lost during your period',
        'Meat, liver, eggs, dark leafy greens and beans are good iron sources. Pairing them with vitamin C rich fruit improves absorption.',
        'MedlinePlus (medlineplus.gov)'],
      ['💧', 'Drink enough water', 'Roughly 6–8 glasses a day',
        'Staying hydrated helps your skin, digestion and energy. Adjust for the weather and how active you are.',
        'MedlinePlus (medlineplus.gov)'],
    ],

    ovulation: [
      ['✨', 'Ovulation', 'Happens about 14 days before your next period',
        'Ovulation occurs roughly 14 days before your next period. The egg survives about 12–24 hours, which makes the fertile window around 6 days. Calendar counting is an estimate only and must not be used as contraception.',
        'Cleveland Clinic (my.clevelandclinic.org)'],
      ['🧖', 'Skin often looks its best', 'Keep up sunscreen and gentle cleansing',
        'Many people find their skin looks good in this phase. Use the momentum to stay consistent: sunscreen, cleansing twice a day, and enough water.',
        'MedlinePlus (medlineplus.gov)'],
      ['😊', 'Mood tends to lift', 'Spend the energy on something you enjoy',
        'Hormones in this phase leave many people feeling confident and sociable. Good time to see friends, pick up a hobby, or train.',
        'MedlinePlus (medlineplus.gov)'],
    ],

    luteal: [
      ['🍫', 'Choose better snacks', 'They keep your mood steadier',
        'Hunger often rises before your period. Snacks with protein and fibre — yoghurt, nuts, fruit — keep you full longer and your blood sugar steadier.',
        'MedlinePlus (medlineplus.gov)'],
      ['😴', 'Keep a steady bedtime', 'Cut caffeine in the afternoon',
        'Sleep can get harder in this phase. Go to bed at the same time, skip coffee and tea after midday, and cut screens before bed.',
        'MedlinePlus (medlineplus.gov)'],
      ['💧', 'Less salt, less bloating', 'Cutting salty food reduces that bloated feeling',
        'Salty food makes your body hold water, which can feel like bloating. Try cutting processed food and keeping your water up.',
        'MedlinePlus (medlineplus.gov)'],
    ],

    pms: [
      ['🌀', 'What PMS is', 'Symptoms that start 1–2 weeks before your period',
        'PMS covers physical and emotional symptoms such as acne, bloating, headaches, irritability and poor sleep, which usually fade once your period starts. If it disrupts daily life, talk to a clinician.',
        'MedlinePlus (medlineplus.gov)'],
      ['🍎', 'Less sugar, salt and caffeine', 'In the two weeks before your period',
        'Cutting back on sugar, salt, caffeine and alcohol in the run-up to your period may ease PMS symptoms.',
        'MedlinePlus (medlineplus.gov)'],
      ['🏃', 'Exercise regularly', 'Helps both mood and PMS symptoms',
        'Regular exercise such as brisk walking, swimming or cycling reduces stress and PMS symptoms.',
        'MedlinePlus (medlineplus.gov)'],
      ['💗', 'Be kind to yourself', 'Resting is allowed',
        'Emotions can run closer to the surface now. Give yourself time to rest, do something that relaxes you, and tell the people close to you if you need patience.',
        'MedlinePlus (medlineplus.gov)'],
    ],
  },

  generalTips: [
    ['📅', 'Log every day', 'The longer you track, the clearer the patterns',
      'Note your period days and any small symptoms daily. After 2–3 cycles the app switches to your real average and symptom patterns start to show.',
      'Daisy Days'],
  ],
};
