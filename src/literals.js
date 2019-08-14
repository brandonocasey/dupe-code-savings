/* eslint-disable no-console */
const walk = require('acorn-walk');
const getUtils = require('./get-utils');

// find duplicate literals
const literals = (ast, options) => Promise.resolve().then(function() {
  const utils = getUtils(options);

  walk.simple(ast, {
    Literal(node) {
      // skip single digit negative or positive numbers
      if (typeof node.value === 'number' && (/^-?\d$/).test(node.value)) {
        return;
      }

      // skip null literal
      if (node.value === null) {
        return;
      }

      // skip boolean
      if (typeof node.value === 'boolean') {
        return;
      }

      // skip undefined
      if (typeof node.value === 'undefined') {
        return;
      }

      // skip empty string
      if (node.value === 'string' && !node.value.trim()) {
        return;
      }
      utils.setFrag(node, typeof node.value === 'string' ? node.value : node.raw);
    },
    Property(node) {
      utils.setFrag(node.key, node.key.name);
    }
  });

  return utils.getResults((nodes, frag) => `${frag}`);
});

module.exports = literals;
