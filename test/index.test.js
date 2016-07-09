/* jshint node: true, mocha: true, expr: true */

var util = require('util');
var stream = require('stream');
var crypto = require('crypto');
var zlib = require('zlib');

var expect = require('chai').expect;
var through = require('through2');

var isGzippedStream = require('../index');

function getReadable(options, dataStr, size) {
    var idx = 0;
    size = size || 5;
    
    dataStr = dataStr !== undefined ?
        dataStr :
        crypto.randomBytes(size * 10).toString('hex').slice(0, size * 10);
    
    function Stream(opts) {
        stream.Readable.call(this, opts);
    }
    
    util.inherits(Stream, stream.Readable);
    
    Stream.prototype._read = function(n) {
        
        if (idx > dataStr.length) {
            this.push(null);
            return;
        }
        
        var data = dataStr.slice(idx, size);
        idx += size;
        
        this.push(data);
    };
    
    return new Stream(options);
}

describe('[positive]', function() {
    it('takes a readable stream', function(done) {
        var input = getReadable();
        
        isGzippedStream(input, function(err, isGzipped) {
            expect(err).to.not.be.ok;
            
            expect(isGzipped).to.equal(false);
            done();
        });
    });
    it('returns a readable stream', function(done) {
        var input = getReadable();
        
        var out = isGzippedStream(input, function(err, isGzipped, outInCallback) {
            expect(err).to.not.be.ok;
            expect(isGzipped).to.be.a('boolean');
            expect(out).to.equal(outInCallback);
            
            [
                'on', 'once', 'pipe', 'read'
            ].forEach(function(prop) {
                expect(out).to.have.property(prop).and.to.be.a('function');
            });
            
            done();
        });
    });
    it('takes a through stream', function(done) {
        var input = through();
        
        isGzippedStream(input, function(err, isGzipped) {
            expect(err).to.not.be.ok;
            
            expect(isGzipped).to.equal(false);
            done();
        });
        
        input.write('asdgasdfsad');
        input.end();
    });
    
    it('detects gzipped data as true', function(done) {
        var data = 'pineapple';
        
        zlib.gzip(new Buffer(data), function(err, zipped) {
            
            var input = through();
            
            isGzippedStream(input, function(err, isGzipped) {
                expect(err).to.not.be.ok;
                expect(isGzipped).to.equal(true);
                
                done();
            });
            
            input.write(zipped);
            input.end();
        });
    });
    it('detects non-gzipped data as false', function(done) {
        var data = 'pineapple';
        var input = through();

        isGzippedStream(input, function(err, isGzipped) {
            expect(err).to.not.be.ok;
            expect(isGzipped).to.equal(false);

            done();
        });

        input.write(data);
        input.end();
    });
    
    it('passes through all data', function(done) {
        var data = 'pineapple';
        var input = through();

        var out = isGzippedStream(input, function(err, isGzipped) {
            expect(err).to.not.be.ok;
            expect(isGzipped).to.equal(false);
        });

        var outData = [];
        out.on('data', outData.push.bind(outData));
        
        out.on('end', function() {
            var outStr = Buffer.concat(outData).toString();
            
            expect(outStr).to.equal(data);
            done();
        });
        
        input.write(data);
        input.end();
    });
    
    it('will read more than once if it has to', function(done) {
        var input = through();
        
        isGzippedStream(input, function(err, bool) {
            expect(err).to.not.be.ok;
            expect(bool).to.be.a('boolean');
            
            done();
        });
        
        input.write('1');
        input.write('2');
        
        // just because I can
        setTimeout(function() {
            input.write('3');
            input.end();    
        }, 0);
    });
    
    it('detects false for streams that are not long enough', function(done) {
        var input = through();
        
        isGzippedStream(input, function(err, bool) {
            expect(err).to.not.be.ok;
            expect(bool).to.equal(false);
            
            done();
        });
        
        input.write('1');
        input.write('2');
        
        input.end();
    });
    
    it('errors on the input stream will be caught and triggered on the output stream', function(done) {
        var ERR = new Error('input error');
        var input = through();
        
        var output = isGzippedStream(input, function() {});
        
        output.on('error', function(err) {
            expect(err).to.equal(ERR);
            done();
        });
        
        input.write('asdgsd');
        input.emit('error', ERR);
    });
});

describe('[negative]', function() {
    [
        1, 3.14, null, 'eagle', {}, []
    ].forEach(function(val) {
        it('errors for invalid input value: ' + JSON.stringify(val), function(done) {
            var out = isGzippedStream(val, function(err, isGzipped) {
                expect(err).to.be.instanceof(TypeError)
                    .and.to.match(/input is not a readable stream/);
                
                done();
            });
        });
    });
});
