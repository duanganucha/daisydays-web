<div align="center">

<img src="icons/icon.svg" width="104" alt="Daisy Days">

# Daisy Days 🌼

**บันทึกรอบเดือนแบบออฟไลน์ — ข้อมูลอยู่ในเครื่องคุณเท่านั้น**
Offline-first period & symptom tracker. Your data never leaves your device.

[**▶ เปิดใช้งาน / Open the app**](https://duanganucha.github.io/daisydays-web/)

`HTML` · `CSS` · `JavaScript` — ไม่มี framework ไม่มี build step ไม่มีเซิร์ฟเวอร์

</div>

---

## 6 หน้า

| หน้า | มีอะไร |
|---|---|
| 🌼 **วันนี้** | ทักทายตามเวลา · วงแหวนบอกวันที่เท่าไรของรอบ · ชิปชื่อช่วงรอบ · นับถอยหลังรอบหน้า · สรุปบันทึกวันนี้ · เคล็ดลับประจำวัน |
| 📅 **ปฏิทิน** | ปฏิทินรายเดือน (ปี พ.ศ.) ระบาย 5 สี: มีประจำเดือน · คาดการณ์ · ช่วงเจริญพันธุ์ · ไข่ตก · จุดบอกว่ามีบันทึก |
| ➕ **บันทึก** | สวิตช์ "ประจำเดือนมา" · อาการ 9 แบบแบบตาราง 3 ช่อง · ระดับพลังงาน 1–5 · โน้ต |
| 📊 **สถิติ** | ตารางความถี่ **อาการ × ช่วงรอบ** · การ์ด pattern ที่เจอ · กราฟความยาว 6 รอบล่าสุด |
| 💗 **ฉัน** | ชื่อเล่น · ค่าตั้งต้นรอบ/ประจำเดือน · ส่งออก–นำเข้าไฟล์สำรอง · ใส่ข้อมูลตัวอย่าง 6 รอบ · ลบข้อมูล |
| 📖 **เคล็ดลับ** | 17 เรื่องแยกตาม 5 ช่วงรอบ กางอ่านรายละเอียดได้ พร้อมอ้างอิงแหล่งที่มา |

---

## ความเป็นส่วนตัว

ข้อมูลรอบเดือนเป็นข้อมูลสุขภาพที่อ่อนไหวที่สุดอย่างหนึ่ง แอปนี้ออกแบบให้**ไม่มีทางรู้ข้อมูลของคุณได้เลย**:

| | |
|---|---|
| เซิร์ฟเวอร์ | ❌ ไม่มี — เป็นไฟล์ static ที่ GitHub Pages เสิร์ฟ |
| บัญชีผู้ใช้ | ❌ ไม่มี |
| analytics / tracker | ❌ ไม่มี |
| cookie | ❌ ไม่มี |
| ปลายทางที่ข้อมูลถูกส่งไป | ❌ ไม่มี |
| ที่เก็บข้อมูล | ✅ `localStorage` ของเบราว์เซอร์คุณเท่านั้น |

คำขอข้ามเครือข่ายเดียวที่แอปยิงคือฟอนต์ IBM Plex Sans Thai จาก Google Fonts — ถ้าไม่ต้องการเลยแม้แต่อันนั้น ลบสองบรรทัด `<link>` ใน `index.html` ออกได้ แอปใช้ฟอนต์ระบบแทนทันที

> ⚠️ **ข้อแลกเปลี่ยน:** ไม่มีคลาวด์ = ไม่มีการสำรองอัตโนมัติ ถ้าล้างข้อมูลเบราว์เซอร์ ข้อมูลหาย → **ส่งออกไฟล์สำรองเป็นระยะ** (ฉัน → ส่งออกไฟล์สำรอง)

---

## ติดตั้งเป็นแอป

เปิดเว็บบนมือถือแล้วกด **Add to Home Screen** — เป็น PWA ที่ใช้งานออฟไลน์ได้เต็มรูปแบบ

---

## รันในเครื่อง

ไม่ต้อง `npm install` ไม่ต้อง build เพราะเป็น HTML/CSS/JS ล้วน

```bash
git clone https://github.com/duanganucha/daisydays-web.git
cd daisydays-web
python3 -m http.server 8000
# เปิด http://localhost:8000
```

> ต้องเสิร์ฟผ่าน HTTP จริง ไม่ใช่เปิดไฟล์แบบ `file://` เพราะแอปใช้ ES modules ซึ่งติดข้อจำกัด CORS

---

## โครงสร้างโค้ด

```
daisydays-web/
├── index.html          โครงหน้าเปล่า + meta tags (UI ถูกวาดด้วย JS ทั้งหมด)
├── manifest.json       PWA manifest
├── sw.js               service worker — cache-first ให้ใช้ออฟไลน์ได้
├── css/
│   └── app.css         สไตล์ทั้งหมด พาเลตอยู่ใน :root
├── js/
│   ├── data.js         ค่าคงที่: อาการ 9 แบบ · 5 ช่วงรอบ · เคล็ดลับ 17 ข้อ · ชื่อวัน/เดือนไทย
│   ├── store.js        ชั้นข้อมูล: localStorage, บันทึกรายวัน, ส่งออก/นำเข้า
│   ├── cycle.js        ตรรกะล้วน: สถิติรอบ คาดการณ์ ตารางอาการ ข้อมูลตัวอย่าง
│   └── app.js          UI ทั้งหมด 6 หน้า
└── icons/              ไอคอนแอป (SVG + PNG 192/512/maskable)
```

**หลักการแบ่งไฟล์:** `cycle.js` เป็นฟังก์ชันบริสุทธิ์ที่รับ state แล้วคืนค่า ไม่แตะ DOM และไม่แตะ storage เลย — เทสต์ง่ายและย้ายไปใช้ที่อื่นได้

### รูปแบบข้อมูล

```js
// localStorage['dd.logs.v1']
{
  "2026-10-07": { period: true, symptoms: ["cramps", "moody"], energy: 4, note: "" }
}

// localStorage['dd.settings.v1']
{ name: "ออม", cycleLength: 28, periodLength: 5 }
```

ไฟล์ที่ส่งออกคือ JSON ก้อนนี้ตรง ๆ — อ่านออก แก้ด้วยมือได้ ไม่มีรูปแบบปิด

---

## การคาดการณ์ทำงานอย่างไร

1. **วันเริ่มรอบ** = วันที่บันทึกว่ามีประจำเดือน และวันก่อนหน้า**ไม่ได้**บันทึก (ไม่ต้องกรอกวันจบเอง)
2. ความยาวรอบ = ระยะห่างระหว่างวันเริ่มที่ติดกัน กรองเฉพาะ **18–45 วัน** เพื่อไม่ให้ข้อมูลกรอกผิดทำสถิติเพี้ยน
3. เฉลี่ย **6 รอบล่าสุด** → ความยาวรอบที่ใช้คาดการณ์ (ถ้ายังไม่มีข้อมูลใช้ค่าตั้งต้นจากหน้า "ฉัน")
4. **ช่วงของรอบ** ตัดสินตามลำดับ: วันที่ ≤ ความยาวประจำเดือน → เมนส์ · เลยรอบ−5 → PMS · ห่างจากวันไข่ตก ≤1 → ไข่ตก · ก่อนไข่ตก → ฟอลลิคูลาร์ · ที่เหลือ → ลูเทียล
5. **ไข่ตก** ≈ 14 วันก่อนรอบถัดไป · **ช่วงเจริญพันธุ์** = 5 วันก่อน ถึง 1 วันหลัง
6. **ตารางอาการ × ช่วงรอบ** นับเป็น % ของวันที่บันทึกในช่วงนั้น จะชี้ว่า "เจอ pattern" เมื่อช่วงนั้นมีข้อมูล ≥ 3 วัน และความถี่ ≥ 20%

เป็นสถิติพื้นฐานตรงไปตรงมา ไม่มี AI ไม่มีกล่องดำ อ่านโค้ดใน [`js/cycle.js`](js/cycle.js) ได้ทั้งหมด

---

## ร่วมพัฒนา — กำลังหาคนช่วย 🙋

**มี [35 issue เปิดอยู่](https://github.com/duanganucha/daisydays-web/issues) และ [20 อันเป็น `good first issue`](https://github.com/duanganucha/daisydays-web/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)**
ทุกใบเขียนไว้ครบว่าต้องแก้ไฟล์ไหน ทำอะไร และเสร็จแล้วต้องได้อะไร

> We welcome contributors. Issues are written in Thai and English, and PRs in either language are fine.

| อยากช่วยแบบ | ไปที่ | มี |
|---|---|---|
| 🌍 **แปลภาษา** — แตะไฟล์เดียว ไม่ต้องอ่านโค้ด | [`i18n`](https://github.com/duanganucha/daisydays-web/issues?q=is%3Aissue+is%3Aopen+label%3Ai18n) | 12 ภาษา |
| 🧪 **เขียนเทสต์** — ตรรกะล้วน ไม่ต้องแตะ DOM | [`tests`](https://github.com/duanganucha/daisydays-web/issues?q=is%3Aissue+is%3Aopen+label%3Atests) | 5 ใบ |
| ♿ **การเข้าถึง** | [`accessibility`](https://github.com/duanganucha/daisydays-web/issues?q=is%3Aissue+is%3Aopen+label%3Aaccessibility) | 4 ใบ |
| 📝 **เนื้อหาสุขภาพ** — ไม่ต้องเขียนโค้ดเลย | [`content`](https://github.com/duanganucha/daisydays-web/issues?q=is%3Aissue+is%3Aopen+label%3Acontent) | 4 ใบ |
| ✨ **ฟีเจอร์** | [`enhancement`](https://github.com/duanganucha/daisydays-web/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement) | 7 ใบ |
| ⚙️ **CI / เครื่องมือ** | [`infra`](https://github.com/duanganucha/daisydays-web/issues?q=is%3Aissue+is%3Aopen+label%3Ainfra) | 5 ใบ |

**เริ่มเลย:**

```bash
git clone https://github.com/duanganucha/daisydays-web.git
cd daisydays-web
npm test      # ไม่ต้อง npm install — โปรเจกต์นี้ไม่มี dependency
npm start     # เปิด http://localhost:8000
```

คอมเมนต์ใน issue ว่าจะรับอันไหน ไม่ต้องขออนุญาต · อ่าน [CONTRIBUTING.md](CONTRIBUTING.md) ก่อนส่ง PR

### อยากเพิ่มภาษาของคุณ?

คัดลอก [`js/locales/en.js`](js/locales/en.js) เป็น `js/locales/<รหัสภาษา>.js` แล้วแปล — **แปลไม่ครบก็ merge ได้** คีย์ที่ขาดจะถอยไปใช้ภาษาไทยเอง แอปไม่พัง และ `npm test` จะบอกเองว่าขาดคีย์ไหน

Copy [`js/locales/en.js`](js/locales/en.js), translate the values, and open a PR. **Partial translations are welcome** — missing keys fall back to Thai, and the test suite tells you exactly what is missing.

---

## ⚠️ ไม่ใช่คำแนะนำทางการแพทย์

Daisy Days เป็นเครื่องมือช่วยจดบันทึกเท่านั้น การคาดการณ์เป็นค่าประมาณจากข้อมูลที่คุณกรอกเอง
**ใช้เป็นวิธีคุมกำเนิดไม่ได้ และไม่ใช่คำวินิจฉัยทางการแพทย์**
หากรอบเดือนผิดปกติหรือมีข้อกังวลด้านสุขภาพ กรุณาปรึกษาแพทย์หรือเภสัชกร

เคล็ดลับในแอปเป็นข้อมูลทั่วไป อ้างอิงจาก MedlinePlus, ACOG และ Cleveland Clinic

---

## สัญญาอนุญาต

[MIT](LICENSE) — ใช้ แก้ แจกจ่าย หรือนำไปทำต่อได้อย่างอิสระ

<div align="center">
<sub>สร้างที่ศรีสะเกษ ประเทศไทย 🇹🇭</sub>
</div>
