var Readable = require('./readable');
var Writable = require('./writable');
var util = require('./util');
var inherits = require('inherits');

var Duplex = module.exports = function Duplex (opts) {
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
inherits.parasitically(Duplex, Writable);

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
