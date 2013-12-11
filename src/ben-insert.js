define(['stream/passthrough', 'stream/transform', 'stream/readable', 'stream/writable', 'stream/util', 'inherits'],
function (PassThrough, Transform, Readable, Writable, util, inherits) {

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
        Transform.call(this, opts);
        
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
    inherits(Inserter, Transform);
    
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

        this._source = stream;
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

    Inserter.prototype._transform = function (chunk, done) {
        var self = this;
        var source = this.getSource();
        var toInsert;

        // Push from what's being piped in
        this.push(chunk);
        this._counter++;

        // Now decide if its time to insert something from ._source
        if (this._counter % this._interval === 0) {
            toInsert = source.read();
            console.log('_transform should insert somethin', toInsert)
            if (toInsert) {
                pushAndContinue(toInsert);
            } else {
                // Source doesn't have anything for us!
                // Wait for it.
                source.once('readable', function () {
                    var toInsert = source.read();
                    if ( ! toInsert) {
                        // TODO: Remove
                        throw "Source was readable, but I didn't read anything"
                    }
                    pushAndContinue(toInsert);
                });
            }
        } else {
            // No need to insert, we done
            done();
        }

        function pushAndContinue (chunk) {
            self.push(chunk);
            done();
        }
    }

    return Insert;
});