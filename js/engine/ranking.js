/**
 * ISE — Intelligent Search Engine for Computer & Technology Products
 * Module: Multi-Criteria Weighted Ranking Engine
 *
 * Implements the core multi-criteria scoring algorithm:
 * FinalScore = (Relevance × 0.30) + (Budget × 0.25) + (Specifications × 0.25) + (UseCase × 0.20)
 *
 * Generates genuine, mathematically grounded sub-scores and overall match metrics.
 */

class ISERankingEngine {
  constructor(weights = { relevance: 0.30, budget: 0.25, specs: 0.25, useCase: 0.20 }) {
    this.weights = weights;
  }

  /**
   * Rank candidate products based on structured query intent
   * @param {Array<Object>} candidates
   * @param {Object} parsedIntent
   * @returns {Array<Object>} Ranked products with breakdown scores
   */
  rank(candidates, parsedIntent) {
    if (!candidates || candidates.length === 0) return [];

    const activeCriteria = this.getActiveCriteria(parsedIntent);
    const activeWeightTotal = Object.entries(activeCriteria)
      .filter(([, active]) => active)
      .reduce((total, [criterion]) => total + this.weights[criterion], 0);

    const scoredProducts = candidates.map(product => {
      const relevanceScore = activeCriteria.relevance ? this.computeRelevanceScore(product, parsedIntent) : null;
      const budgetScore = activeCriteria.budget ? this.computeBudgetScore(product, parsedIntent) : null;
      const specScore = activeCriteria.specs ? this.computeSpecificationScore(product, parsedIntent) : null;
      const useCaseScore = activeCriteria.useCase ? this.computeUseCaseScore(product, parsedIntent) : null;

      const weightedScores = { relevance: relevanceScore, budget: budgetScore, specs: specScore, useCase: useCaseScore };
      const rawFinalScore = activeWeightTotal > 0
        ? Object.entries(weightedScores).reduce((total, [criterion, score]) => {
          return score === null ? total : total + score * this.weights[criterion];
        }, 0) / activeWeightTotal
        : null;

      const finalScore = rawFinalScore === null ? null : Math.min(100, Math.max(0, Math.round(rawFinalScore)));

      return {
        ...product,
        matchScore: finalScore,
        scoreBreakdown: {
          overall: finalScore,
          relevance: relevanceScore === null ? null : Math.round(relevanceScore),
          budget: budgetScore === null ? null : Math.round(budgetScore),
          specs: specScore === null ? null : Math.round(specScore),
          useCase: useCaseScore === null ? null : Math.round(useCaseScore)
        },
        activeCriteria: { ...activeCriteria }
      };
    });

    // Sort descending by match score, tie-breaking on use-case score and price
    scoredProducts.sort((a, b) => {
      if ((b.matchScore ?? -1) !== (a.matchScore ?? -1)) {
        return (b.matchScore ?? -1) - (a.matchScore ?? -1);
      }
      if ((b.scoreBreakdown.useCase ?? -1) !== (a.scoreBreakdown.useCase ?? -1)) {
        return (b.scoreBreakdown.useCase ?? -1) - (a.scoreBreakdown.useCase ?? -1);
      }
      return a.price - b.price;
    });

    return scoredProducts;
  }

  getActiveCriteria(parsedIntent = {}) {
    const specs = parsedIntent.specs || {};
    const hasSpecs = Object.values(specs).some(value => value !== null && value !== undefined);
    const hasProductIntent = Boolean(parsedIntent.category || parsedIntent.brand || parsedIntent.useCase || hasSpecs);

    return {
      relevance: hasProductIntent,
      budget: Boolean(parsedIntent.budget && (parsedIntent.budget.min || parsedIntent.budget.max)),
      specs: hasSpecs,
      useCase: Boolean(parsedIntent.useCase)
    };
  }

