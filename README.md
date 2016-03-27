# is-gzip-stream

[![Build][1]][2] [![Test Coverage][3]][4] [![Code Climate][5]][6] [![Downloads][7]][8] [![Version][9]][8] [![ISC License][10]][11] 

[1]: https://travis-ci.org/catdad/is-gzip-stream.svg?branch=master
[2]: https://travis-ci.org/catdad/is-gzip-stream

[3]: https://codeclimate.com/github/catdad/is-gzip-stream/badges/coverage.svg
[4]: https://codeclimate.com/github/catdad/is-gzip-stream/coverage

[5]: https://codeclimate.com/github/catdad/is-gzip-stream/badges/gpa.svg
[6]: https://codeclimate.com/github/catdad/is-gzip-stream

[7]: https://img.shields.io/npm/dm/is-gzip-stream.svg
[8]: https://www.npmjs.com/package/is-gzip-stream

[9]: https://img.shields.io/npm/v/is-gzip-stream.svg

[10]: https://img.shields.io/npm/l/is-gzip-stream.svg
[11]: http://opensource.org/licenses/ISC

## Install

    npm install --save is-gzip-stream
    
## Usage

You can pass any readable stream into the module to determine if the stream contains gzipped content.

**The module has to read some of the stream, meaning that you will not be able to use the entire stream if you wait to determine if the content is gzipped or not. To read the stream, you will need to use the stream provided by the lib. It is available both as a return value and in the callback, just in case.**

```javascript
var fs = require('fs');
var isGzipStream = require('is-gzip-stream');

var stream = fs.createReadStream('somefile');

stream = isGzipStream(stream, function(err, isGzipped) {
    // if there is no error, isGzipped will be a boolean
    
    // stream can provide the entire content of the original file
    // you can read the data as normal
});
```

```javascript
var fs = require('fs');
var isGzipStream = require('is-gzip-stream');

var unknownStream = fs.createReadStream('somefile');

isGzipStream(unknownStream, function(err, isGzipped, knownStream) {
    // if there is no error, isGzipped will be a boolean
    
    // knownStream can provide the entire content of the original file,
    // and you can read it like normal
    
    // the original `stream` variable is still the same, though some data
    // has been read already, and you will not get the entire file if you
    // begin reading now
});
```
