# ISE Multi-Criteria Ranking Algorithm Specification

---

## 1. Algorithm Overview
The ISE ranking framework applies a **Multi-Criteria Weighted Evaluation Matrix** designed to reconcile competing consumer requirements:
1. **Relevance** ($S_{\text{rel}}$): Textual alignment with product metadata, brands, and categories.
2. **Budget Utility** ($S_{\text{bud}}$): Price compliance with progressive penalties for budget overflow and optimization for value-for-money.
3. **Specification Fulfillment** ($S_{\text{spec}}$): Exact and tiered matching of hardware components (CPU, GPU, RAM, Storage, Screen, Hz).
4. **Domain Suitability** ($S_{\text{use}}$): Product performance indices tailored to specific use cases (Programming, Gaming, AI, Thin & Light).

### Final Composite Score Formula
$$\text{FinalScore} = \text{round}\left(w_{\text{rel}} \cdot S_{\text{rel}} + w_{\text{bud}} \cdot S_{\text{bud}} + w_{\text{spec}} \cdot S_{\text{spec}} + w_{\text{use}} \cdot S_{\text{use}}\right)$$

Default prototype weights:
$$w_{\text{rel}} = 0.30, \quad w_{\text{bud}} = 0.25, \quad w_{\text{spec}} = 0.25, \quad w_{\text{use}} = 0.20$$
$$\sum w_i = 1.00$$

All sub-scores $S_i$ are mathematically bounded within $[0, 100]$.

---

## 2. Mathematical Formulations of Sub-Scores

### A. Relevance Score ($S_{\text{rel}}$)
Evaluates category alignment, brand match, and inverted index token density:
$$S_{\text{rel}} = \min\left(100, \max\left(10, S_{\text{base}} + \Delta_{\text{cat}} + \Delta_{\text{brand}} + \min\left(20, N_{\text{hits}} \times 5\right)\right)\right)$$
Where:
- $S_{\text{base}} = 50$ (Neutral baseline)
- $\Delta_{\text{cat}} = +35$ for primary category match (e.g. Laptop); $+25$ for compatible subcategory (e.g. Gaming Laptop); $-25$ for category mismatch.
- $\Delta_{\text{brand}} = +15$ if user requested a specific brand and the product matches; $-10$ if requested another brand.
- $N_{\text{hits}}$: Number of matching tokens from the query found in the product's inverted index posting list.

---

### B. Budget Score ($S_{\text{bud}}$)
Evaluates product price $P$ relative to the user's upper budget bound $B_{\text{max}}$.

#### Case 1: Within Budget ($P \le B_{\text{max}}$)
$$\text{utilization} = \frac{P}{B_{\text{max}}}$$
$$S_{\text{bud}} = \begin{cases}
92 + (\text{utilization} \times 8) & \text{if } \text{utilization} \ge 0.70 \\
75 + (\text{utilization} \times 20) & \text{if } \text{utilization} < 0.70
\end{cases}$$
*Rationale:* Products that utilize 70% to 100% of the budget offer superior specifications and are scored between 97 and 100. Products that cost significantly less (e.g. ฿14,900 on a ฿30,000 budget) receive a mild deduction ($85 - 90$) because their hardware performance leaves substantial user budget unexploited.

#### Case 2: Exceeding Budget ($P > B_{\text{max}}$)
$$\text{overflowRatio} = \frac{P - B_{\text{max}}}{B_{\text{max}}}$$
$$S_{\text{bud}} = \max\left(0, 100 - (\text{overflowRatio} \times 350)\right)$$
*Penalty curve behavior:*
- $+5\%$ over budget: $S_{\text{bud}} = 100 - 17.5 = 82.5$
- $+10\%$ over budget: $S_{\text{bud}} = 100 - 35.0 = 65.0$
- $+20\%$ over budget: $S_{\text{bud}} = 100 - 70.0 = 30.0$
- $\ge +28.5\%$ over budget: $S_{\text{bud}} = 0.0$

---

### C. Specification Score ($S_{\text{spec}}$)
Evaluates user-requested hardware constraints against candidate attributes:
$$S_{\text{spec}} = \frac{1}{|E|} \sum_{e \in E} s(e)$$
Where $E$ is the set of explicit criteria extracted from the query:
1. **GPU Match ($s_{\text{gpu}}$):**
   - Exact chip match (e.g. RTX 4060): $100$
   - Superior tier (e.g. RTX 4070 when 4060 was asked): $98$
   - Inferior tier (e.g. RTX 4050): $65$
   - Integrated / Non-matching: $40$
2. **RAM Match ($s_{\text{ram}}$):**
   - If $\text{RAM} \ge \text{Target}$: $100$
   - If $\text{RAM} < \text{Target}$: $\text{round}\left(\frac{\text{RAM}}{\text{Target}} \times 60\right)$ (e.g. 8GB vs 16GB requirement $\to 30$)
