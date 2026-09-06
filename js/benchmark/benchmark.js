/**
 * ISE — Intelligent Search Engine for Computer & Technology Products
 * Module: Benchmark & Evaluation Framework (Regression Test Suite)
 *
 * Provides standardized query test scenarios with predefined ground-truth items.
 * Evaluates Information Retrieval metrics (Precision@K, Recall@K, MRR, Latency)
 * comparing Baseline (Keyword-based) vs ISE (Intelligent Multi-Criteria Ranking).
 */

const ISE_BENCHMARK_SCENARIOS = [
  {
    id: "sc-1",
    title: "Scenario 1: โน้ตบุ๊กสำหรับเขียนโปรแกรม งบไม่เกิน 30,000",
    query: "โน้ตบุ๊กสำหรับเขียนโปรแกรม งบไม่เกิน 30000",
    description: "โน้ตบุ๊กทำงานเขียนโค้ด ซีพียูประสิทธิภาพสูง แรม 16GB ในงบประมาณไม่เกิน 30,000 บาท",
    groundTruthIds: [
      "nb-acer-swift-go14",      // i5-13500H, 16GB, OLED, ฿28,900
      "nb-lenovo-ideapad5-r7",   // Ryzen 7 7730U, 16GB, ฿27,900
      "nb-asus-vivobook16-i5"    // i5-13500H, 16GB, ฿26,900
    ],
    expectedCategory: "Laptop",
    expectedBudgetMax: 30000
  },
  {
    id: "sc-2",
    title: "Scenario 2: Gaming Laptop RTX 4060 ราคาไม่เกิน 40,000",
    query: "Gaming Laptop RTX 4060 ราคาไม่เกิน 40000",
    description: "เกมมิ่งโน้ตบุ๊กติดตั้งการ์ดจอ RTX 4060 8GB ในงบประมาณไม่เกิน 40,000 บาท",
    groundTruthIds: [
      "gl-lenovo-loq-4060",      // i5-13450HX, RTX 4060 105W, ฿37,900
      "gl-hp-victus16-4060",     // Ryzen 5 7640HS, RTX 4060 120W, ฿38,900
      "gl-acer-nitrov15-4060"    // i5-13420H, RTX 4060 75W, ฿34,900
    ],
    expectedCategory: "Gaming Laptop",
    expectedGpu: "RTX 4060"
  },
  {
    id: "sc-3",
    title: "Scenario 3: จอ 27 นิ้ว 144Hz",
    query: "จอ 27 นิ้ว 144Hz",
    description: "จอมอนิเตอร์ขนาด 27 นิ้ว อัตรารีเฟรชเรต 144Hz หรือสูงกว่า พาเนล IPS สำหรับเล่นเกมและทำงาน",
    groundTruthIds: [
      "mon-asus-tuf-vg27aq3a",   // 27" 2K 180Hz Fast IPS, ฿8,500
      "mon-lg-ultragear-27gr75q", // 27" 2K 165Hz IPS, ฿8,900
      "mon-gigabyte-g27q",       // 27" 2K 144Hz IPS, ฿7,900
      "mon-viewsonic-vx2728"     // 27" 2K 165Hz Fast IPS, ฿6,990
    ],
    expectedCategory: "Monitor",
    expectedDisplaySize: 27
  },
  {
    id: "sc-4",
    title: "Scenario 4: SSD 1TB สำหรับ Gaming",
    query: "SSD 1TB สำหรับ Gaming",
    description: "ฮาร์ดไดรฟ์ SSD ขนาด 1TB มาตรฐาน PCIe 4.0 ความเร็วสูง พร้อม DRAM Cache สำหรับเล่นเกม",
    groundTruthIds: [
      "ssd-wd-black-sn850x-1tb", // 7300 MB/s Game Mode 2.0, ฿3,790
      "ssd-samsung-990pro-1tb",  // 7450 MB/s Flagship, ฿4,190
      "ssd-kingston-kc3000-1tb", // 7000 MB/s Phison E18, ฿3,290
      "ssd-crucial-t500-1tb"     // 7300 MB/s Micron 232L, ฿3,590
    ],
    expectedCategory: "SSD",
    expectedStorage: 1000
  },
  {
    id: "sc-5",
    title: "Scenario 5: CPU สำหรับทำงาน AI",
    query: "CPU สำหรับทำงาน AI",
    description: "โปรเซสเซอร์ Multi-core ประสิทธิภาพสูง รองรับชุดคำสั่ง AVX-512 และ Deep Learning",
    groundTruthIds: [
      "cpu-amd-ryzen9-7950x",    // 16C/32T AVX-512, ฿21,900
      "cpu-intel-core-i9-14900k", // 24C/32T 6.0 GHz, ฿22,900
      "cpu-intel-core-i7-14700k", // 20C/28T DL Boost, ฿16,500
      "cpu-amd-ryzen9-7900x"     // 12C/24T AVX-512, ฿15,900
    ],
    expectedCategory: "CPU",
    expectedUseCase: "AI Workload"
  },
  {
    id: "sc-6",
    title: "Scenario 6: โน้ตบุ๊กบางเบา แบตอึด สำหรับทำงาน",
    query: "โน้ตบุ๊กบางเบา แบตอึด สำหรับทำงาน",
    description: "อัลตร้าบุ๊กน้ำหนักเบา (ต่ำกว่า 1.4 กก.) แบตเตอรี่ใช้งานได้ยาวนาน เหมาะกับการทำงานนอกสถานที่",
    groundTruthIds: [
      "nb-asus-zenbook-14-ux3405",  // 1.20 kg, 75Whr, ฿39,900
      "nb-apple-macbook-air-m3-13", // 1.24 kg, 18 hrs battery, ฿44,900
      "nb-lenovo-thinkpad-t14s-g4"  // 1.25 kg, 57Whr, ฿42,900
    ],
    expectedCategory: "Laptop",
    expectedUseCase: "Thin & Light"
  }
];

