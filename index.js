var es = require('event-stream');
var gutil = require('gulp-util');
var htmlmin = require('minimize');

module.exports = function(options) {
	options = options || {};
	options.jsmin = options.jsmin !== false;
	options.cssmin = options.cssmin !== false;
	options.htmlmin = options.htmlmin !== false;

	var startReg = /<!--\s*build:(css|js)\s+([^\s]+)\s*-->/gim;
	var endReg = /<!--\s*endbuild\s*-->/gim;

	function processJs(content) {
		console.log('TODO js:', content);
		// TODO concat
		// TODO uglify
	}

	function processCss(content) {
		console.log('TODO css:', content);
		// TODO concat
		// TODO minify
	}

	function processHtml(content, callback) {
		var result = [];
		var sections = content.split(endReg);

		for (var i = 0, l = sections.length; i < l; ++i)
			if (sections[i].match(startReg)) {
				var section = sections[i].split(startReg);

				result.push(section[0]);

				switch (section[1]) {
					case 'js':
						result.push('<script src="' + section[2] + '"></script>');
						processJs(section[3]);
						break;
					case 'css':
						result.push('<link rel="stylesheet" href="' + section[2] + '"/>');
						processCss(section[3]);
						break;
				}
			}
		else
			result.push(sections[i]);

		if (options.htmlmin)
			new htmlmin().parse(result.join(''), callback);
		else
			callback(null, result.join(''));
	}

  function process(file, callback) {
    var isStream = file.contents && typeof file.contents.on === 'function' && typeof file.contents.pipe === 'function';
    var isBuffer = file.contents instanceof Buffer;

		if (isStream)
      callback(new gutil.PluginError('gulp-usemin', 'Streaming not supported'), file);
		else if (!isBuffer)
			callback(new gutil.PluginError('gulp-usemin', 'Unknown type of input'), file);
		else {
			var content = String(file.contents);
			if (endReg.test(content))
				processHtml(content, function(error, content) {
					file.contents = new Buffer(content);
					callback(error, file);
				});
		}
  }

  return es.map(process);
};