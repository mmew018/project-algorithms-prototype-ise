/**
 * ISE — Intelligent Search Engine for Computer & Technology Products
 * Module: Explainable Ranking (Why This Result Generator)
 *
 * Generates natural-language reasoning in Thai based on real matching signals,
 * specification highlights, and trade-off considerations.
 */

const ISEExplainer = {
  /**
   * Generate comprehensive explanation for a ranked product
   * @param {Object} product Ranked product with scoreBreakdown
   * @param {Object} parsedIntent Structured query intent
   * @returns {Object} Explanation details { summary, highlights, tradeOffs }
   */
  explain(product, parsedIntent) {
    const highlights = [];
    const reasons = [];
    let tradeOff = '';

    const breakdown = product.scoreBreakdown || { relevance: null, budget: null, specs: null, useCase: null };

    if (parsedIntent.category) {
      const categoryMatches = product.category === parsedIntent.category ||
        (parsedIntent.category === 'Laptop' && product.category === 'Gaming Laptop');
      if (categoryMatches) reasons.push(`อยู่ในหมวด ${product.category} ที่ค้นหา`);
    }

    if (parsedIntent.brand && product.brand.toLowerCase() === parsedIntent.brand.toLowerCase()) {
      reasons.push(`เป็นแบรนด์ ${product.brand} ตามที่ระบุ`);
    }

    // 1. Explain Budget Signal
    if (parsedIntent.budget && parsedIntent.budget.max) {
      const budgetMax = parsedIntent.budget.max;
      if (product.price <= budgetMax) {
        const diff = budgetMax - product.price;
        if (diff === 0) {
          highlights.push(`ตรงตามงบประมาณพอดี (฿${product.price.toLocaleString()})`);
          reasons.push('อยู่ในงบประมาณที่กำหนด');
        } else {
          highlights.push(`ประหยัดกว่างบประมาณ ฿${diff.toLocaleString()} (ราคา ฿${product.price.toLocaleString()})`);
          reasons.push(`อยู่ในงบประมาณที่ตั้งไว้`);
        }
      } else {
        const over = product.price - budgetMax;
        highlights.push(`เกินงบประมาณเล็กน้อย ฿${over.toLocaleString()}`);
        tradeOff = `ราคา ฿${product.price.toLocaleString()} สูงกว่างบที่กำหนดไว้ ฿${budgetMax.toLocaleString()}`;
      }
    }

    // 2. Explain Hardware Specification Signals
    if (parsedIntent.specs) {
      const { gpu, ram, storage, displaySize, refreshRate, cpu } = parsedIntent.specs;

      // GPU Match
      if (gpu) {
        const pGpu = product.gpuChip || product.gpu || '';
        if (pGpu.toLowerCase().includes(gpu.toLowerCase())) {
          highlights.push(`ติดตั้งชิปกราฟิก ${pGpu} ตรงตามต้องการ`);
          reasons.push(`ใช้การ์ดจอ ${pGpu}`);
        }
      }

      // RAM Match
      if (ram && product.ram) {
        if (product.ram >= ram) {
          highlights.push(`RAM ${product.ram}GB เพียงพอกับงานที่ต้องการ`);
          reasons.push(`มีหน่วยความจำ RAM ${product.ram}GB`);
        }
      }

      // Display Size & Refresh Rate
      if (displaySize && product.displaySize) {
        if (Math.abs(product.displaySize - displaySize) < 0.5) {
          highlights.push(`หน้าจอขนาด ${product.displaySize} นิ้ว ตรงตามความต้องการ`);
          reasons.push(`ขนาดจอ ${product.displaySize}"`);
        }
      }

      if (refreshRate && product.refreshRate) {
        if (product.refreshRate >= refreshRate) {
          highlights.push(`รีเฟรชเรตสูง ${product.refreshRate}Hz ภาพลื่นไหล`);
          reasons.push(`รีเฟรชเรต ${product.refreshRate}Hz`);
        }
      }

      // Storage Match
      if (storage && product.storage) {
        const storageLabel = product.storage >= 1000 ? `${product.storage / 1000}TB` : `${product.storage}GB`;
        highlights.push(`พื้นที่จัดเก็บ ${storageLabel} (${product.storageType || 'NVMe'})`);
      }
    }

    // 3. Explain Domain / Use Case Suitability
    if (parsedIntent.useCase) {
      switch (parsedIntent.useCase) {
        case 'Programming':
          if (product.programmingLevel >= 85) {
            reasons.push(`ซีพียู ${product.cpu ? product.cpu.split('(')[0].trim() : 'ประสิทธิภาพสูง'} เหมาะสำหรับการคอมไพล์โค้ดและรัน Docker`);
            highlights.push(`คะแนนความเหมาะสมเขียนโค้ดสูงถึง ${product.programmingLevel}/100`);
          }
          break;

        case 'Gaming':
          if (product.gamingLevel >= 85) {
            reasons.push(`รองรับการเล่นเกมระดับสูงได้อย่างลื่นไหล`);
            highlights.push(`คะแนนด้านการเล่นเกม ${product.gamingLevel}/100`);
          }
          break;

        case 'Thin & Light':
          if (product.weight && product.weight <= 1.5) {
            reasons.push(`น้ำหนักบางเบาเพียง ${product.weight} กก. และพกพาสะดวก`);
            highlights.push(`ตัวเครื่องบางเบา ${product.weight} kg`);
          }
          if (product.battery && product.battery >= 60) {
            highlights.push(`แบตเตอรี่ ${product.battery}Whr ใช้งานนอกสถานที่ได้ยาวนาน`);
          }
          break;

        case 'AI Workload':
          if (product.aiWorkloadLevel >= 85) {
            reasons.push(`มีสเปกและชุดคำสั่งรองรับงานประมวลผล AI/Machine Learning`);
            highlights.push(`คะแนนรองรับงาน AI สูงถึง ${product.aiWorkloadLevel}/100`);
          }
          break;
      }
    }

    // 4. Construct Natural Summary Sentence
    let summary = '';
    if (reasons.length > 0) {
      summary = `เหมาะกับความต้องการนี้เพราะ ${reasons.join(', ')}`;
    } else {
      // Browse/catalog fallback: describe the product without pretending that
      // unspecified criteria were matched.
      const firstPro = product.pros && product.pros.length > 0 ? product.pros[0] : '';
      summary = firstPro ? `จุดเด่นของรุ่นนี้คือ ${firstPro}` : 'ดูรายละเอียดสเปกเพื่อพิจารณาความเหมาะสมกับการใช้งานของคุณ';
    }

    // Add first con as trade-off if not already set
    if (!tradeOff && product.cons && product.cons.length > 0) {
      tradeOff = product.cons[0];
    }

    return {
      summary,
      highlights: highlights.slice(0, 4),
      tradeOff
    };
  }
};

// Compatibility export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ISEExplainer };
} else if (typeof window !== 'undefined') {
  window.ISEExplainer = ISEExplainer;
}
