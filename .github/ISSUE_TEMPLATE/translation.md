---
name: 🌍 เพิ่มภาษา / Add a language
about: อาสาแปลแอปเป็นภาษาใหม่ / Volunteer to translate the app
title: 'แปลเป็นภาษา: '
labels: ['good first issue', 'i18n', 'help wanted']
---

**ภาษา / Language:**
<!-- เช่น ลาว (lo) · Lao (lo) -->

**รหัสภาษา ISO 639-1 / ISO 639-1 code:**
<!-- lo, km, my, vi, id, ms, tl, zh, ja, ko ... -->

---

## ทำอย่างไร / How to do it

ไม่ต้องอ่านโค้ดทั้งแอป แตะไฟล์เดียวจบ
You only touch one file. No need to read the rest of the app.

1. คัดลอก `js/locales/en.js` → `js/locales/<รหัสภาษา>.js`
   Copy `js/locales/en.js` to `js/locales/<code>.js`
2. แปลทุก **ค่า** — อย่าแก้ **คีย์** ด้านซ้าย และเก็บตัวแทนค่าอย่าง `{n}` `{date}` ไว้ให้ครบ
   Translate every **value**. Never change the **keys**. Keep placeholders like `{n}` and `{date}` intact.
3. ลงทะเบียนใน `js/i18n.js` — เพิ่ม `import` 1 บรรทัด และใส่ชื่อใน `LOCALES`
   Register it in `js/i18n.js`: one `import` line plus an entry in `LOCALES`.
4. เพิ่มชื่อไฟล์ใน `ASSETS` ของ `sw.js` แล้ว**ขึ้นเลข** `CACHE` (เช่น `daisydays-v4` → `v5`)
   Add the file to `ASSETS` in `sw.js` and **bump** `CACHE`.
5. รัน `npm test` — เทสต์จะบอกเองถ้าแปลตกคีย์ไหนหรืออาร์เรย์ยาวไม่ครบ
   Run `npm test` — it tells you exactly which keys are missing.

## จุดที่พลาดกันบ่อย / Common mistakes

- `months` และ `monthsShort` ต้องมี **12** ค่า · `weekdays` และ `dow` ต้องมี **7** ค่า
  `months`/`monthsShort` need **12** entries; `weekdays`/`dow` need **7**
- `weekdays` เริ่มจาก**วันจันทร์** แต่ `dow` (หัวตารางปฏิทิน) เริ่มจาก**วันอาทิตย์**
  `weekdays` starts on **Monday**; `dow` (calendar headers) starts on **Sunday**
- `energy` ต้องมี **6** ค่า ค่าแรกคือ "ยังไม่เลือก"
  `energy` needs **6** entries; the first means "not set"
- `yearOffset` ใส่ `0` เว้นแต่ภาษานั้นใช้ปฏิทินอื่น (ไทยใช้ `543` เพราะเป็น พ.ศ.)
  `yearOffset` is `0` unless your locale uses a different era (Thai uses `543`)
- `dateFormats` เรียงตัวแทนค่าใหม่ได้ตามที่ภาษานั้นเขียนวันที่
  Reorder the placeholders in `dateFormats` to match how your language writes dates

## เรื่องเคล็ดลับสุขภาพ / About the health tips

`tips` เป็นเนื้อหาสุขภาพที่มีแหล่งอ้างอิง **แปลให้ตรงความหมายเดิม ห้ามเพิ่มคำแนะนำใหม่เอง** และต้องคงแหล่งอ้างอิงไว้
ถ้าไม่สะดวกแปลส่วนนี้ **ข้ามได้** — ระบบจะถอยไปใช้ภาษาไทยอัตโนมัติ และ PR ยัง merge ได้

The `tips` entries are sourced health information. **Translate the meaning faithfully, never add your own advice**, and keep the source citation. If you would rather skip this section, **that is fine** — it falls back to Thai automatically and the PR can still be merged.
