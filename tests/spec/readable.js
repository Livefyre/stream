define(['jasmine', 'stream', 'stream/readable', 'stream/writable'],
function (jasmine, Stream, Readable, Writable) {
    describe('stream/readable', function () {
        describe('when constructed', function () {
            var stream;
            beforeEach(function () {
                stream = new Readable();
            });
            it('is instanceof Stream and Readable', function () {
                expect(stream instanceof Stream).toBe(true);
                expect(stream instanceof Readable).toBe(true);
            });
            it('is .readable', function () {
                expect(stream.readable).toBe(true);
            });
        });

        describe('.read', function () {
            var items,
                stream;
            beforeEach(function() {
                stream = new Readable();
                spyOn(stream, '_read').andCallThrough();
                items = [1,/a/gi,3,{},'5',6];
                for (var i=0, numItems = items.length; i < numItems; i++) {
                    stream.push(items[i]);
                }
            });
            it('is a method on Readable instances', function () {
                expect(stream.read instanceof Function).toBe(true);
            });
            it('returns null if called with 0', function () {
                // In this case, it should actually call ._read
                expect(stream.read(0)).toBe(null);
                expect(stream._read).toHaveBeenCalled();
            });
            it('returns the first item on the buffer if called with no arguments', function () {
                expect(stream.read()).toEqual(items[0]);
                expect(stream._readableState.buffer.length).toBe(items.length - 1);
            });
            it('always returns 1 item if .read(N) is called (objectMode)', function () {
                var N = 3,
                    chunk = stream.read(N);
                expect(chunk).toBe(items[0]);
            });
            it('emits a data event', function () {
                var onData = jasmine.createSpy('onData');
                stream.on('data', onData);
                var data = stream.read();
                expect(onData).toHaveBeenCalledWith(data);
            });
            describe('when .read(N) is called and N > .state.buffer.length', function () {
                var N,
                    chunk;
                beforeEach(function () {
                    N = 20;
                    chunk = stream.read(N);
                });
                it('returns the first item on the buffer', function () {
                    expect(chunk).toBe(items[0]);
                });
            });
        });

        describe('.push', function () {
            var stream;
            beforeEach(function () {
                stream = new Readable();
            });
            it('is a method on Readable instances', function () {
                expect(stream.push instanceof Function).toBe(true);
            });
            it('can be called with multiple arguments, and each arg is added' +
               'to the readable buffer', function () {
                stream.push(1,2,3);
                expect(stream._readableState.buffer.length).toBe(3);
            });
            describe('when called with a chunk of data', function () {
                var chunk,
                    onReadableSpy;
                beforeEach(function () {
                    onReadableSpy = jasmine.createSpy('onReadableSpy');
                    stream.on('readable', onReadableSpy);
                    chunk = 'abcde';
                    stream.push(chunk);
                });
                it('the stream emits readable', function () {
                    waitsFor(function () {
                        return onReadableSpy.callCount;
                    }, 'stream to emit readable');
                    runs(function () {
                        expect(onReadableSpy).toHaveBeenCalled();
                    });
                });
                describe('and then called with null', function () {
                    var onEndSpy;
                    beforeEach(function () {
                        onEndSpy = jasmine.createSpy('onEndSpy');
                        stream.on('end', onEndSpy);
                        stream.push(null);
                    });
                    it('the stream does not emit end if there is still content in the buffer', function () {
                        expect(onEndSpy).not.toHaveBeenCalled();
                    });
                    it('the stream emits end once all content has been read from the buffer', function () {
                        while (stream.read() !== null) {}
                        waitsFor(function () {
                            return onEndSpy.callCount;
                        }, 500, 'stream to emit end');
                        runs(function () {
                            expect(onEndSpy).toHaveBeenCalled();
                        });
                    });
                });
            });
            describe('when called with null before being read', function () {
                var onEndSpy;
                beforeEach(function () {
                    onEndSpy = jasmine.createSpy('onEndSpy');
                    stream.on('end', onEndSpy);
                    stream.push(null);
                });
                it('the stream does not emit end', function () {
                    expect(onEndSpy).not.toHaveBeenCalled();
                });
            });
        });

        describe('.unshift', function () {
            var stream;
            beforeEach(function () {
                stream = new Readable();
            });
            it('is a method on Readable instances', function () {
                expect(stream.unshift instanceof Function).toBe(true);
            });
            it('can be called with multiple arguments, and each arg is added' +
               'to the readable buffer', function () {
                stream.unshift(1,2,3);
                expect(stream._readableState.buffer.length).toBe(3);
            });
        });

        describe('.pipe()', function () {
            var readable,
                writable;
            beforeEach(function () {
                readable = new Readable();
                readable._read = function () {
                    var self = this;
                    setTimeout(function () {
                        self.push(1,2);
                    }, 10);
                };
                writable = new Writable();
                spyOn(writable, '_write').andCallThrough();
            });
            it('is a method on Readables', function () {
                expect(readable.pipe).toEqual(jasmine.any(Function));
            });
            it('can be passed a writable', function () {
                var pipeReturn = readable.pipe(writable);
                expect(pipeReturn).toBe(writable);
            });
            it('calls writable._write with data from the readable', function () {
                readable.pipe(writable);
                waitsFor(function () {
                    return writable._write.callCount === 2;
                });
                runs(function () {
                    expect(writable._write).toHaveBeenCalledWith(1, jasmine.any(Function));
                    expect(writable._write).toHaveBeenCalledWith(2, jasmine.any(Function));
                });
            });
        });

        describe('.resume()', function () {
            var readable;
            beforeEach(function () {
                readable = new Readable();
                readable._read = function () {
                    var self = this;
                    setTimeout(function () {
                        self.push(1);
                    }, 1);
                };
            });
            it('is a method on Readable', function () {
                expect(readable.resume).toEqual(jasmine.any(Function));
            });
            it('causes data events to be emitted', function () {
                var onData = jasmine.createSpy('onData');
                readable.on('data', onData);
                readable.resume();
                waitsFor(function () {
                    return onData.callCount;
                }, 'data to be emitted');
            });
        });

        describe('.pause()', function () {
            var readable;
            beforeEach(function () {
                readable = new Readable();
                readable._read = function () {
                    var self = this;
                    setTimeout(function () {
                        self.push(1, 1);
                    }, 1);
                };
            });
            it('is a method on Readable', function () {
                expect(readable.pause).toEqual(jasmine.any(Function));
            });
            it('stops data events from beign emitted', function () {
                var onData = jasmine.createSpy('onData').andCallFake(function () {
                    readable.pause();
                });
                readable.on('data', onData);
                readable.resume();
                waitsFor(function () {
                    return onData.callCount;
                }, 'data to be emitted');
                runs(function () {
                    // Wasn't called again because we called pause the first time
                    expect(onData.callCount).toBe(1);
                });
            });
        });

        describe('.on()', function () {
            var readable;
            beforeEach(function () {
                readable = new Readable();
                readable._read = function () {
                    var self = this;
                    setTimeout(function () {
                        self.push(1, 1);
                    }, 1);
                };
            });
            it('calls .resume() when a data listener is added', function () {
                spyOn(readable, 'resume').andCallThrough();
                readable.on('data', function () {});
                expect(readable.resume).toHaveBeenCalled();
            });
        });
    });
});