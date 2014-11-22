var path = require('path');
var fs = require('fs');
var EOL = require('os').EOL;

var through = require('through2');
var gutil = require('gulp-util');
var glob = require('glob');
var minimatch = require('minimatch');
var when = require('when');
var es = require('event-stream');
var Readable = require('stream').Readable;

module.exports = function (options) {
  options = options || {};
  var startReg = /<!--\s*build:(\w+)(?:\(([^\)]+?)\))?\s+(\/?([^\s]+?))?\s*-->/gim;
  var endReg = /<!--\s*endbuild\s*-->/gim;
  var jsReg = /<\s*script\s+.*?src\s*=\s*("|')([^"']+?)\1.*?><\s*\/\s*script\s*>/gi;
  var cssReg = /<\s*link\s+.*?href\s*=\s*("|')([^"']+)\1.*?>/gi;
  var startCondReg = /<!--\[[^\]]+\]>/gim;
  var endCondReg = /<!\[endif\]-->/gim;
  var basePath, mainPath, mainName, alternatePath;


  function getPath(name) {
    var filePath = path.join(path.relative(basePath, mainPath), name);
    var isStatic = name.split('.').pop() === 'js' || name.split('.').pop() === 'css';

    if (options.outputRelativePath && isStatic)
      filePath = options.outputRelativePath + name;
    return filePath;
  }

  function createFile(name, content) {
    return new gutil.File({
      path: getPath(name),
      contents: new Buffer(content)
    })
  }

  function getBlockType(content) {
    return !cssReg.test(content) ? 'js' : 'css';
  }

  function readStream(stream, callback) {
    var files = [];
    var deferred = when.defer();

    stream.on('data', function (file) {
      if (file.isStream()) {
        this.emit('error', gutil.PluginError('gulp-usemin', 'Streams in assets are not supported!'));
      }

      if (file.isBuffer()) {
        file.base = path.resolve(file.base);
        file.path = path.resolve(file.path);
        files.push(file);
      }
    });

    stream.on('end', function () {
      if (options.debugStreamFiles) {
        console.log('asssets:\n', files.map(function (f) {
          return f.base + ' :: ' + f.path;
        }).join('\n '));
      }
      deferred.resolve(files);
    });

    return deferred.promise;
  }

  function produceMatcher(fileArray) {
    var allFiles = fileArray.map(function (file) {
      return file.path;
    });

    var filesByPath = fileArray.reduce(function (obj, file) {
      obj[file.path] = file;
      return obj;
    }, {});

    var notMatched = allFiles.slice(); // clone

    return {
      matching: function (pattern) {
        var matched = minimatch.match(allFiles, pattern);

        // filter array
        notMatched = notMatched.filter(function (i) {
          return matched.indexOf(i) < 0;
        });

        return matched.map(function (path) {
          return filesByPath[path];
        });
      },

      notMatched: function () {
        return notMatched.map(function (path) {
          return filesByPath[path];
        });
      }
    }
  }

  function getFiles(content, reg, alternatePath, matcherPromise) {
    var paths = [];
    var promises = [];
    var files = [];
    var i, l;

    content
      .replace(startCondReg, '')
      .replace(endCondReg, '')
      .replace(/<!--(?:(?:.|\r|\n)*?)-->/gim, function (a, quote, b) {
        return options.enableHtmlComment ? a : '';
      })
      .replace(reg, function (a, quote, b) {
        var filePath = path.resolve(path.join(alternatePath || options.path || mainPath, b));

        if (options.assetsDir)
          filePath = path.resolve(path.join(options.assetsDir, path.relative(basePath, filePath)));

        paths.push(filePath);
      });

    if (!matcherPromise) {
      // read files from filesystem
      for (i = 0, l = paths.length; i < l; ++i) {
        var filepaths = glob.sync(paths[i]);
        if (filepaths[0] === undefined) {
          throw new gutil.PluginError('gulp-usemin', 'Path ' + paths[i] + ' not found!');
        }
        promises.push.apply(promises, filepaths.map(function (filepath) {
          var fileDeferred = when.defer();
          fs.readFile(filepath, function (err, data) {
            if (err) {
              throw err;
            }
            fileDeferred.resolve(new gutil.File({
              path: filepath,
              contents: data
            }));
          });
          return fileDeferred.promise;
        }));
      }
      return when.all(promises);
    }
    else {
      // read files from stream
      for (i = 0, l = paths.length; i < l; ++i) {
        var matching = matcherPromise.matching(paths[i]);
        if (matching[0] === undefined) {
          throw new gutil.PluginError('gulp-usemin', 'File ' + paths[i] + ' not in stream!');
        }
        files.push.apply(files, matching);
      }
      return when.resolve(files);
    }
  }

  function concat(files, name) {
    var buffer = [];

    files.forEach(function (file) {
      buffer.push(String(file.contents));
    });

    return createFile(name, buffer.join(EOL));
  }

  function concatThrough(name) {
    var throughFiles = [];
    return through.obj(function (file, enc, done) {
      throughFiles.push(file);
      done();
    }, function (done) {
      this.push(concat(throughFiles, name));
      done();
    });
  }

  function processTask(pipeline, name, files) {
    var newFiles = [];

    var tip = new Readable({objectMode: true});

    tip._read = function () {
      if (files.length > 0) {
        var file = files.shift();
        this.push(file);
      }
      else {
        this.push(null);
      }
    };

    if(typeof pipeline === 'function') {
        return pipeline(tip, concatThrough(name));
    }
    else {
        return tip.pipe(concatThrough(name));
    }
  }

  function process(name, files, pipelineId) {
    var pipeline = options[pipelineId] || [];
    return processTask(pipeline, name, files);
  }

  function processHtml(content, matcherProducer) {
    var html = [];
    var sections = content.split(endReg);
    var promise = when.resolve();

    var streams = [];
    for (var i = 0, l = sections.length; i < l; ++i) {
      if (sections[i].match(startReg)) {
        var section = sections[i].split(startReg);
        alternatePath = section[2];

        (function (section) {
          promise = promise
            .then(function () {
              html.push(section[0]);
            });
        }(section));

        var startCondLine = section[5].match(startCondReg);
        var endCondLine = section[5].match(endCondReg);
        if (startCondLine && endCondLine) {
          (function (startCondLine) {
            promise = promise.then(function () {
              html.push(startCondLine[0]);
            });
          }(startCondLine))
        }

        if (section[1] !== 'remove') {
          if (getBlockType(section[5]) == 'js') {
            (function (section, alternatePath) {
              promise = promise
                .then(matcherProducer)
                .then(function (matcher) {
                  return getFiles(section[5], jsReg, alternatePath, matcher)
                })
                .then(function (files) {
                  var name = section[4];
                  streams.push(process(name, files, section[1]));
                  var filePath = getPath(name);
                  if (path.extname(filePath) == '.js') {
                    html.push('<script src="' + section[3].replace(path.basename(name), path.basename(filePath)) + '"></script>');
                  }
                });
            }(section, alternatePath))
          } else {
            (function (section, alternatePath) {
              promise = promise
                .then(matcherProducer)
                .then(function (matcher) {
                  return getFiles(section[5], cssReg, alternatePath, matcher)
                })
                .then(function (files) {
                  var name = section[4];
                  streams.push(process(name, files, section[1]));
                  var filePath = getPath(name);
                  html.push('<link rel="stylesheet" href="' + section[3].replace(path.basename(name), path.basename(filePath)) + '"/>');
                });
            }(section, alternatePath));
          }
        }

        if (startCondLine && endCondLine) {
          (function (endCondLine) {
            promise = promise.then(function () {
              html.push(endCondLine[0]);
            });
          }(endCondLine));
        }
      }
      else {
        (function (section) {
          promise = promise.then(function () {
            html.push(section);
          });
        }(sections[i]))
      }
    }

    return promise.then(function () {
      streams.push(process(mainName, [createFile(mainName, html.join(''))], 'html'));
      return es.merge.apply(es, streams);
    });
  }

  var matcherPromise, matcherProducer;

  if (options.assetsStream) {
    matcherPromise = readStream(options.assetsStream())
      .then(function (filesList) {
        return produceMatcher(filesList);
      });
    matcherProducer = function () {
      return matcherPromise;
    }
  }

  return through.obj(function (file, enc, callback) {
    if (file.isNull()) {
      this.push(file); // Do nothing if no contents
      callback();
    }
    else if (file.isStream()) {
      this.emit('error', new gutil.PluginError('gulp-usemin', 'Streams are not supported!'));
      callback();
    }
    else {
      basePath = file.base;
      mainPath = path.dirname(file.path);
      mainName = path.basename(file.path);

      var push = this.push.bind(this);

      processHtml(String(file.contents), matcherProducer)
        .then(function (stream) {
          stream.on('data', function (file) {
            push(file);
          });

          stream.on('end', function () {
            callback();
          })
        });
    }
  }, function (callback) {
    // push not processed files down the stream
    if (options.other && matcherPromise) {
      var push = this.push.bind(this);
      matcherPromise.then(function (filesMatcher) {
        var rest = filesMatcher.notMatched();
        var stream = processTask(options.other, options.othersName, rest)

        stream.on('data', function (file) {
          push(file);
        });

        stream.on('end', function () {
          callback();
        })
      });
    }
    else {
        callback();
    }
  });
};
