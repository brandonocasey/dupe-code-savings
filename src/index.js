/* eslint-disable no-console */
const acorn = require('acorn');
const dupeFinders = require('./dupe-finders');

// TODO: stretch often used properties and variables and recommend something
// TODO: stretch get the total count of native functions used by function

const dupeCodeWarnings = function(options) {
  options.include = options.include || [];
  options.exclude = options.exclude || [];

  if (options.include.length === 0) {
    options.include = Object.keys(dupeFinders);
  }

  if (!options.code) {
    throw Error('options.code must be passed to dupeCodeWarnings!');
  }

  return Promise.resolve().then(function() {
    const ast = options.ast || acorn.parse(options.code);
    const promises = [];

    Object.keys(dupeFinders).forEach(function(type) {
      if (options.exclude.indexOf(type) !== -1) {
        return;
      }

      if (options.include.indexOf(type) === -1) {
        return;
      }

      promises.push(dupeFinders[type](ast, options).then((results) => {
        return Promise.resolve({type, results});
      }));
    });

    if (!promises.length) {
      throw Error('All checks excluded or not included via options! Valid checks:\n' + Object.keys(dupeFinders).join(', '));
    }

    // clone minify options
    return Promise.all(promises);
  }).then((dupeResults) => Promise.resolve(dupeResults.map((dupeResult) => ({
    type: dupeResult.type,
    results: dupeResult.results.sort(function(a, b) {
      if (b.bytes > a.bytes) {
        return 1;
      } else if (b.bytes < a.bytes) {
        return -1;
      }

      return 0;
    })
  }))));
};

module.exports = dupeCodeWarnings;
