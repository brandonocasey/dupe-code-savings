#! /usr/bin/env node

/* eslint-disable no-console */
const {performance} = require('perf_hooks');
const fs = require('fs');
const dupeCodeWarnings = require('./index.js');
const {version} = require('../package.json');
const dupeFinders = require('./dupe-finders.js');
const defaults = {
  max: 25,
  bytes: 10,
  idLength: 50,
  positions: false,
  countOnly: false,
  compressor: 'gzip',
  include: [],
  exclude: []
};
const printDupeResult = require('./print-dupe-result');

const showHelp = function() {
  console.log(`
  dupe-code-savings [file]
  echo "some code" | dupe-code-savings

  current supported checks: ${Object.keys(dupeFinders).join(', ')}

  -i, --include     <check,check>  Only include dupe tests listed
  -x, --exclude     <check,check>  Exclude these dupe tests from being run
  -l, --id-length   <length>       Longer length for dupe code id strings, Defaults to 50, -1 for Infinity.
  -b, --bytes       <bytes>        Show results above x bytes, ${defaults.bytes} by default
  -m, --max         <max>          Max results to print per check, ${defaults.max} is default, -1 for Infinity
  -c, --compressor  <name>         Use brotli, gzip, or none for compression, default is ${defaults.compressor}
      --positions                  Print byte positions instead of line
      --count-only                 Only print the count of dupes, and not the results
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
      console.log(`dupe-code-savings v${version}`);
      process.exit(0);
    } else if ((/^--help|-h$/).test(arg)) {
      showHelp();
      process.exit(0);
    } else if ((/^--l|-id-length$/).test(arg)) {
      i++;
      options.idLength = Number(args[i]);
    } else if ((/^--positions$/).test(arg)) {
      options.positions = true;
    } else if ((/^--bytes|-b$/).test(arg)) {
      i++;
      options.bytes = Number(args[i]);
    } else if ((/^--compressor|-c$/).test(arg)) {
      i++;
      options.compressor = args[i];
    } else if ((/^--count-only|-c$/).test(arg)) {
      options.countOnly = true;
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
  const options = Object.assign({}, defaults, parseArgs(process.argv.slice(2)));

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

  if (options.idLength === -1) {
    options.idLength = Infinity;
  }

  const startTime = performance.now();

  return dupeCodeWarnings(options).then(function(dupeResults) {
    dupeResults.forEach(function(dupeResult) {
      printDupeResult(options, dupeResult);
    });

    const runTime = ((performance.now() - startTime).toFixed(0) / 1000);

    console.log(`Finished in: ${runTime}s`);
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
