define(['jasmine', 'stream', 'stream/writable', 'stream/readable', 'stream/duplex'],
function (jasmine, Stream, Writable, Readable, Duplex) {
    describe('stream/duplex', function () {
        it('is a function', function () {
            expect(Duplex).toEqual(jasmine.any(Function));
        });

        describe('when constructed', function () {
            var stream;
            beforeEach(function () {
                stream = new Duplex();
            });
            it('is instanceof Readable', function () {
                expect(stream instanceof Readable).toBe(true);
                expect(stream.readable).toBe(true);
            });
            it('is writable', function () {
                expect(stream.writable).toBe(true);
                expect(stream.write).toEqual(jasmine.any(Function));
            });
            it('defaults .allowHalfOpen to true', function () {
                expect(stream.allowHalfOpen).toBe(true);
            });
        });

        it('is not .readable if passed opts.readable: false', function () {
            var stream = new Duplex({
                readable: false
            });
            expect(stream.readable).toBe(false);
        });

        it('is not .writable if passed opts.writable: false', function () {
            var stream = new Duplex({
                writable: false
            });
            expect(stream.writable).toBe(false);
        });

        describe('when constructed with opts.allowHalfOpen: false', function () {
            var stream;
            beforeEach(function () {
                stream = new Duplex({
                    allowHalfOpen: false
                });
            });
            it('has .allowHalfOpen === false', function () {
                expect(stream.allowHalfOpen).toBe(false);
            });
        });
    });
});