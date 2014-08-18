'use strict';

var path = require('path');
var fs = require('fs');
var through = require('through2');
var gulp = require('gulp');
var gutil = require('gulp-util');
var glob = require('glob');
var multipipe = require('multipipe');
var merge = require('merge-stream');
var Readable = require('stream').Readable;

var concat = require('./src/concat');

module.exports = function(options) {
	options = options || {};

	var startReg = /<!--\s*build:(\w+)(?:\(([^\)]+?)\))?\s+(\/?([^\s]+?))\s*-->/gim;
	var endReg = /<!--\s*endbuild\s*-->/gim;
	var jsReg = /<\s*script\s+.*?src\s*=\s*"([^"]+?)".*?><\s*\/\s*script\s*>/gi;
	var cssReg = /<\s*link\s+.*?href\s*=\s*"([^"]+)".*?>/gi;
	var startCondReg = /<!--\[[^\]]+\]>/gim;
	var endCondReg = /<!\[endif\]-->/gim;

	function createReadableStreamFromArray(array) {
		var rs = new Readable({objectMode: true});
		rs._read = function(size) {
			array.forEach(function(item) {
	      rs.push(item);
	    });
			rs.push(null);
		};
		return rs;
	}

	function getFiles(content, alternatePath, rootPath, basePath) {

		var paths = [];
		var files = [];

		content
			.replace(startCondReg, '')
			.replace(endCondReg, '')
			.replace(/<!--(?:(?:.|\r|\n)*?)-->/gim, '')
			.replace(jsReg.test(content) ? jsReg : cssReg, function (a, b) {
				var filePath = path.resolve(path.join(alternatePath || rootPath, b));

				if (options.assetsDir) {
					filePath = path.resolve(path.join(options.assetsDir, path.relative(basePath, filePath)));
				}

				paths.push(filePath);
			});

		/* jshint loopfunc:true */
		for (var i = 0, l = paths.length; i < l; ++i) {
			var filepaths = glob.sync(paths[i]);
			if(filepaths[0] === undefined) {
				throw new gutil.PluginError('gulp-usemin', 'Path ' + paths[i] + ' not found!');
			}
			filepaths.forEach(function (filepath) {
				files.push(new gutil.File({
					path: filepath,
					contents: fs.readFileSync(filepath)
				}));
			});
		}

		return createReadableStreamFromArray(files);

	}


	function process(files, pipelineId, index) {

		var tasks = options[pipelineId] || [];
		if(tasks.indexOf('concat') !== -1) {
			tasks[tasks.indexOf('concat')] = concat();
		} else if(!tasks.length || !options.skipConcat) {
			tasks.unshift(concat());
		}

		return files
			.pipe(multipipe.apply(multipipe, tasks))
			.pipe(through.obj(function(file, encoding, next) {
				file.$index = index;
				next(null, file);
			}));
	}

	function processHtml(htmlFile, push, next) {

		var rootPath = path.dirname(htmlFile.path);
		var sections = String(htmlFile.contents).split(endReg);

		var splits = [];
		var streams = [];

		for (var i = 0, l = sections.length; i < l; ++i) {

			if (sections[i].match(startReg)) {

				var split = splits[i] = sections[i].split(startReg);
				// Reset section with outer prepended content
				sections[i] = split[0];
				var pipelineId = split[1];
				var alternatePath = split[2];
				var innerContent = split[5];

				/* jshint loopfunc:true */
				var stream = process(getFiles(innerContent, alternatePath, rootPath, htmlFile.base), pipelineId, i)
					.pipe(gutil.buffer(function(err, files) {

						if(!files.length) return;
						var index = files[0].$index;
						// Start with reset content
						var html = [sections[index]];
						// html.push('<!-- built -->\n');

						// Support [if] blocks
						var startCondLine = splits[index][5].match(startCondReg);
						var endCondLine = splits[index][5].match(endCondReg);
						if (startCondLine && endCondLine) {
							html.push(startCondLine[0]);
						}

						files.forEach(function(file) {
							var extName = path.extname(file.path);
							var filePath = splits[index][3] || path.basename(file.path);
							file.path = path.relative(rootPath, path.join(rootPath, filePath));
							if (extName === '.js') {
								html.push('<script src="' + filePath + '"></script>'); // \n
							} else if (extName === '.css') {
								html.push('<link rel="stylesheet" href="' + filePath + '"/>'); // \n
							}
							push(file);
						});


						if (startCondLine && endCondLine) {
							html.push(endCondLine[0]);
						}

						// Merge back compiled section
						// html.push('<!-- endbuilt -->\n');
						sections[index] = html.join('');

					}));

				streams.push(stream);

			}

		}

		// Pass along
		if(!streams.length) return next(null, htmlFile);

		return merge(streams)
			.pipe(gutil.buffer(function(err, files) {
				htmlFile.contents = new Buffer(sections.join(''));
				// Also process src html file
				process(createReadableStreamFromArray([htmlFile]), 'html').pipe(gutil.buffer(function(err, files) {
					next(null, files[0]);
				}));
   		}));

	}

	return through.obj(function(file, encoding, next) {

    if (file.isNull()) {
      return next(null, file);
    } else if (file.isStream()) {
			this.emit('error', new gutil.PluginError('gulp-usemin', 'Streams are not supported!'));
			return next();
    }

		processHtml(file, this.push.bind(this), next);

	});

};
