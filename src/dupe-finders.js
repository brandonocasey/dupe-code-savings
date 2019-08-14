const literals = require('./literals.js');
const functions = require('./functions.js');
const variables = require('./variables.js');
const loops = require('./loops.js');
const choices = require('./choices.js');

const dupeFinders = {
  functions,
  literals,
  variables,
  loops,
  choices
};

module.exports = dupeFinders;
