/* eslint-disable no-console */
const walk = require('acorn-walk');
const getUtils = require('./get-utils');

const functions = (state) => Promise.resolve().then(function() {
  const utils = getUtils(state);

  walk.ancestor(state.ast, {
    Function(node, ancestors) {
      const code = utils.getCode(node)
        .replace(/^(\s+)?function(\s+)?/, '')
        .replace(node.id && node.id.name || '', '');

      // skip noops
      if ((/^\(\)\{\};?$/).test(code)) {
        return;
      }

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
