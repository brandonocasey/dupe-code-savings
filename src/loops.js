/* eslint-disable no-console */
const walk = require('acorn-walk');
const getUtils = require('./get-utils');

// find duplicate variables
const loops = (ast, options) => Promise.resolve().then(function() {
  const utils = getUtils(options);

  walk.simple(ast, {
    WhileStatement: utils.simpleSet,
    DoWhileStatement: utils.simpleSet,
    ForStatement: utils.simpleSet,
    ForInStatement: utils.simpleSet
  });

  return utils.getResults();
});

module.exports = loops;
