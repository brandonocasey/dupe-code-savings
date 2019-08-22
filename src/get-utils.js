const gzipSize = require('gzip-size');

const setOgLoc = function(state, node) {
  if (!state.consumer) {
    return;
  }

  const start = state.consumer.originalPositionFor(node.loc.start);
  const end = state.consumer.originalPositionFor(node.loc.end);

  node.loc.ogStart = start;
  node.loc.ogEnd = end;
};
const getUtils = function(state) {
  const frags = new Map();
  const dupes = new Map();

  const utils = {
    getIdentCode(node) {
      let frag;

      if (node.loc.ogStart && node.loc.ogEnd) {
        const start = node.loc.ogStart;
        const end = node.loc.ogEnd;

        frag = '';

        // source-map is 1 based for lines, but we will map to zero based
        // since our lineMap is zero based.
        for (let i = start.line - 1; i < end.line + 1; i++) {
          let line = state.lineMap[i];

          if (i === (start.line - 1)) {
            line = line.substring(start.column);
          }

          frag += line + '\n';
        }
      } else {
        frag = state.code.substring(node.start, node.end);
      }

      return frag
        .trim()
        .replace(/(\s|\r\n|\r|\n)+/g, ' ');
    },
    getCode(node) {
      return state.code
        .substring(node.start, node.end)
        .trim()
        .replace(/(\s|\r\n|\r|\n)+/g, ' ');
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

        setOgLoc(state, nodes[nodes.length - 1]);
        while (i--) {
          setOgLoc(state, nodes[i]);
          const node = nodes[i].codesize_ || nodes[i];

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
