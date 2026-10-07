/**
 * data.js — โครงสร้างของแอป: คีย์ ไอคอน ลำดับ ค่าคงที่ของการคำนวณ
 *
 * ไฟล์นี้ต้อง "ไม่มีข้อความที่ผู้ใช้อ่าน" แม้แต่คำเดียว
 * ข้อความทั้งหมดอยู่ใน js/locales/<lang>.js — นักแปลแตะแค่ไฟล์นั้นไฟล์เดียว
 *
 * ถ้าจะเพิ่มอาการใหม่: เพิ่มที่ SYMPTOMS ตรงนี้ แล้วเพิ่มคำแปลคีย์เดียวกัน
 * ในไฟล์ locale (ถ้าภาษาไหนขาด ระบบจะถอยไปใช้ภาษาไทยให้อัตโนมัติ)
 */

/** ช่วงของรอบเดือน เรียงตามลำดับเวลาในรอบ — ลำดับนี้คือคอลัมน์ในตารางหน้าสถิติ */
export const PHASES = ['menstrual', 'follicular', 'ovulation', 'luteal', 'pms'];

/**
 * อาการที่บันทึกได้
 * negative = อาการไม่พึงประสงค์ จะถูกนำไปหา pattern ในหน้าสถิติ
 * หน้าบันทึกเรียงเป็นตาราง 3 คอลัมน์ จำนวนที่หาร 3 ลงตัวจะดูเรียบร้อยที่สุด
 */
export const SYMPTOMS = [
  { key: 'happy', icon: '😊', negative: false },
  { key: 'energy', icon: '⚡', negative: false },
  { key: 'acne', icon: '🧖', negative: true },
  { key: 'cramps', icon: '🩸', negative: true },
  { key: 'moody', icon: '🌀', negative: true },
  { key: 'insomnia', icon: '😴', negative: true },
  { key: 'craving', icon: '🍫', negative: true },
  { key: 'water', icon: '💧', negative: false },
  { key: 'exercise', icon: '🏃', negative: false },
];

export const symptomOf = (k) => SYMPTOMS.find((s) => s.key === k);

/** อาการที่ไม่ขึ้นตารางหน้าสถิติ (เป็นพฤติกรรมที่ตั้งใจทำ ไม่ใช่อาการที่เกิดเอง) */
export const SYMPTOMS_OFF_CHART = ['water', 'exercise'];

/** ระดับพลังงานสูงสุด (0 = ยังไม่เลือก) */
export const ENERGY_MAX = 5;

/** ขอบเขตค่าตั้งต้นในหน้า "ฉัน" */
export const LIMITS = {
  cycleLength: { min: 21, max: 40 },
  periodLength: { min: 2, max: 10 },
};

/** ความยาวรอบที่ยอมรับว่าเป็นไปได้ทางสรีรวิทยา — กันข้อมูลกรอกผิดทำสถิติเพี้ยน */
export const CYCLE_RANGE = { min: 18, max: 45 };

/** ใช้กี่รอบล่าสุดในการเฉลี่ย */
export const AVG_WINDOW = 6;

/** ไข่ตกเกิดกี่วันก่อนรอบถัดไป */
export const OVULATION_BEFORE_NEXT = 14;

/** ช่วงเจริญพันธุ์: กี่วันก่อนไข่ตก ถึงกี่วันหลัง */
export const FERTILE_WINDOW = { before: 5, after: 1 };

/** ต้องบันทึกกี่วันถึงจะโชว์ตาราง pattern ในหน้าสถิติ */
export const PATTERN_MIN_DAYS = 10;

/** ช่องในตารางจะเชื่อได้เมื่อช่วงนั้นมีข้อมูลกี่วัน และความถี่กี่ % */
export const PATTERN_MIN_PHASE_DAYS = 3;
export const PATTERN_MIN_PCT = 20;
