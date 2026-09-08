# ISE (Intelligent Search Engine for Computer & Technology Products)
## Project Specification & Capstone Charter

---

## 1. Executive Summary & Brand Identity
- **Product Name:** ISE
- **Full Name:** Intelligent Search Engine for Computer & Technology Products
- **Prototype Brand:** NexusTech / ISE
- **Academic Context:** University Capstone Project Prototype (Information Systems / Computer Science)
- **Primary Domain:** Computer hardware, laptops, components, displays, and high-performance workstation peripherals.

### Core Value Proposition:
A simple keyword baseline requires users to translate functional goals into explicit product terms. ISE explores how rule-based intent extraction and multi-criteria ranking can support queries expressed as needs:
> *"จากความต้องการของฉัน สินค้าไหนเหมาะที่สุด และเพราะอะไร?"*
> *(From my functional needs and budgetary constraints, which product is optimal, and why?)*

---

## 2. Problem Statement
Modern computer hardware catalogs feature intricate specifications with multidimensional trade-offs:
- CPU cores, clock frequencies, thermal design power (TDP), cache architectures (e.g. 3D V-Cache, AVX-512).
- GPU architectures, TGP wattage limits, VRAM capacities, memory buses.
- Display resolutions, panel types (IPS, OLED, Fast IPS), color spaces (sRGB, DCI-P3), refresh rates.
- Form factor considerations, battery capacities (Wh), and chassis weight.

### Limitations of the Project Keyword Baseline:
1. **Keyword Rigidity:** Exact token matching can miss functional intent when the same words do not appear in product text.
2. **Binary Filtering:** A hard price boundary can remove products slightly above a stated budget without showing them as relaxed alternatives.
3. **No Generated Explanation:** The baseline used in this project does not generate a reason for each ranking position.

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
To preserve academic credibility, the prototype maintains strict boundaries:

| Included in ISE Scope | Explicit Non-Goals |
| :--- | :--- |
| Natural language query parsing (Rule-based & Regex) | Heavy external LLMs / Cloud AI API dependencies |
| Inverted index candidate retrieval | Distributed cluster infrastructure / Kubernetes |
| Multi-criteria mathematical ranking | Real-time payment gateways / Shopping cart checkout |
| Explainable recommendation synthesis | Social networking / Live user chat systems |
| Side-by-side spec comparison tool | Real-time distributor inventory synchronization |
| Empirical benchmark test runner | Black-box unverified neural search claims |

---

## 5. Reference Milestone Plan

แผนด้านล่างใช้แสดงลำดับงานที่เหมาะสมสำหรับพัฒนา Prototype และไม่ใช่หลักฐานยืนยันระยะเวลาที่ใช้จริง

- **Weeks 1–2:** Requirements analysis, hardware data modeling (60 products / 11 categories), taxonomy definition.
- **Weeks 3–4:** Information retrieval engine, rule-based Thai NLP parser, in-memory inverted index.
- **Weeks 5–6:** Multi-criteria weighted ranking formulation, dynamic rationale synthesis.
- **Weeks 7–8:** High-density UI implementation (NotebookSPEC inspiration + modern design system), comparison tool, benchmark suite, cross-resolution visual QA, and technical documentation.
