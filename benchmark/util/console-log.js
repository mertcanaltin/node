'use strict';
const fs = require('fs');
const path = require('path');
const common = require('../common.js');

// Redirect output to /dev/null to avoid I/O overhead in measurements
const nullStream = fs.createWriteStream('/dev/null');

const bench = common.createBenchmark(main, {
  n: [1e4, 5e4],
  method: [
    'simple_string',
    'number',
    'object_small',
    'object_complex',
    'array_small',
    'array_large',
    'mixed_args',
    'error_object',
  ],
  output: ['stdout', 'null'],
});

function createConsole(output) {
  if (output === 'null') {
    const { Console } = require('console');
    return new Console({ stdout: nullStream, stderr: nullStream });
  }
  return console;
}

function main({ method, n, output }) {
  const testConsole = createConsole(output);
  let obj;

  switch (method) {
    case 'simple_string':
      obj = 'Simple log message';
      break;
    case 'number':
      obj = 42;
      break;
    case 'object_small':
      obj = { a: 1, b: 2, c: 'test' };
      break;
    case 'object_complex':
      obj = {
        user: { id: 123, name: 'John Doe', email: 'john@example.com' },
        data: { items: [1, 2, 3, 4, 5], timestamp: Date.now() },
        nested: { deep: { very: { deep: { value: 'test' } } } }
      };
      break;
    case 'array_small':
      obj = [1, 2, 3, 'test', true];
      break;
    case 'array_large':
      obj = Array(100).fill().map((_, i) => ({ id: i, value: `item_${i}` }));
      break;
    case 'mixed_args':
      // This will test multiple arguments formatting
      bench.start();
      for (let i = 0; i < n; i++) {
        testConsole.log('User %s has %d items at %s', 'John', 42, new Date().toISOString());
      }
      bench.end(n);
      return;
    case 'error_object':
      obj = new Error('Test error with stack trace');
      break;
    default:
      throw new Error(`Unsupported method "${method}"`);
  }

  bench.start();
  for (let i = 0; i < n; i++) {
    testConsole.log(obj);
  }
  bench.end(n);
}