define(['stream/readable', 'inherits'], function (Readable, inherits) {
    "use strict";

    /**
     * A Readable that emits the items of an array
     */
    function ReadableArray (array) {
        this._array = array || [];
        Readable.call(this);
    }

    inherits(ReadableArray, Readable);


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