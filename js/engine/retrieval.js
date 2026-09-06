/**
 * ISE — Intelligent Search Engine for Computer & Technology Products
 * Module: Candidate Retrieval (Inverted Index & Constraint Filtering)
 *
 * Implements a lightweight in-memory Inverted Index mapping normalized tokens
 * to product posting lists, combined with hard/soft constraint filtering.
 */

class ISERetrievalEngine {
  constructor(products = []) {
    this.products = products;
    this.productMap = new Map(products.map(p => [p.id, p]));
    this.invertedIndex = new Map(); // token -> Set(productId)
    this.buildInvertedIndex();
  }

  /**
   * Tokenize text into lowercased terms (removing common Thai/English punctuation)
   * @param {string} text
   * @returns {string[]}
   */
  tokenize(text) {
    if (!text) return [];
    return text
      .toLowerCase()
      .replace(/[^\w\d\u0E00-\u0E7F]+/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1);
  }

  /**
   * Build the inverted index over all products
   */
  buildInvertedIndex() {
    this.invertedIndex.clear();

    for (const product of this.products) {
      const docTokens = new Set();

      // Collect tokens from primary searchable fields
      const textCorpus = [
        product.name,
        product.brand,
        product.category,
        product.subcategory,
        product.cpu,
        product.gpu,
        product.gpuChip,
        product.storageType,
        product.panelType,
        ...(product.useCases || []),
        ...(product.features || []),
        ...(product.pros || [])
      ].filter(Boolean).join(' ');

      const tokens = this.tokenize(textCorpus);
      for (const token of tokens) {
        docTokens.add(token);
      }

      // Add numeric spec tokens (e.g. "16gb", "1tb", "144hz", "27")
      if (product.ram) docTokens.add(`${product.ram}gb`);
      if (product.storage) {
        docTokens.add(`${product.storage}gb`);
        if (product.storage >= 1000) docTokens.add(`${product.storage / 1000}tb`);
      }
      if (product.refreshRate) docTokens.add(`${product.refreshRate}hz`);
      if (product.displaySize) {
        docTokens.add(`${product.displaySize}`);
        docTokens.add(`${product.displaySize}"`);
      }

      // Populate posting lists
      for (const token of docTokens) {
        if (!this.invertedIndex.has(token)) {
          this.invertedIndex.set(token, new Set());
        }
        this.invertedIndex.get(token).add(product.id);
      }
    }
  }

  /**
   * Retrieve candidates matching structured intent and raw tokens
   * @param {Object} parsedIntent
   * @returns {Object} { candidates: Product[], matchStats: Object }
   */
  retrieveCandidates(parsedIntent) {
    const startTime = performance.now();
    let candidates = [...this.products];
    const matchReasons = new Map(); // id -> string[]

    // Stage 1: Category Filtering (Soft/Strict)
    if (parsedIntent.category) {
      const targetCat = parsedIntent.category;
      candidates = candidates.filter(p => {
        if (targetCat === 'Laptop') {
          // General laptop query matches both standard Laptop and Gaming Laptop
          return p.category === 'Laptop' || p.category === 'Gaming Laptop';
        }
        if (targetCat === 'Gaming Laptop') {
          // Specific gaming laptop intent matches Gaming Laptop
          return p.category === 'Gaming Laptop';
        }
        return p.category === targetCat;
      });
    }

    // Stage 2: Budget Soft-filtering
    // We allow candidates up to +15% over budget so the ranking stage can mathematically penalize them
    // rather than causing zero-results if a great product is ฿30,900 on a ฿30,000 budget.
    if (parsedIntent.budget && parsedIntent.budget.max) {
      const maxBudgetWithTolerance = parsedIntent.budget.max * 1.15;
      candidates = candidates.filter(p => p.price <= maxBudgetWithTolerance);
    }

    // Stage 3: Specific Hardware Attribute Pre-matching (for targeted queries like "RTX 4060", "27 นิ้ว")
    if (parsedIntent.specs.gpu) {
      const targetGpu = parsedIntent.specs.gpu.toLowerCase();
      // If user specifically asked for an RTX 4060, prioritize products that have it
      const gpuMatches = candidates.filter(p => {
        const pGpu = (p.gpu || '').toLowerCase();
        const pChip = (p.gpuChip || '').toLowerCase();
        return pGpu.includes(targetGpu) || pChip.includes(targetGpu);
      });
      if (gpuMatches.length > 0) {
        // We keep gpu matches as primary candidates
        candidates = gpuMatches;
      }
    }

    if (parsedIntent.specs.displaySize && parsedIntent.category === 'Monitor') {
      const targetSize = parsedIntent.specs.displaySize;
      const sizeMatches = candidates.filter(p => Math.abs(p.displaySize - targetSize) < 1.0);
      if (sizeMatches.length > 0) {
        candidates = sizeMatches;
      }
    }

    // Stage 4: Inverted Index Token Scoring & Matching
    const queryTokens = this.tokenize(parsedIntent.rawQuery);
    const scoredCandidates = candidates.map(product => {
      let tokenHitCount = 0;
      const matchedTokens = [];

      for (const token of queryTokens) {
        const postingList = this.invertedIndex.get(token);
        if (postingList && postingList.has(product.id)) {
          tokenHitCount++;
          matchedTokens.push(token);
        }
      }

      return {
        product,
        tokenHitCount,
        matchedTokens
      };
    });

    // Sort or filter if tokens exist and we have high-relevance matches
    const finalCandidates = scoredCandidates.map(sc => {
      sc.product._retrievalMeta = {
        tokenHitCount: sc.tokenHitCount,
        matchedTokens: sc.matchedTokens
      };
      return sc.product;
    });

    const endTime = performance.now();

    return {
      candidates: finalCandidates,
      stats: {
        totalCatalogCount: this.products.length,
        candidateCount: finalCandidates.length,
        latencyMs: parseFloat((endTime - startTime).toFixed(2)),
        appliedCategory: parsedIntent.category,
        appliedBudgetMax: parsedIntent.budget.max
      }
    };
  }
}

// Compatibility export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ISERetrievalEngine };
} else if (typeof window !== 'undefined') {
  window.ISERetrievalEngine = ISERetrievalEngine;
}
