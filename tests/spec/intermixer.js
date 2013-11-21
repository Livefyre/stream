define(['jasmine', 'stream', 'stream/intermixer'],
function (jasmine, Stream, Intermixer) {
    describe('stream/intermixer', function () {
        it('is a function', function () {
            expect(Intermixer).toEqual(jasmine.any(Function));
        });

        it('is a factory for Intermixer Objects', function () {});

        it('has a CONSTRUCTOR property containing the constructor function', function () {});

        describe('factory when called', function () {
            describe('without params', function () {
                it('throws an exception', function () {});
            });

            describe('with a readable stream as the first parameter', function () {
                it('returns an Intermixer with that stream as its source stream', function () {});

                describe('and with an opts object as its second parameter', function () {
                    it('sets interval to opts.interval if it is a non-negative number', function () {});

                    it('sets itself disabled if opts.enabled === false', function () {});
                });
            });

            describe('and with an opts object as its second parameter', function () {
                it('throws an exception if opts.source isn\'t a readable stream', function () {});

                describe('it returns an Intermixer with opts.source as its source stream and', function () {
                    beforeEach() {};

                    it('sets interval to opts.interval if it is a non-negative number', function () {});

                    it('sets itself disabled if opts.enabled === false', function () {});
                });
            });
        });

        describe('constructed object', function () {
            it('cannot be constructed without specifying a stream', function () {});

            describe('with a readable stream specified', function () {
                it('is an instance of Duplex', function () {});

                it('sets that stream as its source', function () {});

                it('returns that source stream using .getSource()', function () {});

                it('waits to read from the stream,', function () {});

                it('has a default interval of 1', function () {});

                it('has isEnabled(), which returns the value of ._enabled', function () {});

                describe('and an interval specified using .every(n)', function () {
                    it('replaces the default interval with the non-negative number value [n]', function () {});

                    it('ignores negative and NAN values' function () {});

                    it('streams without inhibition if set to 0', function () {});
                });

                describe('is piped into a readable stream', function () {
                    it('reads from the stream', function () {});

                    describe('and has a writable stream piped in', function () {
                        it('writes to the writable stream each piece of content it reads from the readable stream and increments counter', function () {});

                        it('writes one piece of source content for every [interval] number of stream content(s) it reads', function () {});

                        it('can be disabled using .disable() to pause the counter and stop it from reading from source', function () {});

                        it('can be re-enabled using .enable() to continue the counter and read from source', function () {});

                        it('can have its counter reset using .reset()', function () {});

                        it('can read source and bypass the counter by using .now()', function () {});

                        it('reads from source and resets counter if .every(n) called with  n < counter', function () {});
                    });
                });
            });
        });
    });
});
