/* eslint-disable no-console */
const walk = require('acorn-walk');
const getUtils = require('./get-utils');

const objects = (ast, options) => Promise.resolve().then(function() {
  const utils = getUtils(options);

  walk.simple(ast, {
    ObjectExpression(node) {
      // empty array
      if (!node.properties || !node.properties.length) {
        return;
      }
      utils.simpleSet(node);
    },
    ArrayExpression(node) {
      // empty array
      if (!node.elements || !node.elements.length) {
        return;
      }

      utils.simpleSet(node);
    }
  });

  return utils.getResults();
});

module.exports = objects;
