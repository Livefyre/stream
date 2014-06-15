var stream = require('stream-compat');

console.log(stream);

var myStream = new stream.Readable();

myStream._read = function () {
    setTimeout(push.bind(this), 1000);
    function push() {
        this.push(Math.random());
    }
};

myStream.on('data', console.log);
