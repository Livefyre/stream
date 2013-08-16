define(['jasmine', 'stream', 'stream/writable', 'stream/util'],
function (jasmine, Stream, Writable, util) {
    describe('stream/writable', function () {
        it('defines .WritableState', function () {
            expect(Writable.WritableState).toEqual(jasmine.any(Function));
        });
        describe('when constructed', function () {
            var stream;
            beforeEach(function () {
                stream = new Writable();
            });
            it('is instanceof Stream and Writable', function () {
                expect(stream instanceof Stream).toBe(true);
                expect(stream instanceof Writable).toBe(true);
            });
            it('is .writable', function () {
                expect(stream.writable).toBe(true);
            });
            it('has a ._writableState', function () {
                expect(stream._writableState)
                    .toEqual(jasmine.any(Writable.WritableState));
            });
            it('emits an error event if .pipe is called, since Writables ' +
               'should not be pipeable', function () {
                var onErrorSpy = jasmine.createSpy('onErrorSpy');
                stream.on('error', onErrorSpy);
                stream.pipe();
                waitsFor(function () {
                    return onErrorSpy.callCount;
                }, 'error to be emitted');
            });
        });


        describe('.end()', function () {
            var stream;
            beforeEach(function () {
                stream = new Writable();
                spyOn(stream, 'write').andCallThrough();
            });
            it('is a method on Writables', function () {
                expect(stream.end).toEqual(jasmine.any(Function));
            });
            describe('when passed only a chunk of data', function () {
                var data;
                beforeEach(function () {
                    data = 'dataToWrite';
                    stream.end(data);
                });
                it('.write()s the chunk of data', function () {
                    expect(stream.write).toHaveBeenCalledWith(data);
                });
            });
            describe('when passed only an errback', function () {
                var errback;
                beforeEach(function () {
                    errback = jasmine.createSpy('.end errback');
                    stream.end(errback);
                });
                it('calls the errback', function () {
                    waitsFor(function () {
                        return errback.callCount;
                    }, '.end errback to be called');
                });
            });
            describe('when passed a chunk of data and an errback', function () {
                var errback,
                    data;
                beforeEach(function () {
                    data = 'dataToWrite';
                    errback = jasmine.createSpy('.end errback');
                    stream.end(data, errback);
                });
                it('.write()s the chunk of data', function () {
                    expect(stream.write).toHaveBeenCalledWith(data);
                });
                it('calls the errback', function () {
                    waitsFor(function () {
                        return errback.callCount;
                    }, '.end errback to be called');
                });
            });
        });


        describe('.write()', function () {
            var stream;
            beforeEach(function () {
                stream = new Writable();
            });
            it('is a method on Writables', function () {
                expect(stream.write).toEqual(jasmine.any(Function));
            });
            it('returns a boolean', function () {
                var data = 'chunk';
                expect([true, false]).toContain(stream.write(data));
            });

            describe('when called with a callback', function () {
                var afterWriteSpy;
                beforeEach(function () {
                    afterWriteSpy = jasmine.createSpy('.write callback');
                });
                it('the callback is called', function () {
                    stream.write('something', afterWriteSpy);
                    waitsFor(function () {
                        return afterWriteSpy.callCount;
                    }, 'write callback to be called', 1000);
                });
            });

            describe('when called after the stream is ended', function () {
                beforeEach(function () {
                    stream.end();
                });
                it('emits an error event', function () {
                    var onErrorSpy = jasmine.createSpy('onErrorSpy');
                    stream.on('error', onErrorSpy);
                    stream.write('data');
                    waitsFor(function () {
                        return onErrorSpy.callCount;
                    }, 'error to be emitted', 1000);                    
                });
                it('passes an error to the .write callback', function () {
                    var afterWriteSpy = jasmine.createSpy('.write callback');
                    stream.write('data', afterWriteSpy);
                    waitsFor(function () {
                        return afterWriteSpy.callCount;
                    }, 'write callback to be called');
                    runs(function () {
                        expect(afterWriteSpy.mostRecentCall.args[0]).toBeTruthy();
                    });
                });
            });

            it('emits error if .write() is called after the stream is ended', function () {

            });
        });
    });
});