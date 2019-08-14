const gzipSize = require('gzip-size');
const terser = require('terser').minify;

const nameCache = {};
const tryMinify = function(code, options) {
  let result = terser(code, options);

  if (!result.error) {
    return result.code;
  }

  result = terser('var test = ' + code, options);

  if (!result.error) {
    return result.code.replace('var test=', '');
  }

  result = terser('for (;i;) {' + code + '}', options);

  if (!result.error) {
    return result.code.replace('for(;i;){', '').replace(/}$/, '');
  }

  result = terser('switch(i){' + code + '}', options);

  if (!result.error) {
    return result.code.replace('switch(i){', '').replace(/}$/, '');
  }

  return code
    .replace(/(\s|\n)+/g, ' ');
};

const getUtils = function(options) {
  const frags = new Map();
  const dupes = new Map();

  const utils = {
    getIdentCode(node) {
      return tryMinify(options.code.substring(node.start, node.end), {
        // eslint-disable-next-line
        parse: {bare_returns: true},
        output: {comments: false},
        mangle: false,
        compress: false
      }).trim()
        .replace(/(\s|\n)+/g, ' ');
    },
    getCode(node) {
      const code = options.code
        .substring(node.start, node.end)
        .trim();

      if (!options.minify) {
        return code
          .replace(/(\s|\n)+/g, ' ');
      }

      return tryMinify(code, {
        nameCache,
        // eslint-disable-next-line
        parse: {bare_returns: true}
      });
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
        const code = nodes.reduce((acc, node) => {
          // extra bytes that were removed from variable/function nodes
          let extra = '';

          if ((/Variable/).test(node.type)) {
            extra = 'var =' + (node.id && node.id.name || '');
          }

          if ((/Function/).test(node.type)) {
            extra = (node.id && node.id.name || '') + ' function';
          }
          return acc + frag + extra;
        }, '');

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
