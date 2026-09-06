# ISE — Intelligent Search Engine for Computer & Technology Products

> A university capstone search and ranking prototype that interprets natural-language requirements, applies multi-criteria decision ranking, and explains recommendations with complete transparency.

---

## Overview

When people shop for computer hardware and laptops online, they rarely know the exact technical model number or SKU they need. Instead, they usually know their **goal** and their **budget**:

> *"อยากได้โน้ตบุ๊กไว้เขียนโปรแกรม งบ 30,000"*  
> *(I want a laptop for programming with a budget under 30,000 THB)*

Traditional e-commerce search engines struggle with this kind of request. They rely heavily on exact keyword matching, static category dropdowns, and sorting by ascending price or popularity. If a product title does not happen to include the exact word *"เขียนโปรแกรม"* (programming), the user either gets zero results or ends up with an underpowered budget machine at rank #1 simply because it was the cheapest option.

**ISE (Intelligent Search Engine)** is a prototype built to solve this exact problem. Instead of asking:

> *"What products does this store have in stock?"*

ISE answers:

> **"Based on your requirements and budget, which product is the most suitable, and why?"**

### What This Prototype Is (and What It Is Not)
- **It is:** A functional Information Retrieval (IR) and decision-support search prototype that uses deterministic rule-based intent parsing, in-memory candidate retrieval, multi-criteria weighted scoring, and signal-based explainability.
- **It is not:** An AI chatbot, an LLM wrapper, a neural search engine, or a commercial e-commerce store with checkout and payments. Every calculation in ISE is deterministic, mathematically grounded, and directly inspectable in the source code.

---

## Problem

Computer hardware catalogs present a serious decision problem for everyday buyers:

1. **Complex, Interdependent Specifications:**  
   Laptops and PC components involve dozens of technical attributes: CPU core counts, clock speeds, GPU wattage (TGP), RAM bandwidth, SSD generation, screen color gamut (sRGB vs. DCI-P3), refresh rates, and battery capacities (Whr). Most buyers know what they want to accomplish (e.g., coding, esports gaming, video editing), but not which combination of specs delivers that experience.

2. **The Exact-Keyword Trap:**  
   Traditional e-commerce search engines search product names for literal words. If a user types *"โน้ตบุ๊กสำหรับเขียนโปรแกรม"*, the search engine looks for products whose title contains the word *"เขียนโปรแกรม"*. Since manufacturers do not name their laptops *"Programming Laptop"*, the search engine either misses excellent candidates or returns arbitrary results.

3. **The Flaw of Binary Price Filters:**  
   Standard filters apply hard drop-offs. If a user sets a filter of $\le 30,000\text{ THB}$, a laptop priced at $30,900\text{ THB}$ is completely hidden—even if it offers twice the RAM and a significantly better processor that would last the user three years longer.

4. **The Pitfall of Sorting by Price:**  
   Sorting by lowest price returns laptops with 4-core CPUs and 8GB of RAM at the very top. For programming with modern IDEs and Docker, an 8GB machine creates daily frustration, yet traditional sorting algorithms treat it as the "best" result because of its price tag.

5. **Lack of Explainability:**  
   Traditional search results do not explain *why* an item appeared at the top. The user is left to open twenty browser tabs, read spec sheets manually, and try to deduce which product fits their needs.

---

## How It Works

ISE processes every user query through a clear, multi-stage pipeline:

