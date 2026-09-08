'use strict';

const assert = require('node:assert/strict');
const { ISE_PRODUCTS } = require('../data/products.js');
const { ISEQueryParser } = require('../js/engine/queryParser.js');
const { ISERetrievalEngine } = require('../js/engine/retrieval.js');
const { ISERankingEngine } = require('../js/engine/ranking.js');
const { ISEBenchmarkRunner } = require('../js/benchmark/benchmark.js');

const retrieval = new ISERetrievalEngine(ISE_PRODUCTS);
const ranking = new ISERankingEngine();

function search(query) {
  const intent = ISEQueryParser.parse(query);
  if (!intent.isUnderstood) return { intent, results: [] };
  const { candidates } = retrieval.retrieveCandidates(intent);
  return { intent, results: ranking.rank(candidates, intent) };
}

function assertTop(query, expectedName) {
  const { results } = search(query);
  assert.ok(results.length > 0, `Expected results for: ${query}`);
  assert.equal(results[0].name, expectedName);
}

const weather = search('อากาศวันนี้');
assert.equal(weather.intent.isUnderstood, false);
assert.equal(weather.results.length, 0);

const budgetOnly = search('งบ 30000');
assert.equal(budgetOnly.intent.isUnderstood, false);
assert.equal(budgetOnly.results.length, 0);

const ambiguousGaming = search('อยากได้ของแรงๆ เอาไว้เล่นเกม');
assert.equal(ambiguousGaming.intent.isUnderstood, true);
assert.equal(ambiguousGaming.intent.needsClarification, true);

const naturalGamingLaptop = search('โน็ตบุ๊ก แรงๆ เบาๆ เล่นเกมแรงๆ อย่าง GTA V ราคาไม่เกิน 35,000');
assert.equal(naturalGamingLaptop.intent.category, 'Laptop');
assert.equal(naturalGamingLaptop.intent.useCase, 'Gaming');
assert.equal(naturalGamingLaptop.intent.budget.max, 35000);
assert.equal(naturalGamingLaptop.intent.needsClarification, false);

const gpuOnly = search('RTX 4060');
assert.ok(gpuOnly.results.length > 0);
gpuOnly.results.forEach(product => {
  assert.equal(product.scoreBreakdown.budget, null);
  assert.equal(product.scoreBreakdown.useCase, null);
});

assertTop(
  'โน้ตบุ๊กสำหรับเขียนโปรแกรม งบไม่เกิน 30000',
  'Acer Swift Go 14 SFG14-71-570W'
);
assertTop(
  'Gaming Laptop RTX 4060 ราคาไม่เกิน 40000',
  'Lenovo LOQ 15IRX9 (83DV003DTA)'
);
assertTop('จอ 27 นิ้ว 144Hz', 'ViewSonic OMNI VX2728-2K');
assertTop('เมาส์ทำงาน', 'Logitech MX Master 3S Wireless Performance Mouse');

const benchmark = new ISEBenchmarkRunner(
  ISE_PRODUCTS,
  ISEQueryParser,
  retrieval,
  ranking
).evaluate(3);

assert.deepEqual(
  {
    precisionAtK: benchmark.summary.iseAvg.precisionAtK,
    recallAtK: benchmark.summary.iseAvg.recallAtK,
    mrr: benchmark.summary.iseAvg.mrr
  },
  { precisionAtK: 0.944, recallAtK: 0.819, mrr: 1 }
);
assert.deepEqual(
  {
    precisionAtK: benchmark.summary.baselineAvg.precisionAtK,
    recallAtK: benchmark.summary.baselineAvg.recallAtK,
    mrr: benchmark.summary.baselineAvg.mrr
  },
  { precisionAtK: 0.222, recallAtK: 0.167, mrr: 0.256 }
);

console.log('ISE regression tests passed.');
