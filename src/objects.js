/* eslint-disable no-console */
const walk = require('acorn-walk');
const getUtils = require('./get-utils');

const objects = (ast, options) => Promise.resolve().then(function() {
  const utils = getUtils(options);
  const simple = (node) => utils.setFrag(node, utils.getCode(node));

  walk.simple(ast, {
    ObjectExpression: simple,
    ArrayExpression: simple
  });

  return utils.getResults((nodes, frag) => utils.getCode(nodes[0], false));
});

module.exports = objects;