```
[ User Query (Thai / English) ]
               │
               ▼
   [ 1. Query Processing ]
       ├── Clean punctuation, lowercase, normalize whitespace
       └── Tokenize into searchable terms
               │
               ▼
   [ 2. Query Understanding ]
       ├── Extract Category (e.g., Gaming Laptop, Monitor, SSD)
       ├── Extract Budget Bounds (e.g., max: 40,000 THB)
       ├── Extract Target Hardware (e.g., RTX 4060, 16GB RAM, 144Hz)
       └── Classify Domain Use Case (e.g., Gaming, Programming)
               │
               ▼
   [ 3. Candidate Retrieval ]
       ├── Filter candidates by category and target specs
       ├── Inverted index token matching
       └── Soft-budget tolerance window (up to +15% over budget)
               │
               ▼
   [ 4. Multi-Criteria Ranking ]
       ├── Relevance Score (30%)
       ├── Budget Score (25%)
       ├── Specifications Score (25%)
       └── Use Case Score (20%)
               │
               ▼
   [ 5. Explainable Ranking ]
       ├── Generate natural Thai rationale ("ทำไมระบบจึงแนะนำตัวนี้")
       ├── Highlight matched requirements
       └── Flag notable trade-offs (e.g., weight, battery life)
               │
               ▼
[ Results Display & Side-by-Side Comparison ]
```

---

## Prototype Features

- **Natural-Language Requirement Input:** Supports mixed Thai and English queries with realistic phrasing (e.g., budget keywords like `"งบไม่เกิน 30000"`, `"งบ 40k"`, `"ไม่เกิน 3 หมื่น"`).
- **"เราเข้าใจความต้องการของคุณ" (Interpreted Intent Card):** Displays visual chips showing exactly what the system extracted: category, budget ceiling, detected hardware targets, and inferred ranking priority.
- **Best Match Hero Badge:** Emphasizes the highest-scoring product with a clear rationale and score breakdown.
- **4-Pillar Score Breakdown on Every Card:** Every product displays its overall match score along with individual sub-scores for Relevance, Budget, Specifications, and Use Case.
- **Dynamic "Why This Result" Explanation:** Explains in plain Thai why each specific product is recommended based on real matching signals.
- **Technical Specification Drawer:** A NotebookSPEC-inspired slide-out drawer presenting full component specifications, radar score meters, and pros & cons.
- **Side-by-Side Comparison Matrix:** Compare up to 3 selected products with a **Highlight Differences** mode that highlights divergent specifications.
- **Live Benchmark / Evaluation Runner:** An in-browser regression testing suite that evaluates 6 standardized test scenarios against a baseline keyword search engine in real time.

---

## Algorithms Used

ISE does not use a single monolithic function. The search intelligence is divided into five specialized algorithmic components:

```
┌───────────────────────┐     ┌────────────────────────┐     ┌─────────────────────────┐
│ 1. Query Processing   │ ──> │ 2. Query Understanding │ ──> │ 3. Candidate Retrieval  │
└───────────────────────┘     └────────────────────────┘     └─────────────────────────┘
                                                                          │
                                                                          ▼
┌───────────────────────┐     ┌────────────────────────┐     ┌─────────────────────────┐
│ 5. Explainable Result │ <── │ 4. Multi-Criteria Rank │ <───┘ (Filtered Candidates C) │
└───────────────────────┘     └────────────────────────┘
```

---

### 3.1 Query Processing / Tokenization
- **File:** `js/engine/queryParser.js`
- **Purpose:** Prepares raw user text before analysis.

#### Why We Need It
Users write search queries in unpredictable ways—mixing Thai and English, using uppercase and lowercase, adding commas in numbers (`"30,000"`), using shorthand (`"40k"`, `"1tb"`, `"144hz"`), or using colloquial expressions (`"3 หมื่น"`). Algorithms cannot perform mathematical evaluation on unnormalized text.

#### How It Works
1. Converts all characters to lowercase.
2. Normalizes numerical shorthand:
   - `"40k"` $\to 40,000$
   - `"3 หมื่น"` $\to 30,000$
   - Strips commas: `"30,000"` $\to 30,000$
3. Tokenizes the string into normalized tokens while preserving alphanumeric spec terms (e.g., `rtx`, `4060`, `16gb`, `144hz`, `27`).

---

### 3.2 Query Understanding / Intent Parsing
- **File:** `js/engine/queryParser.js`
- **Purpose:** Extracts structured constraints and functional goals from the processed query.

