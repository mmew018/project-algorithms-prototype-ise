# ISE Information Retrieval Benchmark & Evaluation Report

---

## 1. Evaluation Methodology & Scope
This report presents metrics computed by `js/benchmark/benchmark.js` from the fixed prototype catalog and six predefined scenarios at $K=3$.

The benchmark evaluates:
1. **Baseline System:** Any-token matching across name, category, brand, CPU, and GPU fields, followed by ascending price order.
2. **ISE Prototype System:** Query Understanding (Intent Extraction) + Inverted Index Retrieval + Multi-Criteria Weighted Ranking.

---

## 2. Predefined Evaluation Scenarios & Ground Truth (GT)
Ground Truth was authored by the project team from the explicit criteria below. It was not independently validated, crowdsourced, or derived from production user behavior. Some criteria add author-defined relevance assumptions beyond the literal query, such as panel type, storage speed, and instruction-set support.

### Scenario 1: *"โน้ตบุ๊กสำหรับเขียนโปรแกรม งบไม่เกิน 30000"*
- **Target:** Laptops with high-performance multi-core CPUs, $\ge 16\text{GB}$ RAM, price $\le ฿30,000$.
- **Ground Truth Items:**
  - `nb-acer-swift-go14` (i5-13500H 12C/16T, 16GB, 2.8K OLED, ฿28,900)
  - `nb-lenovo-ideapad5-r7` (Ryzen 7 7730U 8C/16T, 16GB, ฿27,900)
  - `nb-asus-vivobook16-i5` (i5-13500H 12C/16T, 16GB, ฿26,900)

### Scenario 2: *"Gaming Laptop RTX 4060 ราคาไม่เกิน 40000"*
- **Target:** Gaming laptops with discrete NVIDIA RTX 4060 GPU, price $\le ฿40,000$.
- **Ground Truth Items:**
  - `gl-lenovo-loq-4060` (i5-13450HX, RTX 4060 105W, ฿37,900)
  - `gl-hp-victus16-4060` (Ryzen 5 7640HS, RTX 4060 120W, ฿38,900)
  - `gl-acer-nitrov15-4060` (i5-13420H, RTX 4060 75W, ฿34,900)

