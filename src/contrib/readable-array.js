define(['stream/readable', 'stream/util'], function (Readable, util) {
    "use strict";

    /**
     * A Readable that emits the items of an array
     */
    function ReadableArray (array) {
        this._array = array || [];
        Readable.call(this);
    }

    util.inherits(ReadableArray, Readable);


    /**
     * @private
     * Called by Readable base when you should go get more data,
     * then pass it to this.push()
     */
    ReadableArray.prototype._read = function () {
        this.push(this._array.shift());
    };


    return ReadableArray;
 });