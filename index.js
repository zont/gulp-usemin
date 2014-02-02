var path = require('path');
var fs = require('fs');
var EOL = require('os').EOL;

var CleanCSS = require('clean-css');
var uglify = require('uglify-js');
var htmlmin = require('minimize');
var through = require('through2');
var gutil = require('gulp-util');

module.exports = function (options) {
	options = options || {};
	options.jsmin = options.jsmin !== false;
	options.cssmin = options.cssmin !== false;
	options.htmlmin = options.htmlmin !== false;
	options.resolvePath = options.resolvePath || [ '.' ];

	var startReg = /<!--\s*build:(css|js)\s+(\/?([^\s]+))\s*-->/gim;
	var endReg = /<!--\s*endbuild\s*-->/gim;
	var jsReg = /<\s*script\s+.*src\s*=\s*"([^"]+)".*><\s*\/\s*script\s*>/gi;
	var cssReg = /<\s*link\s+.*href\s*=\s*"([^"]+)".*>/gi;
	var mainPath, mainName;

	function createFile(name, content) {
		return new gutil.File({
			path: name,
			contents: new Buffer(content)
		});
	}

	function resolvePath(filename) {
		for (var i = 0; i < options.resolvePath.length; i++) {
			var p = path.join(options.resolvePath[i], filename);

			if (fs.existsSync(p))
				return p;
		}

		throw new gutil.PluginError('gulp-usemin', 'Could not find file: ' + filename);
	}

	function concat(content, reg, delimiter) {
		var paths = [];
		var buffer = [];

		content
			.replace(/<!--(?:(?:.|\r|\n)*?)-->/gim, '')
			.replace(reg, function (a, b) {
				paths.push(b);
			});

		for (var i = 0, l = paths.length; i < l; ++i)
			buffer.push(fs.readFileSync(resolvePath(paths[i])));

		return buffer.join(delimiter);
	}

	function processJs(content, name) {
		var str = concat(content, jsReg, ';' + EOL + EOL);

		if (options.jsmin)
			str = uglify.minify(str, {fromString: true}).code;

		return createFile(name, str);
	}

	function processCss(content, name) {
		var str = concat(content, cssReg, EOL + EOL);

		if (options.cssmin)
			str = new CleanCSS({root: mainPath}).minify(str);

		return createFile(name, str);
	}

	function processHtml(content, callback) {
		var html = [];
		var files = [];
		var sections = content.split(endReg);

		for (var i = 0, l = sections.length; i < l; ++i)
			if (sections[i].match(startReg)) {
				var section = sections[i].split(startReg);

				html.push(section[0]);

				if (section[1] == 'js') {
					html.push('<script src="' + section[2] + '"></script>');
					files.push(processJs(section[4], section[3]));
				}
				else {
					html.push('<link rel="stylesheet" href="' + section[2] + '"/>');
					files.push(processCss(section[4], section[3]));
				}
			}
			else
				html.push(sections[i]);

		if (options.htmlmin)
			new htmlmin().parse(html.join(''), function(err, data) {
				files.push(createFile(mainName, data));

				callback(files);
			});
		else {
			files.push(createFile(mainName, html.join('')));

			callback(files);
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
			mainPath = file.base;
			mainName = path.basename(file.path);
			
			try {
				processHtml(String(file.contents), function(files) {
					for (var i = 0; i < files.length; ++ i)
						this.push(files[i]);
					callback();
				}.bind(this));
			} catch(ex) {
				this.emit('error', ex)
			}
		}
	});
};