#### Why We Need It
If a search engine looks only at raw words, it treats `"เขียนโปรแกรม"` and `"coding"` as completely unrelated strings. It also cannot tell whether `"30000"` is a model number, a price, or a frequency. Intent parsing translates conversational text into a structured data object that represents what the user actually wants.

#### How It Works (Rule-Based Intent Parsing)
ISE implements a deterministic, rule-based regular expression and pattern matching parser:
- **Category Detection:** Matches terms like `"โน้ตบุ๊ก"` $\to$ `Laptop`, `"gaming laptop"` $\to$ `Gaming Laptop`, `"จอ 27 นิ้ว"` $\to$ `Monitor`, `"การ์ดจอ"` $\to$ `GPU`.
- **Budget Extraction:** Uses regex patterns to identify upper and lower bounds:
  - `"งบไม่เกิน 30000"`, `"ราคาไม่เกิน 40000"`, `"ต่ำกว่า 25000"` $\to$ `maxBudget`
  - `"20000 ถึง 30000"` $\to$ `minBudget` and `maxBudget`
- **Hardware Specification Extraction:**
  - GPU: Detects chips like `RTX 4060`, `RTX 4070`, `RTX 4080`, `RX 7800 XT`.
  - CPU: Detects families like `Core i5`, `Core i7`, `Ryzen 7`, `M3`.
  - RAM: Detects capacities like `16GB`, `32GB`.
  - Display Size & Refresh Rate: Detects parameters like `27"` and `144Hz`.
- **Use Case Classification:**
  - `"เขียนโปรแกรม"`, `"coding"`, `"developer"` $\to$ `Programming`
  - `"เล่นเกม"`, `"gaming"`, `"esports"` $\to$ `Gaming`
  - `"บางเบา"`, `"แบตอึด"`, `"พกพา"` $\to$ `Thin & Light`
  - `"ai"`, `"deep learning"`, `"machine learning"` $\to$ `AI Workload`

> **Note on Academic Integrity:** This component is implemented as a **deterministic rule-based parser**, not an AI model or Large Language Model (LLM). It does not require remote network calls, has zero API latency, and behaves 100% predictably.

---

### 3.3 Candidate Retrieval
- **File:** `js/engine/retrieval.js`
- **Purpose:** Narrows down the catalog to a relevant pool of candidate products before detailed ranking.

#### Why We Need It
Evaluating every single item in a large catalog through a complex, multi-variable ranking formula is computationally unnecessary. An initial retrieval pass quickly filters out irrelevant categories (e.g., excluding computer monitors when the user asked for a laptop) while keeping all plausible candidates.

#### How It Works in the Prototype
1. **In-Memory Inverted Index:**  
   At startup, ISE builds a token-to-product mapping (`Map<token, Set<productId>>`) across all product names, brands, categories, hardware specs, and feature descriptions.
2. **Category Partitioning:**  
   If a category is identified (e.g., `Laptop`), items from unrelated categories (e.g., `PSU`, `Mouse`) are excluded. A general `Laptop` query still includes `Gaming Laptop` candidates to avoid premature exclusion.
3. **Soft Budget Window ($+15\%$ Tolerance):**  
   Instead of dropping a product priced at $31,900\text{ THB}$ when the user's budget is $30,000\text{ THB}$, ISE allows products up to $15\%$ above the budget into the candidate pool. This allows the ranking algorithm to evaluate whether the product offers enough extra value to justify the price difference, rather than causing a false zero-result.
4. **Hardware Pre-matching:**  
   If the user explicitly requested a specific component (e.g., `RTX 4060`), the retrieval layer prioritizes products carrying that exact hardware chip.

---

### 3.4 Multi-Criteria Weighted Ranking
- **File:** `js/engine/ranking.js`
- **Purpose:** The core decision-making algorithm of ISE. Ranks candidate products using a mathematically grounded scoring formula across four distinct criteria.

#### Why We Need It
In real purchasing decisions, no single variable tells the whole story:
- **Product A** matches the keyword closely but is over budget.
- **Product B** is well under budget but has an underpowered 4-core CPU and only 8GB of RAM.
- **Product C** uses the budget fully, has 16GB of RAM, and a powerful multi-core CPU.

