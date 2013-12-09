define(['stream/passthrough', 'stream/readable', 'stream/writable', 'stream/util', 'inherits'],
function (PassThrough, Readable, Writable, util, inherits) {

    /**
     * Factory for creating Inserter objects.
     * 
     * @param stream {Readable} Source for inserted content.
     * @param [opts] {Object}
     * @param [opts.enabled] {number} Set false to disable upon initialization.
     * @param [opts.interval] {number} Sets the interval upon initialization.
     * @exports stream/insert
     */
    function Insert (stream, opts) {
        var inserter = new Inserter(stream, opts);
        return inserter || null;
    }
    Insert.CONSTRUCTOR = Inserter;
    
    /**
     * Extends PassThrough. Constructed with a reference to a "source" stream.
     * Writes a single piece of content from the source stream after allowing
     * a determined number of items to passthrough.
     * 
     * @param stream {Readable} Source for inserted content.
     * @param [opts] {Object}
     * @param [opts.enabled] {number} Set false to disable upon initialization.
     * @param [opts.interval] {number} Sets the interval upon initialization.
     * @constructor
     */
    function Inserter (stream, opts) {
        PassThrough.call(this, opts);
        
        this._setStream(stream);//Will throw if source isn't Readable stream
        
        //Defaults
        this._counter = 0;
        this._interval = 1;
        this._freeFlow = false;
        this._enabled = true;
        this._timestamp = 0;
        
        //If opts, set them
        if (opts) {
            this._setInterval(opts.interval);
            if (opts.enabled === false) {
                this._enabled = false;
            }
        }
    }
    inherits(Inserter, PassThrough);
    
    /**
     * Sets the source stream internally
     * 
     * @private
     */
    Inserter.prototype._setStream = function (stream) {
        if (! stream instanceof Readable) {
            throw 'Inserter requires a Readable stream as its source.';
        }
        
        if (this._source) {
            //TODO (joao) Remove listeners from old stream.
        }
//        debugger
        this._source = stream;
        //TODO (joao) Attach listeners.
        this._buffer = [this._source.read(1)];//Initialize.
    };
    
    /**
     * Sets the interval internally
     * 
     * @private
     */
    Inserter.prototype._setInterval = function (n) {
        if (typeof(n) !== 'number' || n < 0 || Number.isNaN(n)) {
            return;
        }
        
        if (n <= this._counter) {
            this._insert();
        }
        
        this._interval = n;
        this._freeFlow = n === 0;
    };
    
    /**
     * Returns a reference to the source stream.
     * 
     * @return {Readable} Source stream
     */
    Inserter.prototype.getSource = function () {
        return this._source;
    };
    
    /**
     * Sets the interval for inserting source content.
     * 
     * @param n {!number} Number of passthrough items to allow before inserting.
     * @return {!Inserter} this
     */
    Inserter.prototype.every = function (n) {
        this._setInterval(n);
        return this;
    };
    
    /**
     * Enables the insertion functionality.
     * 
     * @return {!Inserter} this
     */
    Inserter.prototype.enable = function () {
        this._enabled = true;
        return this;
    };
    
    /**
     * Disables the insertion functionality. Inserter acts as a PassThrough when
     * disabled.
     * 
     * @return {!Inserter} this
     */
    Inserter.prototype.disable = function () {
        this._enabled = false;
        return this;
    };
    
    /**
     * Returns the enabled state.
     * 
     * @return {!boolean}
     */
    Inserter.prototype.isEnabled = function () {
        return this._enabled;
    };
    
    /**
     * Resets the internal passthrough counter to 0 without inserting source
     * items.
     * 
     * @return {!Inserter} this
     */
    Inserter.prototype.reset = function () {
        this._counter = 0;
        return this;
    };
    
    /**
     * Writes a source item and resets the passthrough counter.
     * 
     * @return {!Inserter} this
     */
    Inserter.prototype.now = function () {
        console.log('now()');
        this._insert();//Will reset the counter.
        return this;
    };
    
    /**
     * Writes a piece of content from the source stream and resets the
     * passthrough counter.
     * 
     * @protected
     */
    Inserter.prototype._insert = function () {
        this._counter = -1;
        console.log('_insert()');
        var chunk = this._source.read(1);
        if (chunk) {
            chunk.createdAt = new Date(this._timestamp + 1);
            chunk.body = 'source';
//            debugger
            this._doWrite(chunk, function () {
//            this._write(chunk, function () {
                console.log('inserted');
            });
        }
    };
    
//    Inserter.prototype._read = function () {
//        //TODO (joao) Monitor the reads and increment this._counter
//        
//        //TODO (joao) If this._counter === this._increment, then this._insert()
//    };
    
    Inserter.prototype._doWrite = function (chunk, errback) {
        PassThrough.prototype._doWrite.call(this, chunk, errback);
//        if (!this._freeFlow) {
//            this._counter++;
//            if (this._counter === this._interval) {
//                this._insert();//Will reset the counter.
//            }
//        }
    };
    
    Inserter.prototype._write = function (chunk, errback) {
        PassThrough.prototype._write.call(this, chunk, errback);
        this._timestamp = chunk.createdAt.getTime();
//        chunk.body = 'written';
        if (!this._freeFlow) {
            this._counter++;
            if (this._counter === this._interval) {
                this._insert();//Will reset the counter.
            }
        }
    };
    
//    Inserter.prototype._afterWrite = function (finished, errback) {
//        console.log('_afterWrite()');
////        if (!this._freeFlow) {
////            this._counter++;
////            if (this._counter === this._interval) {
////                this._insert();//Will reset the counter.
////            }
////        }
////        debugger
//        Writable.prototype._afterWrite.call(this, finished, errback);
//    };


    return Insert;
});