/* jshint node: true */
/* global describe, it */

'use strict';

var assert = require('assert');
var es = require('event-stream');
var fs = require('fs');
var gutil = require('gulp-util');
var PassThrough = require('stream').PassThrough;
var path = require('path');
var usemin = require('../index');

var jsmin = require('gulp-uglify');
var htmlmin = require('gulp-minify-html');
var cssmin = require('gulp-minify-css');

function getFile(filePath) {
	return new gutil.File({
		path:     filePath,
		base:     path.dirname(filePath),
		contents: fs.readFileSync(filePath)
	});
}

function getFixture(filePath) {
	return getFile(path.join('test', 'fixtures', filePath));
}

function getExpected(filePath) {
	return getFile(path.join('test', 'expected', filePath));
}

describe('gulp-usemin', function() {
	describe('negative test:', function() {
		it('shouldn\'t work in stream mode', function(done) {
			var stream = usemin();
			var t;
			var fakeStream = new PassThrough();
			var fakeFile = new gutil.File({
				contents: fakeStream
			});
			fakeStream.end();

			stream.on('error', function() {
				clearTimeout(t);
				done();
			});

			t = setTimeout(function() {
				assert.fail('', '', 'Should throw error', '');
				done();
			}, 1000);

			stream.write(fakeFile);
			stream.end();
		});

		it('html without blocks', function(done) {
			var stream = usemin();
			var content = '<div>content</div>';
			var fakeFile = new gutil.File({
				contents: new Buffer(content)
			});

			stream.on('data', function(newFile) {
				assert.equal(content, String(newFile.contents));
			});

			stream.on('end', function() {
				done();
			});

			stream.write(fakeFile);
			stream.end();
		});
	});

	describe('should work in buffer mode with', function() {
		describe('minified HTML:', function() {
			function compare(name, expectedName, done) {
				var stream = usemin({htmlmin: htmlmin({empty: true})});

				stream.on('data', function(newFile) {
					if (path.basename(newFile.path) === name)
						assert.equal(String(getExpected(expectedName).contents), String(newFile.contents));
				});
				stream.on('end', function() {
					done();
				});

				stream.write(getFixture(name));
				stream.end();
			}

			it('simple js block', function(done) {
				compare('simple-js.html', 'min-simple-js.html', done);
			});

			it('simple js block with path', function(done) {
				compare('simple-js-path.html', 'min-simple-js-path.html', done);
			});

			it('simple css block', function(done) {
				compare('simple-css.html', 'min-simple-css.html', done);
			});

			it('simple css block with path', function(done) {
				compare('simple-css-path.html', 'min-simple-css-path.html', done);
			});

			it('complex (css + js)', function(done) {
				compare('complex.html', 'min-complex.html', done);
			});

			it('complex with path (css + js)', function(done) {
				compare('complex-path.html', 'min-complex-path.html', done);
			});
		});

		describe('not minified HTML:', function() {
			function compare(name, expectedName, done) {
				var stream = usemin();

				stream.on('data', function(newFile) {
					if (path.basename(newFile.path) === name)
						assert.equal(String(getExpected(expectedName).contents), String(newFile.contents));
				});
				stream.on('end', function() {
					done();
				});

				stream.write(getFixture(name));
				stream.end();
			}

			it('simple (js block)', function(done) {
				compare('simple-js.html', 'simple-js.html', done);
			});

			it('simple (js block) (html minified)', function(done) {
				compare('min-html-simple-js.html', 'min-html-simple-js.html', done);
			});

			it('simple with path (js block)', function(done) {
				compare('simple-js-path.html', 'simple-js-path.html', done);
			});

			it('simple (css block)', function(done) {
				compare('simple-css.html', 'simple-css.html', done);
			});

			it('simple (css block) (html minified)', function(done) {
				compare('min-html-simple-css.html', 'min-html-simple-css.html', done);
			});

			it('simple with path (css block)', function(done) {
				compare('simple-css-path.html', 'simple-css-path.html', done);
			});

			it('complex (css + js)', function(done) {
				compare('complex.html', 'complex.html', done);
			});

			it('complex with path (css + js)', function(done) {
				compare('complex-path.html', 'complex-path.html', done);
			});
		});

		describe('minified CSS:', function() {
			function compare(name, callback, end) {
				var stream = usemin({cssmin: cssmin()});

				stream.on('data', callback);
				stream.on('end', end);

				stream.write(getFixture(name));
				stream.end();
			}

			it('simple (css block)', function(done) {
				var name = 'style.css';
				var expectedName = 'min-style.css';
				var exist = false;

				compare(
					'simple-css.html',
					function(newFile) {
						if (newFile.path === name) {
							exist = true;
							assert.equal(String(getExpected(expectedName).contents), String(newFile.contents));
						}
					},
					function() {
						assert.ok(exist);
						done();
					}
				);
			});

			it('simple with path (css block)', function(done) {
				var name = path.join('data', 'css', 'style.css');
				var expectedName = path.join('data', 'css', 'min-style.css');
				var exist = false;

				compare(
					'simple-css-path.html',
					function(newFile) {
						if (newFile.path === name) {
							exist = true;
							assert.equal(String(getExpected(expectedName).contents), String(newFile.contents));
						}
					},
					function() {
						assert.ok(exist);
						done();
					}
				);
			});

			it('simple with alternate path (css block)', function(done) {
				var name = path.join('data', 'css', 'style.css');
				var expectedName = path.join('data', 'css', 'min-style.css');
				var exist = false;

				compare(
					'simple-css-alternate-path.html',
					function(newFile) {
						if (newFile.path === name) {
							exist = true;
							assert.equal(String(getExpected(expectedName).contents), String(newFile.contents));
						}
					},
					function() {
						assert.ok(exist);
						done();
					}
				);
			});
		});

		describe('not minified CSS:', function() {
			function compare(name, callback, end) {
				var stream = usemin();

				stream.on('data', callback);
				stream.on('end', end);

				stream.write(getFixture(name));
				stream.end();
			}

			it('simple (css block)', function(done) {
				var expectedName = 'style.css';
				var exist = false;

				compare(
					'simple-css.html',
					function(newFile) {
						if (newFile.path === expectedName) {
							exist = true;
							assert.equal(String(getExpected(expectedName).contents), String(newFile.contents));
						}
					},
					function() {
						assert.ok(exist);
						done();
					}
				);
			});

			it('simple (css block) (minified html)', function(done) {
				var expectedName = 'style.css';
				var exist = false;

				compare(
					'min-html-simple-css.html',
					function(newFile) {
						if (newFile.path === expectedName) {
							exist = true;
							assert.equal(String(getExpected(expectedName).contents), String(newFile.contents));
						}
					},
					function() {
						assert.ok(exist);
						done();
					}
				);
			});

			it('simple with path (css block)', function(done) {
				var expectedName = path.join('data', 'css', 'style.css');
				var exist = false;

				compare(
					'simple-css-path.html',
					function(newFile) {
						if (newFile.path === expectedName) {
							exist = true;
							assert.equal(String(getExpected(expectedName).contents), String(newFile.contents));
						}
					},
					function() {
						assert.ok(exist);
						done();
					}
				);
			});

			it('simple with alternate path (css block)', function(done) {
				var expectedName = path.join('data', 'css', 'style.css');
				var exist = false;

				compare(
					'simple-css-alternate-path.html',
					function(newFile) {
						if (newFile.path === expectedName) {
							exist = true;
							assert.equal(String(getExpected(expectedName).contents), String(newFile.contents));
						}
					},
					function() {
						assert.ok(exist);
						done();
					}
				);
			});
		});

		describe('minified JS:', function() {
			function compare(name, callback, end) {
				var stream = usemin({jsmin: jsmin()});

				stream.on('data', callback);
				stream.on('end', end);

				stream.write(getFixture(name));
				stream.end();
			}

			it('simple (js block)', function(done) {
				var name = 'app.js';
				var expectedName = 'min-app.js';
				var exist = false;

				compare(
					'simple-js.html',
					function(newFile) {
						if (newFile.path === name) {
							exist = true;
							assert.equal(String(getExpected(expectedName).contents), String(newFile.contents));
						}
					},
					function() {
						assert.ok(exist);
						done();
					}
				);
			});

			it('simple with path (js block)', function(done) {
				var name = path.join('data', 'js', 'app.js');
				var expectedName = path.join('data', 'js', 'min-app.js');
				var exist = false;

				compare(
					'simple-js-path.html',
					function(newFile) {
						if (newFile.path === name) {
							exist = true;
							assert.equal(String(getExpected(expectedName).contents), String(newFile.contents));
						}
					},
					function() {
						assert.ok(exist);
						done();
					}
				);
			});

			it('simple with alternate path (js block)', function(done) {
				var name = path.join('data', 'js', 'app.js');
				var expectedName = path.join('data', 'js', 'min-app.js');
				var exist = false;

				compare(
					'simple-js-alternate-path.html',
					function(newFile) {
						if (newFile.path === name) {
							exist = true;
							assert.equal(String(getExpected(expectedName).contents), String(newFile.contents));
						}
					},
					function() {
						assert.ok(exist);
						done();
					}
				);
			});
		});

		describe('not minified JS:', function() {
			function compare(name, callback, end) {
				var stream = usemin();

				stream.on('data', callback);
				stream.on('end', end);

				stream.write(getFixture(name));
				stream.end();
			}

			it('simple (js block)', function(done) {
				var expectedName = 'app.js';
				var exist = false;

				compare(
					'simple-js.html',
					function(newFile) {
						if (newFile.path === expectedName) {
							exist = true;
							assert.equal(String(getExpected(expectedName).contents), String(newFile.contents));
						}
					},
					function() {
						assert.ok(exist);
						done();
					}
				);
			});

			it('simple (js block) (minified html)', function(done) {
				var expectedName = 'app.js';
				var exist = false;

				compare(
					'min-html-simple-js.html',
					function(newFile) {
						if (newFile.path === expectedName) {
							exist = true;
							assert.equal(String(getExpected(expectedName).contents), String(newFile.contents));
						}
					},
					function() {
						assert.ok(exist);
						done();
					}
				);
			});

			it('simple with path (js block)', function(done) {
				var expectedName = path.join('data', 'js', 'app.js');
				var exist = false;

				compare(
					'simple-js-path.html',
					function(newFile) {
						if (newFile.path === expectedName) {
							exist = true;
							assert.equal(String(getExpected(expectedName).contents), String(newFile.contents));
						}
					},
					function() {
						assert.ok(exist);
						done();
					}
				);
			});

			it('simple with alternate path (js block)', function(done) {
				var expectedName = path.join('data', 'js', 'app.js');
				var exist = false;

				compare(
					'simple-js-alternate-path.html',
					function(newFile) {
						if (newFile.path === expectedName) {
							exist = true;
							assert.equal(String(getExpected(expectedName).contents), String(newFile.contents));
						}
					},
					function() {
						assert.ok(exist);
						done();
					}
				);
			});
		});
	});
});