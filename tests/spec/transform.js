define(['jasmine', 'stream/duplex', 'stream/transform'],
function (jasmine, Duplex, Transform) {
    describe('stream/transform', function () {
        it('is a function', function () {
            expect(Transform).toEqual(jasmine.any(Function));
        });

        describe('when constructed', function () {
            var stream;
            beforeEach(function () {
                stream = new Transform();
            });
            it('is instanceof Duplex', function () {
                expect(stream instanceof Duplex).toBe(true);
            });
            it('is .readable and .writable', function () {
                expect(stream.writable).toBe(true);
                expect(stream.readable).toBe(true);
            });
            it('defaults .allowHalfOpen to true', function () {
                expect(stream.allowHalfOpen).toBe(true);
            });
        });

        it('calls ._transform on any written data', function () {
            var transform = new Transform(),
                data = 'lf';
            spyOn(transform, '_transform');
            transform.write(data);
            expect(transform._transform).toHaveBeenCalledWith(data, jasmine.any(Function));
        });

        it('is not .readable if passed opts.readable: false', function () {
            var stream = new Transform({
                readable: false
            });
            expect(stream.readable).toBe(false);
        });

        it('is not .writable if passed opts.writable: false', function () {
            var stream = new Transform({
                writable: false
            });
            expect(stream.writable).toBe(false);
        });

        describe('when constructed with opts.allowHalfOpen: false', function () {
            var stream;
            beforeEach(function () {
                stream = new Transform({
                    allowHalfOpen: false
                });
            });
            it('has .allowHalfOpen === false', function () {
                expect(stream.allowHalfOpen).toBe(false);
            });
        });
    });
});