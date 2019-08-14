/* eslint-disable no-console */
const walk = require('acorn-walk');
const getUtils = require('./get-utils');

const functions = (ast, options) => Promise.resolve().then(function() {
  const utils = getUtils(options);

  walk.simple(ast, {
    Function(node) {
      const code = utils.getCode(node)
        .replace(/^(\s+)?function(\s+)?/, '')
        .replace(node.id && node.id.name || '', '');

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
