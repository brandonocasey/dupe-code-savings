/* eslint-disable no-console */
const walk = require('acorn-walk');
const getUtils = require('./get-utils');

// find duplicate variables
const variables = (ast, options) => Promise.resolve().then(function() {
  const utils = getUtils(options);

  walk.ancestor(ast, {
    VariableDeclarator(node, ancestors) {
      // we only handle object/array variables
      if (!node.init || node.init.type === 'Literal') {
        return;
      }

      if (node.init.type === 'ThisExpression' || node.init.type === 'FunctionExpression') {
        return;
      }

      // empty object
      if (node.init.properties && !node.init.properties.length) {
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

      if ((/^void0;?$/).test(code) || (/^-?\d;?$/).test(code)) {
        return;
      }

      utils.setFrag(node, code);
    },

    Property(node) {
      if (!node.value || node.value.type === 'Literal') {
        return;
      }

      if (node.value.type === 'FunctionExpression') {
        return;
      }

      // empty object
      if (node.value.properties && !node.value.properties.length) {
        return;
      }

      // empty array
      if (node.value.elements && !node.value.elements.length) {
        return;
      }
      const code = utils.getCode(node.value);

      if (code === 'void0' || (/^-?\d$/).test(code)) {
        return;
      }

      utils.setFrag(node, code);
    }
  });

  return utils.getResults((nodes, frag) => utils.getCode(nodes[0], false));
});

module.exports = variables;