A single-factor sort (like sorting by price or keyword matches) fails here. Weighted multi-criteria ranking allows the system to balance multiple trade-offs simultaneously.

#### Scoring Formula
$$\text{FinalScore} = (S_{\text{rel}} \times 0.30) + (S_{\text{bud}} \times 0.25) + (S_{\text{spec}} \times 0.25) + (S_{\text{use}} \times 0.20)$$

Every sub-score $S_i$ is calculated independently on a scale of $0$ to $100$:

| Dimension | Weight | What It Evaluates |
| :--- | :---: | :--- |
| **Relevance ($S_{\text{rel}}$)** | **30%** | Category alignment ($+35$), brand match ($+15$), and inverted index token frequency ($+5$ to $+20$). |
| **Budget ($S_{\text{bud}}$)** | **25%** | Price compliance. If within budget, scores $92–100$ based on value utilization. If over budget, a progressive penalty curve deducts points: $100 - (\text{overflowRatio} \times 350)$. |
| **Specifications ($S_{\text{spec}}$)** | **25%** | Direct evaluation of requested hardware (GPU chip tier, RAM capacity, screen size, refresh rate). If no explicit spec was asked, falls back to the product's overall performance level. |
| **Use Case ($S_{\text{use}}$)** | **20%** | Evaluates domain-specific suitability: `programmingLevel` (multi-core CPU & RAM), `gamingLevel` (GPU wattage & display response), or `Thin & Light` (calculated from weight $\le 1.25\text{ kg}$ and battery $\ge 70\text{ Whr}$). |

---

### 3.5 Explainable Ranking / Reasoning
- **File:** `js/engine/explainer.js`
- **Purpose:** Generates human-readable explanations in Thai detailing *why* each product appears at its position.

#### Why We Need It
A recommendation system that simply outputs `"Score: 94"` is a black box. If users cannot see why a product was selected, they cannot trust the recommendation. Explainability transforms an abstract score into actionable buying advice.

#### How It Works
The explainer analyzes the actual winning signals from the ranking breakdown:
1. **Budget Compliance:** Explains whether the product is within budget (e.g., *"อยู่ในงบประมาณที่ตั้งไว้ (฿28,900 จากงบ ฿30,000)"*).
2. **Key Component Fit:** Mentions the exact matched hardware (e.g., *"ใช้การ์ดจอ RTX 4060 ตรงตามต้องการ"*, *"มี RAM 16GB เพียงพอกับงาน"*).
3. **Domain Rationale:** Explains why the machine fits the use case (e.g., *"ซีพียู Intel Core i5-13500H 12C/16T เหมาะสำหรับการคอมไพล์โค้ดและรัน Docker"*).
4. **Honest Trade-Offs:** Flags potential considerations (e.g., screen color gamut of 45% NTSC, or chassis weight).

> **Terminology Note:** This feature is described as **Explainable Ranking** or **Explainable Reasoning**, not Explainable AI (XAI), because it is built from rule-based signal synthesis rather than a trained machine learning model.

---

## Why These Algorithms?

When designing ISE, the goal was not to include as many complex buzzwords as possible, but to choose the right tool for each step in the search and decision pipeline:

```
User's Need                   Failure in Traditional Search           ISE's Algorithmic Solution
──────────────────────────────────────────────────────────────────────────────────────────────────
Colloquial query text      ─> Keyword mismatch                     ─> 1. Query Processing & Tokenization
Implicit goal & budget     ─> System only looks for exact SKU      ─> 2. Rule-Based Query Understanding
Unnecessary full scan      ─> Slow search / irrelevant categories  ─> 3. Candidate Retrieval (Inverted Index)
Multi-factor trade-offs    ─> Cheap / underpowered items rank #1   ─> 4. Multi-Criteria Weighted Ranking
Black-box recommendations  ─> User distrusts the results           ─> 5. Explainable Ranking Synthesis
```

