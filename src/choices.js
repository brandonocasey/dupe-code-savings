/* eslint-disable no-console */
const walk = require('acorn-walk');
const getUtils = require('./get-utils');

// find duplicate variables
const choices = (ast, options) => Promise.resolve().then(function() {
  // cannot minify choices
  const utils = getUtils(options);

  walk.simple(ast, {
    IfStatement: utils.simpleSet,
    SwitchStatement(node) {
      if (!node.cases || !node.cases.length) {
        return;
      }
      node.cases.forEach(utils.simpleSet);
    }
  });

  return utils.getResults();
});

module.exports = choices;
