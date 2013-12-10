define(['jasmine', 'stream', 'stream/insert', 'stream/writable', 'stream/readable', 'stream/duplex', 'stream/passthrough', 'stream/contrib/readable-array', 'stream/contrib/writable-array'],
function (jasmine, Stream, Insert, Writable, Readable, Duplex, PassThrough, ReadableArray, WritableArray) {
    describe('stream/insert', function () {
        var sourceStream,
            sourceSpy,
            inserter;
        beforeEach(function () {
            //TODO (joao) Make ths Readable with _read() defined
            sourceStream = new Readable();
            sourceSpy = spyOn(sourceStream, '_read').andCallFake(function () { console.log('source read'); });
        });
            
        it('is a function', function () {
            expect(Insert).toEqual(jasmine.any(Function));
        });

        it('is a factory for Inserter Objects', function () {
            inserter = Insert(sourceStream);
            
            //TODO (joao) Test for Inserter, not PassThrough
            expect(inserter instanceof PassThrough).toBe(true);
        });

        it('has a CONSTRUCTOR property containing the constructor function', function () {
            expect(Insert.CONSTRUCTOR).toEqual(jasmine.any(Function));
        });

        describe('factory when called', function () {
            describe('without params', function () {
                it('throws an exception', function () {
                    var fn = function () { inserter = Insert(); };
                    
                    expect(fn).toThrow();
                });
            });

            describe('with a readable stream as the first parameter', function () {
                beforeEach(function () {
                    inserter = Insert(sourceStream);
                });
                
                it('returns an Inserter with that stream as its source stream', function () {
                    expect(inserter._source).toBe(sourceStream);
                });

                describe('and with an opts object as its second parameter', function () {
                    var opts;
                    beforeEach(function () {
                        opts = {
                            interval: 4,
                            enabled: false
                        };
                        inserter = Insert(sourceStream, opts);
                    });
                    
                    it('sets interval to opts.interval if it is a non-negative number', function () {
                        expect(inserter._interval).toBe(4);
                    });

                    it('sets itself disabled if opts.enabled === false', function () {
                        expect(inserter._enabled).toBe(false);
                    });
                });
            });
        });

        describe('constructed object', function () {
            var constFn = Insert.CONSTRUCTOR;
            
            it('cannot be constructed without specifying a stream', function () {
                var fn = function () { inserter = new constFn(); };
                expect(fn).toThrow();
            });

            describe('with a readable stream specified', function () {
                beforeEach(function () {
                    inserter = new constFn(sourceStream);
                });
                
                it('is an instance of Duplex', function () {
                    expect(inserter instanceof Duplex).toBe(true);
                });

                it('sets that stream as its source', function () {
                    expect(inserter._source).toBe(sourceStream);
                });

                it('returns that source stream using .getSource()', function () {
                    expect(inserter.getSource).toEqual(jasmine.any(Function));
                    expect(inserter.getSource()).toBe(sourceStream);
                });

                it('waits to read from the stream,', function () {});

                it('has a default interval of 1', function () {
                    expect(inserter._interval).toBe(1);
                });

                it('has isEnabled(), which returns the value of ._enabled', function () {
                    expect(inserter.isEnabled).toEqual(jasmine.any(Function));
                    expect(inserter.isEnabled()).toBe(true);
                });

                describe('and an interval specified using .every(n)', function () {
                    it('replaces the default interval with the non-negative number value [n]', function () {
                        inserter.every(3);
                        
                        expect(inserter._interval).toBe(3);
                    });

                    it('ignores negative and NAN values', function () {
                        inserter.every("3");//string
                        inserter.every(-1);//negative number
                        inserter.every(true);//boolean
                        inserter.every(function () {});//function
                        inserter.every({});//object
                        inserter.every(null);//null
                        inserter.every();//undefined
                        inserter.every(NaN);//NaN
                        
                        expect(inserter._interval).toBe(1);//1 is the default
                    });
                    
                    it('returns itself', function () {
                        var retVal = inserter.every(5);
                        
                        expect(retVal).toBe(inserter);
                    });
//TODO (joao) Potential upgrade
//                    it('streams without inhibition if set to 0', function () {throw 'TODO (joao) Write this test.';});
                });

                describe('is passed to a readable stream.pipe()', function () {
                    var readStream,
                        onReadEndSpy;
                    beforeEach(function () {
                        inserter.every(2);//Set insertion interval to 2
                        sourceStream.push('_insert_');
                        readStream = new ReadableArray([1,2,3]);
                        onReadEndSpy = jasmine.createSpy('onReadableEnd');
                        readStream.on('end', onReadEndSpy);
//                        readStream.pipe(inserter);
                    });
                    
                    describe('and has .pipe(writable stream)', function () {
                        var writeStream;
                        beforeEach(function () {
                            writeStream = new WritableArray();
                            inserter.pipe(writeStream);
                        });
                        
                        it('writes to the writable stream each piece of content it reads from the readable stream and increments counter', function () {
                            inserter.every(10);
                            readStream.pipe(inserter);
                            
                            waitsFor(function () {
                                return onReadEndSpy.callCount;
                            }, 'readStream to emit end', 1000);
                            runs(function () {
                                expect(writeStream.get()).toEqual([1,2,3]);
                            });
                        });

                        it('writes one piece of source content for every [interval] number of stream content(s) it reads', function () {
                            readStream.pipe(inserter);
                            
                            waitsFor(function () {
                                return onReadEndSpy.callCount;
                            }, 'readStream to emit end', 1000);
                            runs(function () {
                                expect(writeStream.get()).toEqual([1,2,'_insert_',3]);
                            });
                        });

                        it('can be disabled using .disable() to pause the counter and stop it from reading from source', function () {
                            inserter.disable();
                            readStream.pipe(inserter);
                            
                            expect(inserter._enabled).toBe(false);
                            waitsFor(function () {
                                return onReadEndSpy.callCount;
                            }, 'readStream to emit end', 1000);
                            runs(function () {
                                //Make sure insertion didn't occur
                                expect(writeStream.get()).toEqual([1,2,3]);
                            });
                        });

                        it('can be re-enabled using .enable() to continue the counter and read from source', function () {
                            inserter.disable();
                            inserter.enable();
                            readStream.pipe(inserter);
                            
                            expect(inserter._enabled).toBe(true);
                            waitsFor(function () {
                                return onReadEndSpy.callCount;
                            }, 'readStream to emit end', 1000);
                            runs(function () {
                                //Make sure insertion occured
                                expect(writeStream.get()).toEqual([1,2,'_insert_',3]);
                            });
                        });

                        it('can have its counter reset using .reset()', function () {
                            inserter.every(10);
                            readStream.pipe(inserter);
                            
                            waitsFor(function () {
                                return onReadEndSpy.callCount;
                            }, 'readStream to emit end', 1000);
                            runs(function () {
                                expect(inserter._counter).toBe(3);
                                inserter.reset();
                                expect(inserter._counter).toBe(0);
                            });
                        });

                        it('can read source and bypass the counter by using .now()', function () {
                            inserter.every(10);
                            readStream.pipe(inserter);
                            
                            waitsFor(function () {
                                return onReadEndSpy.callCount;
                            }, 'readStream to emit end', 1000);
                            runs(function () {
                                expect(writeStream.get()).toEqual([1,2,3]);
                                inserter.now();
                                expect(writeStream.get()).toEqual([1,2,3,'_insert_']);
                            });
                        });

                        it('reads from source and resets counter if .every(n) called with  n < counter', function () {
                            inserter.every(10);
                            readStream.pipe(inserter);
                            
                            waitsFor(function () {
                                return onReadEndSpy.callCount;
                            }, 'readStream to emit end', 1000);
                            runs(function () {
                                expect(writeStream.get()).toEqual([1,2,3]);
                                expect(inserter._counter).toBe(3);
                                inserter.every(2);
                                expect(inserter._counter).toBe(0);
                                expect(writeStream.get()).toEqual([1,2,3,'_insert_']);
                            });
                        });
                    });
                });
            });
        });
    });
});
