/* eslint-disable no-console */
const acorn = require('acorn');
const dupeFinders = require('./dupe-finders');
const terser = require('terser').minify;
const gzipSize = require('gzip-size');
const sourceMap = require('source-map');

// TODO: stretch often used properties and variables and recommend something
// TODO: stretch get the total count of native functions used by function

const dupeCodeWarnings = function(options) {
  if (!options.code) {
    return Promise.reject('options.code must be passed to dupeCodeWarnings!');
  }

  const state = {
    code: null,
    map: null,
    originalCode: null,
    gzipSize: null,
    ast: null,
    dupeFinders: []
  };

  options.include = options.include || [];
  options.exclude = options.exclude || [];

  if (options.include.length === 0) {
    options.include = Object.keys(dupeFinders);
  }

  Object.keys(dupeFinders).forEach(function(type) {
    if (options.exclude.indexOf(type) !== -1) {
      return;
    }

    if (options.include.indexOf(type) === -1) {
      return;
    }

    state.dupeFinders.push(type);
  });

  if (!state.dupeFinders.length) {
    return Promise.reject('No checks due to options! Valid checks:\n' + Object.keys(dupeFinders).join(', '));
  }

  return Promise.resolve().then(function() {
    const result = terser(options.code, {sourceMap: true});

    if (result.error) {
      return Promise.reject('minify failed with error' + result.error);
    }

    state.lineMap = options.code.split(/\r\n|\r|\n/);
    state.code = result.code;
    return new sourceMap.SourceMapConsumer(result.map);
  }).then(function(consumer) {
    state.consumer = consumer;
    return Promise.resolve();
  }).then(function() {
    return gzipSize(state.code).then(function(bytes) {
      state.bytes = bytes;
    });
  }).then(function() {
    state.ast = acorn.parse(state.code, {locations: true});

    return Promise.all(state.dupeFinders.map(function(type) {
      return dupeFinders[type](state).then((results) => Promise.resolve({type, results}));
    }));
  }).then((dupeResults) => {
    // cleanup SourceMapConsumer
    state.consumer.destroy();

    return Promise.resolve(dupeResults.map((dupeResult) => ({
      type: dupeResult.type,
      results: dupeResult.results.sort(function(a, b) {
        if (b.bytes > a.bytes) {
          return 1;
        } else if (b.bytes < a.bytes) {
          return -1;
        }

        return 0;
      })
    })));
  });
};

module.exports = dupeCodeWarnings;
