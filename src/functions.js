/* eslint-disable no-console */
const walk = require('acorn-walk');
const getUtils = require('./get-utils');

const functions = (ast, options) => Promise.resolve().then(function() {
  const utils = getUtils(options);

  walk.ancestor(ast, {
    Function(node, ancestors) {
      const code = utils.getCode(node)
        .replace(/^(\s+)?function(\s+)?/, '')
        .replace(node.id && node.id.name || '', '');

      utils.setFrag(node, code);
    }
  });

  return utils
    .getResults((nodes, frag) => {
      return utils
        .getCode(nodes[0], false)
        .replace(/^(\s+)?function(\s+)?/, '');

    });
});

module.exports = functions;
