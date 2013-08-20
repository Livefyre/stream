define(function () {
    "use strict";

    var exports = {};

    exports.nextTick = (function () {
        if (typeof setImmediate == 'function') {
            return function(f){ setImmediate(f); };
        }
        // fallback for other environments / postMessage behaves badly on IE8
        else if (typeof window == 'undefined' || window.ActiveXObject || !window.postMessage) {
            return function(f){ setTimeout(f); };
        } else {
            var q = [];

            window.addEventListener('message', function(){
                var i = 0;
                while (i < q.length) {
                    try { q[i++](); }
                    catch (e) {
                        q = q.slice(i);
                        window.postMessage('tic!', '*');
                        throw e;
                    }
                }
                q.length = 0;
            }, true);

            return function(fn){
                if (!q.length) window.postMessage('tic!', '*');
                q.push(fn);
            };
        }
    }());

    return exports;
});