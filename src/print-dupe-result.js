/* eslint-disable no-console */
const getLine = function(opts, max) {
  return Object.keys(max)
    .reduce((acc, key) => acc + opts[key].toString().padEnd(max[key]) + ' | ', '| ')
    .trim();
};

const title = function(text) {
  return `*~*~*~*~* ${text} *~*~*~*~*`;
};

const printDupeResult = function(options, {type, results}) {
  // filter out < 0
  results = results.filter(({bytes}) => bytes > 0);
  const filtered = results.slice(0, options.max).filter(({bytes}) => options.bytes < bytes);

  if (!filtered.length) {
    if (results.length) {
      console.log(title(`No Dupes due to byte filter "${options.bytes}" for ${type}`));
    } else {
      console.log(title(`No Dupes with for ${type}`));
    }
    return;
  }

  const titleLine = `${type}: ` + (options.countOnly ? results.length : `${filtered.length}/${results.length}`);

  if (options.countOnly) {
    console.log(`* ${titleLine}`);
    return;
  }

  const headerObject = {
    index: '#',
    bytes: 'bytes',
    count: 'count',
    locations: options.positions ? 'minified position' : 'line numbers',
    identifier: 'identifier (compressed code)'
  };

  const maxLength = {
    index: filtered.length.toString().length,
    count: headerObject.count.length,
    bytes: headerObject.bytes.length,
    locations: headerObject.locations.length,
    identifier: headerObject.identifier.length
  };

  const getLocations = (nodes) => nodes
    .slice(0, 6)
    .reduce((acc, {loc, start, end}) => {
      return acc + `${acc.length ? ', ' : ''}` +
        `${options.positions ? start : (loc.ogStart && loc.ogStart.line || loc.start.line)}`;
    }, '');

  filtered.forEach(function({nodes, bytes, identifier}) {
    const currentLength = {
      count: nodes.length.toString().length,
      bytes: bytes.toString().length,
      identifier: identifier.substring(0, options.idLength).length,
      locations: getLocations(nodes).length
    };

    Object.keys(currentLength).forEach(function(k) {
      if (currentLength[k] > maxLength[k]) {
        maxLength[k] = currentLength[k];
      }
    });
  });

  const headerLine = getLine(headerObject, maxLength);

  // center the title
  console.log(' '.repeat(Math.max(headerLine.length / 2) - Math.max(title(titleLine).length / 2)) + title(titleLine));
  // header line
  console.log(headerLine);
  // separator
  console.log(getLine({
    index: '-'.repeat(maxLength.index),
    bytes: '-'.repeat(maxLength.bytes),
    count: '-'.repeat(maxLength.count),
    locations: '-'.repeat(maxLength.locations),
    identifier: '-'.repeat(maxLength.identifier)
  }, maxLength));

  // print results
  filtered.forEach(function({nodes, bytes, identifier}, index) {
    console.log(getLine({
      index: index + 1,
      bytes,
      count: nodes.length,
      locations: getLocations(nodes),
      identifier: identifier.substring(0, options.idLength)
    }, maxLength));
  });
  console.log();
};

module.exports = printDupeResult;
