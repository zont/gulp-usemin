var path = require('path');
var fs = require('fs');
var EOL = require('os').EOL;

var CleanCSS = require('clean-css');
var uglify = require('uglify-js');
var htmlmin = require('minimize');
var through = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;

module.exports = function (options) {
	options = options || {};
	options.jsmin = options.jsmin !== false;
	options.cssmin = options.cssmin !== false;
	options.htmlmin = options.htmlmin !== false;

	var startReg = /<!--\s*build:(css|js)\s+([^\s]+)\s*-->/gim;
	var endReg = /<!--\s*endbuild\s*-->/gim;
	var jsReg = /<\s*script\s+.*src\s*=\s*"([^"]+)".*><\s*\/\s*script\s*>/gi;
	var cssReg = /<\s*link\s+.*href\s*=\s*"([^"]+)".*>/gi;
	var mainPath, mainName;

	function concat(content, reg, delimiter) {
		var paths = [];
		var buffer = [];

		content
			.replace(/<!--(?:.|\r|\n)*-->/gim, '')
			.replace(reg, function (a, b) {
				paths.push(path.join(mainPath, b));
			});

		for (var i = 0, l = paths.length; i < l; ++i)
			buffer.push(fs.readFileSync(paths[i]));

		return buffer.join(delimiter);
	}

	function processJs(content, name) {
		var str = concat(content, jsReg, ';' + EOL + EOL);

		if (options.jsmin)
			str = uglify.minify(str, {fromString: true}).code;

		return new gutil.File({
			path: name,
			contents: new Buffer(str)
		});
	}

	function processCss(content, name) {
		var str = concat(content, cssReg, EOL + EOL);

		if (options.cssmin)
			str = new CleanCSS({root: mainPath}).minify(str);

		return new gutil.File({
			path: name,
			contents: new Buffer(str)
		});
	}

	function processHtml(content, callback) {
		var html = [];
		var files = [];
		var sections = content.split(endReg);

		for (var i = 0, l = sections.length; i < l; ++i)
			if (sections[i].match(startReg)) {
				var section = sections[i].split(startReg);

				html.push(section[0]);

				switch (section[1]) {
					case 'js':
						html.push('<script src="' + section[2] + '"></script>');
						files.push(processJs(section[3], section[2]));
						break;
					case 'css':
						html.push('<link rel="stylesheet" href="' + section[2] + '"/>');
						files.push(processCss(section[3], section[2]));
						break;
				}
			}
			else
				html.push(sections[i]);

		if (options.htmlmin)
			new htmlmin().parse(html.join(''), function(err, data) {
				files.push(new gutil.File({
					path: mainName,
					contents: new Buffer(data)
				}));

				callback(files);
			});
		else {
			files.push(new gutil.File({
				path: mainName,
				contents: new Buffer(html.join(''))
			}));

			callback(files);
		}
	}

	return through.obj(function (file, enc, callback) {
		if (file.isNull()) {
			this.push(file); // Do nothing if no contents
			callback();
		}
		else if (file.isStream()) {
			this.emit('error', new PluginError('gulp-usemin', 'Streams are not supported!'));
			callback();
		}
		else {
			mainPath = file.base;
			mainName = path.basename(file.path);

			processHtml(String(file.contents), function(files) {
				for (var i = 0; i < files.length; ++ i)
					this.push(files[i]);
				callback();
			}.bind(this));
		}
	});
};