  /**
   * 1. Relevance Score (0 - 100)
   * Evaluates text token overlap, category alignment, and brand match.
   */
  computeRelevanceScore(product, parsedIntent) {
    let score = 35;

    // Category match
    if (parsedIntent.category) {
      if (product.category === parsedIntent.category) {
        score += 45;
      } else if (
        parsedIntent.category === 'Laptop' &&
        product.category === 'Gaming Laptop'
      ) {
        score += 35; // Compatible category
      } else {
        score -= 25;
      }
    }

    // Brand match
    if (parsedIntent.brand) {
      if (product.brand.toLowerCase() === parsedIntent.brand.toLowerCase()) {
        score += 15;
      } else {
        score -= 10;
      }
    }

    // Token hit boost from inverted index
    if (product._retrievalMeta && product._retrievalMeta.tokenHitCount) {
      const hitBonus = Math.min(25, product._retrievalMeta.tokenHitCount * 10);
      score += hitBonus;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * 2. Budget Score (0 - 100)
   * Evaluates price adherence with progressive penalties for exceeding budget
   * and value-optimization for products within budget.
   */
  computeBudgetScore(product, parsedIntent) {
    const budget = parsedIntent.budget;
    if (!budget || !budget.max) return null;

    const maxBudget = budget.max;
    const price = product.price;

    if (price <= maxBudget) {
      // Within budget: reward optimal budget utilization
      // Products that use 70-100% of budget receive high marks (90-100)
      // Products that severely under-utilize budget (e.g. 50% lower spec) receive minor deduction
      const utilization = price / maxBudget;
      if (utilization >= 0.70) {
        return 92 + utilization * 8; // 97 - 100
      } else {
        return 75 + utilization * 20; // 85 - 92
      }
    } else {
      // Over budget: progressive penalty
      // 10% over budget = -35 points
      // 20% over budget = -70 points
      // > 28% over budget = 0 points
      const overflowRatio = (price - maxBudget) / maxBudget;
      const penalty = overflowRatio * 350;
      const score = Math.max(0, 100 - penalty);
      return score;
    }
  }

  /**
   * 3. Specification Score (0 - 100)
   * Evaluates requested technical parameters (GPU, CPU, RAM, Display, Storage).
   */
  computeSpecificationScore(product, parsedIntent) {
    const specs = parsedIntent.specs || {};
    const evalCriteria = [];

    // Evaluate GPU
    if (specs.gpu) {
      const targetGpu = specs.gpu.toLowerCase();
      const productGpu = (product.gpu || '').toLowerCase();
      const productChip = (product.gpuChip || '').toLowerCase();

      if (productChip.includes(targetGpu) || productGpu.includes(targetGpu)) {
        evalCriteria.push(100);
      } else if (targetGpu === 'rtx 4060' && productChip.includes('rtx 4050')) {
        evalCriteria.push(65); // Inferior tier
      } else if (targetGpu === 'rtx 4060' && productChip.includes('rtx 4070')) {
        evalCriteria.push(98); // Superior tier
      } else {
        evalCriteria.push(40);
      }
    }

    // Evaluate CPU family/model
    if (specs.cpu) {
      const targetCpu = specs.cpu.toLowerCase();
      const productCpu = (product.cpu || '').toLowerCase();
      evalCriteria.push(productCpu.includes(targetCpu) ? 100 : 40);
    }

    // Evaluate RAM
    if (specs.ram) {
      const targetRam = specs.ram;
      const productRam = product.ram || 0;

      if (productRam >= targetRam) {
        evalCriteria.push(100);
      } else {
        // e.g. 8GB for 16GB requirement = 50 score
        evalCriteria.push(Math.round((productRam / targetRam) * 60));
      }
    }

    // Evaluate Display Size
    if (specs.displaySize && product.displaySize) {
      const targetSize = specs.displaySize;
      const diff = Math.abs(product.displaySize - targetSize);
      if (diff < 0.2) {
        evalCriteria.push(100);
      } else if (diff <= 1.0) {
        evalCriteria.push(85);
      } else {
        evalCriteria.push(50);
      }
    }

    // Evaluate Refresh Rate (Hz)
    if (specs.refreshRate && product.refreshRate) {
      const targetHz = specs.refreshRate;
      const productHz = product.refreshRate;
      if (productHz >= targetHz) {
        evalCriteria.push(100);
      } else {
        evalCriteria.push(Math.round((productHz / targetHz) * 60));
      }
    }

    // Evaluate Storage
    if (specs.storage && product.storage) {
      const targetStorage = specs.storage;
      const productStorage = product.storage;
      if (productStorage === targetStorage) {
        evalCriteria.push(100);
      } else if (productStorage > targetStorage) {
        evalCriteria.push(92); // Over capacity when specific size was asked
      } else {
        evalCriteria.push(65);
      }
    }

    // If explicit specs were checked, average them
    if (evalCriteria.length > 0) {
      const sum = evalCriteria.reduce((a, b) => a + b, 0);
      return sum / evalCriteria.length;
    }

    return null;
  }

  /**
   * 4. Use Case Score (0 - 100)
   * Measures product suitability for the specified domain.
   */
  computeUseCaseScore(product, parsedIntent) {
    const useCase = parsedIntent.useCase;
    if (!useCase) return null;

    switch (useCase) {
      case 'Programming':
        return product.programmingLevel || 75;

      case 'Gaming':
        return product.gamingLevel || 70;

      case 'Thin & Light': {
        // Evaluated based on actual weight and battery capacity
        if (product.category !== 'Laptop' && product.category !== 'Gaming Laptop') {
          return 40;
        }
        let score = 70;
        // Weight score: 1.2kg = +20, 1.4kg = +10, 2.2kg = -25
        const weight = product.weight || 2.0;
        if (weight <= 1.25) score += 20;
        else if (weight <= 1.5) score += 10;
        else if (weight >= 2.2) score -= 30;

        // Battery score: 70Wh+ = +15, 40Wh = -5
        const battery = product.battery || 50;
        if (battery >= 70) score += 15;
        else if (battery <= 45) score -= 5;

        return Math.min(100, Math.max(30, score));
      }

      case 'AI Workload':
        return product.aiWorkloadLevel || 60;

      case 'Content Creation':
        // Blend of performance and productivity
        return Math.round(((product.performanceLevel || 80) + (product.productivityLevel || 80)) / 2);

      case 'Productivity':
        return product.productivityLevel || 80;

      default:
        return product.performanceLevel || 80;
    }
  }
}

// Compatibility export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ISERankingEngine };
} else if (typeof window !== 'undefined') {
  window.ISERankingEngine = ISERankingEngine;
}
