# ISE (Intelligent Search Engine for Computer & Technology Products)
## Project Specification & Capstone Charter

---

## 1. Executive Summary & Brand Identity
- **Product Name:** ISE
- **Full Name:** Intelligent Search Engine for Computer & Technology Products
- **Prototype Brand:** NexusTech / ISE
- **Academic Context:** University Capstone Project (Information Systems / Computer Science, ~2 Months Development Cycle)
- **Primary Domain:** Computer hardware, laptops, components, displays, and high-performance workstation peripherals.

### Core Value Proposition:
Traditional e-commerce platforms force users to translate their functional goals into precise SKU keywords and static database filters. ISE transforms this paradigm by interpreting natural language requirements:
> *"จากความต้องการของฉัน สินค้าไหนเหมาะที่สุด และเพราะอะไร?"*
> *(From my functional needs and budgetary constraints, which product is optimal, and why?)*

---

## 2. Problem Statement
Modern computer hardware catalogs feature intricate specifications with multidimensional trade-offs:
- CPU cores, clock frequencies, thermal design power (TDP), cache architectures (e.g. 3D V-Cache, AVX-512).
- GPU architectures, TGP wattage limits, VRAM capacities, memory buses.
- Display resolutions, panel types (IPS, OLED, Fast IPS), color spaces (sRGB, DCI-P3), refresh rates.
- Form factor considerations, battery capacities (Wh), and chassis weight.

### Limitations of Traditional E-Commerce Search:
1. **Keyword Rigidity (Exact-Match Failure):** A query like `"โน้ตบุ๊กสำหรับเขียนโปรแกรม งบไม่เกิน 30000"` fails if product titles do not explicitly contain the exact tokens `"เขียนโปรแกรม"`.
2. **Binary Filter Dropping:** Hard price filters abruptly drop products that are minimally over budget (e.g. ฿30,900 on a ฿30,000 budget), even if they provide 50% better specifications and longevity.
3. **Absence of Explainability:** Search results are sorted by popularity or ascending price without explaining *why* a particular machine is suited for software development, gaming, or content creation.

---

## 3. Project Objectives & Engineering Goals
1. **Natural Language Requirement Understanding:** Deterministic extraction of hardware category, target brand, budgetary bounds, component criteria, and domain use cases from mixed Thai/English queries.
2. **Candidate Retrieval Layer:** Multi-attribute inverted index lookup and constraint evaluation.
3. **Multi-Criteria Ranking:** Computation of genuine mathematical match scores based on 4 pillars:
   - Relevance (30%)
   - Budget (25%)
   - Specifications (25%)
   - Use Case (20%)
4. **Transparent Explainability:** Dynamic generation of factual, specification-grounded rationales explaining why each product is recommended.
5. **Decision Support & Comparison:** Side-by-side comparison matrix for up to 3 products with automated differential highlighting.
6. **Empirical Evaluation Framework:** Standardized regression test suite calculating Information Retrieval metrics (Precision@K, Recall@K, MRR, Latency) comparing baseline keyword search against ISE.

---

## 4. System Boundaries & Non-Goals
To preserve academic credibility and adhere to the 2-month capstone timeline, the project maintains strict boundaries:

| Included in ISE Scope | Explicit Non-Goals |
| :--- | :--- |
| Natural language query parsing (Rule-based & Regex) | Heavy external LLMs / Cloud AI API dependencies |
| Inverted index candidate retrieval | Distributed cluster infrastructure / Kubernetes |
| Multi-criteria mathematical ranking | Real-time payment gateways / Shopping cart checkout |
| Explainable recommendation synthesis | Social networking / Live user chat systems |
| Side-by-side spec comparison tool | Real-time distributor inventory synchronization |
| Empirical benchmark test runner | Black-box unverified neural search claims |

---

## 5. Development Timeline & Milestone Cadence
- **Weeks 1–2:** Requirements analysis, hardware data modeling (70+ products schema), taxonomy definition.
- **Weeks 3–4:** Information retrieval engine, rule-based Thai NLP parser, in-memory inverted index.
- **Weeks 5–6:** Multi-criteria weighted ranking formulation, dynamic rationale synthesis.
- **Weeks 7–8:** High-density UI implementation (NotebookSPEC inspiration + modern design system), comparison tool, benchmark suite, cross-resolution visual QA, and technical documentation.
