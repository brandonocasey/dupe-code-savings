const gzipSize = require('gzip-size');
const uglify = require('uglify-js').minify;

/* eslint-disable camelcase */
const minifyOptions = {
  parse: {bare_returns: true}
};
/* eslint-enable camelcase */

const getUtils = function(options) {
  const frags = new Map();
  const dupes = new Map();

  const utils = {
    getCode(node, useMinifyOption = true) {
      const code = options.code
        .substring(node.start, node.end)
        .trim();

      if (!useMinifyOption || !options.minify) {
        return code;
      }
      let result = uglify(code, minifyOptions);

      if (!result.error) {
        return result.code;
      }

      result = uglify('var test = ' + code, minifyOptions);

      if (!result.error) {
        return result.code.replace('var test=', '');
      }

      return code;
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
    }
  };

  return utils;
};

module.exports = getUtils;
