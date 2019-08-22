/* eslint-disable no-console */
const walk = require('acorn-walk');
const getUtils = require('./get-utils');

// find duplicate literals
const literals = (state) => Promise.resolve().then(function() {
  const utils = getUtils(state);

  walk.simple(state.ast, {
    Literal(node) {
      // only strings < 27 in length are worth deduping
      if (typeof node.value !== 'string' || node.raw.length < 27) {
        return;
      }
      utils.setFrag(node, node.value);
    }
  });

  return utils.getResults((nodes, frag) => frag);
});

module.exports = literals;
