/* eslint-disable no-console */
const walk = require('acorn-walk');
const getUtils = require('./get-utils');

const typeRegex = /Function|Object|This|Literal/;
const typesMatch = (...args) => {
  let i = args.length;

  while (i--) {
    if (args[i] && typeRegex.test(args[i].type)) {
      return true;
    }
  }

  return false;
};
const codeRegex = /^(void0|-?\d);?$/;

// find duplicate variables
const variables = (ast, options) => Promise.resolve().then(function() {
  const utils = getUtils(options);

  walk.ancestor(ast, {
    VariableDeclarator(node, ancestors) {
      // filter out non variables
      if (!node.init || typesMatch(node.init, node.init.callee)) {
        return;
      }

      // empty array
      if (node.init.elements && !node.init.elements.length) {
        return;
      }

      // skip iterator variables
      const loopAncestor = ancestors
        .slice(ancestors.length - 5, ancestors.lenght)
        .find((a) => (/^For|ForIn/).test(a.type)) || {};

      const loopVars = loopAncestor.init || loopAncestor.left;

      // ignore variables inside loop init
      if (loopVars && loopVars.declarations && loopVars.declarations.some((v) => v === node)) {
        return;
      }

      const code = utils.getCode(node.init);

      if (codeRegex.test(code)) {
        return;
      }

      node.init.addedBy = 'VariableDeclarator';
      utils.setFrag(node.init, code);
    },

    Property(node) {
      if (!node.value || typesMatch(node, node.value, node.value.callee)) {
        return;
      }

      // empty array
      if (node.value.elements && !node.value.elements.length) {
        return;
      }
      const code = utils.getCode(node.value);

      if (codeRegex.test(code)) {
        return;
      }

      node.value.addedBy = 'Property';

      utils.setFrag(node.value, code);
    }
  });

  return utils.getResults((nodes, frag) => utils.getCode(nodes[0], false));
});

module.exports = variables;
