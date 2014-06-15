var jasmine = require('jasmine');
var Stream = require('stream');
var EventEmitter = require('events').EventEmitter;

describe('stream', function () {
	it ('is a function', function () {
		expect(Stream).toEqual(jasmine.any(Function));
	});
	describe('when constructed', function () {
		var stream;
		beforeEach(function () {
			stream = new Stream();
		});
		it('is instanceof Stream and EventEmitter', function () {
			expect(stream instanceof Stream).toBe(true);
			expect(stream instanceof EventEmitter).toBe(true);
		});
	});
});
