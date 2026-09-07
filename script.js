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
    hasSearched: false,
    searchTimer: null,
    searchRequestId: 0,
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
      gpu: new Set(),
      storage: new Set(),
      display: new Set(),
      refresh: new Set()
    },
    currentSort: 'match',

    // Comparison List (Max 3 Product IDs)
    compareList: [],
    highlightDiffs: false,

    // Active View
    activeView: 'search'
  };

  let drawerReturnFocus = null;
  let toastTimer = null;

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
    searchSubmitBtn: document.getElementById('searchSubmitBtn'),
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
    resultsMetaBar: document.getElementById('resultsMetaBar'),
    resultsCount: document.getElementById('resultsCount'),
    resultsLatency: document.getElementById('resultsLatency'),
    activeFiltersSummary: document.getElementById('activeFiltersSummary'),
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
    filterStorageList: document.getElementById('filterStorageList'),
    filterDisplayList: document.getElementById('filterDisplayList'),
    filterRefreshList: document.getElementById('filterRefreshList'),
    filterRamGroup: document.getElementById('filterRamGroup'),
    filterGpuGroup: document.getElementById('filterGpuGroup'),
    filterStorageGroup: document.getElementById('filterStorageGroup'),
    filterDisplayGroup: document.getElementById('filterDisplayGroup'),
    filterRefreshGroup: document.getElementById('filterRefreshGroup'),
    filterOverlay: document.getElementById('filterOverlay'),

    // Product Grid & Empty State
    productGrid: document.getElementById('productGrid'),
    emptyState: document.getElementById('emptyState'),
    emptyStateTitle: document.getElementById('emptyStateTitle'),
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
    appToast: document.getElementById('appToast'),

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

    // 4. Populate initial benchmark results
    renderBenchmarkReport();

    // 5. Use the URL hash as the routing source of truth
    handleRouting(true);
  }

  // ==========================================================================
  // 4. ROUTING & VIEW NAVIGATION
  // ==========================================================================
  const VALID_VIEWS = new Set(['search', 'catalog', 'compare', 'how-it-works', 'algorithm', 'benchmark', 'about']);

  function renderRoute(viewName, isInitial = false) {
    const safeView = VALID_VIEWS.has(viewName) ? viewName : 'search';
    State.activeView = safeView;

    // Update Nav Links
    DOM.navLinks.forEach(link => {
      if (link.dataset.view === safeView) {
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
      safeView === 'catalog' ? 'viewSearch' :
      safeView === 'how-it-works' ? 'viewHowItWorks' :
      safeView === 'algorithm' ? 'viewAlgorithm' :
      safeView === 'benchmark' ? 'viewBenchmark' :
      safeView === 'compare' ? 'viewCompare' :
      safeView === 'about' ? 'viewAbout' : 'viewSearch'
    );

    if (targetSection) {
      targetSection.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'auto' });
    }

    if (safeView === 'compare') {
      renderCompareTable();
    } else if (safeView === 'catalog') {
      showCatalog();
    } else if (safeView === 'search' && !State.hasSearched) {
      showCatalog();
    }

    syncCompareDock();

    // Close mobile nav if open
    DOM.mainNav.classList.remove('mobile-open');
    DOM.mobileMenuBtn.setAttribute('aria-expanded', 'false');
  }

  function navigateTo(viewName) {
    const safeView = VALID_VIEWS.has(viewName) ? viewName : 'search';
    if (window.location.hash === `#${safeView}`) {
      renderRoute(safeView);
    } else {
      window.location.hash = safeView;
    }
  }

  function handleRouting(isInitial = false) {
    let hash = window.location.hash.replace('#', '');
    if (!VALID_VIEWS.has(hash)) {
      hash = 'search';
      window.history.replaceState(null, '', '#search');
    }
    renderRoute(hash, isInitial);
  }

  function setProcessing(isProcessing) {
    DOM.pipelineStatus.hidden = !isProcessing;
    DOM.searchSubmitBtn.disabled = isProcessing;
    DOM.searchForm.setAttribute('aria-busy', String(isProcessing));
  }

  function beginSearch(queryText) {
    const query = (queryText || '').trim();
    State.searchRequestId += 1;
    const requestId = State.searchRequestId;
    if (State.searchTimer) window.clearTimeout(State.searchTimer);

    if (!query) {
      setProcessing(false);
      showCatalog();
      return;
    }

    setProcessing(true);
    State.searchTimer = window.setTimeout(() => {
      if (requestId !== State.searchRequestId) return;
      State.searchTimer = null;
      executeSearch(query, null, { resetSort: true, resetFilters: true });
      setProcessing(false);
    }, 180);
  }

  function showCatalog() {
    if (State.searchTimer) window.clearTimeout(State.searchTimer);
    State.searchTimer = null;
    State.searchRequestId += 1;
    State.currentQuery = '';
    State.parsedIntent = window.ISEQueryParser.getEmptyIntent('');
    State.hasSearched = false;
    State.activeCategory = '';
    DOM.searchInput.value = '';
    DOM.searchClearBtn.style.display = 'none';
    setProcessing(false);
    resetAllFilters(false);
    resetSort();

    const retrievalResult = State.retrievalEngine.retrieveCandidates(State.parsedIntent);
    State.rawCandidates = retrievalResult.candidates;
    State.rankedResults = State.rankingEngine.rank(State.rawCandidates, State.parsedIntent);
    buildSidebarFilterOptions(State.rankedResults);
    updateAdaptiveFilters('');
    renderQueryUnderstanding(State.parsedIntent);
    DOM.resultsLatency.hidden = true;
    applyFiltersAndSort();
    syncCategoryButtons();
  }

  // ==========================================================================
  // 5. SEARCH & RANKING PIPELINE
  // ==========================================================================
  function executeSearch(queryText, forcedCategory = null, options = {}) {
    const tStart = performance.now();
    State.currentQuery = queryText || '';
    State.hasSearched = Boolean(State.currentQuery || forcedCategory);

    if (options.resetFilters) resetAllFilters(false);
    if (options.resetSort) resetSort();

    // Step 1: Query Understanding
    State.parsedIntent = window.ISEQueryParser.parse(State.currentQuery);

    // Apply forced category override if clicked from quickbar
    if (forcedCategory !== null) {
      State.activeCategory = forcedCategory;
      if (forcedCategory) {
        State.parsedIntent.category = forcedCategory;
        State.parsedIntent.isUnderstood = true;
        State.parsedIntent.confidence = {
          level: 'high', score: 100, recognizedSignals: ['category'], isUnderstood: true
        };
      } else {
        State.parsedIntent.category = null;
      }
    } else {
      State.activeCategory = State.parsedIntent.category || '';
    }

    syncCategoryButtons();

    if (State.currentQuery && !State.parsedIntent.isUnderstood) {
      renderUnknownQueryState();
      if (State.activeView !== 'search') navigateTo('search');
      return;
    }

    // Step 2: Candidate Retrieval
    const retrievalResult = State.retrievalEngine.retrieveCandidates(State.parsedIntent);
    State.rawCandidates = retrievalResult.candidates;

    // Step 3: Multi-Criteria Ranking
    State.rankedResults = State.rankingEngine.rank(State.rawCandidates, State.parsedIntent);
    buildSidebarFilterOptions(State.rankedResults);
    updateAdaptiveFilters(State.parsedIntent.category || State.activeCategory);

    // Step 4: Apply Additional Sidebar Filters
    applyFiltersAndSort();

    const tEnd = performance.now();
    const latency = (tEnd - tStart).toFixed(2);

    // Step 5: Render UI
    renderQueryUnderstanding(State.parsedIntent);
    DOM.resultsLatency.textContent = `คำนวณใน ${latency} ms`;
    DOM.resultsLatency.hidden = false;

    // Switch view to search if currently elsewhere
    if (State.activeView !== 'search' && State.activeView !== 'catalog') {
      navigateTo('search');
    }
  }

  function syncCategoryButtons() {
    DOM.catBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.cat === State.activeCategory));
  }

  function resetSort() {
    State.currentSort = 'match';
    DOM.sortSelect.value = 'match';
  }

  function renderUnknownQueryState() {
    State.rawCandidates = [];
    State.rankedResults = [];
    State.displayedResults = [];
    DOM.resultsCount.textContent = '0';
    DOM.resultsMetaBar.classList.add('unknown-query');
    DOM.resultsLatency.hidden = true;
    DOM.queryUnderstandingCard.style.display = 'none';
    DOM.productGrid.innerHTML = '';
    DOM.productGrid.style.display = 'none';
    DOM.filterSidebar.hidden = true;
    DOM.mobileFilterTrigger.hidden = true;
    DOM.activeFiltersSummary.hidden = true;
    DOM.emptyState.style.display = 'block';
    DOM.emptyStateTitle.textContent = 'เราไม่สามารถระบุความต้องการสินค้าไอทีจากคำค้นนี้ได้';
    DOM.emptyStateDesc.textContent = 'ลองระบุประเภทสินค้า ลักษณะการใช้งาน งบประมาณ หรือสเปกที่ต้องการอย่างน้อยหนึ่งอย่าง';
    const examples = [
      'โน้ตบุ๊กสำหรับเขียนโปรแกรม งบไม่เกิน 30000',
      'Gaming Laptop RTX 4060',
      'SSD 1TB สำหรับ Gaming'
    ];
    DOM.relaxSuggestions.innerHTML = examples.map(query => `
      <button type="button" class="relax-btn" data-example-query="${escapeHtml(query)}">${escapeHtml(query)}</button>
    `).join('');
    DOM.relaxSuggestions.querySelectorAll('[data-example-query]').forEach(btn => {
      btn.addEventListener('click', () => {
        DOM.searchInput.value = btn.dataset.exampleQuery;
        DOM.searchClearBtn.style.display = 'block';
        beginSearch(btn.dataset.exampleQuery);
      });
    });
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

    if (State.filters.storage.size > 0) {
      const minimum = Math.max(...State.filters.storage);
      filtered = filtered.filter(p => (p.storage || 0) >= minimum);
    }

    if (State.filters.display.size > 0) {
      const minimum = Math.max(...State.filters.display);
      filtered = filtered.filter(p => (p.displaySize || 0) >= minimum);
    }

    if (State.filters.refresh.size > 0) {
      const minimum = Math.max(...State.filters.refresh);
      filtered = filtered.filter(p => (p.refreshRate || 0) >= minimum);
    }

    // Sort Results
    switch (State.currentSort) {
      case 'match':
        filtered.sort((a, b) => (b.matchScore ?? -1) - (a.matchScore ?? -1));
        break;
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'spec':
        filtered.sort((a, b) => (b.scoreBreakdown.specs ?? -1) - (a.scoreBreakdown.specs ?? -1));
        break;
      case 'relevance':
        filtered.sort((a, b) => (b.scoreBreakdown.relevance ?? -1) - (a.scoreBreakdown.relevance ?? -1));
        break;
    }

    State.displayedResults = filtered;
    renderProductGrid();
    renderActiveFilters();
  }

  function buildSidebarFilterOptions(products = State.products) {
    // Unique Brands
    const brands = [...new Set(products.map(p => p.brand))].sort();
    DOM.filterBrandList.innerHTML = brands.map(b => `
      <label class="filter-checkbox-label">
        <input type="checkbox" name="filterBrand" value="${escapeHtml(b)}">
        ${escapeHtml(b)}
      </label>
    `).join('');
  }

  function updateAdaptiveFilters(category) {
    const laptopLike = category === 'Laptop' || category === 'Gaming Laptop' || category === 'Desktop PC';
    const monitor = category === 'Monitor';
    const ssd = category === 'SSD';

    DOM.filterRamGroup.hidden = !laptopLike;
    DOM.filterGpuGroup.hidden = !laptopLike;
    DOM.filterStorageGroup.hidden = !(laptopLike || ssd);
    DOM.filterDisplayGroup.hidden = !(laptopLike || monitor);
    DOM.filterRefreshGroup.hidden = !(laptopLike || monitor);
  }

  // ==========================================================================
  // 7. PRODUCT GRID & CARD RENDERING
  // ==========================================================================
  function renderProductGrid() {
    const products = State.displayedResults;
    DOM.resultsMetaBar.classList.remove('unknown-query');
    DOM.resultsCount.textContent = products.length;
    DOM.filterSidebar.hidden = false;
    DOM.mobileFilterTrigger.hidden = false;
    DOM.emptyStateTitle.textContent = 'ไม่พบสินค้าที่ตรงกับทุกเงื่อนไข';
    DOM.emptyStateDesc.textContent = 'ลองผ่อนปรนเงื่อนไขบางอย่าง หรือล้างตัวกรองที่ใช้งานอยู่';

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
      const isBestMatch = (index === 0 && State.currentSort === 'match' && product.matchScore !== null && product.matchScore >= 70);
      const explanation = window.ISEExplainer.explain(product, State.parsedIntent || {});
      const inCompare = State.compareList.includes(product.id);

      // Score color class
      const scoreClass = product.matchScore >= 85 ? 'high' : product.matchScore >= 70 ? 'mid' : 'fair';
      const compactSpecs = getProductSpecRows(product, true).slice(0, 5);

      html += `
        <article class="product-card ${isBestMatch ? 'best-match' : ''}" data-id="${product.id}">
          ${isBestMatch ? `
            <div class="best-match-badge-wrap">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span>ตรงกับเงื่อนไขมากที่สุด</span>
            </div>
          ` : ''}

          <!-- Media / Thumbnail -->
          <div class="card-media-col">
            <span class="card-brand-tag">${escapeHtml(product.brand)}</span>
            <img src="${product.image || 'assets/placeholders/laptop.svg'}" alt="${escapeHtml(product.name)}" class="product-thumb" loading="lazy">
          </div>

          <!-- Product Specifications & Information -->
          <div class="card-info-col">
            <span class="card-category-badge">${escapeHtml(product.category)}${product.subcategory ? ` • ${escapeHtml(product.subcategory)}` : ''}</span>
            <h3 class="card-product-title">${escapeHtml(product.name)}</h3>

            <!-- Specification Tags -->
            <div class="card-spec-tags">
              ${compactSpecs.map((spec, specIndex) => `<span class="spec-tag ${specIndex < 2 ? 'highlight' : ''}">${escapeHtml(spec.compact || spec.value)}</span>`).join('')}
            </div>

            <!-- Explainable Ranking Signal ("Why This Result") -->
            <div class="card-rationale">
              <strong>${State.hasSearched ? 'ทำไมผลลัพธ์นี้ตรง:' : 'จุดเด่น:'}</strong> ${escapeHtml(explanation.summary)}
            </div>
          </div>

          <!-- Scoring, Price & Action Column -->
          <div class="card-action-col">
            ${product.matchScore !== null ? `<div class="match-score-badge">
              <div class="score-number-wrap">
                <span class="score-val ${scoreClass}">${product.matchScore}</span>
                <span class="score-max">/100</span>
              </div>
              <span class="score-label">คะแนนตรงกับเงื่อนไข</span>
            </div>` : '<div class="browse-score-note">ระบุความต้องการเพื่อดูคะแนนที่เหมาะกับคุณ</div>'}

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
          beginSearch(DOM.searchInput.value);
        }
      });
    }

    suggestions.push({
      label: 'ล้างตัวกรองทั้งหมด',
      action: resetAllFilters
    });

    suggestions.push(State.activeCategory ? {
      label: `ดูสินค้าทั้งหมดในหมวด ${State.activeCategory}`,
      action: () => executeSearch('', State.activeCategory, { resetFilters: true, resetSort: true })
    } : {
      label: 'ดูสินค้าทั้งหมด',
      action: showCatalog
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
  function renderBreakdownMeter(label, value, weight) {
    const valueText = value === null || value === undefined ? 'ไม่ได้ระบุ' : `${value}/100`;
    const meter = value === null || value === undefined
      ? '<div class="meter-track inactive"><div class="meter-fill" style="width: 0"></div></div>'
      : `<div class="meter-track"><div class="meter-fill" style="width: ${value}%"></div></div>`;
    return `
      <div class="breakdown-meter-row ${value === null || value === undefined ? 'inactive' : ''}">
        <div class="meter-label-wrap"><span>${label}${weight ? ` (${weight})` : ''}</span><strong>${valueText}</strong></div>
        ${meter}
      </div>
    `;
  }

  function openProductDrawer(productId) {
    const product = State.products.find(p => p.id === productId);
    if (!product) return;

    // Retrieve computed ranking score if present
    const ranked = State.rankedResults.find(p => p.id === productId) || product;
    const breakdown = ranked.scoreBreakdown || { relevance: null, budget: null, specs: null, useCase: null };
    const explanation = window.ISEExplainer.explain(ranked, State.parsedIntent || {});

    DOM.drawerCategory.textContent = `${product.category} • ${product.brand}`;
    DOM.drawerTitle.textContent = product.name;
    DOM.drawerPrice.textContent = `฿${product.price.toLocaleString()}`;

    const inCompare = State.compareList.includes(product.id);
    DOM.drawerCompareBtn.textContent = inCompare ? '✓ ลบออกจากรายการเปรียบเทียบ' : '+ เพิ่มในรายการเปรียบเทียบ';
    DOM.drawerCompareBtn.dataset.id = product.id;

    // Render Drawer Body with NotebookSPEC style specification density
    DOM.drawerBody.innerHTML = `
      ${ranked.matchScore !== null && ranked.matchScore !== undefined ? `<!-- Score Breakdown Section -->
      <div class="detail-score-section">
        <h4 class="detail-section-title">
          คะแนนตรงกับเงื่อนไข: ${ranked.matchScore}/100
        </h4>
        <p class="score-detail-help">คำนวณเฉพาะเงื่อนไขที่ระบุในคำค้น เกณฑ์ที่ไม่ได้ระบุจะไม่ถูกนำไปรวมคะแนน</p>

        <div class="score-breakdown-card">
          ${renderBreakdownMeter('ความตรงกับคำค้น', breakdown.relevance, '30%')}
          ${renderBreakdownMeter('ความเหมาะสมกับงบ', breakdown.budget, '25%')}
          ${renderBreakdownMeter('ความตรงกับสเปก', breakdown.specs, '25%')}
          ${renderBreakdownMeter('ความเหมาะสมกับการใช้งาน', breakdown.useCase, '20%')}
        </div>
      </div>` : ''}

      <!-- Explanations & Key Highlights -->
      <div>
        <h4 class="detail-section-title">🎯 ทำไมผลลัพธ์นี้จึงเหมาะ</h4>
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
        <h4 class="detail-section-title">📋 ข้อมูลสเปก</h4>
        <table class="spec-table">
          <tbody>
            <tr><th>ชื่อรุ่น</th><td>${escapeHtml(product.name)}</td></tr>
            <tr><th>แบรนด์</th><td>${escapeHtml(product.brand)}</td></tr>
            <tr><th>หมวดหมู่</th><td>${escapeHtml(product.category)}${product.subcategory ? ` (${escapeHtml(product.subcategory)})` : ''}</td></tr>
            <tr><th>ราคาทางการ</th><td><strong>฿${product.price.toLocaleString()}</strong></td></tr>
            ${getProductSpecRows(product).map(row => `<tr><th>${escapeHtml(row.label)}</th><td>${escapeHtml(row.value)}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>

      <!-- Pros and Cons -->
      <div>
        <h4 class="detail-section-title">⚖️ จุดเด่นและข้อควรพิจารณา</h4>
        <div class="pros-cons-grid">
          <div class="pros-box">
            <div class="pros-box-title">✓ จุดเด่น</div>
            <ul class="pros-list">
              ${(product.pros || ['สเปกคุ้มค่า', 'แบรนด์มาตรฐาน']).map(p => `<li>${escapeHtml(p)}</li>`).join('')}
            </ul>
          </div>
          <div class="cons-box">
            <div class="cons-box-title">! ข้อควรพิจารณา</div>
            <ul class="cons-list">
              ${(product.cons || ['ราคาสูงตามประสิทธิภาพ']).map(c => `<li>${escapeHtml(c)}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;

    drawerReturnFocus = document.activeElement;
    DOM.drawerBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
    document.getElementById('mainContent').setAttribute('inert', '');
    window.requestAnimationFrame(() => DOM.drawerCloseBtn.focus());
  }

  function closeProductDrawer() {
    DOM.drawerBackdrop.classList.remove('open');
    document.body.style.overflow = '';
    document.getElementById('mainContent').removeAttribute('inert');
    if (drawerReturnFocus && typeof drawerReturnFocus.focus === 'function') drawerReturnFocus.focus();
    drawerReturnFocus = null;
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
        showToast('เปรียบเทียบได้สูงสุด 3 รายการ กรุณานำสินค้าเดิมออกก่อน');
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

    syncCompareDock();

    // Refresh active button states in product cards
    DOM.productGrid.querySelectorAll('[data-action="toggle-compare"]').forEach(btn => {
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

  function syncCompareDock() {
    const shouldShow = State.compareList.length > 0 && State.activeView !== 'compare';
    DOM.compareDock.hidden = !shouldShow;

    if (shouldShow) {
      DOM.compareDock.classList.add('visible');
      document.body.classList.add('compare-active');
    } else {
      DOM.compareDock.classList.remove('visible');
      document.body.classList.remove('compare-active');
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

    const specMaps = items.map(item => new Map(getProductSpecRows(item).map(row => [row.label, row.value])));
    const specLabels = [...new Set(specMaps.flatMap(map => [...map.keys()]))];
    const compareRows = [
      { label: 'ราคา', values: items.map(item => `฿${item.price.toLocaleString()}`), price: true },
      { label: 'แบรนด์ / หมวดหมู่', values: items.map(item => `${item.brand} • ${item.category}`) },
      ...specLabels.map(label => ({ label, values: specMaps.map(map => map.get(label) || 'ไม่เกี่ยวข้อง') })),
      { label: 'จุดเด่นสำคัญ', values: items.map(item => (item.pros || []).slice(0, 3)) , list: true }
    ];

    let html = `
      <table class="compare-table">
        <thead>
          <tr>
            <th class="param-col">คุณสมบัติ / สินค้า</th>
            ${items.map(it => `
              <th scope="col" class="product-col">
                <div class="compare-product-header">
                  <img src="${it.image || 'assets/placeholders/laptop.svg'}" alt="${escapeHtml(it.name)}" class="compare-product-thumb">
                  <span class="compare-product-name">${escapeHtml(it.name)}</span>
                  <button type="button" class="relax-btn" data-remove-compare="${it.id}">นำออก</button>
                </div>
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          ${compareRows.map(row => {
            const comparableValues = row.values.map(value => Array.isArray(value) ? value.join('|') : value);
            const different = State.highlightDiffs && new Set(comparableValues).size > 1;
            return `<tr class="${different ? 'compare-diff-highlight' : ''}">
              <th scope="row" class="param-col">${escapeHtml(row.label)}</th>
              ${row.values.map(value => `<td>${row.list
                ? `<ul class="compare-pros-list">${value.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
                : row.price ? `<strong class="compare-price">${escapeHtml(value)}</strong>` : escapeHtml(value)}</td>`).join('')}
            </tr>`;
          }).join('')}
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
      beginSearch(query);
    });

    // Clear Search Input
    DOM.searchInput.addEventListener('input', () => {
      DOM.searchClearBtn.style.display = DOM.searchInput.value ? 'block' : 'none';
    });

    DOM.searchClearBtn.addEventListener('click', () => {
      DOM.searchInput.value = '';
      DOM.searchClearBtn.style.display = 'none';
      DOM.searchInput.focus();
      showCatalog();
    });

    // Prompt Chips
    DOM.promptChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const q = chip.dataset.query;
        DOM.searchInput.value = q;
        DOM.searchClearBtn.style.display = 'block';
        beginSearch(q);
      });
    });

    // Category Quickbar
    DOM.categoryQuickbar.addEventListener('click', e => {
      const btn = e.target.closest('.cat-btn');
      if (!btn) return;
      const cat = btn.dataset.cat;
      DOM.searchInput.value = '';
      DOM.searchClearBtn.style.display = 'none';
      if (!cat) {
        showCatalog();
      } else {
        executeSearch('', cat, { resetSort: true, resetFilters: true });
      }
      if (State.activeView !== 'search') navigateTo('search');
    });

    // Navigation Links
    document.querySelectorAll('[data-view]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const view = link.dataset.view;
        navigateTo(view);
      });
    });

    // Mobile Menu Toggle
    DOM.mobileMenuBtn.addEventListener('click', () => {
      const isOpen = DOM.mainNav.classList.toggle('mobile-open');
      DOM.mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
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

    DOM.filterStorageList.addEventListener('change', e => updateSetFilter(e, 'filterStorage', State.filters.storage));
    DOM.filterDisplayList.addEventListener('change', e => updateSetFilter(e, 'filterDisplay', State.filters.display));
    DOM.filterRefreshList.addEventListener('change', e => updateSetFilter(e, 'filterRefresh', State.filters.refresh));

    DOM.filterResetBtn.addEventListener('click', resetAllFilters);

    DOM.activeFiltersSummary.addEventListener('click', e => {
      const removeBtn = e.target.closest('[data-remove-filter]');
      if (!removeBtn) return;
      removeActiveFilter(removeBtn.dataset.removeFilter, removeBtn.dataset.value || '');
    });

    // Mobile Filter Trigger & Close
    DOM.mobileFilterTrigger.addEventListener('click', () => {
      openFilterDrawer();
    });

    if (DOM.filterCloseBtn) {
      DOM.filterCloseBtn.addEventListener('click', () => {
        closeFilterDrawer();
      });
    }
    DOM.filterOverlay.addEventListener('click', closeFilterDrawer);

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
      navigateTo('compare');
    });

    DOM.compareDockClearBtn.addEventListener('click', () => {
      State.compareList = [];
      updateCompareUI();
    });

    // Compare View Actions
    DOM.btnToggleDiffs.addEventListener('click', () => {
      State.highlightDiffs = !State.highlightDiffs;
      DOM.btnToggleDiffs.classList.toggle('selected', State.highlightDiffs);
      DOM.btnToggleDiffs.setAttribute('aria-pressed', String(State.highlightDiffs));
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
      } else if (e.key === 'Escape' && DOM.filterSidebar.classList.contains('mobile-open')) {
        closeFilterDrawer();
      } else if (e.key === 'Tab' && DOM.drawerBackdrop.classList.contains('open')) {
        trapDrawerFocus(e);
      }
    });

    window.addEventListener('hashchange', () => handleRouting(false));
  }

  function updateSetFilter(event, inputName, targetSet) {
    if (event.target.name !== inputName) return;
    const value = Number(event.target.value);
    if (event.target.checked) targetSet.add(value);
    else targetSet.delete(value);
    applyFiltersAndSort();
  }

  function resetAllFilters(shouldRender = true) {
    State.filters.priceMin = null;
    State.filters.priceMax = null;
    State.filters.brands.clear();
    State.filters.ram.clear();
    State.filters.gpu.clear();
    State.filters.storage.clear();
    State.filters.display.clear();
    State.filters.refresh.clear();

    DOM.filterPriceMin.value = '';
    DOM.filterPriceMax.value = '';

    document.querySelectorAll('#filterSidebar input[type="checkbox"]').forEach(cb => {
      cb.checked = false;
    });

    if (shouldRender) applyFiltersAndSort();
  }

  function renderActiveFilters() {
    const chips = [];
    if (State.filters.priceMin !== null) chips.push({ key: 'priceMin', label: `ตั้งแต่ ฿${State.filters.priceMin.toLocaleString()}` });
    if (State.filters.priceMax !== null) chips.push({ key: 'priceMax', label: `ไม่เกิน ฿${State.filters.priceMax.toLocaleString()}` });
    State.filters.brands.forEach(value => chips.push({ key: 'brand', value, label: value }));
    State.filters.ram.forEach(value => chips.push({ key: 'ram', value, label: `RAM ${value}GB` }));
    State.filters.gpu.forEach(value => chips.push({ key: 'gpu', value, label: value }));
    State.filters.storage.forEach(value => chips.push({ key: 'storage', value, label: `${formatStorage(value)} ขึ้นไป` }));
    State.filters.display.forEach(value => chips.push({ key: 'display', value, label: `${value} นิ้วขึ้นไป` }));
    State.filters.refresh.forEach(value => chips.push({ key: 'refresh', value, label: `${value}Hz ขึ้นไป` }));

    if (chips.length === 0) {
      DOM.activeFiltersSummary.hidden = true;
      DOM.activeFiltersSummary.innerHTML = '';
      return;
    }

    DOM.activeFiltersSummary.hidden = false;
    DOM.activeFiltersSummary.innerHTML = `
      <span class="active-filters-label">ตัวกรองที่ใช้:</span>
      ${chips.map(chip => `<button type="button" class="active-filter-chip" data-remove-filter="${chip.key}" data-value="${escapeHtml(chip.value ?? '')}" aria-label="ลบตัวกรอง ${escapeHtml(chip.label)}">${escapeHtml(chip.label)} <span aria-hidden="true">×</span></button>`).join('')}
      <button type="button" class="clear-active-filters" data-remove-filter="all">ล้างทั้งหมด</button>
    `;
  }

  function removeActiveFilter(key, rawValue) {
    const config = {
      brand: { set: State.filters.brands, name: 'filterBrand', value: rawValue },
      ram: { set: State.filters.ram, name: 'filterRam', value: rawValue },
      gpu: { set: State.filters.gpu, name: 'filterGpu', value: rawValue },
      storage: { set: State.filters.storage, name: 'filterStorage', value: Number(rawValue) },
      display: { set: State.filters.display, name: 'filterDisplay', value: Number(rawValue) },
      refresh: { set: State.filters.refresh, name: 'filterRefresh', value: Number(rawValue) }
    };

    if (key === 'all') {
      resetAllFilters();
      return;
    }
    if (key === 'priceMin' || key === 'priceMax') {
      State.filters[key] = null;
      DOM[key === 'priceMin' ? 'filterPriceMin' : 'filterPriceMax'].value = '';
    } else if (config[key]) {
      config[key].set.delete(config[key].value);
      const input = DOM.filterSidebar.querySelector(`input[name="${config[key].name}"][value="${CSS.escape(String(rawValue))}"]`);
      if (input) input.checked = false;
    }
    applyFiltersAndSort();
  }

  function openFilterDrawer() {
    DOM.filterSidebar.classList.add('mobile-open');
    DOM.filterOverlay.classList.add('visible');
    document.body.classList.add('filter-drawer-open');
    window.requestAnimationFrame(() => DOM.filterCloseBtn.focus());
  }

  function closeFilterDrawer() {
    DOM.filterSidebar.classList.remove('mobile-open');
    DOM.filterOverlay.classList.remove('visible');
    document.body.classList.remove('filter-drawer-open');
    DOM.mobileFilterTrigger.focus();
  }

  function trapDrawerFocus(event) {
    const focusable = [...DOM.productDrawer.querySelectorAll('button, a[href], input, select, [tabindex]:not([tabindex="-1"])')]
      .filter(element => !element.disabled && element.offsetParent !== null);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function showToast(message) {
    if (toastTimer) window.clearTimeout(toastTimer);
    DOM.appToast.textContent = message;
    DOM.appToast.hidden = false;
    DOM.appToast.classList.add('visible');
    toastTimer = window.setTimeout(() => {
      DOM.appToast.classList.remove('visible');
      DOM.appToast.hidden = true;
    }, 3200);
  }

  // ==========================================================================
  // 12. UTILITY HELPERS
  // ==========================================================================
  function formatStorage(storage) {
    if (!storage) return '-';
    return storage >= 1000 ? `${storage / 1000}TB` : `${storage}GB`;
  }

  function getProductSpecRows(product) {
    const rows = [];
    const add = (label, value, compact = '') => {
      if (value !== null && value !== undefined && value !== '' && value !== '-') rows.push({ label, value: String(value), compact });
    };
    const category = product.category;
    const laptopLike = ['Laptop', 'Gaming Laptop', 'Desktop PC'].includes(category);

    if (laptopLike) {
      add('หน่วยประมวลผล', product.cpu, `⚙️ ${(product.cpu || '').split('(')[0].trim()}`);
      add('ชิปกราฟิก', product.gpu, `🎮 ${product.gpuChip || (product.gpu || '').split('(')[0].trim()}`);
      add('หน่วยความจำ', product.ram ? `${product.ram}GB ${product.ramType || ''}`.trim() : '', `RAM ${product.ram}GB`);
      add('พื้นที่จัดเก็บ', product.storage ? `${formatStorage(product.storage)} ${product.storageType || ''}`.trim() : '', `SSD ${formatStorage(product.storage)}`);
      add('หน้าจอ', product.displaySize ? `${product.displaySize} นิ้ว ${product.resolution || ''} ${product.refreshRate ? `${product.refreshRate}Hz` : ''}`.trim() : '', `🖥️ ${product.displaySize}\" ${product.refreshRate ? `${product.refreshRate}Hz` : ''}`.trim());
      add('น้ำหนัก', product.weight ? `${product.weight} กิโลกรัม` : '', `⚖️ ${product.weight} kg`);
      add('แบตเตอรี่', product.battery ? `${product.battery} Wh` : '');
      add('ระบบปฏิบัติการ', product.operatingSystem);
    } else if (category === 'Monitor') {
      add('ขนาดหน้าจอ', product.displaySize ? `${product.displaySize} นิ้ว` : '', `🖥️ ${product.displaySize}\"`);
      add('ความละเอียด', product.resolution, product.resolution);
      add('รีเฟรชเรต', product.refreshRate ? `${product.refreshRate}Hz` : '', `↻ ${product.refreshRate}Hz`);
      add('ชนิดพาเนล', product.panelType, product.panelType);
      add('น้ำหนัก', product.weight ? `${product.weight} กิโลกรัม` : '');
    } else if (category === 'SSD') {
      const speed = (product.features || []).find(item => /mb\/s|ความเร็วอ่าน/i.test(item));
      add('ความจุ', formatStorage(product.storage), `💾 ${formatStorage(product.storage)}`);
      add('อินเทอร์เฟซ', product.storageType, product.storageType);
      add('ความเร็วอ่าน/เขียน', speed, speed ? speed.replace(/^ความเร็ว/, '') : '');
    } else if (category === 'CPU') {
      add('รุ่นซีพียู', product.cpu, `⚙️ ${(product.cpu || '').split('(')[0].trim()}`);
      add('จำนวนคอร์', product.cpuCores ? `${product.cpuCores} คอร์` : '', product.cpuCores ? `${product.cpuCores} Cores` : '');
      add('ความเร็วสูงสุด', product.cpuSpeed, product.cpuSpeed);
    } else if (category === 'GPU') {
      add('ชิปกราฟิก', product.gpu, `🎮 ${product.gpuChip || ''}`);
      add('หน่วยความจำกราฟิก', product.ram ? `${product.ram}GB` : '', product.ram ? `VRAM ${product.ram}GB` : '');
      add('น้ำหนัก', product.weight ? `${Math.round(product.weight * 1000)} กรัม` : '');
    } else if (category === 'RAM') {
      add('ความจุ', product.ram ? `${product.ram}GB` : '', `RAM ${product.ram}GB`);
      add('ชนิดและความเร็ว', product.ramType, product.ramType);
    } else if (category === 'Mouse') {
      const dpi = (product.features || []).join(' ').match(/([\d,]+)\s*DPI/i)?.[1];
      add('น้ำหนัก', product.weight ? `${Math.round(product.weight * 1000)} กรัม` : '', `⚖️ ${Math.round(product.weight * 1000)} g`);
      add('ความละเอียดเซ็นเซอร์', dpi ? `${dpi} DPI` : '', dpi ? `🖱️ ${dpi} DPI` : '');
      add('แบตเตอรี่', product.battery ? `${product.battery} mAh (ชาร์จได้)` : '', product.battery ? `🔋 ${product.battery} mAh` : '');
      add('ระบบที่รองรับ', product.operatingSystem);
    } else if (category === 'Mechanical Keyboard') {
      add('น้ำหนัก', product.weight ? `${Math.round(product.weight * 1000)} กรัม` : '', `⚖️ ${Math.round(product.weight * 1000)} g`);
      add('แบตเตอรี่', product.battery ? `${product.battery} mAh` : '', product.battery ? `🔋 ${product.battery} mAh` : '');
      add('ระบบที่รองรับ', product.operatingSystem);
    } else if (category === 'PSU') {
      const wattage = product.name.match(/\b(\d{3,4})W\b/i)?.[1];
      add('กำลังไฟ', wattage ? `${wattage}W` : '', wattage ? `⚡ ${wattage}W` : '');
      add('มาตรฐาน', product.subcategory, product.subcategory);
    } else {
      add('น้ำหนัก', product.weight ? `${product.weight} กิโลกรัม` : '');
      add('ระบบที่รองรับ', product.operatingSystem);
    }

    return rows;
  }

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
