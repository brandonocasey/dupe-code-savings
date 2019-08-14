const gzipSize = require('gzip-size');
const uglify = require('uglify-js').minify;

const tryUglify = function(code, options) {
  let result = uglify(code, options);

  if (!result.error) {
    return result.code;
  }

  result = uglify('var test = ' + code, options);

  if (!result.error) {
    return result.code.replace('var test=', '');
  }
};

const getUtils = function(options) {
  const frags = new Map();
  const dupes = new Map();

  const utils = {
    getIdentCode(node) {
      const code = options.code
        .substring(node.start, node.end)
        .trim();

      return tryUglify(code, {
        output: {comments: false},
        mangle: false,
        compress: true
      });
    },
    getCode(node) {
      const code = options.code
        .substring(node.start, node.end)
        .trim();

      if (!options.minify) {
        return code;
      }

      // eslint-disable-next-line
      return tryUglify(code, {parse: {bare_returns: true}});
    },
    frags,
    dupes,
    setFrag(node, frag) {
      if (!frags.has(frag)) {
        frags.set(frag, []);
      }

      const nodes = frags.get(frag);

      if (nodes.indexOf(node) === -1) {
        nodes.push(node);
      }

      if (nodes.length > 1 && !dupes.has(frag)) {
        dupes.set(frag, nodes);
      }
    },
    getResults(callback) {
      const promises = [];

      if (!callback) {
        callback = (nodes, frag) => utils.getIdentCode(nodes[0]);
      }

      dupes.forEach((nodes, frag) => promises.push(Promise.resolve().then(() => {
        const code = nodes.reduce((acc, node) => acc + (node.id && node.id.name || '') + frag, '');

        return Promise.resolve({
          bytes: options.gzip ? gzipSize.sync(code) : code.length,
          nodes,
          frag,
          identifier: callback(nodes, frag).replace(/(\s|\n)+/g, ' ')
        });
      })));
      return Promise.all(promises);
    },
    simpleSet: (node) => utils.setFrag(node, utils.getCode(node))
  };

  return utils;
};

module.exports = getUtils;