1. **Query Processing** ensures that messy user text is standardized into clean tokens.
2. **Rule-Based Query Understanding** bridges the vocabulary gap between functional user goals (*"เขียนโปรแกรม"*) and structured database filters (*"RAM $\ge$ 16GB, CPU $\ge$ H-Series"*).
3. **Candidate Retrieval** reduces the search space efficiently without dropping borderline candidates prematurely.
4. **Multi-Criteria Weighted Ranking** replaces naive sorting by price with a balanced evaluation of relevance, budget, hardware, and use case.
5. **Explainable Ranking** closes the loop by providing the user with the rationale behind the algorithm's recommendation.

Every algorithm connects directly to the next, forming an integrated information retrieval pipeline.

---

## Example: End-to-End Walkthrough

To see how the pipeline operates in practice, consider this search query:

```
"Gaming Laptop RTX 4060 ราคาไม่เกิน 40000"
```

### 1. Query Understanding Output
The parser extracts:
- **Category:** `Gaming Laptop`
- **GPU Target:** `RTX 4060`
- **Budget Ceiling:** $\le 40,000\text{ THB}$
- **Use Case:** `Gaming`
- **Inferred Priority:** Graphic card performance and thermal design within budget.

### 2. Candidate Retrieval
- Filters out non-gaming laptops, monitors, CPUs, and accessories.
- Soft-budget window allows laptops up to $46,000\text{ THB}$ into candidate consideration.
- Identifies gaming laptops carrying RTX 4060 chips.
- Resulting candidate pool: $4$ laptops.

### 3. Multi-Criteria Ranking Calculation

| Candidate Product | Price | Relevance (30%) | Budget (25%) | Specs (25%) | Use Case (20%) | Final Match Score | Rank |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Lenovo LOQ 15IRX9** (i5-13450HX, RTX 4060 105W) | ฿37,900 | 100 | 100 | 100 | 92 | **98 / 100** | **#1 (Best Match)** |
| **HP Victus 16** (Ryzen 5 7640HS, RTX 4060 120W) | ฿38,900 | 100 | 100 | 100 | 91 | **98 / 100** | **#2** |
| **Acer Nitro V 15** (i5-13420H, RTX 4060 75W) | ฿34,900 | 100 | 100 | 100 | 89 | **97 / 100** | **#3** |
| **ASUS TUF Gaming A15** (Ryzen 7, RTX 4060 140W) | ฿44,900 | 90 | 57 (Penalized +12% over budget) | 100 | 95 | **85 / 100** | **#4** |

### 4. Final Output & Explanation
The top-ranked product is **Lenovo LOQ 15IRX9** (Match Score: 98/100).

The system displays the following explanation:
> *"เหมาะกับความต้องการนี้เพราะ อยู่ในงบประมาณที่ตั้งไว้ (฿37,900 จากงบ ฿40,000), ใช้การ์ดจอ RTX 4060 วัตต์สูง 105W, หน้าจอ IPS 100% sRGB สีตรง, และรองรับการเล่นเกมระดับสูงได้อย่างลื่นไหล"*

Notice how **ASUS TUF A15** has the highest raw gaming specs (140W TGP, Ryzen 7), but because its price ($44,900\text{ THB}$) exceeds the user's budget, its budget score is penalized down to $57$, moving it below the machines that fit within the user's financial constraint.

---

## Prototype Architecture

ISE is built as a **zero-build, standalone web application** with a clean separation of concerns:

