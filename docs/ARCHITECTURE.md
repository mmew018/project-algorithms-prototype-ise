# ISE System Architecture & Engineering Blueprint

---

## 1. High-Level Architectural Pipeline
The ISE processing pipeline enforces strict separation of concerns across 5 discrete stages:

```
[ USER QUERY (Thai / English) ]
               │
               ▼
   [ 1. QUERY UNDERSTANDING ]
       ├── Tokenizer & Normalizer
       ├── Category & Brand Detector
       ├── Budget Bounds Extractor (Min, Max)
       ├── Component Specs Extractor (CPU, GPU, RAM, Storage, Screen, Hz)
       └── Use Case Classifier (Programming, Gaming, Thin & Light, AI)
               │
               ▼ Structured Intent Object
   [ 2. CANDIDATE RETRIEVAL ]
       ├── Inverted Token Index Lookup
       ├── Category Hard/Soft Filter
       └── Budget Tolerance Window (≤ 1.15 × Max Budget)
               │
               ▼ Candidate Set C (Sub-catalog)
   [ 3. MULTI-CRITERIA RANKING ]
       ├── Relevance Score Calculation (30%)
       ├── Budget Utility & Penalty Function (25%)
       ├── Hardware Specification Evaluator (25%)
       └── Domain Use Case Suitability (20%)
               │
               ▼ Ranked & Scored Products
   [ 4. EXPLAINABILITY ENGINE ]
       ├── Signal-to-Text Mapping
       ├── Budget & Hardware Compliances
       └── Trade-off & Consideration Synthesis
               │
               ▼
   [ 5. USER INTERFACE & COMPARISON ]
       ├── "เราเข้าใจความต้องการของคุณ" Intent Card
       ├── Best Match Hero Badge
       ├── Score Breakdown (4 Pillars)
       └── Side-by-Side Product Comparison (Up to 3 Products)
```

---

## 2. Module Responsibilities & Boundary Definition

### A. Data Layer (`data/products.js`)
- Houses the authentic hardware catalog of 60+ products across 11 key categories.
- Ensures physical and technical consistency (e.g. realistic GPU TGPs, valid CPU socket configurations, authentic battery Wh ratings).
- Structured schema exposes numeric attributes (`price`, `ram`, `storage`, `displaySize`, `refreshRate`, `weight`, `battery`) and normalized domain ratings (`performanceLevel`, `gamingLevel`, `productivityLevel`, `programmingLevel`, `aiWorkloadLevel`).

### B. Query Understanding Engine (`js/engine/queryParser.js`)
- **Type:** Deterministic Rule-Based Natural Language Parser.
- **Responsibilities:**
  - Tokenizes mixed Thai and English strings without external remote dependencies.
  - Extracts numeric budget bounds with unit normalization (`"30000"`, `"30k"`, `"3 หมื่น"`, `"ไม่เกิน 40,000"`).
  - Matches hardware nomenclature (e.g. `RTX 4060`, `i5-13500H`, `Ryzen 7 7800X3D`, `144Hz`, `27 นิ้ว`).
  - Maps conversational phrases to domain use cases (e.g. `"เขียนโปรแกรม"` $\to$ `Programming`, `"บางเบา แบตอึด"` $\to$ `Thin & Light`).

### C. Retrieval Engine (`js/engine/retrieval.js`)
- **Type:** In-Memory Inverted Index & Multi-Attribute Constraint Filter.
- **Data Structure:** `Map<Token, Set<ProductId>>` mapping lowercased alphanumeric terms to document postings.
- **Responsibilities:**
  - Fast $O(1)$ token lookup.
  - Category partition filtering.
  - Soft-boundary budget enforcement: allows candidates up to $+15\%$ over budget into the ranking phase so the multi-criteria algorithm can penalize them mathematically rather than causing false zero-result drops.

### D. Ranking Engine (`js/engine/ranking.js`)
- **Type:** Multi-Criteria Weighted Decision Matrix.
- **Responsibilities:**
  - Computes four distinct sub-scores $[0, 100]$:
    $$\text{FinalScore} = 0.30 \times S_{\text{rel}} + 0.25 \times S_{\text{bud}} + 0.25 \times S_{\text{spec}} + 0.20 \times S_{\text{use}}$$
  - Implements smooth budget penalty curves for products above target budgets and rewards optimal budget utilization for products within budget.
  - Outputs transparent score breakdowns to the UI.

### E. Explainability Engine (`js/engine/explainer.js`)
- **Type:** Template & Signal Synthesis Generator.
- **Responsibilities:**
  - Maps actual winning ranking signals into concise Thai sentences.
  - Generates bulleted compliance highlights and honest trade-offs (e.g. chassis weight, display color gamut).

### F. Application Controller (`script.js`)
- **Type:** Single Page Architecture (SPA) State Manager.
- **Responsibilities:**
  - Coordinates event listeners, manages browser history and view switching.
  - Handles sidebar filter mutations and dynamic sorting without reloading.
  - Manages the Comparison State (dock, item selection, diff table rendering).

---

## 3. Data Flow Diagram

```
User Input
    │
    ▼
script.js (onSearchSubmit)
    │
    ├──> ISEQueryParser.parse(query)
    │       │
    │       ▼ parsedIntent
    │
    ├──> ISERetrievalEngine.retrieveCandidates(parsedIntent)
    │       │
    │       ▼ candidateProducts (C)
    │
    ├──> ISERankingEngine.rank(candidateProducts, parsedIntent)
    │       │
    │       ▼ rankedProducts with scoreBreakdown
    │
    ├──> ISEExplainer.explain(product, parsedIntent)
    │       │
    │       ▼ dynamicRationale
    │
    └──> DOM Renderers (Query Card, Product Grid, Drawer, Comparison Dock)
```

---

## 4. Algorithmic Complexity Discussion
- **Query Parsing:** $O(T)$ where $T$ is the number of tokens in the query string. Regex matches execute in under $1\text{ ms}$.
- **Inverted Index Construction:** $O(N \cdot M)$ performed once at startup, where $N$ is catalog size ($60$) and $M$ is the average token count per product. Runtime: $< 2\text{ ms}$.
- **Candidate Retrieval:** $O(K \cdot L)$ where $K$ is the query token count and $L$ is posting list size.
- **Multi-Criteria Ranking:** $O(C \log C)$ where $C$ is the candidate count ($C \le N$). For $N = 60$, execution completes in under $3\text{ ms}$ on standard consumer hardware.
