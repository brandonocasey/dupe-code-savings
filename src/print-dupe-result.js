/* eslint-disable no-console */
const getUtils = require('./get-utils.js');

const getLine = function(opts, max) {
  return Object.keys(max)
    .reduce((acc, key) => acc + opts[key].toString().padEnd(max[key]) + ' | ', '| ')
    .trim();
};

const printDupeResult = function(options, {type, results}) {
  const utils = getUtils(options);

  console.log();
  const filtered = results.slice(0, options.max).filter(({bytes}) => options.bytes < bytes);
  const maxLength = {
    index: filtered.length.toString().length,
    count: 'count'.length,
    bytes: 'bytes'.length,
    positions: 'positions'.length,
    identifier: 'identifier'.length
  };

  const getPositions = (nodes) => nodes
    .slice(0, 3)
    .reduce((acc, {start, end}) => acc + `${acc.length ? ', ' : ''}${start}-${end}`, '');

  filtered.forEach(function({nodes, bytes, identifier}) {
    const currentLength = {
      count: nodes.length.toString().length,
      bytes: bytes.toString().length,
      identifier: identifier.substring(0, 50).length,
      positions: getPositions(nodes).length
    };

    Object.keys(currentLength).forEach(function(k) {
      if (currentLength[k] > maxLength[k]) {
        maxLength[k] = currentLength[k];
      }
    });
  });

  if (!filtered.length) {
    console.log(`*~*~*~*~* No Dupes for ${type} *~*~*~*~*`);
    console.log();
  } else {

    const titleLine = `*~*~*~*~* ${filtered.length} of ${results.length} Dupes for ${type} *~*~*~*~*`;
    const firstLine = getLine({
      index: '#',
      bytes: 'bytes',
      count: 'count',
      positions: 'positions',
      identifier: 'identifier'
    }, maxLength);

    console.log(' '.repeat(Math.max(firstLine.length / 2) - Math.max(titleLine.length / 2)) + titleLine);
    console.log(firstLine);
    console.log(getLine({
      index: '-'.repeat(maxLength.index),
      bytes: '-'.repeat(maxLength.bytes),
      count: '-'.repeat(maxLength.count),
      positions: '-'.repeat(maxLength.positions),
      identifier: '-'.repeat(maxLength.identifier)
    }, maxLength));
  }
  filtered.forEach(function({nodes, bytes, identifier}, index) {
    console.log(getLine({
      index: index + 1,
      bytes,
      count: nodes.length,
      positions: getPositions(nodes),
      identifier: identifier.substring(0, 50)
    }, maxLength));
    if (options.printCode) {
      console.log(utils.getCode(nodes[0]));
      console.log();
    }
  });
  console.log();
};

module.exports = printDupeResult;