class ISEBenchmarkRunner {
  constructor(products = [], parser = null, retrievalEngine = null, rankingEngine = null) {
    this.products = products;
    this.parser = parser || (typeof ISEQueryParser !== 'undefined' ? ISEQueryParser : null);
    this.retrieval = retrievalEngine || (typeof ISERetrievalEngine !== 'undefined' ? new ISERetrievalEngine(products) : null);
    this.ranking = rankingEngine || (typeof ISERankingEngine !== 'undefined' ? new ISERankingEngine() : null);
  }

  /**
   * Run Baseline (Keyword matching & price sort) search
   * @param {string} query
   * @returns {Array<Object>}
   */
  runBaselineSearch(query) {
    const tokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);
    const results = this.products.filter(p => {
      const corpus = `${p.name} ${p.category} ${p.brand} ${p.cpu} ${p.gpu}`.toLowerCase();
      // Match if any significant token is included
      return tokens.some(t => corpus.includes(t));
    });

    // Baseline simple price ascending sort
    return results.sort((a, b) => a.price - b.price);
  }

  /**
   * Run ISE Intelligent Search Pipeline
   * @param {string} query
   * @returns {Array<Object>}
   */
  runISESearch(query) {
    const parsed = this.parser.parse(query);
    const { candidates } = this.retrieval.retrieveCandidates(parsed);
    const ranked = this.ranking.rank(candidates, parsed);
    return ranked;
  }

  /**
   * Execute evaluation over all test scenarios
   * @param {number} k Cutoff rank (default K=3)
   * @returns {Object} Comprehensive evaluation metrics
   */
  evaluate(k = 3) {
    const scenarioResults = [];

    let totalIsePAtK = 0;
    let totalBaselinePAtK = 0;
    let totalIseRecallAtK = 0;
    let totalBaselineRecallAtK = 0;
    let totalIseMRR = 0;
    let totalBaselineMRR = 0;
    let totalIseLatency = 0;
    let totalBaselineLatency = 0;

    for (const sc of ISE_BENCHMARK_SCENARIOS) {
      const gtSet = new Set(sc.groundTruthIds);

      // 1. Run Baseline
      const t0Baseline = performance.now();
      const baselineResults = this.runBaselineSearch(sc.query);
      const baselineLatency = performance.now() - t0Baseline;

      // 2. Run ISE
      const t0ISE = performance.now();
      const iseResults = this.runISESearch(sc.query);
      const iseLatency = performance.now() - t0ISE;

      // 3. Compute Metrics for Baseline
      const baselineTopK = baselineResults.slice(0, k);
      const baselineHits = baselineTopK.filter(p => gtSet.has(p.id)).length;
      const baselinePrecision = k > 0 ? baselineHits / k : 0;
      const baselineRecall = gtSet.size > 0 ? baselineHits / gtSet.size : 0;
      let baselineFirstRank = 0;
      for (let i = 0; i < baselineResults.length; i++) {
        if (gtSet.has(baselineResults[i].id)) {
          baselineFirstRank = i + 1;
          break;
        }
      }
      const baselineMRR = baselineFirstRank > 0 ? 1 / baselineFirstRank : 0;

      // 4. Compute Metrics for ISE
      const iseTopK = iseResults.slice(0, k);
      const iseHits = iseTopK.filter(p => gtSet.has(p.id)).length;
      const isePrecision = k > 0 ? iseHits / k : 0;
      const iseRecall = gtSet.size > 0 ? iseHits / gtSet.size : 0;
      let iseFirstRank = 0;
      for (let i = 0; i < iseResults.length; i++) {
        if (gtSet.has(iseResults[i].id)) {
          iseFirstRank = i + 1;
          break;
        }
      }
      const iseMRR = iseFirstRank > 0 ? 1 / iseFirstRank : 0;

      // Accumulate
      totalIsePAtK += isePrecision;
      totalBaselinePAtK += baselinePrecision;
      totalIseRecallAtK += iseRecall;
      totalBaselineRecallAtK += baselineRecall;
      totalIseMRR += iseMRR;
      totalBaselineMRR += baselineMRR;
      totalIseLatency += iseLatency;
      totalBaselineLatency += baselineLatency;

      scenarioResults.push({
        scenario: sc,
        k,
        ise: {
          topK: iseTopK,
          precision: parseFloat(isePrecision.toFixed(3)),
          recall: parseFloat(iseRecall.toFixed(3)),
          mrr: parseFloat(iseMRR.toFixed(3)),
          latencyMs: parseFloat(iseLatency.toFixed(2)),
          totalCandidates: iseResults.length
        },
        baseline: {
          topK: baselineTopK,
          precision: parseFloat(baselinePrecision.toFixed(3)),
          recall: parseFloat(baselineRecall.toFixed(3)),
          mrr: parseFloat(baselineMRR.toFixed(3)),
          latencyMs: parseFloat(baselineLatency.toFixed(2)),
          totalCandidates: baselineResults.length
        }
      });
    }

    const n = ISE_BENCHMARK_SCENARIOS.length;
    const summary = {
      evaluatedScenariosCount: n,
      cutoffK: k,
      iseAvg: {
        precisionAtK: parseFloat((totalIsePAtK / n).toFixed(3)),
        recallAtK: parseFloat((totalIseRecallAtK / n).toFixed(3)),
        mrr: parseFloat((totalIseMRR / n).toFixed(3)),
        avgLatencyMs: parseFloat((totalIseLatency / n).toFixed(2))
      },
      baselineAvg: {
        precisionAtK: parseFloat((totalBaselinePAtK / n).toFixed(3)),
        recallAtK: parseFloat((totalBaselineRecallAtK / n).toFixed(3)),
        mrr: parseFloat((totalBaselineMRR / n).toFixed(3)),
        avgLatencyMs: parseFloat((totalBaselineLatency / n).toFixed(2))
      }
    };

    return {
      summary,
      details: scenarioResults
    };
  }
}

// Compatibility export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ISE_BENCHMARK_SCENARIOS, ISEBenchmarkRunner };
} else if (typeof window !== 'undefined') {
  window.ISE_BENCHMARK_SCENARIOS = ISE_BENCHMARK_SCENARIOS;
  window.ISEBenchmarkRunner = ISEBenchmarkRunner;
}
