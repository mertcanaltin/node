'use strict';

require('../common');

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const tmpdir = require('../common/tmpdir');

tmpdir.refresh();

const virtualFS = {
  '/test-module.js': 'module.exports = { data: "test module data" }',
  '/module-not-found.js': 'module.exports = { data: "module not found data" }',
};

Object.entries(virtualFS).forEach(([file, content]) => {
  const filePath = path.join(tmpdir.path, file);
  fs.writeFileSync(filePath, content, 'utf-8');
});

// Tests

try {
  const testModule = require(path.resolve(__dirname, '/test-module.js'));
  assert.deepStrictEqual(testModule, { data: 'test module data' });
} catch (error) {
  console.error(error);
}

try {
  const moduleNotFound = require(path.resolve(__dirname, '/module-not-found.js'));
  assert.deepStrictEqual(moduleNotFound, { data: 'module not found data' });
} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND') {
    const originalRequireStack = new Error().stack;
    error.requireStack = originalRequireStack;
  }
  console.error(error);
}

fs.writeFileSync(path.join(tmpdir.path, 'index.js'), 'require("a");');
fs.mkdirSync(path.join(tmpdir.path, 'node_modules'));
fs.mkdirSync(path.join(tmpdir.path, 'node_modules/a'));
fs.mkdirSync(path.join(tmpdir.path, 'node_modules/b'));
fs.writeFileSync(path.join(tmpdir.path, 'node_modules/a/a.js'), 'require("b");');
fs.writeFileSync(path.join(tmpdir.path, 'node_modules/a/package.json'), '{ "main": "a.js" }');
fs.writeFileSync(path.join(tmpdir.path, 'node_modules/b/package.json'), '{ "main": "b.js" }');