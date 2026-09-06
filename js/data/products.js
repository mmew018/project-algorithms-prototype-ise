/**
 * Re-export products from data/products.js for modular or direct script loading
 */
if (typeof require !== 'undefined') {
  module.exports = require('../../data/products.js');
}
