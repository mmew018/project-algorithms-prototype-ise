/**
 * ISE — Intelligent Search Engine for Computer & Technology Products
 * Module: Query Parser (Deterministic Rule-Based Query Understanding)
 *
 * Extracts structured intent from natural language queries (Thai & English).
 * Identifies categories, budgets, hardware specifications, and domain use-cases.
 */

const ISEQueryParser = {
  /**
   * Parse raw user query into structured intent representation
   * @param {string} rawQuery
   * @returns {Object} Structured query intent
   */
  parse(rawQuery) {
    if (!rawQuery || typeof rawQuery !== 'string') {
      return this.getEmptyIntent('');
    }

    const query = rawQuery.trim();
    const lower = query.toLowerCase();

    // 1. Category extraction
    const category = this.extractCategory(lower);

    // 2. Budget extraction (min, max, target)
    const budget = this.extractBudget(lower);

    // 3. Hardware specifications extraction
    const specs = this.extractSpecs(lower);

    // 4. Use Case extraction
    const useCase = this.extractUseCase(lower, category);

    // 5. Brand extraction
    const brand = this.extractBrand(lower);

    // 6. Infer implicit priorities
    const priority = this.inferPriority({ category, budget, specs, useCase });

    // 7. Generate a human-readable interpretation badge text
    const interpretationText = this.buildInterpretationText({ category, budget, specs, useCase, brand });

    return {
      rawQuery: query,
      normalizedQuery: lower,
      category,
      brand,
      budget,
      specs,
      useCase,
      priority,
      interpretationText
    };
  },

  getEmptyIntent(rawQuery) {
    return {
      rawQuery: rawQuery || '',
      normalizedQuery: '',
      category: null,
      brand: null,
      budget: { min: null, max: null, target: null },
      specs: {
        cpu: null,
        gpu: null,
        ram: null,
        storage: null,
        displaySize: null,
        refreshRate: null
      },
      useCase: null,
      priority: 'General Relevance',
      interpretationText: 'ค้นหาทั่วไป'
    };
  },

  extractCategory(text) {
    // Gaming Laptop priority before general Laptop
    if (
      text.includes('gaming laptop') ||
      text.includes('gaming notebook') ||
      text.includes('โน้ตบุ๊กเกมมิ่ง') ||
      text.includes('โน้ตบุ๊คเกมมิ่ง') ||
      text.includes('แล็ปท็อปเกมมิ่ง') ||
      (text.includes('gaming') && (text.includes('โน้ตบุ๊ก') || text.includes('โน้ตบุ๊ค') || text.includes('laptop') || text.includes('notebook')))
    ) {
      return 'Gaming Laptop';
    }

    if (
      text.includes('โน้ตบุ๊ก') ||
      text.includes('โน้ตบุ๊ค') ||
      text.includes('แล็ปท็อป') ||
      text.includes('laptop') ||
      text.includes('notebook') ||
      text.includes('ultrabook') ||
      text.includes('macbook')
    ) {
      return 'Laptop';
    }

    if (
      text.includes('จอคอม') ||
      text.includes('จอมอนิเตอร์') ||
      text.includes('หน้าจอ') ||
      text.startsWith('จอ') ||
      text.includes(' จอ') ||
      text.includes('monitor') ||
      text.includes('display')
    ) {
      return 'Monitor';
    }

    if (text.includes('การ์ดจอ') || text.includes('gpu') || text.includes('graphic card') || text.includes('vga')) {
      return 'GPU';
    }

    if (text.includes('ซีพียู') || text.includes('cpu') || text.includes('processor') || text.includes('หน่วยประมวลผล')) {
      return 'CPU';
    }

    if (text.includes('ssd') || text.includes('เอสเอสดี') || text.includes('solid state') || text.includes('nvme')) {
      return 'SSD';
    }

    if (text.includes('ram') || text.includes('แรม') || text.includes('memory') || text.includes('ddr4') || text.includes('ddr5')) {
      // Check if it's explicitly asking for RAM product rather than "laptop with 16gb ram"
      if (text.startsWith('ram') || text.startsWith('แรม') || text.includes('ซื้อ ram') || text.includes('ซื้อแรม')) {
        return 'RAM';
      }
    }

    if (
      text.includes('คีย์บอร์ด') ||
      text.includes('keyboard') ||
      text.includes('mechanical keyboard')
    ) {
      return 'Mechanical Keyboard';
    }

    if (text.includes('เมาส์') || text.includes('mouse')) {
      return 'Mouse';
    }

    if (text.includes('พาวเวอร์') || text.includes('psu') || text.includes('power supply')) {
      return 'PSU';
    }

    if (
      text.includes('คอมตั้งโต๊ะ') ||
      text.includes('คอมพิวเตอร์') ||
      text.includes('desktop') ||
      text.includes('workstation') ||
      text.includes('pc') ||
      text.includes('คอมประกอบ')
    ) {
      return 'Desktop PC';
    }

    return null;
  },

  extractBudget(text) {
    let min = null;
    let max = null;

    // Pattern 1: Range (e.g. 20000 - 30000, 20k - 30k, 20000 ถึง 30000)
    const rangeMatch = text.match(/(\d+[\d,]*|\d+k)\s*(?:-|ถึง|to)\s*(\d+[\d,]*|\d+k)/i);
    if (rangeMatch) {
      min = this.parseBudgetValue(rangeMatch[1]);
      max = this.parseBudgetValue(rangeMatch[2]);
      return { min, max, target: max };
    }

    // Pattern 2: Upper bound (e.g. งบไม่เกิน 30000, ราคาไม่เกิน 40000, งบ 30,000, ต่ำกว่า 25000, ไม่เกิน 35k, 3 หมื่น)
    const maxMatch = text.match(/(?:งบ(?:ไม่เกิน|ไม่เกินกว่า)?|ราคา(?:ไม่เกิน|ต่ำกว่า)?|ต่ำกว่า|ไม่เกิน|budget|under|max)\s*[:=]?\s*(\d+[\d,]*|\d+k|\d+\s*หมื่น)/i);
    if (maxMatch) {
      max = this.parseBudgetValue(maxMatch[1]);
      return { min: null, max, target: max };
    }

    // Pattern 3: Simple budget declaration (e.g. "งบ 30000", "งบ 40k")
    const simpleBudgetMatch = text.match(/งบ\s*(\d+[\d,]*|\d+k|\d+\s*หมื่น)/i);
    if (simpleBudgetMatch) {
      max = this.parseBudgetValue(simpleBudgetMatch[1]);
      return { min: null, max, target: max };
    }

    // Pattern 4: Bare price with 'บาท' or 'k' (e.g. "30000 บาท", "40k")
    const bahtMatch = text.match(/(\d{4,6})\s*(?:บาท|thb)/i);
    if (bahtMatch) {
      max = parseInt(bahtMatch[1], 10);
      return { min: null, max, target: max };
    }

    return { min: null, max: null, target: null };
  },

  parseBudgetValue(valStr) {
    if (!valStr) return null;
    const clean = valStr.trim().toLowerCase();

    if (clean.includes('หมื่น')) {
      const num = parseFloat(clean.replace('หมื่น', '').trim()) || 1;
      return num * 10000;
    }

    if (clean.endsWith('k')) {
      const num = parseFloat(clean.replace('k', '')) || 0;
      return num * 1000;
    }

    const digitsOnly = clean.replace(/,/g, '');
    const num = parseInt(digitsOnly, 10);
    return isNaN(num) ? null : num;
  },

  extractSpecs(text) {
    const specs = {
      cpu: null,
      gpu: null,
      ram: null,
      storage: null,
      displaySize: null,
      refreshRate: null
    };

    // GPU Extraction
    if (text.includes('rtx 4090') || text.includes('4090')) {
      specs.gpu = 'RTX 4090';
    } else if (text.includes('rtx 4080 super') || text.includes('4080 super') || text.includes('rtx 4080')) {
      specs.gpu = 'RTX 4080';
    } else if (text.includes('rtx 4070 super') || text.includes('4070 super')) {
      specs.gpu = 'RTX 4070 Super';
    } else if (text.includes('rtx 4070') || text.includes('4070')) {
      specs.gpu = 'RTX 4070';
    } else if (text.includes('rtx 4060 ti') || text.includes('4060 ti')) {
      specs.gpu = 'RTX 4060 Ti';
    } else if (text.includes('rtx 4060') || text.includes('4060')) {
      specs.gpu = 'RTX 4060';
    } else if (text.includes('rtx 4050') || text.includes('4050')) {
      specs.gpu = 'RTX 4050';
    } else if (text.includes('rx 7800 xt') || text.includes('7800 xt') || text.includes('rx 7800')) {
      specs.gpu = 'RX 7800 XT';
    }

    // CPU Extraction
    if (text.includes('core ultra 9') || text.includes('ultra 9')) {
      specs.cpu = 'Intel Core Ultra 9';
    } else if (text.includes('core ultra 7') || text.includes('ultra 7')) {
      specs.cpu = 'Intel Core Ultra 7';
    } else if (text.includes('i9-14900k') || text.includes('i9 14900k') || text.includes('i9')) {
      specs.cpu = 'Intel Core i9';
    } else if (text.includes('i7-14700k') || text.includes('i7 14700k') || text.includes('i7')) {
      specs.cpu = 'Intel Core i7';
    } else if (text.includes('i5-13500h') || text.includes('i5 13500') || text.includes('i5')) {
      specs.cpu = 'Intel Core i5';
    } else if (text.includes('7950x') || text.includes('ryzen 9 7950x') || text.includes('ryzen 9')) {
      specs.cpu = 'AMD Ryzen 9';
    } else if (text.includes('7800x3d') || text.includes('ryzen 7 7800x3d') || text.includes('ryzen 7')) {
      specs.cpu = 'AMD Ryzen 7';
    } else if (text.includes('7600x') || text.includes('ryzen 5 7600x') || text.includes('ryzen 5')) {
      specs.cpu = 'AMD Ryzen 5';
    } else if (text.includes('m3 pro')) {
      specs.cpu = 'Apple M3 Pro';
    } else if (text.includes('m3')) {
      specs.cpu = 'Apple M3';
    }

    // RAM Extraction
    const ramMatch = text.match(/(?:ram|แรม)\s*(\d{1,3})\s*(?:gb)?/i) || text.match(/(\d{1,3})\s*gb\s*(?:ram|แรม)/i);
    if (ramMatch) {
      specs.ram = parseInt(ramMatch[1], 10);
    } else if (text.includes('16gb') || text.includes('16 gb')) {
      // Check if not preceded by storage/ssd
      if (!text.includes('ssd 16') && !text.includes('16 นิ้ว')) {
        // Can be RAM 16GB if reasonable
        if (text.includes('ram 16') || text.includes('แรม 16') || (!text.includes('นิ้ว') && !text.includes('ssd'))) {
          // If query mentions laptop/pc or coding, 16gb is typically RAM
          if (text.includes('เขียนโปรแกรม') || text.includes('laptop') || text.includes('gaming')) {
            specs.ram = 16;
          }
        }
      }
    } else if (text.includes('32gb') || text.includes('32 gb')) {
      specs.ram = 32;
    } else if (text.includes('64gb') || text.includes('64 gb')) {
      specs.ram = 64;
    }

    // Storage Extraction
    if (text.includes('1tb') || text.includes('1 tb') || text.includes('1000gb')) {
      specs.storage = 1000;
    } else if (text.includes('2tb') || text.includes('2 tb')) {
      specs.storage = 2000;
    } else if (text.includes('512gb') || text.includes('512 gb')) {
      specs.storage = 512;
    }

    // Display Size Extraction (e.g. 27 นิ้ว, 27", 24 นิ้ว, 14 นิ้ว, 16 นิ้ว)
    const sizeMatch = text.match(/(\d{2}(?:\.\d)?)\s*(?:นิ้ว|\"|\s*inch)/i);
    if (sizeMatch) {
      specs.displaySize = parseFloat(sizeMatch[1]);
    }

    // Refresh Rate Extraction (e.g. 144Hz, 165Hz, 240Hz, 180Hz, 120Hz)
    const hzMatch = text.match(/(\d{2,3})\s*(?:hz|เฮิร์ตซ์)/i);
    if (hzMatch) {
      specs.refreshRate = parseInt(hzMatch[1], 10);
    } else if (text.includes('144 hz') || text.includes('144hz') || text.includes('จอ 144')) {
      specs.refreshRate = 144;
    } else if (text.includes('165 hz') || text.includes('165hz')) {
      specs.refreshRate = 165;
    } else if (text.includes('240 hz') || text.includes('240hz')) {
      specs.refreshRate = 240;
    }

    return specs;
  },

  extractUseCase(text, category) {
    if (
      text.includes('เขียนโปรแกรม') ||
      text.includes('เขียนโค้ด') ||
      text.includes('coding') ||
      text.includes('programming') ||
      text.includes('developer') ||
      text.includes('dev') ||
      text.includes('โปรแกรมเมอร์')
    ) {
      return 'Programming';
    }

    if (
      text.includes('เล่นเกม') ||
      text.includes('เกมมิ่ง') ||
      text.includes('gaming') ||
      text.includes('game') ||
      text.includes('esport') ||
      text.includes('esports')
    ) {
      return 'Gaming';
    }

    if (
      text.includes('บางเบา') ||
      text.includes('แบตอึด') ||
      text.includes('พกพา') ||
      text.includes('น้ำหนักเบา') ||
      text.includes('ทำงานนอกสถานที่') ||
      text.includes('battery') ||
      text.includes('thin & light')
    ) {
      return 'Thin & Light';
    }

    if (
      text.includes('ai') ||
      text.includes('deep learning') ||
      text.includes('machine learning') ||
      text.includes('data science') ||
      text.includes('llm') ||
      text.includes('ปัญญาประดิษฐ์')
    ) {
      return 'AI Workload';
    }

    if (
      text.includes('ตัดต่อ') ||
      text.includes('ตัดต่อวิดีโอ') ||
      text.includes('วิดีโอ') ||
      text.includes('กราฟิก') ||
      text.includes('แต่งภาพ') ||
      text.includes('3d') ||
      text.includes('render')
    ) {
      return 'Content Creation';
    }

    if (
      text.includes('ทำงาน') ||
      text.includes('ออฟฟิศ') ||
      text.includes('งานเอกสาร') ||
      text.includes('เรียนออนไลน์') ||
      text.includes('office') ||
      text.includes('productivity')
    ) {
      return 'Productivity';
    }

    // Default use case inferred from category
    if (category === 'Gaming Laptop') return 'Gaming';
    return null;
  },

  extractBrand(text) {
    const brands = [
      'ASUS', 'Lenovo', 'Acer', 'Dell', 'HP', 'Apple', 'MSI',
      'Gigabyte', 'Kingston', 'Western Digital', 'Samsung', 'Crucial',
      'AMD', 'Intel', 'Corsair', 'G.Skill', 'Sapphire', 'Keychron',
      'Logitech', 'Seasonic', 'Cooler Master', 'ZOTAC', 'NexusTech'
    ];

    for (const b of brands) {
      if (text.includes(b.toLowerCase())) {
        return b;
      }
    }

    // Aliases
    if (text.includes('wd')) return 'Western Digital';
    if (text.includes('เอซุส')) return 'ASUS';
    if (text.includes('เลอโนโว')) return 'Lenovo';
    if (text.includes('แอปเปิ้ล')) return 'Apple';

    return null;
  },

  inferPriority({ category, budget, specs, useCase }) {
    if (budget.max && useCase === 'Programming') {
      return 'ความคุ้มค่าด้านการประมวลผลและแรมในงบประมาณ';
    }
    if (specs.gpu && useCase === 'Gaming') {
      return 'ประสิทธิภาพชิปกราฟิกและการระบายความร้อน';
    }
    if (useCase === 'Thin & Light') {
      return 'อายุการใช้งานแบตเตอรี่และน้ำหนักความคล่องตัว';
    }
    if (useCase === 'AI Workload') {
      return 'พลังประมวลผล Multi-core, ชุดคำสั่งเร่งความเร็ว และ VRAM';
    }
    if (category === 'Monitor' && specs.refreshRate) {
      return 'ความลื่นไหลของภาพ (Hz) และความคมชัดของพาเนล';
    }
    if (category === 'SSD') {
      return 'ความเร็วอ่าน/เขียนต่อเนื่อง (Sequential) และ DRAM Cache';
    }
    return 'ความเหมาะสมโดยรวมของสเปกต่อราคา';
  },

  buildInterpretationText({ category, budget, specs, useCase, brand }) {
    const parts = [];
    if (category) parts.push(`หมวดหมู่: ${category}`);
    if (brand) parts.push(`แบรนด์: ${brand}`);
    if (useCase) parts.push(`การใช้งาน: ${useCase}`);
    if (budget.max) parts.push(`งบประมาณ: ≤ ฿${budget.max.toLocaleString()}`);
    if (specs.gpu) parts.push(`การ์ดจอ: ${specs.gpu}`);
    if (specs.cpu) parts.push(`ซีพียู: ${specs.cpu}`);
    if (specs.ram) parts.push(`RAM: ≥ ${specs.ram}GB`);
    if (specs.storage) parts.push(`พื้นที่จัดเก็บ: ${specs.storage >= 1000 ? `${specs.storage / 1000}TB` : `${specs.storage}GB`}`);
    if (specs.displaySize) parts.push(`ขนาดจอ: ${specs.displaySize}"`);
    if (specs.refreshRate) parts.push(`รีเฟรชเรต: ≥ ${specs.refreshRate}Hz`);

    return parts.length > 0 ? parts.join(' • ') : 'ค้นหาทั่วไปตามคำสำคัญ';
  }
};

// Compatibility export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ISEQueryParser };
} else if (typeof window !== 'undefined') {
  window.ISEQueryParser = ISEQueryParser;
}
