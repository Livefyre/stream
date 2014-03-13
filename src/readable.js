define(['stream', 'stream/util', 'event-emitter', 'inherits'],
function (Stream, util, EventEmitter, inherits) {
    "use strict";

    /**
     * Base class for Readable Streams
     * @constructor
     * @param [opts] {object} Configuration options
     * @param [opts.highWaterMark=0] {number} The maximum number of objects to
     *     store in the internal buffer before ceasing to read from upstream
     */
    function Readable (opts) {
        opts = opts || {};
        // This Readable implementation only supports objectMode
        opts.objectMode = true;
        this._readableState = new ReadableState(opts, this);

        this.readable = true;
        Stream.call(this);
    }
    inherits(Readable, Stream);


    /**
     * Pulls all the data out of this readable stream, and writes it to the
     * supplied destination, automatically managing the flow so that the
     * destination is not overwhelmed by a fast readable stream.
     * @param dest {Writable} A writable stream that should be written to
     * @param [pipeOpts] {object} Pipe options
     * @param [pipeOpts.end=true] {boolean} Whether the writer should be ended
     *     when the reader ends
     */
    Readable.prototype.pipe = function (dest, pipeOpts) {
        var src = this,
            state = this._readableState,
            doEnd,
            endFn;

        state.pipes.push(dest);

        doEnd = ( ! pipeOpts || pipeOpts.end !== false );

        endFn = doEnd ? onend : cleanup;

        if (state.endEmitted) {
            util.nextTick(endFn);
        } else {
            src.once('end', endFn);
        }

        dest.on('unpipe', onunpipe);
        function onunpipe (readable) {
            // Only if the unpipe was for this readable
            if (readable === src) {
                // Cleanup listeners when unpiped
                cleanup();
            }
        }

        // End the writable destination
        function onend () {
            dest.end();
        }

        // when the dest drains, it reduces the awaitDrain counter
        // on the source.  This would be more elegant with a .once()
        // handler in flow(), but adding and removing repeatedly is
        // too slow.
        var ondrain = this._pipeOnDrain();
        dest.on('drain', ondrain);

        function cleanup() {
            // cleanup event handlers once the pipe is broken
            dest.removeListener('close', onclose);
            dest.removeListener('finish', onfinish);
            dest.removeListener('drain', ondrain);
            dest.removeListener('error', onerror);
            dest.removeListener('unpipe', onunpipe);
            src.removeListener('end', onend);
            src.removeListener('end', cleanup);
            src.removeListener('data', ondata);

            // if the reader is waiting for a drain event from this
            // specific writer, then it would cause it to never start
            // flowing again.
            // So, if this is awaiting a drain, then we just call it now.
            // If we don't know, then assume that we are waiting for one.
            if (state.awaitDrain &&
               (!dest._writableState || dest._writableState.needDrain)) {
                ondrain();
            }
        }

        src.on('data', ondata);
        function ondata (chunk) {
            var ret = dest.write(chunk);
            if (ret === false) {
                // We should stop writing, so pause the source readable
                src._readableState.awaitDrain++;
                src.pause();
            }
        }

        // Unpipe when there is an error in the destination writable
        function onerror (err) {
            unpipe();
            if (EventEmitter.listenerCount(dest, 'error') === 0) {
                dest.emit('error', err);
            }
        }
        dest.once('error', onerror);


        // Both close and finish should trigger unpipe, but only once
        function onclose () {
            dest.removeListener('finish', onfinish);
            unpipe();
        }
        dest.once('close', onclose);
        function onfinish () {
            dest.removeListener('close', onclose);
            unpipe();
        }
        dest.once('finish', onfinish);


        function unpipe () {
            src.unpipe(dest);
        }

        // writables should emit 'pipe' when they're being piped to
        dest.emit('pipe', src);

        if ( ! state.flowing) {
            // Start the flow so pipe works
            src.resume();
        }

        return dest;
    };


    /**
     * This method will remove the hooks set up for a previous pipe() call.
     * If the destination is not specified, then all pipes are removed.
     * If the destination is specified, but no pipe is set up for it, then
     * this is a no-op.
     */
    Readable.prototype.unpipe = function (dest) {
        var state = this._readableState;

        // If there are no pipes, don't do anything
        if (state.pipes.length === 0) {
            return this;
        }

        // Only one pipe
        if (state.pipes.length === 1) {
            if (dest && dest !== state.pipes[0]) {
                // passed a dest we're not piping to
                return this;
            }

            if (!dest) {
                dest = state.pipes[0];
            }

            state.pipes = [];
            state.flowing = false;

            if (dest) {
                dest.emit('unpipe', this);
            }

            return this;
        }

        // Multiple Pipes

        // If dest not passed, unpipe all of them
        if ( ! dest) {
            var dests = state.pipes,
                numDests = dests.length;

            state.pipes = [];
            state.flowing = false;

            for (var i=0; i < numDests; i++) {
                dests[i].emit('unpipe', this);
            }

            return this;
        }

        // Dest was passed, only unpipe that one
        var indexOfDest = state.pipes.indexOf(dest);
        if (indexOfDest === -1) {
            return this;
        }

        state.pipes.splice(indexOfDest, 1);
        dest.emit('unpipe', this);

        return this;
    };


    /**
     * Get a function that will be excuted by a pipe destination
     * so that this readable continues piping when the writable drains
     */
    Readable.prototype._pipeOnDrain = function () {
        var src = this;
        return function () {
            var dest = this,
                state = src._readableState;
            if (state.awaitDrain) {
                state.awaitDrain--;
            }
            if (state.awaitDrain === 0 &&
                EventEmitter.listenerCount(src, 'data')) {
                state.flowing = true;
                src._flow();
            }
        };
    };


    /**
     * Continually .read() this Readable until there is nothing
     * more to read. Calling .read() will emit 'data'
     */
    Readable.prototype._flow = function () {
        var state = this._readableState,
            chunk;
        if (state.flowing) {
            do {
                chunk = this.read();
            } while (chunk !== null && state.flowing);
        }
    };


    /**
     * Push a chunk onto the end of the internal buffer
     * The _read() function will not be called again until at least one
     *     push(chunk) call is made.
     * The Readable class works by putting data into a read queue to be pulled
     *     out later by calling the read() method when the 'readable' event fires.
     * @param chunk {...object} Chunk of data to push into the read queue.
     *     if chunk === null, that signals the end of data
     * @returns {boolean} Whether or not more pushes should be performed
     */
    Readable.prototype.push = function (chunk) {
        var chunks = Array.prototype.slice.call(arguments);
        return this._addToBuffer.apply(this, [false].concat(chunks));
    };


    /**
     * Push a chunk onto the front of the internal buffer.
     * This is useful in certain cases where a stream is being consumed by a
     * parser, which needs to "un-consume" some data that it has optimistically pulled out of the source, so that the stream can be passed on to some other party.
     * @param chunk {...object} Chunk of data to unshift onto the read queue
     * @returns {boolean} Whether or not more pushes should be performed
     */
    Readable.prototype.unshift = function (chunk) {
        var chunks = Array.prototype.slice.call(arguments);
        return this._addToBuffer.apply(this, [true].concat(chunks));
    };


    /**
     * @private
     * Common implementation shared between .push and .unshift
     * Both methods mutate to read buffer
     * @param addToFront {boolean} Whether to add to the front or back of the
     *     buffer
     * @param chunk {...object} Chunk of data to add to the read queue
     * @returns {boolean} Whether this stream should have more data pushed
     *     to it
     */
    Readable.prototype._addToBuffer = function (addToFront, firstChunk) {
        var chunks = Array.prototype.slice.call(arguments, 1),
            state = this._readableState;
        if (firstChunk === null) {
            // End of file.
            state.reading = false;
            // Start wrapping up if we haven't before
            if ( ! state.ended) {
                this._endReadable();
            }
        } else {
            if (state.ended && ! addToFront) {
                this.emit('error', new Error("readable.push() called after EOF"));
            } else if (state.endEmitted && addToFront) {
                this.emit('error', new Error("readable.unshift() called after end event"));
            } else {
                if (addToFront) {
                    state.buffer.unshift.apply(state.buffer, chunks);
                } else {
                    state.reading = false;
                    state.buffer.push.apply(state.buffer, chunks);
                }
                // If we've pushed data to the buffer,
                // let listeners know we're readable
                if (firstChunk && state.needReadable) {
                    this._emitReadable();
                }
                this._maybeReadMore();
            }
        }

        // Return whether
        return ! state.ended &&
               ( state.needReadable ||
                 state.buffer.length < state.highWaterMark ||
                 state.buffer.length === 0);
    };


    /**
     * @private
     * _read() more data from upstream until the buffer length is greater than
     *     the highWaterMark. It triggers this by calling .read(0);
     * This executes on nextTick, not synchronously
     */
    Readable.prototype._maybeReadMore = function () {
        var self = this,
            state = self._readableState;

        if (state.readingMore) {
            return;
        }
        state.readingMore = true;

        util.nextTick(_readMore);

        function _readMore () {
            var len = state.buffer.length;
            while ( ! state.reading && ! state.ended &&
                    state.buffer.length < state.highWaterMark ) {
                // Trigger ._read()
                self.read(0);
                if (len === state.buffer.length) {
                    // self.read(0) didn't add any data
                    break;
                } else {
                    len = state.buffer.length;
                }
            }
            state.readingMore = false;
        }
    };


    /**
     * Resume emitting data events.
     * This method will switch the stream into flowing-mode. If you do not want
     * to consume the data from a stream, but you do want to get to its end
     * event, you can call readable.resume() to open the flow of data.
     */
    Readable.prototype.resume = function () {
        var state = this._readableState;
        if ( ! state.flowing) {
            state.flowing = true;
            // Make sure there's data coming from upstream
            if ( ! state.reading) {
                this.read(0);
            }
            this._scheduleResume();
        }
    };


    /**
     * @private
     * If not already scheduled, schedule _doResume to execute
     * on nextTick
     */
    Readable.prototype._scheduleResume = function () {
        var self = this,
            state = this._readableState;
        if ( ! state.resumeScheduled) {
            state.resumeScheduled = true;
            util.nextTick(function () {
                self._doResume();
            });
        }
    };


    Readable.prototype._doResume = function () {
        var state = this._readableState;
        state.resumeScheduled = false;
        this.emit('resume');
        this._flow();
        // Make sure we're getting data from upstream
        if (state.flowing && ! state.reading) {
            this.read(0);
        }
    };


    /**
     * Stop emitting data events. Any data that becomes available will remain
     * in the internal buffer.
     */
    Readable.prototype.pause = function () {
        if (this._readableState.flowing !== false) {
            this._readableState.flowing = false;
            this.emit('pause');
        }
    };


    /**
     * Bind an event listener to an event on this stream
     * Readable adds some extra functionality so that binding a listener
     *     to 'readable' marks ._readableState.needReadable=true
     * @param eventName {string} The Event name to listen for
     * @param cb {function} Callback function to call when eventName fires
     */
    Readable.prototype.on = function (eventName, cb) {
        var ret = Stream.prototype.on.call(this, eventName, cb),
            state = this._readableState;

        if (eventName === 'data' && (state.flowing !== false)) {
            this.resume();
        }

        if (eventName === 'readable' && this.readable) {
            // Start reading on the first readable listener
            if ( ! state.readableListening) {
                state.readableListening = true;
                state.emittedReadable = false;
                state.needReadable = true;
                if ( ! state.reading) {
                    this.read(0);
                } else if (state.buffer.length) {
                    this._emitReadable();
                }
            }
        }
    };


    /**
     * Read data from the read buffer
     * @param [size] {number} The number of items to read from the buffer.
     *     If not provided, all data will be returned.
     *     If 0, There are some cases where you want to trigger a refresh of the
     *     underlying readable stream mechanisms, without actually consuming any
     *     data. In that case, you can call stream.read(0), which will always
     *     return null.
     *     If the internal read buffer is below the highWaterMark, and the
     *     stream is not currently reading, then calling read(0) will trigger a
     *     low-level _read call.
     *     There is almost never a need to do this externally.
     * @returns {object|null} An object from the read buffer, or null
     */
    Readable.prototype.read = function (size) {
        var state = this._readableState,
            originalSize = size,
            doRead,
            ret;

        state.calledRead = true;

        if (typeof size !== 'number' || size > 0) {
            // User wants data. We'll need to emit readable
            state.emittedReadable = false;
        }

        if (size === 0 && state.needReadable &&
           (state.buffer.length >= state.highWaterMark || state.ended)) {
            if (state.buffer.length === 0 && state.ended) {
                this._endReadable();
            } else {
                this._emitReadable();
            }
            return null;
        }

        size = this._getSizeToRead(size);

        // If called with 0 once end has been emitted, return null
        if (size === 0 && state.ended) {
            if (state.buffer.length === 0) {
                this._endReadable();
            }
            return null;
        }

        // Determine whether ._read needs to be called to fill up the buffer
        doRead = state.needReadable;

        // We need to read if this read will lower the buffer size
        // below the highWaterMark
        if (state.buffer.length === 0 ||
            state.buffer.length - size < state.highWaterMark) {
            doRead = true;
        }

        // Never read if already reading or the stream has ended
        if (state.reading || state.ended) {
            doRead = false;
        }

        if (doRead) {
            state.reading = true;
            state.sync = true;
            if (state.buffer.length === 0) {
                state.needReadable = true;
            }
            // Go get more data!
            this._read(state.highWaterMark);
            state.sync = false;
            // state.reading will be falsy if _read executed synchronously
            // This could change the buffer so we recalc size
            if ( ! state.reading) {
                size = this._getSizeToRead(originalSize);
            }
        }

        if (size > 0) {
            ret = this._readFromBuffer(size);
        } else {
            ret = null;
        }

        if (ret === null) {
            state.needReadable = true;
            size = 0;
        }

        // If we have nothing in the buffer, then we want to know
        // as soon as we *do* get something into the buffer.
        if (state.buffer.length === 0 && !state.ended) {
            state.needReadable = true;
        }

        // If we happened to read() exactly the remaining amount in the
        // buffer, and the EOF has been seen at this point, then make sure
        // that we emit 'end' on the very next tick.
        if (state.ended && !state.endEmitted && state.buffer.length === 0) {
            this._endReadable();
        }

        if (ret !== null) {
            this.emit('data', ret);
        }

        return ret;
    };


    /**
     * @private
     * Fetch data asynchronously from an upstream source.
     * Implement this function, but do NOT call it directly.
     * When data is available, put it into the read queue by calling
     *     readable.push(chunk). If push returns false, then you should stop
     *     pushing. When _read is called again, you should start pushing more.
     */
    Readable.prototype._read = function () {
        this.emit('error', new Error('._read() not implemented'));
    };


    /**
     * @private
     * Get data from the internal read buffer
     * @returns {object|null} An object from the internal read buffer, or null
     *     if there is no more on the buffer
     */
    Readable.prototype._readFromBuffer = function () {
        var state = this._readableState,
            buffer = state.buffer;
        if (buffer.length === 0) {
            return null;
        } else {
            return buffer.shift();
        }
    };


    /**
     * @private
     * Get the appropriate number of objects to read from the buffer.
     * @param sizeAskedFor {number} The Number of items asked for by the user
     * @returns {number} The number of objects that should be returned from
     *     .read()
     */
    Readable.prototype._getSizeToRead = function (sizeAskedFor) {
        var state = this._readableState;
        // Don't read anything if there's nothing to read
        if (state.buffer.length === 0 && state.ended) {
            return 0;
        }
        // Assuming objectMode. Return at most one item
        return sizeAskedFor === 0 ? 0 : 1;
    };


    /**
     * @private
     * Cause the stream to emit 'readable'
     */
    Readable.prototype._emitReadable = function () {
        var self = this,
            state = this._readableState;

        state.needReadable = false;

        if ( ! state.emittedReadable) {
            state.emittedReadable = true;
            if (state.sync) {
                util.nextTick(emitReadable);
            } else if (state.flowing) {
                emitReadable();
            }
        }

        function emitReadable () {
            self.emit('readable');
            self._flow();
        }
    };


    /**
     * @private
     * Mark the stream as closed and that it should not be readable again.
     * Often this happens after this.push(null);
     */
    Readable.prototype._endReadable = function () {
        var state = this._readableState;
        state.ended = true;
        if (state.buffer.length) {
            this._emitReadable();
        } else {
            this._emitEnd();
        }
    };


    /**
     * @private
     * Emit the end event if it hasn't been emitted yet
     */
    Readable.prototype._emitEnd = function () {
        var self = this,
            state = this._readableState;
        if (state.buffer.length > 0) {
            throw new Error("Tried to emit end event on a non-empty Readable");
        }
        if ( ! state.endEmitted && state.calledRead) {
            state.ended = true;
            util.nextTick(function () {
                // Check that we didn't get one last unshift.
                if (!state.endEmitted && state.buffer.length === 0) {
                    state.endEmitted = true;
                    self.readable = false;
                    self.emit('end');
                }
            });
        }
    };


    /**
     * The state objects contain other useful information for debugging the
     * state of streams in your programs. It is safe to look at them, but beyond
     * setting option flags in the constructor, it is not safe to modify them.
     * Copied from http://bit.ly/16eA5K7
     */
    function ReadableState(opts, stream) {
        opts = opts || {};

        // the point at which it stops calling _read() to fill the buffer
        // Note: 0 is a valid value, means "don't call _read preemptively ever"
        var hwm = opts.highWaterMark;
        this.highWaterMark = (hwm || hwm === 0) ? hwm : 0;

        // cast to ints.
        this.highWaterMark = ~~this.highWaterMark;

        this.buffer = [];
        this.pipes = [];
        this.pipesCount = 0;
        this.flowing = null;
        this.ended = false;
        this.endEmitted = false;
        this.reading = false;

        // In streams that never have any data, and do push(null) right away,
        // the consumer can miss the 'end' event if they do some I/O before
        // consuming the stream.  So, we don't emit('end') until some reading
        // happens.
        this.calledRead = false;

        // a flag to be able to tell if the onwrite cb is called immediately,
        // or on a later tick.  We set this to true at first, becuase any
        // actions that shouldn't happen until "later" should generally also
        // not happen before the first write call.
        this.sync = true;

        // whenever we return null, then we set a flag to say
        // that we're awaiting a 'readable' event emission.
        this.needReadable = false;
        this.emittedReadable = false;
        this.readableListening = false;


        // object stream flag. Used to make read(n) ignore n and to
        // make all the buffer merging and length checks go away
        this.objectMode = !!opts.objectMode;

        // Crypto is kind of old and crusty.  Historically, its default string
        // encoding is 'binary' so we have to make this configurable.
        // Everything else in the universe uses 'utf8', though.
        this.defaultEncoding = opts.defaultEncoding || 'utf8';

        // when piping, we only care about 'readable' events that happen
        // after read()ing all the bytes and not getting any pushback.
        this.ranOut = false;

        // the number of writers that are awaiting a drain event in .pipe()s
        this.awaitDrain = 0;

        // if true, a maybeReadMore has been scheduled
        this.readingMore = false;

        this.decoder = null;
        this.encoding = null;
    }

    return Readable;
});
