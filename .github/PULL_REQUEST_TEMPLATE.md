# อะไรเปลี่ยน / What changed

<!-- อธิบายสั้น ๆ · A short description. Thai or English, either is fine. -->

ปิด issue / Closes #

---

## เช็กลิสต์ / Checklist

- [ ] `npm test` ผ่านทั้งหมด / all tests pass
- [ ] ทดสอบตอน**ยังไม่มีข้อมูลเลย** และตอน**มีข้อมูล 6 รอบ** (ฉัน → ใส่ข้อมูลตัวอย่าง)
      Tested with **no data** and with **6 cycles** of data (Me → Load sample data)
- [ ] Console ไม่มี error / no console errors
- [ ] ถ้าแก้ไฟล์ใน `js/` หรือ `css/` → เพิ่มใน `ASSETS` **และขึ้นเลข** `CACHE` ใน `sw.js`
      If you touched `js/` or `css/`, the file is in `ASSETS` **and** `CACHE` is bumped in `sw.js`
- [ ] ถ้าแก้ UI → ทดสอบที่ความกว้าง 360px แล้ว / tested at 360px width

## ข้อตกลงของโปรเจกต์ / Project rules

ยืนยันว่า PR นี้ไม่ขัดข้อใดข้อหนึ่ง (ดู [CONTRIBUTING.md](../CONTRIBUTING.md)):
Confirm this PR does not break any of these:

- [ ] **ไม่ส่งข้อมูลออกนอกเครื่อง** — ไม่มี `fetch` / analytics / tracker / cookie
      **No data leaves the device** — no `fetch`, analytics, trackers or cookies
- [ ] **ไม่เพิ่ม dependency** และไม่เพิ่ม build step
      **No new dependencies**, no build step
- [ ] **ออฟไลน์ยังใช้ได้** / still works offline
- [ ] **ไม่อ้างเกินจริงเรื่องการแพทย์** — เคล็ดลับใหม่ทุกข้อมีแหล่งอ้างอิงจริง
      **No medical overclaiming** — any new tip cites a real source

<!--
ไม่ต้องกังวลถ้าติ๊กไม่ครบทุกข้อ เขียนบอกมาได้เลยว่าติดอะไร เดี๋ยวช่วยกันดู
Do not worry if you cannot tick everything. Say what you got stuck on and we will work it out.
-->
