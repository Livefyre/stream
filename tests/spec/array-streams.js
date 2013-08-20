define([
    'jasmine',
    'stream/util',
    'stream/contrib/readable-array',
    'stream/contrib/writable-array',
    'stream/contrib/string-transform'],
function (jasmine, util, ReadableArray, WritableArray, StringTransform) {

    describe('WritableArray', function () {
        it('can be written to three times', function () {
            var stream = new WritableArray();
            stream.write(1);
            stream.write(2);
            stream.write(3);
            expect(stream.get()).toEqual([1,2,3]);
        });
    });

    describe('ReadableArray', function () {
        it('can be read', function () {
            var stream = new ReadableArray([1,2,3]);
            expect(stream.read()).toBe(1);
            expect(stream.read()).toBe(2);
            expect(stream.read()).toBe(3);
        });
        it('eventually emits end once .resume()d', function () {
            var stream = new ReadableArray([1,2,3]),
                onEnd = jasmine.createSpy('onEnd');
            stream.on('end', onEnd);
            stream.resume();
            waitsFor(function () {
                return onEnd.callCount;
            }, 'end to be emitted');
        });
        it('can be piped to a WritableArray', function () {
            var readable = new ReadableArray([1,2,3]),
                writable = new WritableArray(),
                onEndSpy = jasmine.createSpy('onReadableEnd');
            readable.on('end', onEndSpy);
            readable.pipe(writable);
            waitsFor(function () {
                return onEndSpy.callCount;
            }, 'readable to emit end', 1000);
            runs(function () {
                expect(writable.get()).toEqual([1,2,3]);
            });
        });
    });

    describe('StringTransform', function () {
        var stringTransform;
        beforeEach(function () {
            stringTransform = new StringTransform();
        });
        it('transforms inputs to Strings with pipe', function () {
            var readable = new ReadableArray([1,2,3]),
                writable = new WritableArray(),
                onEndSpy = jasmine.createSpy('onReadableEnd');
            readable.on('end', onEndSpy);
            readable.pipe(stringTransform).pipe(writable);
            waitsFor(function () {
                return onEndSpy.callCount;
            }, 'readable to emit end', 1000);
            runs(function () {
                expect(writable.get()).toEqual(['1','2','3']);
            });
        });
    });
});