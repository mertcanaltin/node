'use strict';

// Simple polyfills for the functions we need
const ArrayPrototypePush = Array.prototype.push;
const ObjectDefineProperty = Object.defineProperty;

// Buffering configuration
const kBufferFlushThreshold = 16 * 1024; // 16KB threshold
const kMaxBufferSize = 64 * 1024; // 64KB max buffer
const kFlushInterval = 16; // 16ms max delay

let logBuffer = [];
let bufferSize = 0;
let flushScheduled = false;
let flushTimer = null;

// Fast path for simple objects
function fastStringify(obj) {
  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';

  const type = typeof obj;
  if (type === 'string') return obj;
  if (type === 'number' || type === 'boolean') return String(obj);

  // For simple objects, try JSON.stringify first (much faster)
  if (type === 'object') {
    try {
      // Quick check for simple, JSON-serializable objects
      if (obj.constructor === Object || obj.constructor === Array) {
        return JSON.stringify(obj);
      }
    } catch {
      // Fall back to util.inspect for complex objects
    }
  }

  // Fallback to util.inspect for complex cases
  const { inspect } = require('internal/util/inspect');
  return inspect(obj);
}

function flushBuffer() {
  if (logBuffer.length === 0) return;

  // Process all buffered logs at once
  const toFlush = logBuffer;
  logBuffer = [];
  bufferSize = 0;
  flushScheduled = false;

  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  // Batch write to streams
  for (let i = 0; i < toFlush.length; i++) {
    const { console, streamSymbol, message } = toFlush[i];
    // Direct stream write instead of kWriteToConsole
    const stream = console._stdout;
    stream.write(message + '\n');
  }
}

function scheduleFlush() {
  if (flushScheduled) return;

  flushScheduled = true;

  // Use setImmediate for better performance than nextTick
  setImmediate(flushBuffer);

  // Also set a timer as fallback to ensure flushing even under heavy load
  flushTimer = setTimeout(flushBuffer, kFlushInterval);
}

// Optimized console methods
const optimizedMethods = {
  log(...args) {
    let message;

    if (args.length === 1) {
      // Single argument - fast path
      message = fastStringify(args[0]);
    } else if (args.length === 0) {
      message = '';
    } else {
      // Multiple arguments - use existing format logic but with fast stringify
      const first = args[0];
      if (typeof first === 'string' && first.includes('%')) {
        // Has format specifiers - use util.format
        const { formatWithOptions } = require('internal/util/inspect');
        message = formatWithOptions(this[Symbol.for('kGetInspectOptions')](this._stdout), ...args);
      } else {
        // No format specifiers - join with fast stringify
        message = args.map(fastStringify).join(' ');
      }
    }

    const entry = {
      console: this,
      streamSymbol: Symbol.for('kUseStdout'),
      message,
    };

    logBuffer.push(entry);
    bufferSize += message.length;

    // Flush if buffer is too large or we hit the threshold
    if (bufferSize >= kBufferFlushThreshold || logBuffer.length >= 100) {
      flushBuffer();
    } else {
      scheduleFlush();
    }
  },

  // Similar optimizations for other methods
  info(...args) {
    return this.log(...args);
  },

  debug(...args) {
    return this.log(...args);
  },

  error(...args) {
    // Error should flush immediately for debugging
    const message = args.length === 1 ? fastStringify(args[0]) :
      args.map(fastStringify).join(' ');
    // Direct write for errors (immediate flush)
    const stream = this._stderr;
    stream.write(message + '\n');
  },

  warn(...args) {
    // Warn should also flush immediately
    const message = args.length === 1 ? fastStringify(args[0]) :
      args.map(fastStringify).join(' ');
    // Direct write for warnings (immediate flush)
    const stream = this._stderr;
    stream.write(message + '\n');
  },
};

// Force flush on process exit
process.on('exit', flushBuffer);
process.on('beforeExit', flushBuffer);

module.exports = {
  optimizedMethods,
  flushBuffer,
  fastStringify,
};