3. **Display Size Match ($s_{\text{size}}$):**
   - If $|\text{Size} - \text{Target}| \le 0.2''$: $100$
   - If $|\text{Size} - \text{Target}| \le 1.0''$: $85$
   - If $|\text{Size} - \text{Target}| > 1.0''$: $50$
4. **Refresh Rate Match ($s_{\text{hz}}$):**
   - If $\text{Hz} \ge \text{Target}$: $100$
   - If $\text{Hz} < \text{Target}$: $\text{round}\left(\frac{\text{Hz}}{\text{Target}} \times 60\right)$

If no explicit criteria were specified, $S_{\text{spec}} = \text{product.performanceLevel}$.

---

### D. Use Case Score ($S_{\text{use}}$)
Directly maps to the product's verified domain readiness:
- **Programming:** $S_{\text{use}} = \text{product.programmingLevel}$ (evaluates multi-core CPU, RAM capacity, and keyboard quality).
- **Gaming:** $S_{\text{use}} = \text{product.gamingLevel}$ (evaluates GPU TGP, screen response time, and cooling).
- **Thin & Light:** Evaluated empirically via chassis weight $W$ (kg) and battery capacity $B$ (Whr):
  $$S_{\text{thin}} = \min\left(100, \max\left(30, 70 + \Delta_W + \Delta_B\right)\right)$$
  - $\Delta_W = +20$ if $W \le 1.25\text{ kg}$; $+10$ if $W \le 1.50\text{ kg}$; $-30$ if $W \ge 2.20\text{ kg}$.
  - $\Delta_B = +15$ if $B \ge 70\text{ Whr}$; $-5$ if $B \le 45\text{ Whr}$.
- **AI Workload:** $S_{\text{use}} = \text{product.aiWorkloadLevel}$ (evaluates Tensor cores, AVX-512 support, and VRAM bandwidth).

---

## 3. Step-by-Step Worked Example

### Query: *"โน้ตบุ๊กสำหรับเขียนโปรแกรม งบไม่เกิน 30000"*
- **Extracted Intent:**
  - Category: `Laptop`
  - Budget: `≤ 30,000 THB`
  - Use Case: `Programming`
  - Inferred Spec: `RAM ≥ 16GB`, High-performance CPU

### Candidate Comparison:

#### 1. Acer Swift Go 14 (Price: ฿28,900)
- **Relevance ($S_{\text{rel}}$):** Category match ($+35$), token hits ($+15$), base $50 \to \mathbf{95}$
- **Budget ($S_{\text{bud}}$):** Within budget (utilization $28900 / 30000 = 0.963$). Score: $92 + (0.963 \times 8) = \mathbf{100}$
- **Specs ($S_{\text{spec}}$):** i5-13500H 12C/16T, 16GB LPDDR5, 2.8K OLED $\to \mathbf{92}$
- **Use Case ($S_{\text{use}}$):** `programmingLevel` = $\mathbf{92}$
$$\text{FinalScore} = (95 \times 0.30) + (100 \times 0.25) + (92 \times 0.25) + (92 \times 0.20) = 28.5 + 25.0 + 23.0 + 18.4 = \mathbf{95} \text{ (Rank 1: Best Match)}$$

#### 2. Lenovo IdeaPad Slim 5 14 (Price: ฿27,900)
- **Relevance ($S_{\text{rel}}$):** $\mathbf{94}$
- **Budget ($S_{\text{bud}}$):** Utilization $0.93 \to \mathbf{99}$
- **Specs ($S_{\text{spec}}$):** Ryzen 7 7730U 8C/16T, 16GB RAM $\to \mathbf{89}$
- **Use Case ($S_{\text{use}}$):** `programmingLevel` = $\mathbf{89}$
$$\text{FinalScore} = (94 \times 0.30) + (99 \times 0.25) + (89 \times 0.25) + (89 \times 0.20) = 28.2 + 24.75 + 22.25 + 17.8 = \mathbf{93} \text{ (Rank 2)}$$

#### 3. HP 15-fc0000AU (Price: ฿14,900)
- **Relevance ($S_{\text{rel}}$):** $\mathbf{85}$
- **Budget ($S_{\text{bud}}$):** Utilization $0.496 < 0.70 \to 75 + (0.496 \times 20) = \mathbf{85}$
- **Specs ($S_{\text{spec}}$):** Ryzen 3 4 Cores, 8GB RAM (Penalized for low RAM) $\to \mathbf{55}$
- **Use Case ($S_{\text{use}}$):** `programmingLevel` = $\mathbf{55}$
$$\text{FinalScore} = (85 \times 0.30) + (85 \times 0.25) + (55 \times 0.25) + (55 \times 0.20) = 25.5 + 21.25 + 13.75 + 11.0 = \mathbf{72} \text{ (Rank 4)}$$

*Conclusion:* The algorithm correctly identifies that while HP 15 is cheap, it severely under-serves the functional requirement ("เขียนโปรแกรม"), ranking the 16GB H-series/Ryzen-7 laptops at the top with authentic mathematical differentiation.
