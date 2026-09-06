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

    const scoredProducts = candidates.map(product => {
      const relevanceScore = this.computeRelevanceScore(product, parsedIntent);
      const budgetScore = this.computeBudgetScore(product, parsedIntent);
      const specScore = this.computeSpecificationScore(product, parsedIntent);
      const useCaseScore = this.computeUseCaseScore(product, parsedIntent);

      const rawFinalScore =
        relevanceScore * this.weights.relevance +
        budgetScore * this.weights.budget +
        specScore * this.weights.specs +
        useCaseScore * this.weights.useCase;

      const finalScore = Math.min(100, Math.max(0, Math.round(rawFinalScore)));

      return {
        ...product,
        matchScore: finalScore,
        scoreBreakdown: {
          overall: finalScore,
          relevance: Math.round(relevanceScore),
          budget: Math.round(budgetScore),
          specs: Math.round(specScore),
          useCase: Math.round(useCaseScore)
        }
      };
    });

    // Sort descending by match score, tie-breaking on use-case score and price
    scoredProducts.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      if (b.scoreBreakdown.useCase !== a.scoreBreakdown.useCase) {
        return b.scoreBreakdown.useCase - a.scoreBreakdown.useCase;
      }
      return a.price - b.price;
    });

    return scoredProducts;
  }

  /**
   * 1. Relevance Score (0 - 100)
   * Evaluates text token overlap, category alignment, and brand match.
   */
  computeRelevanceScore(product, parsedIntent) {
    let score = 50; // Baseline

    // Category match
    if (parsedIntent.category) {
      if (product.category === parsedIntent.category) {
        score += 35;
      } else if (
        parsedIntent.category === 'Laptop' &&
        product.category === 'Gaming Laptop'
      ) {
        score += 25; // Compatible category
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
      const hitBonus = Math.min(20, product._retrievalMeta.tokenHitCount * 5);
      score += hitBonus;
    }

    return Math.min(100, Math.max(10, score));
  }

  /**
   * 2. Budget Score (0 - 100)
   * Evaluates price adherence with progressive penalties for exceeding budget
   * and value-optimization for products within budget.
   */
  computeBudgetScore(product, parsedIntent) {
    const budget = parsedIntent.budget;
    if (!budget || !budget.max) {
      // If no budget specified, return neutral score based on value-for-money
      return 85;
    }

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

    // Fallback: derive specification score from product's native performance level
    return product.performanceLevel || 80;
  }

  /**
   * 4. Use Case Score (0 - 100)
   * Measures product suitability for the specified domain.
   */
  computeUseCaseScore(product, parsedIntent) {
    const useCase = parsedIntent.useCase;
    if (!useCase) {
      // Default to general productivity / performance
      return product.productivityLevel || product.performanceLevel || 80;
    }

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
