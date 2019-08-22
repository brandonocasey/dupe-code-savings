/* eslint-disable no-console */
const walk = require('acorn-walk');
const getUtils = require('./get-utils');

const typeRegex = /Function|Object|This|Literal|Array/;
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
const variables = (state) => Promise.resolve().then(function() {
  const utils = getUtils(state);

  walk.ancestor(state.ast, {
    VariableDeclarator(node, ancestors) {
      // filter out non variables
      if (!node.init || typesMatch(node.init, node.init.callee)) {
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

      node.init.parent = node;
      node.init.addedBy = 'VariableDeclarator';
      utils.setFrag(node.init, code);
    },

    Property(node) {
      if (!node.value || typesMatch(node, node.value, node.value.callee)) {
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

  return utils.getResults((nodes, frag) => utils.getIdentCode(nodes[0].parent || nodes[0]));
});

module.exports = variables;
