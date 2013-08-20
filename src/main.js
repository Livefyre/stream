define([
    'inherits',
    'event-emitter'],
function (inherits, EventEmitter) {
    "use strict";

    /**
     * Base class for all Streams
     */
    function Stream (opts) {
        EventEmitter.call(this);
    }
    inherits(Stream, EventEmitter);

    return Stream;
});