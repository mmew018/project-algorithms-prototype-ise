/**
 * ISE — Intelligent Search Engine for Computer & Technology Products
 * Main Application Controller & UI Coordinator
 *
 * Coordinates:
 * - Query Parsing & Intent Visualization
 * - Inverted Index Candidate Retrieval
 * - Multi-Criteria Weighted Ranking
 * - Explainable Rationale Generation
 * - Adaptive Filtering & Multi-Criteria Sorting
 * - Product Comparison (up to 3 products with diff highlighting)
 * - Product Detail Drawer (NotebookSPEC style density)
 * - Live Automated Benchmark Runner
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. STATE MANAGEMENT
  // ==========================================================================
  const State = {
    products: window.ISE_PRODUCTS || [],
    retrievalEngine: null,
    rankingEngine: null,
    benchmarkRunner: null,

    // Query & Results
    currentQuery: '',
    parsedIntent: null,
    rawCandidates: [],
    rankedResults: [],
    displayedResults: [],

    // Filters & Sorting
    activeCategory: '',
    filters: {
      priceMin: null,
      priceMax: null,
      brands: new Set(),
      ram: new Set(),
      gpu: new Set()
    },
    currentSort: 'match',

    // Comparison List (Max 3 Product IDs)
    compareList: [],
    highlightDiffs: false,

    // Active View
    activeView: 'search'
  };

  // ==========================================================================
  // 2. DOM ELEMENT REFERENCES
  // ==========================================================================
  const DOM = {
    // Navigation
    mainNav: document.getElementById('mainNav'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    navLinks: document.querySelectorAll('.nav-link'),
    navCompareCount: document.getElementById('navCompareCount'),
    categoryQuickbar: document.getElementById('categoryQuickbar'),
    catBtns: document.querySelectorAll('.cat-btn'),

    // Search
    searchForm: document.getElementById('searchForm'),
    searchInput: document.getElementById('searchInput'),
    searchClearBtn: document.getElementById('searchClearBtn'),
    promptChips: document.querySelectorAll('.prompt-chip'),
    pipelineStatus: document.getElementById('pipelineStatus'),
    pipelineStatusText: document.getElementById('pipelineStatusText'),

    // Views
    viewSections: document.querySelectorAll('.view-section'),
    viewSearch: document.getElementById('viewSearch'),
    viewCompare: document.getElementById('viewCompare'),
    viewBenchmark: document.getElementById('viewBenchmark'),

    // Query Understanding Card
    queryUnderstandingCard: document.getElementById('queryUnderstandingCard'),
    quChipsContainer: document.getElementById('quChipsContainer'),
    quPriorityText: document.getElementById('quPriorityText'),
    quRawEcho: document.getElementById('quRawEcho'),

    // Results Meta Bar
    resultsCount: document.getElementById('resultsCount'),
    resultsLatency: document.getElementById('resultsLatency'),
    sortSelect: document.getElementById('sortSelect'),
    mobileFilterTrigger: document.getElementById('mobileFilterTrigger'),

    // Sidebar Filters
    filterSidebar: document.getElementById('filterSidebar'),
    filterResetBtn: document.getElementById('filterResetBtn'),
    filterCloseBtn: document.getElementById('filterCloseBtn'),
    filterPriceMin: document.getElementById('filterPriceMin'),
    filterPriceMax: document.getElementById('filterPriceMax'),
    filterBrandList: document.getElementById('filterBrandList'),
    filterRamList: document.getElementById('filterRamList'),
    filterGpuList: document.getElementById('filterGpuList'),

    // Product Grid & Empty State
    productGrid: document.getElementById('productGrid'),
    emptyState: document.getElementById('emptyState'),
    emptyStateDesc: document.getElementById('emptyStateDesc'),
    relaxSuggestions: document.getElementById('relaxSuggestions'),

    // Product Detail Drawer
    drawerBackdrop: document.getElementById('drawerBackdrop'),
    productDrawer: document.getElementById('productDrawer'),
    drawerCloseBtn: document.getElementById('drawerCloseBtn'),
    drawerCategory: document.getElementById('drawerCategory'),
    drawerTitle: document.getElementById('drawerTitle'),
    drawerPrice: document.getElementById('drawerPrice'),
    drawerBody: document.getElementById('drawerBody'),
    drawerCompareBtn: document.getElementById('drawerCompareBtn'),

    // Compare View & Dock
    compareDock: document.getElementById('compareDock'),
    compareDockCount: document.getElementById('compareDockCount'),
    compareDockOpenBtn: document.getElementById('compareDockOpenBtn'),
    compareDockClearBtn: document.getElementById('compareDockClearBtn'),
    compareTableWrapper: document.getElementById('compareTableWrapper'),
    btnToggleDiffs: document.getElementById('btnToggleDiffs'),
    btnClearCompare: document.getElementById('btnClearCompare'),

    // Benchmark View
    btnRunBenchmark: document.getElementById('btnRunBenchmark'),
    mIsePrecision: document.getElementById('mIsePrecision'),
    mBasePrecision: document.getElementById('mBasePrecision'),
    mIseRecall: document.getElementById('mIseRecall'),
    mBaseRecall: document.getElementById('mBaseRecall'),
    mIseMrr: document.getElementById('mIseMrr'),
    mBaseMrr: document.getElementById('mBaseMrr'),
    mIseLatency: document.getElementById('mIseLatency'),
    benchmarkScenariosList: document.getElementById('benchmarkScenariosList')
  };

  // ==========================================================================
  // 3. INITIALIZATION
  // ==========================================================================
  function init() {
    // 1. Instantiate Engines
    State.retrievalEngine = new window.ISERetrievalEngine(State.products);
    State.rankingEngine = new window.ISERankingEngine();
    State.benchmarkRunner = new window.ISEBenchmarkRunner(
      State.products,
      window.ISEQueryParser,
      State.retrievalEngine,
      State.rankingEngine
    );

    // 2. Build Sidebar Filter Options
    buildSidebarFilterOptions();

    // 3. Attach Event Listeners
    attachEventListeners();

    // 4. Handle initial URL hash or perform default search
    handleRouting();

    // 5. Populate initial benchmark results
    renderBenchmarkReport();
  }

  // ==========================================================================
  // 4. ROUTING & VIEW NAVIGATION
  // ==========================================================================
  function switchView(viewName) {
    State.activeView = viewName;

    // Update Nav Links
    DOM.navLinks.forEach(link => {
      if (link.dataset.view === viewName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update Section Visibility
    DOM.viewSections.forEach(sec => {
      sec.classList.remove('active');
    });

    const targetSection = document.getElementById(
      viewName === 'catalog' ? 'viewSearch' :
      viewName === 'how-it-works' ? 'viewHowItWorks' :
      viewName === 'algorithm' ? 'viewAlgorithm' :
      viewName === 'benchmark' ? 'viewBenchmark' :
      viewName === 'compare' ? 'viewCompare' :
      viewName === 'about' ? 'viewAbout' : 'viewSearch'
    );

    if (targetSection) {
      targetSection.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (viewName === 'compare') {
      renderCompareTable();
    } else if (viewName === 'catalog') {
      // Show full catalog without query
      executeSearch('', '');
    }

    // Close mobile nav if open
    DOM.mainNav.classList.remove('mobile-open');
  }

  function handleRouting() {
    const hash = window.location.hash.replace('#', '') || 'search';
    switchView(hash);
  }

  // ==========================================================================
  // 5. SEARCH & RANKING PIPELINE
  // ==========================================================================
  function executeSearch(queryText, forcedCategory = null) {
    const tStart = performance.now();
    State.currentQuery = queryText || '';

    // Step 1: Query Understanding
    State.parsedIntent = window.ISEQueryParser.parse(State.currentQuery);

    // Apply forced category override if clicked from quickbar
    if (forcedCategory !== null) {
      State.activeCategory = forcedCategory;
      if (forcedCategory) {
        State.parsedIntent.category = forcedCategory;
      }
    } else if (State.parsedIntent.category) {
      State.activeCategory = State.parsedIntent.category;
    }

    // Synchronize quickbar UI active state
    DOM.catBtns.forEach(btn => {
      if (btn.dataset.cat === State.activeCategory) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Step 2: Candidate Retrieval
    const retrievalResult = State.retrievalEngine.retrieveCandidates(State.parsedIntent);
    State.rawCandidates = retrievalResult.candidates;

    // Step 3: Multi-Criteria Ranking
    State.rankedResults = State.rankingEngine.rank(State.rawCandidates, State.parsedIntent);

    // Step 4: Apply Additional Sidebar Filters
    applyFiltersAndSort();

    const tEnd = performance.now();
    const latency = (tEnd - tStart).toFixed(2);

    // Step 5: Render UI
    renderQueryUnderstanding(State.parsedIntent);
    DOM.resultsLatency.textContent = `คำนวณใน ${latency} ms`;

    // Switch view to search if currently elsewhere
    if (State.activeView !== 'search' && State.activeView !== 'catalog') {
      switchView('search');
    }
  }

  function renderQueryUnderstanding(intent) {
    if (!intent || (!intent.category && !intent.budget.max && !intent.specs.gpu && !intent.specs.ram && !intent.specs.displaySize && !intent.useCase)) {
      DOM.queryUnderstandingCard.style.display = 'none';
      return;
    }

    DOM.queryUnderstandingCard.style.display = 'block';
    DOM.quRawEcho.textContent = intent.rawQuery ? `คำค้นหา: "${intent.rawQuery}"` : '';

    let chipsHtml = '';

    if (intent.category) {
      chipsHtml += `<span class="qu-chip accent">📁 หมวดหมู่: <strong>${escapeHtml(intent.category)}</strong></span>`;
    }
    if (intent.brand) {
      chipsHtml += `<span class="qu-chip">🏷️ แบรนด์: <strong>${escapeHtml(intent.brand)}</strong></span>`;
    }
    if (intent.budget && intent.budget.max) {
      chipsHtml += `<span class="qu-chip budget">💰 งบประมาณ: <strong>≤ ฿${intent.budget.max.toLocaleString()}</strong></span>`;
    }
    if (intent.useCase) {
      chipsHtml += `<span class="qu-chip accent">🎯 การใช้งาน: <strong>${escapeHtml(intent.useCase)}</strong></span>`;
    }
    if (intent.specs.gpu) {
      chipsHtml += `<span class="qu-chip">🎮 การ์ดจอ: <strong>${escapeHtml(intent.specs.gpu)}</strong></span>`;
    }
    if (intent.specs.cpu) {
      chipsHtml += `<span class="qu-chip">⚙️ CPU: <strong>${escapeHtml(intent.specs.cpu)}</strong></span>`;
    }
    if (intent.specs.ram) {
      chipsHtml += `<span class="qu-chip">⚡ RAM: <strong>≥ ${intent.specs.ram}GB</strong></span>`;
    }
    if (intent.specs.storage) {
      const sText = intent.specs.storage >= 1000 ? `${intent.specs.storage / 1000}TB` : `${intent.specs.storage}GB`;
      chipsHtml += `<span class="qu-chip">💾 พื้นที่จัดเก็บ: <strong>${sText}</strong></span>`;
    }
    if (intent.specs.displaySize) {
      chipsHtml += `<span class="qu-chip">🖥️ ขนาดจอ: <strong>${intent.specs.displaySize}"</strong></span>`;
    }
    if (intent.specs.refreshRate) {
      chipsHtml += `<span class="qu-chip">🔄 รีเฟรชเรต: <strong>≥ ${intent.specs.refreshRate}Hz</strong></span>`;
    }

    DOM.quChipsContainer.innerHTML = chipsHtml;
    DOM.quPriorityText.textContent = intent.priority || 'ความเหมาะสมโดยรวมของสเปกต่อราคา';
  }

  // ==========================================================================
  // 6. FILTERING & SORTING
  // ==========================================================================
  function applyFiltersAndSort() {
    let filtered = [...State.rankedResults];

    // Price Filter
    if (State.filters.priceMin !== null) {
      filtered = filtered.filter(p => p.price >= State.filters.priceMin);
    }
    if (State.filters.priceMax !== null) {
      filtered = filtered.filter(p => p.price <= State.filters.priceMax);
    }

    // Brand Filter
    if (State.filters.brands.size > 0) {
      filtered = filtered.filter(p => State.filters.brands.has(p.brand));
    }

    // RAM Filter
    if (State.filters.ram.size > 0) {
      filtered = filtered.filter(p => State.filters.ram.has(String(p.ram)));
    }

    // GPU Filter
    if (State.filters.gpu.size > 0) {
      filtered = filtered.filter(p => {
        const gpuStr = `${p.gpu || ''} ${p.gpuChip || ''}`.toLowerCase();
        for (const g of State.filters.gpu) {
          if (gpuStr.includes(g.toLowerCase())) return true;
        }
        return false;
      });
    }

    // Sort Results
    switch (State.currentSort) {
      case 'match':
        filtered.sort((a, b) => b.matchScore - a.matchScore);
        break;
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'spec':
        filtered.sort((a, b) => b.scoreBreakdown.specs - a.scoreBreakdown.specs);
        break;
      case 'relevance':
        filtered.sort((a, b) => b.scoreBreakdown.relevance - a.scoreBreakdown.relevance);
        break;
    }

    State.displayedResults = filtered;
    renderProductGrid();
  }

  function buildSidebarFilterOptions() {
    // Unique Brands
    const brands = [...new Set(State.products.map(p => p.brand))].sort();
    DOM.filterBrandList.innerHTML = brands.map(b => `
      <label class="filter-checkbox-label">
        <input type="checkbox" name="filterBrand" value="${escapeHtml(b)}">
        ${escapeHtml(b)}
      </label>
    `).join('');
  }

  // ==========================================================================
  // 7. PRODUCT GRID & CARD RENDERING
  // ==========================================================================
  function renderProductGrid() {
    const products = State.displayedResults;
    DOM.resultsCount.textContent = products.length;

    if (products.length === 0) {
      DOM.productGrid.style.display = 'none';
      DOM.emptyState.style.display = 'block';
      renderEmptyStateSuggestions();
      return;
    }

    DOM.productGrid.style.display = 'flex';
    DOM.emptyState.style.display = 'none';

    let html = '';

    products.forEach((product, index) => {
      const isBestMatch = (index === 0 && State.currentSort === 'match' && product.matchScore >= 70);
      const explanation = window.ISEExplainer.explain(product, State.parsedIntent || {});
      const inCompare = State.compareList.includes(product.id);

      // Score color class
      const scoreClass = product.matchScore >= 85 ? 'high' : product.matchScore >= 70 ? 'mid' : 'fair';

      html += `
        <article class="product-card ${isBestMatch ? 'best-match' : ''}" data-id="${product.id}">
          ${isBestMatch ? `
            <div class="best-match-badge-wrap">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span>BEST MATCH — ตรงกับความต้องการที่สุด</span>
            </div>
          ` : ''}

          <!-- Media / Thumbnail -->
          <div class="card-media-col">
            <span class="card-brand-tag">${escapeHtml(product.brand)}</span>
            <img src="${product.image || 'assets/placeholders/laptop.svg'}" alt="${escapeHtml(product.name)}" class="product-thumb" loading="lazy">
          </div>

          <!-- Product Specifications & Information -->
          <div class="card-info-col">
            <span class="card-category-badge">${escapeHtml(product.category)} • ${escapeHtml(product.subcategory || '')}</span>
            <h3 class="card-product-title">${escapeHtml(product.name)}</h3>

            <!-- Specification Tags -->
            <div class="card-spec-tags">
              ${product.cpu && product.cpu !== '-' ? `<span class="spec-tag highlight">⚙️ ${escapeHtml(product.cpu.split('(')[0].trim())}</span>` : ''}
              ${product.gpu && product.gpu !== '-' ? `<span class="spec-tag highlight">🎮 ${escapeHtml(product.gpuChip || product.gpu.split('(')[0].trim())}</span>` : ''}
              ${product.ram ? `<span class="spec-tag">RAM ${product.ram}GB ${product.ramType || ''}</span>` : ''}
              ${product.storage ? `<span class="spec-tag">SSD ${product.storage >= 1000 ? `${product.storage / 1000}TB` : `${product.storage}GB`}</span>` : ''}
              ${product.displaySize ? `<span class="spec-tag">🖥️ ${product.displaySize}" ${product.refreshRate ? `${product.refreshRate}Hz` : ''}</span>` : ''}
              ${product.weight ? `<span class="spec-tag">⚖️ ${product.weight} kg</span>` : ''}
            </div>

            <!-- Explainable Ranking Signal ("Why This Result") -->
            <div class="card-rationale">
              <strong>ทำไมระบบจึงแนะนำ:</strong> ${escapeHtml(explanation.summary)}
            </div>
          </div>

          <!-- Scoring, Price & Action Column -->
          <div class="card-action-col">
            <div class="match-score-badge">
              <div class="score-number-wrap">
                <span class="score-val ${scoreClass}">${product.matchScore}</span>
                <span class="score-max">/100</span>
              </div>
              <span class="score-label">คะแนนความเหมาะสม</span>
            </div>

            <!-- Mini 4-Pillar Score Breakdown -->
            <div class="mini-breakdown" title="การแจกแจงคะแนน 4 ด้าน">
              <div class="breakdown-row">
                <span>คำค้น:</span>
                <strong>${product.scoreBreakdown.relevance}</strong>
              </div>
              <div class="breakdown-row">
                <span>งบ:</span>
                <strong>${product.scoreBreakdown.budget}</strong>
              </div>
              <div class="breakdown-row">
                <span>สเปก:</span>
                <strong>${product.scoreBreakdown.specs}</strong>
              </div>
              <div class="breakdown-row">
                <span>การใช้:</span>
                <strong>${product.scoreBreakdown.useCase}</strong>
              </div>
            </div>

            <div class="card-price-wrap">
              <span class="card-price"><span class="card-price-currency">฿</span>${product.price.toLocaleString()}</span>
            </div>

            <div class="card-actions">
              <button type="button" class="btn-view-details" data-action="view-details" data-id="${product.id}">
                ดูสเปกฉบับเต็ม
              </button>
              <button type="button" class="btn-compare-toggle ${inCompare ? 'selected' : ''}" data-action="toggle-compare" data-id="${product.id}">
                ${inCompare ? '✓ เลือกเปรียบเทียบแล้ว' : '+ เปรียบเทียบ'}
              </button>
            </div>
          </div>
        </article>
      `;
    });

    DOM.productGrid.innerHTML = html;
  }

  function renderEmptyStateSuggestions() {
    let suggestions = [];
    if (State.parsedIntent && State.parsedIntent.budget && State.parsedIntent.budget.max) {
      const relaxedBudget = State.parsedIntent.budget.max + 5000;
      suggestions.push({
        label: `ขยายงบประมาณเป็น ฿${relaxedBudget.toLocaleString()}`,
        action: () => {
          DOM.searchInput.value = State.currentQuery.replace(/\d+[\d,]*/, relaxedBudget);
          executeSearch(DOM.searchInput.value);
        }
      });
    }

    suggestions.push({
      label: 'ล้างตัวกรองทั้งหมด',
      action: resetAllFilters
    });

    suggestions.push({
      label: 'ดูสินค้าทั้งหมดในหมวดนี้',
      action: () => executeSearch('', State.activeCategory)
    });

    DOM.relaxSuggestions.innerHTML = suggestions.map((s, idx) => `
      <button type="button" class="relax-btn" data-sug-idx="${idx}">${escapeHtml(s.label)}</button>
    `).join('');

    // Attach click handlers
    DOM.relaxSuggestions.querySelectorAll('.relax-btn').forEach((btn, idx) => {
      btn.onclick = suggestions[idx].action;
    });
  }

  // ==========================================================================
  // 8. PRODUCT DETAIL DRAWER
  // ==========================================================================
  function openProductDrawer(productId) {
    const product = State.products.find(p => p.id === productId);
    if (!product) return;

    // Retrieve computed ranking score if present
    const ranked = State.rankedResults.find(p => p.id === productId) || product;
    const breakdown = ranked.scoreBreakdown || { relevance: 80, budget: 80, specs: 80, useCase: 80 };
    const explanation = window.ISEExplainer.explain(ranked, State.parsedIntent || {});

    DOM.drawerCategory.textContent = `${product.category} • ${product.brand}`;
    DOM.drawerTitle.textContent = product.name;
    DOM.drawerPrice.textContent = `฿${product.price.toLocaleString()}`;

    const inCompare = State.compareList.includes(product.id);
    DOM.drawerCompareBtn.textContent = inCompare ? '✓ ลบออกจากรายการเปรียบเทียบ' : '+ เพิ่มในรายการเปรียบเทียบ';
    DOM.drawerCompareBtn.dataset.id = product.id;

    // Render Drawer Body with NotebookSPEC style specification density
    DOM.drawerBody.innerHTML = `
      <!-- Score Breakdown Section -->
      <div>
        <h4 class="detail-section-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
          การประเมินความเหมาะสม (Overall Match Score: ${ranked.matchScore || 85}/100)
        </h4>

        <div class="score-breakdown-card">
          <div class="breakdown-meter-row">
            <div class="meter-label-wrap">
              <span>ความตรงตามคำค้นหา (Relevance 30%)</span>
              <strong>${breakdown.relevance}/100</strong>
            </div>
            <div class="meter-track"><div class="meter-fill" style="width: ${breakdown.relevance}%"></div></div>
          </div>

          <div class="breakdown-meter-row">
            <div class="meter-label-wrap">
              <span>ความคุ้มค่าด้านงบประมาณ (Budget 25%)</span>
              <strong>${breakdown.budget}/100</strong>
            </div>
            <div class="meter-track"><div class="meter-fill" style="width: ${breakdown.budget}%"></div></div>
          </div>

          <div class="breakdown-meter-row">
            <div class="meter-label-wrap">
              <span>สเปกฮาร์ดแวร์ต่อความต้องการ (Specifications 25%)</span>
              <strong>${breakdown.specs}/100</strong>
            </div>
            <div class="meter-track"><div class="meter-fill" style="width: ${breakdown.specs}%"></div></div>
          </div>

          <div class="breakdown-meter-row">
            <div class="meter-label-wrap">
              <span>ความเหมาะสมเฉพาะด้าน (Use Case 20%)</span>
              <strong>${breakdown.useCase}/100</strong>
            </div>
            <div class="meter-track"><div class="meter-fill" style="width: ${breakdown.useCase}%"></div></div>
          </div>
        </div>
      </div>

      <!-- Explanations & Key Highlights -->
      <div>
        <h4 class="detail-section-title">🎯 ทำไมระบบจึงแนะนำตัวนี้ (Why This Result)</h4>
        <div style="background-color: #f8fafc; border-left: 3px solid var(--color-primary); padding: 0.85rem; border-radius: 4px; font-size: 0.88rem; margin-bottom: 0.75rem;">
          ${escapeHtml(explanation.summary)}
        </div>
        ${explanation.highlights.length > 0 ? `
          <ul style="padding-left: 1.2rem; font-size: 0.84rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 0.3rem;">
            ${explanation.highlights.map(h => `<li>${escapeHtml(h)}</li>`).join('')}
          </ul>
        ` : ''}
      </div>

      <!-- Complete Technical Specifications Table -->
      <div>
        <h4 class="detail-section-title">📋 ข้อมูลสเปกฮาร์ดแวร์ฉบับเต็ม (Hardware Specifications)</h4>
        <table class="spec-table">
          <tbody>
            <tr><th>ชื่อรุ่น (Model)</th><td>${escapeHtml(product.name)}</td></tr>
            <tr><th>แบรนด์ (Brand)</th><td>${escapeHtml(product.brand)}</td></tr>
            <tr><th>หมวดหมู่ (Category)</th><td>${escapeHtml(product.category)} (${escapeHtml(product.subcategory || '-')})</td></tr>
            <tr><th>ราคาทางการ</th><td><strong>฿${product.price.toLocaleString()}</strong></td></tr>
            ${product.cpu && product.cpu !== '-' ? `<tr><th>หน่วยประมวลผล (CPU)</th><td>${escapeHtml(product.cpu)}</td></tr>` : ''}
            ${product.gpu && product.gpu !== '-' ? `<tr><th>ชิปกราฟิก (GPU)</th><td>${escapeHtml(product.gpu)}</td></tr>` : ''}
            ${product.ram ? `<tr><th>หน่วยความจำ (RAM)</th><td>${product.ram}GB ${escapeHtml(product.ramType || '')}</td></tr>` : ''}
            ${product.storage ? `<tr><th>พื้นที่จัดเก็บ (Storage)</th><td>${product.storage >= 1000 ? `${product.storage / 1000}TB` : `${product.storage}GB`} ${escapeHtml(product.storageType || '')}</td></tr>` : ''}
            ${product.displaySize ? `<tr><th>หน้าจอแสดงผล</th><td>${product.displaySize} นิ้ว (${escapeHtml(product.resolution || '')}) ${product.refreshRate ? `${product.refreshRate}Hz` : ''}</td></tr>` : ''}
            ${product.panelType && product.panelType !== '-' ? `<tr><th>ชนิดพาเนล</th><td>${escapeHtml(product.panelType)}</td></tr>` : ''}
            ${product.weight ? `<tr><th>น้ำหนักตัวเครื่อง</th><td>${product.weight} กิโลกรัม</td></tr>` : ''}
            ${product.battery ? `<tr><th>ขนาดแบตเตอรี่</th><td>${product.battery} Whr</td></tr>` : ''}
            ${product.operatingSystem && product.operatingSystem !== '-' ? `<tr><th>ระบบปฏิบัติการ</th><td>${escapeHtml(product.operatingSystem)}</td></tr>` : ''}
          </tbody>
        </table>
      </div>

      <!-- Pros and Cons -->
      <div>
        <h4 class="detail-section-title">⚖️ จุดเด่นและข้อควรพิจารณา</h4>
        <div class="pros-cons-grid">
          <div class="pros-box">
            <div class="pros-box-title">✓ จุดเด่น (Strengths)</div>
            <ul class="pros-list">
              ${(product.pros || ['สเปกคุ้มค่า', 'แบรนด์มาตรฐาน']).map(p => `<li>${escapeHtml(p)}</li>`).join('')}
            </ul>
          </div>
          <div class="cons-box">
            <div class="cons-box-title">! ข้อควรพิจารณา (Considerations)</div>
            <ul class="cons-list">
              ${(product.cons || ['ราคาสูงตามประสิทธิภาพ']).map(c => `<li>${escapeHtml(c)}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;

    DOM.drawerBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeProductDrawer() {
    DOM.drawerBackdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  // ==========================================================================
  // 9. PRODUCT COMPARISON
  // ==========================================================================
  function toggleCompareProduct(productId) {
    const idx = State.compareList.indexOf(productId);
    if (idx >= 0) {
      State.compareList.splice(idx, 1);
    } else {
      if (State.compareList.length >= 3) {
        alert('คุณสามารถเปรียบเทียบได้สูงสุด 3 รายการพร้อมกัน (กรุณานำสินค้าเดิมออกก่อน)');
        return;
      }
      State.compareList.push(productId);
    }

    updateCompareUI();
  }

  function updateCompareUI() {
    const count = State.compareList.length;
    DOM.navCompareCount.textContent = count;
    DOM.compareDockCount.textContent = count;

    if (count > 0) {
      DOM.compareDock.classList.add('visible');
    } else {
      DOM.compareDock.classList.remove('visible');
    }

    // Refresh active button states in product cards
    document.querySelectorAll('.btn-compare-toggle').forEach(btn => {
      const pId = btn.dataset.id;
      if (State.compareList.includes(pId)) {
        btn.classList.add('selected');
        btn.textContent = '✓ เลือกเปรียบเทียบแล้ว';
      } else {
        btn.classList.remove('selected');
        btn.textContent = '+ เปรียบเทียบ';
      }
    });

    if (State.activeView === 'compare') {
      renderCompareTable();
    }
  }

  function renderCompareTable() {
    if (State.compareList.length === 0) {
      DOM.compareTableWrapper.innerHTML = `
        <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
          <p style="font-size: 1.1rem; margin-bottom: 1rem;">ยังไม่มีสินค้าในรายการเปรียบเทียบ</p>
          <a href="#search" class="btn-view-details" style="display: inline-block;">กลับไปค้นหาเพื่อเลือกสินค้า</a>
        </div>
      `;
      return;
    }

    const items = State.compareList.map(id => State.products.find(p => p.id === id)).filter(Boolean);

    // Identify difference fields if highlightDiffs is enabled
    const isDiff = (fieldGetter) => {
      if (!State.highlightDiffs || items.length < 2) return false;
      const first = fieldGetter(items[0]);
      return items.some(it => fieldGetter(it) !== first);
    };

    const diffPrice = isDiff(p => p.price);
    const diffCpu = isDiff(p => p.cpu);
    const diffGpu = isDiff(p => p.gpu);
    const diffRam = isDiff(p => p.ram);
    const diffStorage = isDiff(p => p.storage);
    const diffScreen = isDiff(p => p.displaySize);
    const diffWeight = isDiff(p => p.weight);

    let html = `
      <table class="compare-table">
        <thead>
          <tr>
            <th class="param-col">คุณสมบัติ / สินค้า</th>
            ${items.map(it => `
              <td class="product-col">
                <div class="compare-product-header">
                  <img src="${it.image || 'assets/placeholders/laptop.svg'}" alt="${escapeHtml(it.name)}" class="compare-product-thumb">
                  <span class="compare-product-name">${escapeHtml(it.name)}</span>
                  <button type="button" class="relax-btn" data-remove-compare="${it.id}">นำออก</button>
                </div>
              </td>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          <tr class="${diffPrice ? 'compare-diff-highlight' : ''}">
            <th class="param-col">ราคาจำหน่าย (THB)</th>
            ${items.map(it => `<td><strong style="font-family: var(--font-mono); font-size: 1.1rem;">฿${it.price.toLocaleString()}</strong></td>`).join('')}
          </tr>
          <tr>
            <th class="param-col">แบรนด์ / หมวดหมู่</th>
            ${items.map(it => `<td>${escapeHtml(it.brand)} • ${escapeHtml(it.category)}</td>`).join('')}
          </tr>
          <tr class="${diffCpu ? 'compare-diff-highlight' : ''}">
            <th class="param-col">ซีพียู (CPU)</th>
            ${items.map(it => `<td>${escapeHtml(it.cpu || '-')}</td>`).join('')}
          </tr>
          <tr class="${diffGpu ? 'compare-diff-highlight' : ''}">
            <th class="param-col">การ์ดจอ (GPU)</th>
            ${items.map(it => `<td>${escapeHtml(it.gpu || '-')}</td>`).join('')}
          </tr>
          <tr class="${diffRam ? 'compare-diff-highlight' : ''}">
            <th class="param-col">RAM</th>
            ${items.map(it => `<td>${it.ram ? `${it.ram}GB ${it.ramType || ''}` : '-'}</td>`).join('')}
          </tr>
          <tr class="${diffStorage ? 'compare-diff-highlight' : ''}">
            <th class="param-col">พื้นที่จัดเก็บ (SSD)</th>
            ${items.map(it => `<td>${it.storage ? `${it.storage >= 1000 ? `${it.storage / 1000}TB` : `${it.storage}GB`} (${it.storageType || ''})` : '-'}</td>`).join('')}
          </tr>
          <tr class="${diffScreen ? 'compare-diff-highlight' : ''}">
            <th class="param-col">หน้าจอแสดงผล</th>
            ${items.map(it => `<td>${it.displaySize ? `${it.displaySize}" ${it.resolution || ''} ${it.refreshRate ? `${it.refreshRate}Hz` : ''}` : '-'}</td>`).join('')}
          </tr>
          <tr class="${diffWeight ? 'compare-diff-highlight' : ''}">
            <th class="param-col">น้ำหนักตัวเครื่อง</th>
            ${items.map(it => `<td>${it.weight ? `${it.weight} kg` : '-'}</td>`).join('')}
          </tr>
          <tr>
            <th class="param-col">แบตเตอรี่</th>
            ${items.map(it => `<td>${it.battery ? `${it.battery} Whr` : '-'}</td>`).join('')}
          </tr>
          <tr>
            <th class="param-col">จุดเด่นสำคัญ</th>
            ${items.map(it => `<td><ul style="padding-left: 1.1rem;">${(it.pros || []).map(p => `<li>${escapeHtml(p)}</li>`).join('')}</ul></td>`).join('')}
          </tr>
        </tbody>
      </table>
    `;

    DOM.compareTableWrapper.innerHTML = html;

    // Attach remove handlers
    DOM.compareTableWrapper.querySelectorAll('[data-remove-compare]').forEach(btn => {
      btn.onclick = () => toggleCompareProduct(btn.dataset.removeCompare);
    });
  }

  // ==========================================================================
  // 10. BENCHMARK & REGRESSION TEST SUITE
  // ==========================================================================
  function renderBenchmarkReport() {
    if (!State.benchmarkRunner) return;

    const report = State.benchmarkRunner.evaluate(3);
    const summary = report.summary;

    DOM.mIsePrecision.textContent = summary.iseAvg.precisionAtK.toFixed(3);
    DOM.mBasePrecision.textContent = summary.baselineAvg.precisionAtK.toFixed(3);

    DOM.mIseRecall.textContent = summary.iseAvg.recallAtK.toFixed(3);
    DOM.mBaseRecall.textContent = summary.baselineAvg.recallAtK.toFixed(3);

    DOM.mIseMrr.textContent = summary.iseAvg.mrr.toFixed(3);
    DOM.mBaseMrr.textContent = summary.baselineAvg.mrr.toFixed(3);

    DOM.mIseLatency.textContent = `${summary.iseAvg.avgLatencyMs.toFixed(2)} ms`;

    // Render Scenarios Breakdown
    let scenariosHtml = '';
    report.details.forEach(item => {
      const sc = item.scenario;
      const gtSet = new Set(sc.groundTruthIds);

      scenariosHtml += `
        <div class="scenario-result-card">
          <div class="scenario-header">
            <div>
              <div class="scenario-title">${escapeHtml(sc.title)}</div>
              <div style="font-size: 0.8rem; color: var(--text-secondary);">${escapeHtml(sc.description)}</div>
            </div>
            <div style="font-size: 0.82rem; font-family: var(--font-mono); font-weight: 600;">
              ISE P@3: <span style="color: var(--color-primary);">${item.ise.precision}</span> | Baseline P@3: <span style="color: var(--text-muted);">${item.baseline.precision}</span>
            </div>
          </div>
          <div class="scenario-body">
            <div>
              <div class="scenario-col-title">ISE Multi-Criteria Top 3:</div>
              <ul class="scenario-product-list">
                ${item.ise.topK.map((p, rank) => {
                  const hit = gtSet.has(p.id);
                  return `
                    <li class="scenario-product-item ${hit ? 'is-hit' : ''}">
                      <span>#${rank + 1} ${escapeHtml(p.name)}</span>
                      <span>฿${p.price.toLocaleString()} ${hit ? '✓ Ground Truth' : ''}</span>
                    </li>
                  `;
                }).join('')}
              </ul>
            </div>
            <div>
              <div class="scenario-col-title">Baseline Keyword Search Top 3:</div>
              <ul class="scenario-product-list">
                ${item.baseline.topK.map((p, rank) => {
                  const hit = gtSet.has(p.id);
                  return `
                    <li class="scenario-product-item ${hit ? 'is-hit' : ''}">
                      <span>#${rank + 1} ${escapeHtml(p.name)}</span>
                      <span>฿${p.price.toLocaleString()} ${hit ? '✓ Ground Truth' : ''}</span>
                    </li>
                  `;
                }).join('')}
              </ul>
            </div>
          </div>
        </div>
      `;
    });

    DOM.benchmarkScenariosList.innerHTML = scenariosHtml;
  }

  // ==========================================================================
  // 11. EVENT LISTENERS
  // ==========================================================================
  function attachEventListeners() {
    // Search Submit
    DOM.searchForm.addEventListener('submit', e => {
      e.preventDefault();
      const query = DOM.searchInput.value.trim();
      executeSearch(query);
    });

    // Clear Search Input
    DOM.searchInput.addEventListener('input', () => {
      DOM.searchClearBtn.style.display = DOM.searchInput.value ? 'block' : 'none';
    });

    DOM.searchClearBtn.addEventListener('click', () => {
      DOM.searchInput.value = '';
      DOM.searchClearBtn.style.display = 'none';
      DOM.searchInput.focus();
      executeSearch('');
    });

    // Prompt Chips
    DOM.promptChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const q = chip.dataset.query;
        DOM.searchInput.value = q;
        DOM.searchClearBtn.style.display = 'block';
        executeSearch(q);
      });
    });

    // Category Quickbar
    DOM.categoryQuickbar.addEventListener('click', e => {
      const btn = e.target.closest('.cat-btn');
      if (!btn) return;
      const cat = btn.dataset.cat;
      executeSearch(DOM.searchInput.value.trim(), cat);
    });

    // Navigation Links
    document.querySelectorAll('[data-view]').forEach(link => {
      link.addEventListener('click', e => {
        const view = link.dataset.view;
        switchView(view);
      });
    });

    // Mobile Menu Toggle
    DOM.mobileMenuBtn.addEventListener('click', () => {
      DOM.mainNav.classList.toggle('mobile-open');
    });

    // Sort Dropdown
    DOM.sortSelect.addEventListener('change', e => {
      State.currentSort = e.target.value;
      applyFiltersAndSort();
    });

    // Filter Change Handlers
    DOM.filterPriceMin.addEventListener('input', e => {
      State.filters.priceMin = e.target.value ? parseFloat(e.target.value) : null;
      applyFiltersAndSort();
    });

    DOM.filterPriceMax.addEventListener('input', e => {
      State.filters.priceMax = e.target.value ? parseFloat(e.target.value) : null;
      applyFiltersAndSort();
    });

    DOM.filterBrandList.addEventListener('change', e => {
      if (e.target.name === 'filterBrand') {
        const val = e.target.value;
        if (e.target.checked) State.filters.brands.add(val);
        else State.filters.brands.delete(val);
        applyFiltersAndSort();
      }
    });

    DOM.filterRamList.addEventListener('change', e => {
      if (e.target.name === 'filterRam') {
        const val = e.target.value;
        if (e.target.checked) State.filters.ram.add(val);
        else State.filters.ram.delete(val);
        applyFiltersAndSort();
      }
    });

    DOM.filterGpuList.addEventListener('change', e => {
      if (e.target.name === 'filterGpu') {
        const val = e.target.value;
        if (e.target.checked) State.filters.gpu.add(val);
        else State.filters.gpu.delete(val);
        applyFiltersAndSort();
      }
    });

    DOM.filterResetBtn.addEventListener('click', resetAllFilters);

    // Mobile Filter Trigger & Close
    DOM.mobileFilterTrigger.addEventListener('click', () => {
      DOM.filterSidebar.classList.toggle('mobile-open');
    });

    if (DOM.filterCloseBtn) {
      DOM.filterCloseBtn.addEventListener('click', () => {
        DOM.filterSidebar.classList.remove('mobile-open');
      });
    }

    // Product Grid Card Actions (Delegation)
    DOM.productGrid.addEventListener('click', e => {
      const viewBtn = e.target.closest('[data-action="view-details"]');
      if (viewBtn) {
        openProductDrawer(viewBtn.dataset.id);
        return;
      }

      const compBtn = e.target.closest('[data-action="toggle-compare"]');
      if (compBtn) {
        toggleCompareProduct(compBtn.dataset.id);
        return;
      }
    });

    // Product Detail Drawer Actions
    DOM.drawerCloseBtn.addEventListener('click', closeProductDrawer);
    DOM.drawerBackdrop.addEventListener('click', e => {
      if (e.target === DOM.drawerBackdrop) closeProductDrawer();
    });
    DOM.drawerCompareBtn.addEventListener('click', () => {
      const pId = DOM.drawerCompareBtn.dataset.id;
      if (pId) toggleCompareProduct(pId);
      closeProductDrawer();
    });

    // Floating Compare Dock Actions
    DOM.compareDockOpenBtn.addEventListener('click', () => {
      switchView('compare');
    });

    DOM.compareDockClearBtn.addEventListener('click', () => {
      State.compareList = [];
      updateCompareUI();
    });

    // Compare View Actions
    DOM.btnToggleDiffs.addEventListener('click', () => {
      State.highlightDiffs = !State.highlightDiffs;
      DOM.btnToggleDiffs.style.backgroundColor = State.highlightDiffs ? 'var(--color-primary-light)' : '';
      renderCompareTable();
    });

    DOM.btnClearCompare.addEventListener('click', () => {
      State.compareList = [];
      updateCompareUI();
    });

    // Benchmark Run Button
    DOM.btnRunBenchmark.addEventListener('click', () => {
      renderBenchmarkReport();
    });

    // Keyboard Shortcuts (Escape to close drawer)
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape' && DOM.drawerBackdrop.classList.contains('open')) {
        closeProductDrawer();
      }
    });
  }

  function resetAllFilters() {
    State.filters.priceMin = null;
    State.filters.priceMax = null;
    State.filters.brands.clear();
    State.filters.ram.clear();
    State.filters.gpu.clear();

    DOM.filterPriceMin.value = '';
    DOM.filterPriceMax.value = '';

    document.querySelectorAll('#filterSidebar input[type="checkbox"]').forEach(cb => {
      cb.checked = false;
    });

    applyFiltersAndSort();
  }

  // ==========================================================================
  // 12. UTILITY HELPERS
  // ==========================================================================
  function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
