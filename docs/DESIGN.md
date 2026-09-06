# ISE Design System & UI/UX Principles

---

## 1. Visual Identity & Brand Philosophy
- **Brand Identity:** NexusTech / ISE
- **Design Language:** Modern Thai Technology Discovery Platform
- **Visual Influence:** Learns from the specification density and technical utility of **NotebookSPEC**, combined with modern clean editorial technology sites (Apple, AnandTech, Rtings).
- **Core Principle:** Information density with high visual clarity — not a generic SaaS landing page, not a toy CRUD app, but an authentic technical decision tool.

---

## 2. Typography System
ISE employs a tri-font typography hierarchy engineered for bilingual Thai-English legibility:

| Role | Font Family | Typical Usage |
| :--- | :--- | :--- |
| **Thai UI & Headings** | `Noto Sans Thai` | Page titles, buttons, Thai spec labels, explanations |
| **English / Tech Terms** | `Inter` | Hardware names, navigation links, secondary specs |
| **Metrics, Formulas & Code** | `JetBrains Mono` | Benchmark numbers, prices (THB), formulas, latency |

### Typography Scale & Leading:
- **Hero Headline:** `1.75rem` ($28\text{px}$), weight $800$, line-height $1.3$.
- **Card Titles:** `1.08rem` ($17.2\text{px}$), weight $700$, line-height $1.35$.
- **Body & Explanations:** `0.95rem` ($15.2\text{px}$), line-height $1.65$ (essential for Thai script vowel mark clearance).
- **Specification Chips:** `0.76rem` ($12.1\text{px}$), weight $500$.

---

## 3. Color Tokens & Semantic Roles

### Primary Technology Palette:
- `--color-primary`: `#2563eb` (Royal Technology Blue) — Main call-to-action buttons, Best Match badge, active tabs.
- `--color-primary-hover`: `#1d4ed8` — Interactive hover states.
- `--color-primary-light`: `#eff6ff` — Active chip backgrounds, subtle card fills.
- `--color-accent`: `#0284c7` (Sky Blue) — Gradient accents, secondary highlights.

### Semantic State Colors:
- `--color-success`: `#10b981` (Emerald) — High match scores ($\ge 85$), budget-compliant indicators, strengths.
- `--color-warning`: `#f59e0b` (Amber) — Moderate scores ($70-84$), trade-offs, considerations.
- `--color-danger`: `#ef4444` (Crimson) — Over-budget alerts, missing requirements.

### Neutral Base:
- `--bg-app`: `#f8fafc` (Slate 50) — Main body background.
- `--bg-surface`: `#ffffff` — Cards, sidebar, modal background.
- `--text-main`: `#0f172a` (Slate 900) — Primary high-contrast typography.
- `--text-secondary`: `#475569` (Slate 600) — Body text, spec details.
- `--border-light`: `#e2e8f0` (Slate 200) — Structural borders.

---

## 4. Component Information Architecture

### A. Query Understanding Card ("เราเข้าใจความต้องการของคุณ")
- Visualized immediately upon query submission.
- Uses distinct thematic badges (Category, Brand, Budget Range, Target Hardware, Inferred Priority).
- Reinforces user trust by making system comprehension visible.

### B. Product Card Hierarchy
1. **Best Match Badge:** Reserved for the top-ranked item when $\text{Score} \ge 70$. Subtle premium gradient with star icon.
2. **Media Column:** Vector hardware illustration with brand badge.
3. **Information Column:** Category breadcrumb, full model name, hardware chip tags, and dynamic "ทำไมระบบจึงแนะนำตัวนี้" rationale.
4. **Action Column:** Overall Match Score meter, 4-pillar sub-score breakdown (Relevance, Budget, Specs, Use Case), price in Thai Baht, and comparison toggle button.

### C. Side-by-Side Comparison Matrix
- Fixed 3-column capacity.
- Sticky column parameters.
- **Diff Highlighting Mode:** Toggling the highlight button applies a distinctive `#fef08a` amber fill to rows where values diverge (e.g. differing CPU models, RAM sizes, or price).

---

## 5. Responsive Design & Breakpoints
Tested and certified across standard screen dimensions:
- **Mobile Small (375px - 430px):** Single-column stacked cards, full-width action buttons, touch targets $\ge 44\text{px}$.
- **Tablet (768px):** Collapsible filter sidebar via mobile filter trigger drawer, 2-column benchmark cards.
- **Desktop (1024px - 1440px):** 2-column layout (260px sticky sidebar + fluid product grid), 3-column comparison matrix, 4-column metric scorecards.
- **Ultra-Wide (1920px):** Centered layout with max-width $1360\text{px}$ preventing stretched typography.

---

## 6. Accessibility & Inclusivity (WCAG AA Compliance)
- **Contrast Ratios:** Minimum $4.5:1$ contrast on all body text against backgrounds.
- **Semantic HTML:** `<header>`, `<nav>`, `<main>`, `<aside>`, `<article>`, `<footer>`, `<button>`.
- **Visible Focus States:** `outline: 2px solid #2563eb; outline-offset: 2px;` on all interactive controls.
- **Motion Reduction:** Full `@media (prefers-reduced-motion: reduce)` support with immediate zero-duration transitions.
