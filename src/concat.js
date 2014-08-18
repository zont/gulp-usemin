'use strict';

var path = require('path');
var through = require('through2');
var EOL = require('os').EOL;

module.exports = function concatTransform(name) {

  var concat, firstFile, fileName;

  return through.obj(function transform(file, encoding, next) {

    if (!firstFile) {
      firstFile = file;
      // Default path to first file basename
      fileName = name || path.basename(file.path);
      // Initialize concat
      concat = [];
    }

    concat.push(file.contents);
    next();

  }, function flush(next) {

    if (firstFile) {
      var joinedFile = firstFile.clone();
      joinedFile.path = path.join(firstFile.base, fileName);

      for(var i = 0, l = concat.length; i < l - 1; i++) {
        concat.splice(i + 1, 0, new Buffer(EOL));
      }
      joinedFile.contents = Buffer.concat(concat);

      /* jshint validthis:true */
      this.push(joinedFile);
    }

    next();

  });

};
