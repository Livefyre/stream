define(['jasmine', 'stream', 'stream/mix', 'stream/writable', 'stream/readable', 'stream/duplex'],
function (jasmine, Stream, Mix, Writable, Readable, Duplex) {
    describe('stream/mix', function () {
        var sourceStream;
        beforeEach(function () {
            
        });
            
        it('is a function', function () {
            expect(Mix).toEqual(jasmine.any(Function));
        });

        it('is a factory for Intermixer Objects', function () {
            var mixer = Mix(sourceStream);
            
            expect(mixer instanceof Intermixer).toBe(true);
        });

        it('has a CONSTRUCTOR property containing the constructor function', function () {
            expect(Mix.CONSTRUCTOR).toEqual(jasmine.any(Function));
        });

        describe('factory when called', function () {
            var mixer;
            describe('without params', function () {
                it('throws an exception', function () {
                    var fn = function () { mixer = Mix(); };
                    
                    expect(fn).toThrow();
                });
            });

            describe('with a readable stream as the first parameter', function () {
                beforeEach(function () {
                    mixer = Mix(sourceStream);
                });
                
                it('returns an Intermixer with that stream as its source stream', function () {
                    expect(mixer._source).toBe(sourceStream);
                });

                describe('and with an opts object as its second parameter', function () {
                    var opts;
                    beforeEach(function () {
                        opts = {
                            interval: 4,
                            enabled: false
                        };
                        mixer = Mix(sourceStream, opts);
                    });
                    
                    it('sets interval to opts.interval if it is a non-negative number', function () {
                        expect(mixer._interval).toBe(4);
                    });

                    it('sets itself disabled if opts.enabled === false', function () {
                        expect(mixer._enabled).toBe(false);
                    });
                });
            });
        });

        describe('constructed object', function () {
            var mixer,
                constFn = Intermixer.CONSTRUCTOR;
            
            it('cannot be constructed without specifying a stream', function () {
                var fn = function () { mixer = new constFn(); };
                expect(fn).toThrow();
            });

            describe('with a readable stream specified', function () {
                beforeEach(function () {
                    mixer = new constFn(sourceStream);
                });
                
                it('is an instance of Duplex', function () {
                    expect(mixer instanceof Duplex).toBe(true);
                });

                it('sets that stream as its source', function () {
                    expect(mixer._source).toBe(sourceStream);
                });

                it('returns that source stream using .getSource()', function () {
                    expect(mixer.getSource()).toEqual(jasmine.any(Function));
                    expect(mixer.getSource()).toBe(sourceStream);
                });

                it('waits to read from the stream,', function () {});

                it('has a default interval of 1', function () {
                    expect(mixer._interval).toBe(1);
                });

                it('has isEnabled(), which returns the value of ._enabled', function () {
                    expect(mixer.isEnabled()).toEqual(jasmine.any(Function));
                    expect(mixer.isEnabled()).toBe(true);
                });

                describe('and an interval specified using .every(n)', function () {
                    it('replaces the default interval with the non-negative number value [n]', function () {
                        mixer.every(3);
                        
                        expect(mixer._interval).toBe(3);
                    });

                    it('ignores negative and NAN values', function () {
                        mixer.every("3");
                        mixer.every(true);
                        mixer.every({});
                        mixer.every(null);
                        mixer.every();
                        mixer.every(NaN);
                        
                        expect(mixer._interval).toBe(1);
                    });

                    it('streams without inhibition if set to 0', function () {throw 'TODO (joao) Write this test.';});
                });

                describe('is passed to a readable stream.pipe()', function () {
                    var readStream;
                    beforeEach(function () {
//                        readStream =
                        readStream.pipe(mixer);
                    });
                    
                    it('reads from the stream', function () {throw 'TODO (joao) Write this test.';});

                    describe('and has .pipe(writable stream)', function () {
                        var writeStream;
                        beforeEach(function () {
//                            writeStream =
                            mixer.pipe(writeStream);
                        });
                        
                        it('writes to the writable stream each piece of content it reads from the readable stream and increments counter', function () {throw 'TODO (joao) Write this test.';});

                        it('writes one piece of source content for every [interval] number of stream content(s) it reads', function () {throw 'TODO (joao) Write this test.';});

                        it('can be disabled using .disable() to pause the counter and stop it from reading from source', function () {
                            mixer.disable();
                            
                            expect(mixer._enabled).toBe(false);
                            throw 'TODO (joao) Make sure mixing has actually stopped';
                        });

                        it('can be re-enabled using .enable() to continue the counter and read from source', function () {
                            mixer.disable();
                            
                            expect(mixer._enabled).toBe(true);
                            throw 'TODO (joao) Make sure mixing has resumed';
                        });

                        it('can have its counter reset using .reset()', function () {
                            throw 'TODO (joao) Stream some';
                            
                            mixer.reset();
                            
                            expect(mixer._counter).toBe(0);
                        });

                        it('can read source and bypass the counter by using .now()', function () {throw 'TODO (joao) Write this test.';});

                        it('reads from source and resets counter if .every(n) called with  n < counter', function () {throw 'TODO (joao) Write this test.';});
                    });
                });
            });
        });
    });
});
