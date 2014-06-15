"use strict";
var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;

/**
 * Base class for all Streams
 */
var Stream = module.exports = function Stream (opts) {
    EventEmitter.call(this);
};

inherits(Stream, EventEmitter);
