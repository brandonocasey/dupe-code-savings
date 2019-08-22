const gzipSize = require('gzip-size');
const terser = require('terser').minify;

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

const getUtils = function(state) {
  const frags = new Map();
  const dupes = new Map();

  const utils = {
    // TODO: use sourcemap
    getIdentCode(node) {
      return tryMinify(state.code.substring(node.start, node.end), {
        // eslint-disable-next-line
        parse: {bare_returns: true},
        output: {comments: false},
        mangle: false,
        compress: false
      }).trim()
        .replace(/(\s|\n)+/g, ' ');
    },
    getCode(node) {
      return state.code
        .substring(node.start, node.end)
        .trim()
        .replace(/(\s|\n)+/g, ' ');
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
        // copy original code
        let code = (' ' + state.code).slice(1);

        // keep one node in the code
        let i = nodes.length - 1;

        while (i--) {
          const node = nodes[i];

          code = code.substring(0, node.start) + code.substring(node.end);
        }

        return gzipSize(code).then((bytes) => Promise.resolve({
          bytes: state.bytes - bytes,
          nodes,
          frag,
          identifier: callback(nodes, frag).replace(/(\s|\n)+/g, ' ')
        }));
      })));
      return Promise.all(promises);
    },
    simpleSet: (node) => utils.setFrag(node, utils.getCode(node))
  };

  return utils;
};

module.exports = getUtils;
