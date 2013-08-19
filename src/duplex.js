define(['stream/readable', 'stream/writable', 'stream/util'],
function (Readable, Writable, util) {

	function Duplex (opts) {
		Readable.call(this, opts);
		Writable.call(this, opts);

		if (opts && opts.readable === false) {
			this.readable = false;
		}

		if (opts && opts.writable == false) {
			this.writable = false;
		}

		this.allowHalfOpen = true;
		if (opts && opts.allowHalfOpen === false) {
			this.allowHalfOpen = false;
		}

		this.once('end', onend);
	}

	util.inherits(Duplex, Readable);
	util.prototypallyInherits(Duplex, Writable);

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

	return Duplex;
});