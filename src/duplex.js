var Readable = require('./readable');
var Writable = require('./writable');
var util = require('./util');
var inherits = require('inherits');
var extend = require('util-extend');

module.exports = Duplex;

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) keys.push(key);
  return keys;
}

function Duplex (opts) {
	Readable.call(this, opts);
	Writable.call(this, opts);

	if (opts && opts.readable === false) {
		this.readable = false;
	}

	if (opts && opts.writable === false) {
		this.writable = false;
	}

	this.allowHalfOpen = true;
	if (opts && opts.allowHalfOpen === false) {
		this.allowHalfOpen = false;
	}

	this.once('end', onend);
}

inherits(Duplex, Readable);

forEach(objectKeys(Writable.prototype), function(method) {
  if (!Duplex.prototype[method])
    Duplex.prototype[method] = Writable.prototype[method];
});

// Enforce noHalfOpen
function onend () {
	var self = this;

	if (this.allowHalfOpen || this._writableState.ended) {
		return;
	}

	// No more data can be written.
	// But more writes can happen in this tick
	util.nextTick(function () {
		self.end();
	});
}

function forEach (xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}
