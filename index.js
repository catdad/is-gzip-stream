/* jshint node: true */

var isGzip = require('is-gzip');
var through = require('through2');

function asyncCall() {
    var args = [].slice.call(arguments);
    var func = args.shift();
    
    process.nextTick(function() {
        func.apply(undefined, args);
    });
}

function is(obj, target) {
    return obj instanceof target;
}

module.exports = function isGzippedStream(fromStream, callback) {

    var isStream = !!fromStream &&  
        // duck type the thing, to support stream-like objects
        // like through streams
        is(fromStream.on, Function) &&
        is(fromStream.once, Function) &&
        is(fromStream.pipe, Function) &&
        fromStream.readable === true;
    
    if (!isStream) {
        asyncCall(callback, new TypeError('input is not a readable stream'));
        return fromStream;
    }
    
    var toStream = through();
    var dataBuffer = [];
    
    function onData(chunk) {
        dataBuffer.push(chunk);
        
        var allData = Buffer.concat(dataBuffer);
        
        if (allData.length >= 3) {
            // we have enough data, so return a response
            onEnoughData(allData);
        } else {
            // we need more data
            listenForData();
        }
    }
    
    function listenForData() {
        fromStream.once('data', onData);
    }
    
    function onEnoughData(data) {
        var isGzippedStream = isGzip(data);
        
        callback(undefined, isGzippedStream, toStream);
    }
    
    // re-emit errors from the input stream to the output stream
    fromStream.on('error', function(err) {
        var args = [].slice.call(arguments);
        toStream.emit.apply(toStream, ['error'].concat(args));
    });
    
    fromStream.on('end', function() {
        if (Buffer.concat(dataBuffer).length < 3) {
            // the stream ended and never got enough data,
            // so it's clearly not gzipped
            asyncCall(callback, undefined, false, toStream);
        }
    });
    
    // begin listening for data
    listenForData();
    
    fromStream.pipe(toStream);
    return toStream;
};
