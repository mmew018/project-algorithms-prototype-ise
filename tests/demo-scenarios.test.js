'use strict';

const assert = require('node:assert/strict');
const { ISE_PRODUCTS } = require('../data/products.js');
const { ISEQueryParser } = require('../js/engine/queryParser.js');
const { ISERetrievalEngine } = require('../js/engine/retrieval.js');
const { ISERankingEngine } = require('../js/engine/ranking.js');

const retrieval = new ISERetrievalEngine(ISE_PRODUCTS);
const ranking = new ISERankingEngine();

function search(query) {
  const intent = ISEQueryParser.parse(query);
  if (!intent.isUnderstood) return { intent, results: [] };

  const { candidates } = retrieval.retrieveCandidates(intent);
  return { intent, results: ranking.rank(candidates, intent) };
}

function assertTopResult(query, expectedName) {
  const { results } = search(query);
  assert.ok(results.length > 0, `Expected at least one result for: ${query}`);
  assert.equal(results[0].name, expectedName);
}

assertTopResult(
  'โน้ตบุ๊กสำหรับเขียนโปรแกรม งบไม่เกิน 30000',
  'Acer Swift Go 14 SFG14-71-570W'
);
assertTopResult(
  'Gaming Laptop RTX 4060 ราคาไม่เกิน 40000',
  'Lenovo LOQ 15IRX9 (83DV003DTA)'
);
assertTopResult('จอ 27 นิ้ว 144Hz', 'ViewSonic OMNI VX2728-2K');
assertTopResult('SSD 1TB สำหรับ Gaming', 'WD_BLACK SN850X 1TB NVMe Gen4 Gaming SSD');
assertTopResult('เมาส์ทำงาน', 'Logitech MX Master 3S Wireless Performance Mouse');

const ambiguous = search('อยากได้ของแรงๆ เอาไว้เล่นเกม');
assert.equal(ambiguous.intent.isUnderstood, true);
assert.equal(ambiguous.intent.needsClarification, true);

const missingCategory = search('งบ 30000');
assert.equal(missingCategory.intent.isUnderstood, false);
assert.equal(missingCategory.results.length, 0);

const outOfScope = search('อากาศวันนี้');
assert.equal(outOfScope.intent.isUnderstood, false);
assert.equal(outOfScope.results.length, 0);

console.log('ISE approval demo scenarios passed.');
