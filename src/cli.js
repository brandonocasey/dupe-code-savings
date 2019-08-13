#! /usr/bin/env node

/* eslint-disable no-console */
const fs = require('fs');
const dupeCodeWarnings = require('./index.js');
const {version} = require('../package.json');
const dupeFinders = require('./dupe-finders.js');
const defaults = {
  max: 25,
  bytes: 50,
  printCode: false,
  gzip: true,
  minify: true,
  include: [],
  exclude: []
};
const printDupeResult = require('./print-dupe-result');

const showHelp = function() {
  console.log(`
  dupe-code-warnings [file]
  echo "some code" | dupe-code-warnings

  current supported checks: ${Object.keys(dupeFinders).join(', ')}

  -i, --include     <check,check>  Only include dupe tests listed
  -x, --exclude     <check,check>  Exclude these dupe tests from being run
  -p, --print-code                 Print code fragments after results
  -b, --bytes       <bytes>        Show results below x bytes, ${defaults.bytes} by default, -1 to disable
  -m, --max         <max>          Max results to print per check, ${defaults.max} is default, -1 to disable
      --no-gzip                    Do not gzip code fragments, when getting duplicate byte costs
      --no-minify                  Do not minify code fragments, when getting duplicate byte costs
  -v, --version                    Print version and exit
  -V, --verbose                    log verbose information to stderr
  -h, --help                       Print help and exit

`);
};

const parseArgs = function(args) {
  const options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if ((/^--include|-i$/).test(arg)) {
      i++;
      options.include = []
        .concat(options.include || [])
        .concat(args[i].split(','));
    } else if ((/^--exclude|-x$/).test(arg)) {
      i++;
      options.exclude = []
        .concat(options.exclude || [])
        .concat(args[i].split(','));
    } else if ((/^--verbose|-V$/).test(arg)) {
      options.verbose = true;
    } else if ((/^--version|-v$/).test(arg)) {
      console.log(`dupe-code-warnings v${version}`);
      process.exit(0);
    } else if ((/^--help|-h$/).test(arg)) {
      showHelp();
      process.exit(0);
    } else if ((/^--print-code|-p$/).test(arg)) {
      options.printCode = true;
    } else if ((/^--bytes|-b$/).test(arg)) {
      i++;
      options.bytes = Number(args[i]);
    } else if ((/^--no-gzip|-g$/).test(arg)) {
      options.gzip = false;
    } else if ((/^--no-minify|-u$/).test(arg)) {
      options.minify = false;
    } else if ((/^--max|-m$/).test(arg)) {
      i++;
      options.max = Number(args[i]);
    } else {
      options.file = arg;
    }
  }

  return options;
};

const cli = function(code) {
  const options = Object.assign({}, defaults, parseArgs(process.argv));

  if (code) {
    options.code = code;
  } else if (options.file) {
    options.code = fs.readFileSync(options.file, 'utf8');
    delete options.file;
  }

  options.cutoff = options.cutoff || 0;
  if (options.max === -1) {
    options.max = Infinity;
  }

  return dupeCodeWarnings(options).then(function(dupeResults) {
    dupeResults.forEach(function(dupeResult) {
      printDupeResult(options, dupeResult);
    });
    process.exit(0);
  }).catch(function(e) {
    console.error(e);
    process.exit(1);
  });
};

// no stdin
if (process.stdin.isTTY) {
  cli();

// stdin
} else {
  let code = '';

  // read from stdin, aka piped input
  process.stdin.setEncoding('utf8');
  process.stdin.on('readable', () => {
    let chunk;

    // Use a loop to make sure we read all available data.
    while ((chunk = process.stdin.read()) !== null) {
      code += chunk;
    }
  });

  process.stdin.on('end', () => {
    cli(code);
  });

}
