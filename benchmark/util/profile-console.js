'use strict';

// Profile console.log to identify bottlenecks
const fs = require('fs');
const nullStream = fs.createWriteStream('/dev/null');
const { Console } = require('console');
const testConsole = new Console({ stdout: nullStream, stderr: nullStream });

// Test data
const complexObject = {
  user: { id: 123, name: 'John Doe', email: 'john@example.com' },
  data: { items: [1, 2, 3, 4, 5], timestamp: Date.now() },
  nested: { deep: { very: { deep: { value: 'test' } } } }
};

// Profile different parts
function profileFunction(name, fn, iterations = 10000) {
  const start = process.hrtime.bigint();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = process.hrtime.bigint();
  const duration = Number(end - start) / 1000000; // Convert to milliseconds
  const opsPerSec = Math.floor(iterations / (duration / 1000));
  process.stdout.write(`${name}: ${duration.toFixed(2)}ms, ${opsPerSec.toLocaleString()} ops/sec\n`);
  return { duration, opsPerSec };
}

// Individual component tests
process.stdout.write('=== Console.log Performance Profiling ===\n\n');

// 1. Full console.log
profileFunction('Full console.log(complexObject)', () => {
  testConsole.log(complexObject);
});

// 2. Only util.inspect
const util = require('util');
profileFunction('Only util.inspect(complexObject)', () => {
  util.inspect(complexObject);
});

// 3. Only string formatting
const formatted = util.inspect(complexObject);
profileFunction('Only stream.write(preformatted)', () => {
  nullStream.write(formatted + '\n');
});

// 4. util.format for mixed args
profileFunction('util.format with placeholders', () => {
  util.format('User %s has %d items', 'John', 42);
});

// 5. Simple string
profileFunction('Simple string console.log', () => {
  testConsole.log('Simple message');
});

// 6. JSON.stringify vs util.inspect
profileFunction('JSON.stringify(complexObject)', () => {
  JSON.stringify(complexObject);
});
