const literals = require('./literals.js');
const functions = require('./functions.js');
const variables = require('./variables.js');

const dupeFinders = {
  functions,
  literals,
  variables
};

module.exports = dupeFinders;
