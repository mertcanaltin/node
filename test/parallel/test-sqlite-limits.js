'use strict';
const { skipIfSQLiteMissing } = require('../common');
skipIfSQLiteMissing();
const { DatabaseSync } = require('node:sqlite');
const { suite, test } = require('node:test');

suite('DatabaseSync limits', () => {
  test('default limits match expected SQLite defaults', (t) => {
    const db = new DatabaseSync(':memory:');
    t.assert.deepStrictEqual({ ...db.limits }, {
      length: 1000000000,
      sqlLength: 1000000000,
      column: 2000,
      exprDepth: 1000,
      compoundSelect: 500,
      vdbeOp: 250000000,
      functionArg: 1000,
      attach: 10,
      likePatternLength: 50000,
      variableNumber: 32766,
      triggerDepth: 1000,
    });
  });

  test('constructor accepts limits option', (t) => {
    const db = new DatabaseSync(':memory:', {
      limits: {
        length: 500000,
        sqlLength: 50000,
        column: 100,
        exprDepth: 50,
        compoundSelect: 10,
        vdbeOp: 10000,
        functionArg: 8,
        attach: 5,
        likePatternLength: 1000,
        variableNumber: 100,
        triggerDepth: 5,
      }
    });

    t.assert.strictEqual(db.limits.length, 500000);
    t.assert.strictEqual(db.limits.sqlLength, 50000);
    t.assert.strictEqual(db.limits.column, 100);
    t.assert.strictEqual(db.limits.exprDepth, 50);
    t.assert.strictEqual(db.limits.compoundSelect, 10);
    t.assert.strictEqual(db.limits.vdbeOp, 10000);
    t.assert.strictEqual(db.limits.functionArg, 8);
    t.assert.strictEqual(db.limits.attach, 5);
    t.assert.strictEqual(db.limits.likePatternLength, 1000);
    t.assert.strictEqual(db.limits.variableNumber, 100);
    t.assert.strictEqual(db.limits.triggerDepth, 5);
  });

  test('getter returns current limit value', (t) => {
    const db = new DatabaseSync(':memory:');
    t.assert.strictEqual(typeof db.limits.length, 'number');
    t.assert.ok(db.limits.length > 0);
    t.assert.strictEqual(typeof db.limits.sqlLength, 'number');
    t.assert.ok(db.limits.sqlLength > 0);
  });

  test('setter modifies limit value', (t) => {
    const db = new DatabaseSync(':memory:');

    db.limits.length = 100000;
    t.assert.strictEqual(db.limits.length, 100000);

    db.limits.sqlLength = 50000;
    t.assert.strictEqual(db.limits.sqlLength, 50000);

    db.limits.column = 50;
    t.assert.strictEqual(db.limits.column, 50);
  });

  test('throws on invalid argument type', (t) => {
    const db = new DatabaseSync(':memory:');
    t.assert.throws(() => {
      db.limits.length = 'invalid';
    }, {
      name: 'TypeError',
      message: /Limit value must be an integer/,
    });
  });

  test('throws on negative value', (t) => {
    const db = new DatabaseSync(':memory:');
    t.assert.throws(() => {
      db.limits.length = -1;
    }, {
      name: 'RangeError',
      message: /Limit value must be non-negative/,
    });
  });

  test('throws on getter access after close', (t) => {
    const db = new DatabaseSync(':memory:');
    db.close();
    t.assert.throws(() => {
      return db.limits.length;
    }, {
      code: 'ERR_INVALID_STATE',
      message: /database is not open/,
    });
  });

  test('throws on setter access after close', (t) => {
    const db = new DatabaseSync(':memory:');
    db.close();
    t.assert.throws(() => {
      db.limits.length = 100;
    }, {
      code: 'ERR_INVALID_STATE',
      message: /database is not open/,
    });
  });

  test('limits object is enumerable', (t) => {
    const db = new DatabaseSync(':memory:');
    const keys = Object.keys(db.limits);
    t.assert.ok(keys.includes('length'));
    t.assert.ok(keys.includes('sqlLength'));
    t.assert.ok(keys.includes('column'));
    t.assert.ok(keys.includes('exprDepth'));
    t.assert.ok(keys.includes('compoundSelect'));
    t.assert.ok(keys.includes('vdbeOp'));
    t.assert.ok(keys.includes('functionArg'));
    t.assert.ok(keys.includes('attach'));
    t.assert.ok(keys.includes('likePatternLength'));
    t.assert.ok(keys.includes('variableNumber'));
    t.assert.ok(keys.includes('triggerDepth'));
  });

  test('throws on invalid limits option type', (t) => {
    t.assert.throws(() => {
      new DatabaseSync(':memory:', { limits: 'invalid' });
    }, {
      name: 'TypeError',
      message: /options\.limits.*must be an object/,
    });
  });

  test('throws on invalid limit value type in constructor', (t) => {
    t.assert.throws(() => {
      new DatabaseSync(':memory:', { limits: { length: 'invalid' } });
    }, {
      name: 'TypeError',
      message: /options\.limits\.length.*must be an integer/,
    });
  });

  test('throws on negative limit value in constructor', (t) => {
    t.assert.throws(() => {
      new DatabaseSync(':memory:', { limits: { length: -100 } });
    }, {
      name: 'RangeError',
      message: /options\.limits\.length.*must be non-negative/,
    });
  });

  test('throws on value exceeding compile-time maximum via setter', (t) => {
    const db = new DatabaseSync(':memory:');
    t.assert.throws(() => {
      db.limits.attach = 100;
    }, {
      name: 'RangeError',
      message: /Limit value exceeds compile-time maximum/,
    });
  });

  test('throws on value exceeding compile-time maximum in constructor', (t) => {
    t.assert.throws(() => {
      new DatabaseSync(':memory:', { limits: { attach: 100 } });
    }, {
      name: 'RangeError',
      message: /options\.limits\.attach.*exceeds compile-time maximum/,
    });
  });

  test('partial limits in constructor', (t) => {
    const db = new DatabaseSync(':memory:', {
      limits: {
        length: 100000,
      }
    });
    t.assert.strictEqual(db.limits.length, 100000);
    t.assert.strictEqual(typeof db.limits.sqlLength, 'number');
  });

  test('throws when exceeding column limit', (t) => {
    const db = new DatabaseSync(':memory:', {
      limits: {
        column: 10,
      }
    });

    db.exec('CREATE TABLE t1 (c1, c2, c3, c4, c5, c6, c7, c8, c9, c10)');

    t.assert.throws(() => {
      db.exec('CREATE TABLE t2 (c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11)');
    }, {
      message: /too many columns/,
    });
  });
});
