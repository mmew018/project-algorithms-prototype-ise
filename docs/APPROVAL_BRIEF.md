# ISE Project Approval Brief

## ปัญหา

ผู้ใช้ทั่วไปมักรู้ว่าจะนำสินค้าไอทีไปทำอะไรและมีงบประมาณเท่าไร แต่ไม่ทราบชื่อรุ่นหรือศัพท์เทคนิคที่ต้องใช้ค้นหา Keyword และ Filter แบบตายตัวจึงอาจไม่สะท้อนความต้องการทั้งหมด

## แนวคิดโครงงาน

ISE ศึกษาการแปลงคำค้นภาษาไทย/อังกฤษเป็นเงื่อนไขที่ตรวจสอบได้ แล้วคัดเลือก จัดอันดับ และอธิบายเหตุผลของสินค้าแต่ละรายการ

## วัตถุประสงค์

1. แยก Category, Brand, Budget, Specs และ Use Case จากคำค้น
2. ดึง Candidate ที่เกี่ยวข้องจากชุดข้อมูลสินค้า
3. จัดอันดับด้วย Active-criteria weighted scoring
4. อธิบายอันดับจากสัญญาณที่ระบบใช้จริง
5. สนับสนุนการกรองและเปรียบเทียบสูงสุด 3 รายการ
6. ประเมิน Retrieval ด้วย Precision@K, Recall@K และ MRR
7. ประเมิน Usability ด้วย Task success, Time-on-task, SEQ และ SUS

## สถาปัตยกรรม

```text
User Query
→ Rule-based Query Understanding
→ Candidate Retrieval
→ Active-criteria Ranking
→ Signal-based Explanation
→ Search UI / Filter / Compare
```

ภาพประกอบที่มีอยู่: `assets/diagrams/02-how-it-works-pipeline.svg`

## ขอบเขต Prototype

มีแล้ว:

- Static dataset 60 รายการ / 11 หมวด
- Rule-based Thai/English parser
- Inverted Index และ Constraint Filter
- Soft budget window
- Multi-Criteria Ranking และ Explanation
- Search, Catalog, Filter, Product detail และ Compare
- Unknown และ Ambiguous query states
- Responsive UI, Accessibility basics และ Regression tests
- Benchmark 6 curated scenarios ที่ K = 3

ยังไม่รวม:

- Backend และฐานข้อมูลจริง
- ราคา/Inventory Real-time
- LLM หรือ Semantic Search
- Login, Cart และ Payment
- Personalization
- การรับประกัน FPS หรือประสิทธิภาพฮาร์ดแวร์จริง

## หลักฐานเชิงประจักษ์ปัจจุบัน

ผลจากชุดทดสอบที่ผู้จัดทำกำหนด 6 scenarios, K = 3:

| Metric | Keyword baseline | ISE |
|---|---:|---:|
| Precision@3 | 0.222 | 0.944 |
| Recall@3 | 0.167 | 0.819 |
| MRR | 0.256 | 1.000 |

ตัวเลขนี้ใช้ตรวจ Regression ภายใน Prototype ไม่ใช่ Accuracy ของระบบกับคำค้นทุกชนิด

## แผนการประเมินก่อนสรุปโครงงาน

- Automated regression สำหรับคำค้นหลัก คำค้นกำกวม และคำค้นนอกขอบเขต
- User Testing อย่างน้อย 6 คน แบ่ง Desktop/Mobile และระดับความรู้
- วิเคราะห์ Task success, Time-on-task, Misclick, SEQ และ SUS
- จัดลำดับปัญหาด้วย Severity และ Frequency แล้ว Retest หลังแก้ P0/P1

## คุณค่าทางวิชาการ

- แสดงการประยุกต์ Information Retrieval กับโจทย์สินค้าไอทีภาษาไทย
- เปรียบเทียบวิธี Keyword baseline กับ Multi-Criteria Retrieval ภายใต้ชุดข้อมูลเดียวกัน
- เปิดเผยสูตร ข้อมูลที่ใช้ ข้อจำกัด และเหตุผลของผลลัพธ์
- มีเส้นทางพัฒนาจาก Deterministic Prototype ไปสู่ Hybrid/Semantic Search ที่ประเมินผลได้

## คำขออนุมัติ

ขออนุมัติพัฒนา ISE จาก Prototype ไปสู่ Full Project โดยขยายความครอบคลุมของ Query Understanding เพิ่มชุดข้อมูลที่มีแหล่งอ้างอิง และประเมินกับผู้ใช้จริง โดยรักษาหลัก Explainability และการวัดผลที่ตรวจสอบได้