### Scenario 3: *"จอ 27 นิ้ว 144Hz"*
- **Target:** 27-inch monitors with $\ge 144\text{Hz}$ refresh rate and IPS panel.
- **Ground Truth Items:**
  - `mon-asus-tuf-vg27aq3a` (27" 2K 180Hz Fast IPS, ฿8,500)
  - `mon-lg-ultragear-27gr75q` (27" 2K 165Hz IPS, ฿8,900)
  - `mon-gigabyte-g27q` (27" 2K 144Hz IPS, ฿7,900)
  - `mon-viewsonic-vx2728` (27" 2K 165Hz Fast IPS, ฿6,990)

### Scenario 4: *"SSD 1TB สำหรับ Gaming"*
- **Target:** 1TB PCIe 4.0 NVMe SSDs with speeds $\ge 7,000\text{ MB/s}$ and DRAM cache.
- **Ground Truth Items:**
  - `ssd-wd-black-sn850x-1tb` (7,300 MB/s Game Mode 2.0, ฿3,790)
  - `ssd-samsung-990pro-1tb` (7,450 MB/s Pascal, ฿4,190)
  - `ssd-kingston-kc3000-1tb` (7,000 MB/s Phison E18, ฿3,290)
  - `ssd-crucial-t500-1tb` (7,300 MB/s Micron 232L, ฿3,590)

### Scenario 5: *"CPU สำหรับทำงาน AI"*
- **Target:** Multi-core CPUs with high compute density and AVX-512 / DL Boost support.
- **Ground Truth Items:**
  - `cpu-amd-ryzen9-7950x` (16C/32T AVX-512, ฿21,900)
  - `cpu-intel-core-i9-14900k` (24C/32T 6.0 GHz, ฿22,900)
  - `cpu-intel-core-i7-14700k` (20C/28T DL Boost, ฿16,500)
  - `cpu-amd-ryzen9-7900x` (12C/24T AVX-512, ฿15,900)

### Scenario 6: *"โน้ตบุ๊กบางเบา แบตอึด สำหรับทำงาน"*
- **Target:** The three thin-and-light work notebooks listed in the author-defined relevance set for this scenario.
- **Ground Truth Items:**
  - `nb-asus-zenbook-14-ux3405` (1.20 kg, 75 Wh battery, ฿39,900)
  - `nb-apple-macbook-air-m3-13` (1.24 kg, 18 hrs battery, ฿44,900)
  - `nb-lenovo-thinkpad-t14s-g4` (1.25 kg, 57 Wh battery, ฿42,900)

---

## 3. Mathematical Metric Definitions
Cutoff rank: $K = 3$.

- **Precision@K:**
  $$\text{Precision@}K = \frac{|\text{Top } K \cap \text{GroundTruth}|}{K}$$
- **Recall@K:**
  $$\text{Recall@}K = \frac{|\text{Top } K \cap \text{GroundTruth}|}{|\text{GroundTruth}|}$$
- **Mean Reciprocal Rank (MRR):**
  $$\text{MRR} = \frac{1}{|Q|} \sum_{q=1}^{|Q|} \frac{1}{\text{rank}_q^*}$$
  Where $\text{rank}_q^*$ is the position of the first relevant ground truth document for query $q$.
- **Latency (ms):** Wall-clock execution time measured via `performance.now()`.

---

## 4. Empirical Evaluation Results Summary

| Metric (Cutoff $K=3$) | Baseline (Keyword Search) | ISE (Multi-Criteria IR) | Relative Delta |
| :--- | :---: | :---: | :---: |
| **Precision@3** | **0.222** | **0.944** | **+325.2%** |
| **Recall@3** | **0.167** | **0.819** | **+390.4%** |
| **Mean Reciprocal Rank (MRR)** | **0.256** | **1.000** | **+290.6%** |
| **Average Search Latency** | Varies by run | Varies by run | Measured in the current browser |

---

## 5. Detailed Breakdown by Scenario

### Scenario 1: โน้ตบุ๊กสำหรับเขียนโปรแกรม งบไม่เกิน 30,000
- **Baseline:** Returns no candidates for this query. **Precision@3 = 0.000, Recall@3 = 0.000, MRR = 0.000**.
- **ISE:** Ranks Acer Swift Go 14, ASUS Vivobook 16, and Lenovo IdeaPad Slim 5 at the top. Under the authored Ground Truth criterion, all three are relevant. **Precision@3 = 1.000, Recall@3 = 1.000, MRR = 1.000**.

### Scenario 2: Gaming Laptop RTX 4060 ราคาไม่เกิน 40,000
- **Baseline:** Its top three are two SSDs and one mouse; the first Ground Truth item appears below the cutoff. **Precision@3 = 0.000, Recall@3 = 0.000, MRR = 0.063**.
- **ISE:** The parsed RTX 4060 constraint ranks Lenovo LOQ, HP Victus, and Acer Nitro V at the top. **Precision@3 = 1.000, Recall@3 = 1.000, MRR = 1.000**.

### Scenario 3: จอ 27 นิ้ว 144Hz
- **Baseline:** Ranks ViewSonic, Gigabyte, and ASUS TUF at the top. **Precision@3 = 1.000, Recall@3 = 0.750, MRR = 1.000**.
- **ISE:** Produces the same top three for this scenario. **Precision@3 = 1.000, Recall@3 = 0.750, MRR = 1.000**.

### Scenario 4: SSD 1TB สำหรับ Gaming
- **Baseline:** Ranks Kingston NV2, Crucial MX500, and Kingston KC3000; only KC3000 is in Ground Truth. **Precision@3 = 0.333, Recall@3 = 0.250, MRR = 0.333**.
- **ISE:** Ranks WD Black SN850X, Samsung 990 Pro, and Kingston KC3000 at the top. **Precision@3 = 1.000, Recall@3 = 0.750, MRR = 1.000**.

### Scenario 5: CPU สำหรับทำงาน AI
- **Baseline:** Its top three include RAM, a PSU, and Core i5-14400F; none are in Ground Truth. **Precision@3 = 0.000, Recall@3 = 0.000, MRR = 0.143**.
- **ISE:** Ranks Ryzen 9 7950X, Core i9-14900K, and Core i7-14700K at the top. **Precision@3 = 1.000, Recall@3 = 0.750, MRR = 1.000**.

### Scenario 6: โน้ตบุ๊กบางเบา แบตอึด สำหรับทำงาน
- **Baseline:** Returns no candidates for this query. **Precision@3 = 0.000, Recall@3 = 0.000, MRR = 0.000**.
- **ISE:** Ranks ASUS Zenbook 14 OLED, Acer Swift Go 14, and Lenovo ThinkPad T14s at the top; two are in Ground Truth. **Precision@3 = 0.667, Recall@3 = 0.667, MRR = 1.000**.

---

## 6. Limitations Disclosure
- The benchmark evaluates a static prototype catalog of 60 items across 11 categories and only six predefined queries.
- Relevance labels were authored by the project team and partly encode the same domain assumptions used by the ranking rules.
- Ground Truth was not independently reviewed, crowdsourced, or validated with real users, click logs, or production traffic.
- Prices and specifications are fixed prototype data and may not reflect current listings.
- Latency varies by device, browser, and individual run.
- These results support regression testing within this collection; they are not system-wide accuracy claims and should not be generalized to real-world search without a larger, independently labeled test set.
