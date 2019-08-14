/* eslint-disable no-console */
const walk = require('acorn-walk');
const getUtils = require('./get-utils');

const functions = (ast, options) => Promise.resolve().then(function() {
  const utils = getUtils(options);

  walk.ancestor(ast, {
    Function(node, ancestors) {
      const code = utils.getCode(node)
        .replace(node.id && node.id.name || '', '');

      const varAncestor = ancestors[ancestors.length - 2];

      if ((/Variable/).test(varAncestor.type)) {
        node.codesize_ = varAncestor;
      }

      utils.setFrag(node, code);
    }
  });

  return utils
    .getResults((nodes, frag) => {
      return utils
        .getIdentCode(nodes[0])
        .replace(/^(\s+)?function(\s+)?/, '');

    });
});

module.exports = functions;
