/* eslint-disable no-console */
const walk = require('acorn-walk');
const getUtils = require('./get-utils');

// TODO:
// change params and local vars for similar function finding
const functions = (ast, options) => Promise.resolve().then(function() {
  const utils = getUtils(options);

  walk.ancestor(ast, {
    Function(node, ancestors) {
      // skip functions with recent variable ancestors
      // TODO: TEST THIS SHIT!!
      if (ancestors.slice(ancestors.length - 6).find((a) => (/Variable/).test(a.type))) {
        return;
      }

      const code = utils.getCode(node)
        .replace(node.id && node.id.name || '', '')
        .replace(/\s/g, '');

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
