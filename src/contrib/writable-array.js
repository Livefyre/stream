define(['stream/writable', 'inherits'], function (Writable, inherits) {
	"use strict";


    /**
     * A Writable that adds any written content to an internal array
     */
    function WritableArray (array) {
        this._array = array || [];
        Writable.call(this);
    }
    inherits(WritableArray, Writable);

    /**
     * @private
     * Called by Writable base when there is written data to do stuff with
     * WritableArray adds the item to its internal array
     * @param chunk {object} Data to do something with
     */
    WritableArray.prototype._write = function (chunk, errback) {
        this._array.push(chunk);
        errback();
    };


    /**
     * Get the internal array, which is all the things that have been written
     */
    WritableArray.prototype.get = function () {
        return this._array;
    };


    return WritableArray;
});