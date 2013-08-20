define(['stream/duplex', 'inherits'],
function (Duplex, inherits) {

    function Transform (opts) {
        var stream = this,
            ts;
        Duplex.call(this, opts);
        ts = this._transformState = new TransformState(opts, this);

        // start out asking for a readable event once data is transformed.
        this._readableState.needReadable = true;
        // we have implemented the _read method, and done the other things
        // that Readable wants before the first _read call, so unset the
        // sync guard flag.
        this._readableState.sync = false;

        this.once('finish', function () {
            if (typeof stream._flush === 'function') {
                stream._flush(function (errback) {
                    stream._doneTransforming(err);
                });
            } else {
                stream._doneTransforming();
            }
        });
    }

    inherits(Transform, Duplex);


    /**
     * Transform subclasses should implement this
     * Call `.push(data)` to pass data to the Readable side.
     * Call `errback(err)` when you are done with this chunk. If you pass an
     *     err, then it will be emitted. If you never call `errback`, then
     *     you'll never get another chunk.
     */
    Transform.prototype._transform = function (chunk, errback) {
        this.emit('error', new Error('_transform not implemented!'));
    };


    Transform.prototype.push = function (chunk) {
        this._transformState.needTransform = false;
        return Duplex.prototype.push.call(this, chunk);
    };


    /**
     * Must be implemented here because Transform is a Readable
     */
    Transform.prototype._read = function () {
        var ts = this._transformState;

        if (ts.writechunk && ts.writecb && ! ts.transforming) {
            ts.transforming = true;
            this._transform(ts.writechunk, ts.afterTransform);
        } else {
            // mark that we need a transform, so that any data that comes in
            // will get processed, now that it's been asked for
            ts.needTransform = true;
        }
    };


    /**
     * Must be implemented here because Transform is Writable
     */
    Transform.prototype._write = function (chunk, errback) {
        var ts = this._transformState,
            rs = this._readableState;
        ts.writecb = errback;
        ts.writechunk = chunk;
        if ( ! ts.transforming ) {
            if (ts.needTransform ||
                rs.needReadable ||
                rs.buffer.length < rs.highWaterMark) {
                this._read(rs.highWaterMark);
            }
        }
    };


    Transform.prototype._afterTransform = function (err, data) {
        var ts = this._transformState,
            rs = this._readableState,
            errback = ts.writecb;

        ts.transforming = false;

        if ( ! errback) {
            return this.emit('error', new Error('no writecb in Transform class'));
        }

        ts.writechunk = null;
        ts.writecb = null;

        if (data !== null && data !== undefined) {
            this.push(data);
        }

        if (errback) {
            errback(err);
        }

        rs.reading = false;

        if (rs.needReadable || rs.buffer.length < rs.highWaterMark) {
            this._read(rs.highWaterMark);
        }
    };


    Transform.prototype._doneTransforming = function (err) {
        if (err) {
            this.emit('error', err);
        }

        // if there's nothing in the write buffer, then that means
        // that nothing more will ever be provided
        var ws = this._writableState,
            ts = this._transformState;

        if (ws.buffer.length) {
            throw new Error('Calling Transform#_doneTransforming when writable buffer not empty');
        }

        if (ts.transforming) {
            throw new Error('Calling Transform#_doneTransforming when still transforming');
        }

        return this.push(null);
    };


    function TransformState (opts, stream) {
        this.afterTransform = function (err, data) {
            return stream._afterTransform(err, data);
        };

        this.needTransform = false;
        this.transforming = false;
        this.writecb = null;
        this.writechunk = null;
    }


    return Transform;
});