```
ISE/
│
├── index.html                  # Semantic HTML5 application shell & view containers
├── style.css                   # Responsive design system & typography (Noto Sans Thai)
├── script.js                   # Client-side state manager and UI orchestrator
│
├── data/
│   └── products.js             # 60+ realistic computer products with structured specs
│
├── js/
│   ├── engine/
│   │   ├── queryParser.js      # Rule-based query understanding & intent extraction
│   │   ├── retrieval.js        # Inverted token index & soft constraint filtering
│   │   ├── ranking.js          # Multi-criteria weighted ranking engine
│   │   └── explainer.js        # Explainable ranking rationale generator
│   └── benchmark/
│       └── benchmark.js        # Automated evaluation test runner & regression suite
│
├── assets/
│   └── placeholders/           # Category-specific vector SVG illustrations (100% standalone)
│
├── docs/
│   ├── PROJECT.md              # Project scope, personas, and non-goals
│   ├── ARCHITECTURE.md         # System pipeline architecture & module boundaries
│   ├── ALGORITHM.md            # Detailed mathematical formulas & worked calculations
│   ├── BENCHMARK.md            # Regression test scenarios & ground-truth evaluation
│   └── DESIGN.md               # Design tokens, typography rules, and responsive specs
│
└── README.md                   # This master documentation file
```

---

## Prototype vs. Future Production System

This project was developed as a university capstone prototype to prove the concept and validate the ranking algorithms. It is important to distinguish between what is implemented today and what would be required in a production-scale system:

| Dimension | Current Prototype Implementation | Future Production Architecture |
| :--- | :--- | :--- |
| **Application Layer** | Single-Page Application (Vanilla JS / CSS / HTML) | Decoupled Frontend (Next.js / Vue) + REST / GraphQL Backend API |
| **Data Storage** | In-memory JavaScript dataset (60+ curated products) | Relational Database (PostgreSQL) with structured spec tables |
| **Search & Retrieval** | In-memory Inverted Token Index (`Map<token, Set<id>>`) | Distributed Search Engine (Elasticsearch or OpenSearch with BM25) |
| **Query Understanding** | Deterministic Regex & Rule-Based Intent Parser | Hybrid Parser: Rule-based fast path + Statistical NLP / NER |
| **Inventory & Pricing** | Static, realistic Thai Baht catalog data | Real-time distributor inventory synchronization via ETL pipelines |
| **Caching Layer** | In-memory client state | Redis distributed cache for frequent queries and candidate sets |

---

## Benchmark & Evaluation

### Regression Test Suite
To verify that the ranking algorithm behaves correctly, the prototype includes an automated regression test suite (`js/benchmark/benchmark.js`) containing **6 standardized test scenarios**:

1. *"โน้ตบุ๊กสำหรับเขียนโปรแกรม งบไม่เกิน 30000"*
2. *"Gaming Laptop RTX 4060 ราคาไม่เกิน 40000"*
3. *"จอ 27 นิ้ว 144Hz"*
4. *"SSD 1TB สำหรับ Gaming"*
5. *"CPU สำหรับทำงาน AI"*
6. *"โน้ตบุ๊กบางเบา แบตอึด สำหรับทำงาน"*

Each scenario has an annotated **Ground Truth (GT)** set of products that technically satisfy all stated requirements.

### Measured Empirical Results (Cutoff Rank $K = 3$)

When comparing ISE against a traditional **Baseline Search** (simple keyword token matching + ascending price sort):

| Metric ($K = 3$) | Baseline Keyword Search | ISE Multi-Criteria Ranking | Relative Improvement |
| :--- | :---: | :---: | :---: |
| **Precision@3** | **0.222** | **0.944** | **+325.2%** |
| **Recall@3** | **0.167** | **0.819** | **+390.4%** |
| **Mean Reciprocal Rank (MRR)** | **0.256** | **1.000** | **+290.6%** |
| **Average Search Latency** | $0.08\text{ ms}$ | $2.55\text{ ms}$ | Instantaneous in-browser |

> **What These Numbers Mean (and What They Do Not Mean):**  
> An MRR of $1.000$ and Precision@3 of $0.944$ indicate that across these 6 standardized scenarios, ISE consistently placed a valid ground-truth product at Rank #1, whereas baseline price-sorting repeatedly placed underpowered budget hardware at the top.  
> **This does not mean the system has "100% accuracy" in general.** In Information Retrieval, evaluation quality depends heavily on catalog size and the breadth of test queries. These results prove that the multi-criteria ranking algorithm functions as intended on its regression test suite.

