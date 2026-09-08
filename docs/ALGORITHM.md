# ISE Multi-Criteria Ranking Algorithm Specification

---

## 1. Algorithm Overview
The ISE ranking framework applies a **Multi-Criteria Weighted Evaluation Matrix** designed to reconcile competing consumer requirements:
1. **Relevance** ($S_{\text{rel}}$): Textual alignment with product metadata, brands, and categories.
2. **Budget Utility** ($S_{\text{bud}}$): Price compliance with progressive penalties for budget overflow and optimization for value-for-money.
3. **Specification Fulfillment** ($S_{\text{spec}}$): Exact and tiered matching of hardware components (CPU, GPU, RAM, Storage, Screen, Hz).
4. **Domain Suitability** ($S_{\text{use}}$): Product performance indices tailored to specific use cases (Programming, Gaming, AI, Thin & Light).

### Active-Criterion Composite Score Formula
$$\text{MatchScore} = \text{round}\left(\frac{\sum_{i \in A} w_i S_i}{\sum_{i \in A} w_i}\right)$$

`A` is the set of criteria that are meaningful for the parsed query. Unspecified dimensions are stored and displayed as `null` / “ไม่ได้ระบุ”; they do not contribute a neutral, perfect, or near-perfect default score. For example, an `RTX 4060` query activates relevance and specification scoring but excludes budget and use-case scoring.

Default prototype weights:
$$w_{\text{rel}} = 0.30, \quad w_{\text{bud}} = 0.25, \quad w_{\text{spec}} = 0.25, \quad w_{\text{use}} = 0.20$$
$$\sum w_i = 1.00$$

All active sub-scores $S_i$ are mathematically bounded within $[0, 100]$. A non-empty query must also contain at least one recognized product signal (category, brand, use case, or hardware specification). Otherwise the UI returns an unknown-query state instead of ranked products.

---

## 2. Mathematical Formulations of Sub-Scores

### A. Relevance Score ($S_{\text{rel}}$)
Evaluates category alignment, brand match, and inverted index token density:
$$S_{\text{rel}} = \min\left(100, \max\left(0, S_{\text{base}} + \Delta_{\text{cat}} + \Delta_{\text{brand}} + \min\left(25, N_{\text{hits}} \times 10\right)\right)\right)$$
Where:
- $S_{\text{base}} = 35$ (low baseline that cannot imply a strong match by itself)
- $\Delta_{\text{cat}} = +45$ for an exact category match; $+35$ for a compatible subcategory (Gaming Laptop for a Laptop query); $-25$ for a mismatch.
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

If no explicit specification was requested, $S_{\text{spec}}$ is inactive and excluded from the composite score.

---

### D. Use Case Score ($S_{\text{use}}$)
Maps to author-assigned capability ratings in the prototype dataset. These ratings support a deterministic demonstration and are not measured hardware benchmarks:
- **Programming:** $S_{\text{use}} = \text{product.programmingLevel}$.
- **Gaming:** $S_{\text{use}} = \text{product.gamingLevel}$.
- **Thin & Light:** Calculated by the following rule-based formula using chassis weight $W$ (kg) and battery capacity $B$ (Wh):
  $$S_{\text{thin}} = \min\left(100, \max\left(30, 70 + \Delta_W + \Delta_B\right)\right)$$
  - $\Delta_W = +20$ if $W \le 1.25\text{ kg}$; $+10$ if $W \le 1.50\text{ kg}$; $-30$ if $W \ge 2.20\text{ kg}$.
  - $\Delta_B = +15$ if $B \ge 70\text{ Wh}$; $-5$ if $B \le 45\text{ Wh}$.
- **AI Workload:** $S_{\text{use}} = \text{product.aiWorkloadLevel}$.

---

## 3. Worked Examples (Current Prototype Behavior)

### Query: *"โน้ตบุ๊กสำหรับเขียนโปรแกรม งบไม่เกิน 30000"*

Extracted intent activates `Relevance`, `Budget`, and `Use Case`. It does **not** activate `Specification`, because the user did not explicitly request RAM, CPU, or another hardware specification.

For the top result, Acer Swift Go 14:

- $S_{\text{rel}} = 80$
- $S_{\text{bud}} = 100$
- $S_{\text{spec}} =$ Not specified (excluded)
- $S_{\text{use}} = 92$

$$\text{MatchScore} = \text{round}\left(\frac{80(0.30)+100(0.25)+92(0.20)}{0.30+0.25+0.20}\right) = 90$$

### Query: *"RTX 4060"*

Only `Relevance` and `Specification` are active. Budget and use case are displayed as Not specified and cannot inflate the result.

For the top exact-match GPU:

- $S_{\text{rel}} = 55$
- $S_{\text{spec}} = 100$
- $S_{\text{bud}} =$ Not specified (excluded)
- $S_{\text{use}} =$ Not specified (excluded)

$$\text{MatchScore} = \text{round}\left(\frac{55(0.30)+100(0.25)}{0.30+0.25}\right) = 75$$

This score means “match against the conditions supplied in this query”; it is not a probability or a statistical accuracy claim.
