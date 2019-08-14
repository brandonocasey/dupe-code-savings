/* eslint-disable no-console */
const walk = require('acorn-walk');
const getUtils = require('./get-utils');

const objects = (ast, options) => Promise.resolve().then(function() {
  const utils = getUtils(options);
  const simple = (node) => utils.setFrag(node, utils.getCode(node));

  walk.simple(ast, {
    ObjectExpression(node) {
      // empty array
      if (!node.properties || !node.properties.length) {
        return;
      }
      simple(node);

    },
    ArrayExpression(node) {
      // empty array
      if (!node.elements || !node.elements.length) {
        return;
      }

      simple(node);
    }
  });

  return utils.getResults((nodes, frag) => utils.getCode(nodes[0], false));
});

module.exports = objects;