### Future Evaluation Roadmap
A full-scale production evaluation would expand on this by:
- Collecting a large-scale test collection of hundreds of real user queries.
- Measuring **NDCG@K** (Normalized Discounted Cumulative Gain) to assess graded relevance.
- Measuring **Zero-Result Rate** across conversational long-tail queries.
- Running live A/B tests with real buyers to measure click-through rates (CTR) and decision time.

---

## Tech Stack

- **Frontend:** Semantic HTML5, Custom Responsive CSS3 (8pt spacing grid, responsive from 375px to 1920px), Modern Vanilla JavaScript (ES6+).
- **Typography:** `Noto Sans Thai` (Thai readability), `Inter` (English hardware specifications), `JetBrains Mono` (Prices, formulas, benchmark values).
- **Search Engine:** Custom in-memory Information Retrieval engine (Inverted Token Index, rule-based intent parser, multi-criteria scoring matrix).
- **Dependencies:** None. Completely standalone zero-build architecture.
- **Testing:** In-browser interactive test suite and headless Node.js runner.

---

## Project Status

- [x] Natural-language query parser for Thai and English
- [x] Structured query understanding visualizer
- [x] In-memory inverted index candidate retrieval
- [x] Multi-criteria weighted ranking algorithm ($30/25/25/20$ weight model)
- [x] Dynamic signal-based explanation generator
- [x] Side-by-side product comparison tool with difference highlighting
- [x] Technical specification slide-out drawer
- [x] Automated benchmark & regression test runner
- [x] 60+ authentic computer hardware items across 11 categories
- [x] Fully responsive layout (tested at 375px, 430px, 768px, 1024px, 1440px)
- [x] Complete technical documentation suite (`docs/`)

---

## Future Improvements

1. **User-Configurable Ranking Weights:** Allow users to adjust the weighting sliders (e.g., boosting the Budget weight to 40% if they are strictly price-sensitive, or boosting Specifications to 40% if performance is paramount).
2. **Catalog Expansion:** Expand the product dataset from 60 items to 500+ items across more specialized hardware subcategories (e.g., custom water-cooling, NAS storage, color-grading monitors).
3. **Compound Thai Word Handling:** Enhance Thai tokenization to better handle ambiguous compound terms without explicit spaces.
4. **Live Price Tracking:** Integrate with real-time retailer APIs to track flash sales, price drops, and historical price graphs.

---

## How to Run

### Method 1: Open Directly in Browser
Because the prototype has zero build dependencies, you can simply double-click `index.html` to run it in any modern browser (Chrome, Edge, Safari, Firefox).

### Method 2: Run via Local HTTP Server (Recommended)
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .
```
Open your browser and navigate to `http://localhost:8000`.

### Method 3: Run the Benchmark Regression Tests via Node.js
```bash
node -e "
const { ISE_PRODUCTS } = require('./data/products.js');
const { ISEQueryParser } = require('./js/engine/queryParser.js');
const { ISERetrievalEngine } = require('./js/engine/retrieval.js');
const { ISERankingEngine } = require('./js/engine/ranking.js');
const { ISEBenchmarkRunner } = require('./js/benchmark/benchmark.js');

const runner = new ISEBenchmarkRunner(ISE_PRODUCTS, ISEQueryParser, new ISERetrievalEngine(ISE_PRODUCTS), new ISERankingEngine());
console.log(runner.evaluate(3).summary);
"
```

---

## Conclusion

The **ISE** prototype demonstrates that solving the e-commerce product discovery problem does not require opaque black-box AI or massive cloud infrastructure. By applying fundamental principles of **Information Retrieval**, **Rule-Based Intent Understanding**, and **Multi-Criteria Decision Analysis**, ISE transforms conversational requirements into structured search criteria, ranks products according to genuine utility, and explains its recommendations with complete clarity.

---

*Developed as a University Capstone Project Prototype under the **NexusTech / ISE** brand.*
