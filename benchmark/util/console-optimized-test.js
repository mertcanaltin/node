'use strict';

const fs = require('fs');
const { Console } = require('console');
const nullStream = fs.createWriteStream('/dev/null');

// Import our optimized methods
const { optimizedMethods, fastStringify } = require('../../lib/internal/console/optimized');

// Create test console
const originalConsole = new Console({ stdout: nullStream, stderr: nullStream });

// Create optimized console by patching methods
const optimizedConsole = new Console({ stdout: nullStream, stderr: nullStream });
Object.assign(optimizedConsole, optimizedMethods);

// Test data
const complexObject = {
  user: { id: 123, name: 'John Doe', email: 'john@example.com' },
  data: { items: [1, 2, 3, 4, 5], timestamp: Date.now() },
  nested: { deep: { very: { deep: { value: 'test' } } } }
};

const simpleObject = { a: 1, b: 2, c: 'test' };

function benchmark(name, fn, iterations = 10000) {
  // Warmup
  for (let i = 0; i < 1000; i++) fn();

  const start = process.hrtime.bigint();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = process.hrtime.bigint();

  const duration = Number(end - start) / 1000000; // ms
  const opsPerSec = Math.floor(iterations / (duration / 1000));

  return { name, duration, opsPerSec };
}

console.log('=== Console.log Optimization Benchmark ===\n');

// Test 1: Complex Object
const test1Original = benchmark('Original - Complex Object', () => {
  originalConsole.log(complexObject);
});

const test1Optimized = benchmark('Optimized - Complex Object', () => {
  optimizedConsole.log(complexObject);
});

// Test 2: Simple Object
const test2Original = benchmark('Original - Simple Object', () => {
  originalConsole.log(simpleObject);
});

const test2Optimized = benchmark('Optimized - Simple Object', () => {
  optimizedConsole.log(simpleObject);
});

// Test 3: String
const test3Original = benchmark('Original - String', () => {
  originalConsole.log('Simple message');
});

const test3Optimized = benchmark('Optimized - String', () => {
  optimizedConsole.log('Simple message');
});

// Test 4: Multiple args
const test4Original = benchmark('Original - Multiple Args', () => {
  originalConsole.log('User', 'John', 'has', 42, 'items');
});

const test4Optimized = benchmark('Optimized - Multiple Args', () => {
  optimizedConsole.log('User', 'John', 'has', 42, 'items');
});

// Test 5: Fast stringify vs util.inspect
const test5Inspect = benchmark('util.inspect(complexObject)', () => {
  require('util').inspect(complexObject);
});

const test5FastStringify = benchmark('fastStringify(complexObject)', () => {
  fastStringify(complexObject);
});

// Results
function printComparison(original, optimized, testName) {
  const improvement = ((optimized.opsPerSec - original.opsPerSec) / original.opsPerSec * 100);
  console.log(`${testName}:`);
  console.log(`  Original:  ${original.opsPerSec.toLocaleString()} ops/sec`);
  console.log(`  Optimized: ${optimized.opsPerSec.toLocaleString()} ops/sec`);
  console.log(`  Improvement: ${improvement > 0 ? '+' : ''}${improvement.toFixed(1)}%`);
  console.log('');
}

printComparison(test1Original, test1Optimized, 'Complex Object Logging');
printComparison(test2Original, test2Optimized, 'Simple Object Logging');
printComparison(test3Original, test3Optimized, 'String Logging');
printComparison(test4Original, test4Optimized, 'Multiple Args Logging');

console.log('Stringify Comparison:');
console.log(`  util.inspect: ${test5Inspect.opsPerSec.toLocaleString()} ops/sec`);
console.log(`  fastStringify: ${test5FastStringify.opsPerSec.toLocaleString()} ops/sec`);
const stringifyImprovement = ((test5FastStringify.opsPerSec - test5Inspect.opsPerSec) / test5Inspect.opsPerSec * 100);
console.log(`  Improvement: +${stringifyImprovement.toFixed(1)}%`);
