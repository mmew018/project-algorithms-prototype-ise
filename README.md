# ISE — Intelligent Search Engine for Computer & Technology Products

> พิมพ์ความต้องการแบบภาษาคน → ระบบเข้าใจเงื่อนไข → จัดอันดับสินค้า → บอกเหตุผลที่ตรวจสอบได้

[![Live Demo](https://img.shields.io/badge/Live-Demo-111827?style=for-the-badge&logo=vercel)](https://project-algorithms-prototype-ise.vercel.app/)
[![Repository](https://img.shields.io/badge/GitHub-Repository-2563eb?style=for-the-badge&logo=github)](https://github.com/mmew018/project-algorithms-prototype-ise)
[![University Capstone](https://img.shields.io/badge/University-Capstone-0f766e?style=for-the-badge)](#)
[![Precision@3](https://img.shields.io/badge/Precision%403-0.944-16a34a?style=for-the-badge)](#ผลทดสอบแบบสั้น)

## เข้าใจ ISE ใน 30 วินาที

```mermaid
flowchart LR
    A["👤 พิมพ์ความต้องการ<br/>โน้ตบุ๊กเขียนโปรแกรม งบ 30,000"]
    B["🧠 แยกความต้องการ<br/>หมวด • งบ • สเปก • งาน"]
    C{"รู้ว่าเป็นสินค้า IT<br/>มากพอหรือไม่?"}
    D["⚡ คัดสินค้าที่เกี่ยวข้อง<br/>จาก 60 รายการ"]
    E["⚖️ จัดอันดับเฉพาะ<br/>เงื่อนไขที่ระบุ"]
    F["💬 แสดงเหตุผล<br/>และเปรียบเทียบได้"]
    X["🤝 บอกตรง ๆ ว่ายังไม่เข้าใจ<br/>พร้อมตัวอย่างคำค้น"]

    A --> B --> C
    C -- "ใช่" --> D --> E --> F
    C -- "ไม่ใช่" --> X
```

### สิ่งที่ผู้ใช้ได้รับ

```mermaid
flowchart LR
    Q["Gaming Laptop RTX 4060<br/>ราคาไม่เกิน 40,000"]
    Q --> I1["หมวด<br/>Gaming Laptop"]
    Q --> I2["งบสูงสุด<br/>฿40,000"]
    Q --> I3["สเปก<br/>RTX 4060"]
    Q --> I4["การใช้งาน<br/>Gaming"]
    I1 --> R["🏆 Lenovo LOQ<br/>98 / 100"]
    I2 --> R
    I3 --> R
    I4 --> R
    R --> WHY["เพราะตรงหมวด • อยู่ในงบ<br/>GPU ตรงรุ่น • เหมาะกับเกม"]
```

> **Match Score คือคะแนนความตรงกับเงื่อนไขที่พิมพ์ ไม่ใช่เปอร์เซ็นต์ความแม่นยำของ AI**

---

## ทำไมไม่ใช้แค่ Keyword Search?

| ค้นหาแบบเดิม | ISE |
|---|---|
| เห็นเพียงคำที่สะกดตรงกัน | แปลงคำค้นเป็นเงื่อนไขที่ระบบใช้ได้ |
| ราคาต่ำอาจขึ้นก่อน แม้ไม่เหมาะกับงาน | ชั่งทั้งความเกี่ยวข้อง งบ สเปก และลักษณะงาน |
| คำค้นไม่เกี่ยวข้องก็อาจยังคืนสินค้า | ยอมบอกว่า “ยังไม่เข้าใจคำค้นนี้” |
| ได้อันดับ แต่ไม่รู้เหตุผล | ทุกผลลัพธ์มีคำอธิบายจากคะแนนจริง |

ตัวอย่างคำค้นที่รองรับ:

- `โน้ตบุ๊กสำหรับเขียนโปรแกรม งบไม่เกิน 30000`
- `Gaming Laptop RTX 4060 ราคาไม่เกิน 40000`
- `จอ 27 นิ้ว 144Hz`
- `SSD 1TB สำหรับ Gaming`
- `เมาส์ทำงาน`

---

## Algorithms ที่ใช้ — ดูภาพเดียวจบ

```mermaid
flowchart LR
    A["1️⃣ Rule-Based<br/>Intent Parser<br/><br/>อ่านข้อความไทย/อังกฤษ<br/>แล้วแยกเป็นโครงสร้าง"]
    B["2️⃣ Inverted Index<br/>+ Candidate Retrieval<br/><br/>หาเฉพาะสินค้าที่เกี่ยวข้อง<br/>ก่อนคำนวณคะแนน"]
    C["3️⃣ Active-Criteria<br/>Weighted Ranking<br/><br/>รวมคะแนนเฉพาะเกณฑ์<br/>ที่ผู้ใช้ระบุจริง"]
    D["4️⃣ Signal-to-Text<br/>Explanation<br/><br/>เปลี่ยนสัญญาณคะแนน<br/>เป็นเหตุผลภาษาไทย"]

    A --> B --> C --> D
```

| Algorithm | ทำหน้าที่อะไร | ทำไมเลือกใช้ตัวนี้ |
|---|---|---|
| **Rule-Based Intent Parsing** | จับหมวดสินค้า แบรนด์ งบ สเปก และการใช้งาน | ผลลัพธ์คงที่ อธิบายง่าย รันใน Browser และเหมาะกับขอบเขต Capstone |
| **Inverted Index** | เชื่อมคำสำคัญกับรายการสินค้าเพื่อดึง Candidate | เร็วกว่าไล่ให้คะแนนสินค้าทุกชิ้น และเป็นหลักการพื้นฐานของ Information Retrieval |
| **Soft Budget Window** | ยอมให้ Candidate เกินงบเล็กน้อยเข้ารอบ แล้วหักคะแนนภายหลัง | ไม่ทิ้งตัวเลือกที่อาจคุ้มกว่าจากเส้นงบแบบตัดทันที |
| **Multi-Criteria Weighted Ranking** | รวมหลายเงื่อนไขเป็น Match Score เดียว | การซื้อสินค้าไอทีไม่มีปัจจัยเดียวที่ตัดสินได้ทั้งหมด |
| **Signal-to-Text Explanation** | สร้างข้อความ “ทำไมผลลัพธ์นี้ตรง” จากสัญญาณจริง | ผู้ใช้ตรวจสอบเหตุผลได้ โดยไม่ต้องเชื่อคะแนนลอย ๆ |

---

## หัวใจของ Ranking: ไม่ให้คะแนนกับสิ่งที่ผู้ใช้ไม่ได้บอก

```mermaid
flowchart TB
    Q["คำค้น: RTX 4060"]
    Q --> R["✅ Relevance<br/>55 × 0.30"]
    Q --> S["✅ Spec Match<br/>100 × 0.25"]
    Q -. ไม่ได้ระบุ .-> B["➖ Budget<br/>ไม่นำมาคำนวณ"]
    Q -. ไม่ได้ระบุ .-> U["➖ Use Case<br/>ไม่นำมาคำนวณ"]
    R --> SCORE["Match Score<br/>75 / 100"]
    S --> SCORE
```

$$\text{MatchScore}=\operatorname{round}\left(\frac{\sum_{i\in A}w_iS_i}{\sum_{i\in A}w_i}\right)$$

- `A` = เกณฑ์ที่พบในคำค้นจริง
- เกณฑ์ที่ไม่พบ = **ไม่ได้ระบุ** ไม่ใช่ 100 คะแนน
- น้ำหนักตั้งต้น: Relevance `30%` • Budget `25%` • Specs `25%` • Use Case `20%`
- ระบบ normalize น้ำหนักใหม่ทุกครั้งตามเกณฑ์ที่ active

### ประตูความน่าเชื่อถือของคำค้น

```mermaid
flowchart LR
    Q["อากาศวันนี้"] --> G{"พบหมวด แบรนด์<br/>สเปก หรือการใช้งานหรือไม่?"}
    G -- "ไม่พบ" --> N["ไม่จัดอันดับสินค้า<br/>ไม่ติด Best Match<br/>ไม่สร้างคะแนนปลอม"]
    N --> H["แนะนำให้ระบุ<br/>หมวด • งาน • งบ • สเปก"]
```

<details>
<summary><strong>ดูรายละเอียดคะแนนย่อย</strong></summary>

| คะแนนย่อย | สัญญาณที่ใช้ |
|---|---|
| **Relevance** | หมวด แบรนด์ และคำที่ตรงกับข้อมูลสินค้า |
| **Budget** | อยู่ในงบ ใช้งบคุ้มค่า หรือเกินงบมากน้อยเพียงใด |
| **Specs** | CPU, GPU, RAM, Storage, ขนาดจอ และ Refresh Rate ที่ระบุ |
| **Use Case** | ความเหมาะกับ Programming, Gaming, AI, Productivity หรือ Thin & Light |

รายละเอียดสูตรเต็ม: [`docs/ALGORITHM.md`](docs/ALGORITHM.md)

</details>

---

## จาก Algorithm สู่หน้าจอ

![ตัวอย่างผลลัพธ์ที่อธิบายเหตุผลได้](assets/diagrams/04-ui-results-explain.svg)

```mermaid
flowchart LR
    A["Intent Card<br/>ระบบเข้าใจอะไร"]
    B["Product Cards<br/>ราคา • คะแนน • สเปกสำคัญ"]
    C["Why This Result<br/>เหตุผลแบบอ่านง่าย"]
    D["Product Detail<br/>คะแนนย่อยและสเปกเต็ม"]
    E["Compare<br/>เทียบได้สูงสุด 3 รุ่น"]

    A --> B --> C
    B --> D
    B --> E
```

ข้อมูลที่แสดงปรับตามหมวดสินค้า:

```mermaid
flowchart TB
    C{"หมวดสินค้า"}
    C --> L["💻 Laptop<br/>CPU • GPU • RAM • Storage<br/>จอ • น้ำหนัก • แบตเตอรี่ Wh"]
    C --> M["🖱️ Mouse<br/>น้ำหนัก g • DPI<br/>แบตเตอรี่ mAh • OS"]
    C --> O["🖥️ Monitor<br/>ขนาด • Resolution<br/>Refresh Rate • Panel"]
    C --> S["💾 SSD<br/>ความจุ • Interface<br/>Read / Write Speed"]
```

---

## ผลทดสอบแบบสั้น

ทดสอบกับ Regression Suite จำนวน 6 สถานการณ์ ที่ตำแหน่งผลลัพธ์ 3 อันดับแรก (`K = 3`)

| Metric | Keyword Baseline | ISE | ความหมายแบบสั้น |
|---|---:|---:|---|
| **Precision@3** | 0.222 | **0.944** | 3 อันดับแรกตรงโจทย์มากขึ้น |
| **Recall@3** | 0.167 | **0.819** | เก็บสินค้าที่เกี่ยวข้องได้ครอบคลุมขึ้น |
| **MRR** | 0.256 | **1.000** | สินค้าที่ตรง Ground Truth ปรากฏอันดับแรกทุก scenario |

> ตัวเลขนี้เป็นผลจากชุดทดสอบของ prototype ไม่ใช่คำกล่าวอ้างว่าระบบแม่นยำ 100% กับทุกคำค้นบนโลก

รายละเอียดชุดทดสอบ: [`docs/BENCHMARK.md`](docs/BENCHMARK.md)

---

## ขอบเขตของ Prototype

```mermaid
flowchart LR
    IN["✅ มี<br/>Natural-language Search<br/>Ranking • Explanation<br/>Filter • Compare • Responsive"]
    OUT["❌ ไม่ได้จำลอง<br/>Backend • Login • Payment<br/>Real-time Inventory • LLM"]
```

ISE เป็น **University Capstone Prototype** ที่เน้นพิสูจน์แนวคิด:

> Search → Understand → Rank → Explain

ระบบใช้ข้อมูลสินค้า local 60 รายการ 11 หมวด ทำงานด้วย HTML, CSS และ Vanilla JavaScript โดยไม่ต้องมี Backend หรือ External AI Service

---

## เปิดใช้งาน

### ใช้เว็บทันที

👉 [project-algorithms-prototype-ise.vercel.app](https://project-algorithms-prototype-ise.vercel.app/)

### รันในเครื่อง

```bash
python -m http.server 8000
```

จากนั้นเปิด `http://localhost:8000`

<details>
<summary><strong>ดูโครงสร้างโปรเจกต์</strong></summary>

```text
ISE/
├── index.html                 # Single-page UI
├── style.css                  # Responsive design
├── script.js                  # State, routing และ interactions
├── data/products.js           # สินค้า 60 รายการ / 11 หมวด
├── js/engine/
│   ├── queryParser.js         # Rule-based intent parser
│   ├── retrieval.js           # Inverted index retrieval
│   ├── ranking.js             # Active-criteria ranking
│   └── explainer.js           # Explainable result text
├── js/benchmark/benchmark.js  # IR regression benchmark
└── docs/                      # เอกสารทางเทคนิคฉบับเต็ม
```

</details>

---

**NexusTech / ISE — University Capstone Project Prototype**
