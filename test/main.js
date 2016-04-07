/* jshint node: true */
/* global describe, it */

'use strict';

var assert = require('assert');
var fs = require('fs');
var gutil = require('gulp-util');
var PassThrough = require('stream').PassThrough;
var path = require('path');
var usemin = require('../index');
var vfs = require('vinyl-fs');

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
  describe('allow removal sections', function() {
      function compare(name, expectedName, done) {
        var htmlmin = require('gulp-minify-html');
        var stream = usemin({html: [htmlmin({empty: true, quotes: true})]});

        stream.on('data', function(newFile) {
          if (path.basename(newFile.path) === name) {
            assert.equal(String(getExpected(expectedName).contents), String(newFile.contents));
            done();
          }
        });

        stream.write(getFixture(name));
      }

      it('simple js block', function(done) {
        compare('simple-js-removal.html', 'simple-js-removal.html', done);
      });

      it('minified js block', function(done) {
        compare('min-html-simple-removal.html', 'min-html-simple-removal.html', done);
      });

      it('many blocks', function(done) {
        compare('many-blocks-removal.html', 'many-blocks-removal.html', done);
      });

      it('robust pattern recognition (no whitespace after build:remove)', function(done) {
        compare('build-remove-no-trailing-whitespace.html', 'build-remove-no-trailing-whitespace.html', done);
      });

  });

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
    });

    it('html without blocks', function(done) {
      var stream = usemin();
      var content = '<div>content</div>';
      var fakeFile = new gutil.File({
        path: 'test.file',
        contents: new Buffer(content)
      });

      stream.on('data', function(newFile) {
        console.log('\n\n', newFile, content, '\n\n');
        assert.equal(content, String(newFile.contents));
        done();
      });

      stream.write(fakeFile);
    });
  });

  describe('should work in buffer mode with', function() {
    describe('minified HTML:', function() {
      function compare(name, expectedName, done, fail) {
        var htmlmin = require('gulp-minify-html');
        var stream = usemin({
          html: [function() {
            return htmlmin({empty: true});
          }]
        });

        stream.on('data', function(newFile) {
          if (path.basename(newFile.path) === name) {
            assert.equal(String(getExpected(expectedName).contents), String(newFile.contents));
            done();
          }
        });
        stream.on('error', function() {
          if (fail)
            fail();
        });

        stream.write(getFixture(name));
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

      it('css block with media query', function(done) {
        compare('css-with-media-query.html', 'min-css-with-media-query.html', done);
      });

      it('css block with mixed incompatible media queries should error', function(done) {
        compare('css-with-media-query-error.html', 'min-css-with-media-query.html', function() {
          assert.fail('', '', 'should error', '');
          done();
        }, done);
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

      it('paths with querystring', function(done) {
        compare('paths-with-querystring.html', 'min-paths-with-querystring.html', done);
      });
    });

    describe('not minified HTML:', function() {
      function compare(name, expectedName, done) {
        var stream = usemin();

        stream.on('data', function(newFile) {
          if (path.basename(newFile.path) === name) {
            assert.equal(String(getExpected(expectedName).contents), String(newFile.contents));
            done();
          }
        });

        stream.write(getFixture(name));
      }

      it('simple js block with single quotes', function (done) {
        compare('single-quotes-js.html', 'single-quotes-js.html', done);
      });

      it('simple css block with single quotes', function (done) {
        compare('single-quotes-css.html', 'single-quotes-css.html', done);
      });

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

      it('multiple alternative paths', function(done) {
        compare('multiple-alternative-paths.html', 'multiple-alternative-paths.html', done);
      });

      it('paths with querystring', function(done) {
        compare('paths-with-querystring.html', 'paths-with-querystring.html', done);
      });
    });

    describe('minified CSS:', function() {
      function compare(fixtureName, name, expectedName, end) {
        var cssmin = require('gulp-minify-css');
        var stream = usemin({css: ['concat', cssmin()]});

        stream.on('data', function(newFile) {
          if (path.basename(newFile.path) === name) {
            assert.equal(String(getExpected(expectedName).contents), String(newFile.contents));
            end();
          }
        });

        stream.write(getFixture(fixtureName));
      }

      it('simple (css block)', function(done) {
        var name = 'style.css';
        var expectedName = 'min-style.css';

        compare('simple-css.html', name, expectedName, done);
      });

      it('simple with path (css block)', function(done) {
        var name = 'style.css';
        var expectedName = path.join('data', 'css', 'min-style.css');

        compare('simple-css-path.html', name, expectedName, done);
      });

      it('simple with alternate path (css block)', function(done) {
        var name = 'style.css';
        var expectedName = path.join('data', 'css', 'min-style.css');

        compare('simple-css-alternate-path.html', name, expectedName, done);
      });
    });

    describe('not minified CSS:', function() {
      function compare(fixtureName, expectedName, end) {
        var stream = usemin();

        stream.on('data', function(newFile) {
          if (path.basename(newFile.path) === path.basename(expectedName)) {
            assert.equal(String(getExpected(expectedName).contents), String(newFile.contents));
            end();
          }
        });

        stream.write(getFixture(fixtureName));
      }

      it('simple (css block)', function(done) {
        compare('simple-css.html', 'style.css', done);
      });

      it('simple (css block) (minified html)', function(done) {
        compare('min-html-simple-css.html', 'style.css', done);
      });

      it('simple with path (css block)', function(done) {
        compare('simple-css-path.html', path.join('data', 'css', 'style.css'), done);
      });

      it('simple with alternate path (css block)', function(done) {
        compare('simple-css-alternate-path.html', path.join('data', 'css', 'style.css'), done);
      });
    });

    describe('minified JS:', function() {
      function compare(fixtureName, name, expectedName, end) {
        var jsmin = require('gulp-uglify');
        var stream = usemin({js: [jsmin()]});

        stream.on('data', function(newFile) {
          if (path.basename(newFile.path) === path.basename(name)) {
            assert.equal(String(getExpected(expectedName).contents), String(newFile.contents));
            end();
          }
        });

        stream.write(getFixture(fixtureName));
      }

      it('simple (js block)', function(done) {
        compare('simple-js.html', 'app.js', 'min-app.js', done);
      });

      it('simple with path (js block)', function(done) {
        var name = path.join('data', 'js', 'app.js');
        var expectedName = path.join('data', 'js', 'min-app.js');

        compare('simple-js-path.html', name, expectedName, done);
      });

      it('simple with alternate path (js block)', function(done) {
        var name = path.join('data', 'js', 'app.js');
        var expectedName = path.join('data', 'js', 'min-app.js');

        compare('simple-js-alternate-path.html', name, expectedName, done);
      });
    });

    describe('not minified JS:', function() {
      function compare(fixtureName, expectedName, end) {
        var stream = usemin();

        stream.on('data', function(newFile) {
          if (path.basename(newFile.path) === path.basename(expectedName)) {
            assert.equal(String(getExpected(expectedName).contents), String(newFile.contents));
            end();
          }
        });

        stream.write(getFixture(fixtureName));
      }

      it('simple (js block)', function(done) {
        compare('simple-js.html', 'app.js', done);
      });

      it('simple (js block) (minified html)', function(done) {
        compare('min-html-simple-js.html', 'app.js', done);
      });

      it('simple with path (js block)', function(done) {
        compare('simple-js-path.html', path.join('data', 'js', 'app.js'), done);
      });

      it('simple with alternate path (js block)', function(done) {
        compare('simple-js-alternate-path.html', path.join('data', 'js', 'app.js'), done);
      });
    });

    it('many html files', function(done) {
      var cssmin = require('gulp-minify-css');
      var jsmin = require('gulp-uglify');
      var rev = require('gulp-rev');
      var stream = usemin({
        css: ['concat', cssmin],
        js: ['concat', jsmin]
      });

      var nameCss = 'style.css';
      var expectedNameCss = 'min-style.css';
      var nameJs = 'app.js';
      var expectedNameJs = 'min-app.js';
      var cssExist = false;
      var jsExist = false;
      var htmlCount = 0;

      stream.on('data', function(newFile) {
        if (path.basename(newFile.path) === path.basename(nameCss)) {
          cssExist = true;
          assert.equal(String(getExpected(expectedNameCss).contents), String(newFile.contents));
        }
        else if (path.basename(newFile.path) === path.basename(nameJs)) {
          jsExist = true;
          assert.equal(String(getExpected(expectedNameJs).contents), String(newFile.contents));
        }
        else {
          htmlCount += 1;
        }
      });

      stream.on('end', function() {
        assert.equal(htmlCount, 2);
        assert.ok(cssExist);
        assert.ok(jsExist);
        done();
      });

      stream.write(getFixture('simple-css.html'));
      stream.write(getFixture('simple-js.html'));
      stream.end();
    });

    it('many blocks', function(done) {
      var cssmin = require('gulp-minify-css');
      var jsmin = require('gulp-uglify');
      var rev = require('gulp-rev');
      var stream = usemin({
        css1: ['concat', cssmin],
        js1: [jsmin, 'concat', rev]
      });

      var nameCss = path.join('data', 'css', 'style.css');
      var expectedNameCss = path.join('data', 'css', 'min-style.css');
      var nameJs = path.join('data', 'js', 'app.js');
      var expectedNameJs = path.join('data', 'js', 'app.js');
      var nameJs1 = 'app1';
      var expectedNameJs1 = path.join('data', 'js', 'app_min_concat.js');
      var nameJs2 = 'app2';
      var expectedNameJs2 = path.join('data', 'js', 'app_min_concat.js');
      var cssExist = false;
      var jsExist = false;
      var js1Exist = false;
      var js2Exist = false;

      stream.on('data', function(newFile) {
        if (path.basename(newFile.path) === path.basename(nameCss)) {
          cssExist = true;
          assert.equal(String(getExpected(expectedNameCss).contents), String(newFile.contents));
        }
        else if (path.basename(newFile.path) === path.basename(nameJs)) {
          jsExist = true;
          assert.equal(String(getExpected(expectedNameJs).contents), String(newFile.contents));
        }
        else if (newFile.path.indexOf(nameJs1) != -1) {
          js1Exist = true;
          assert.equal(String(getExpected(expectedNameJs1).contents), String(newFile.contents));
        }
        else if (newFile.path.indexOf(nameJs2) != -1) {
          js2Exist = true;
          assert.equal(String(getExpected(expectedNameJs2).contents), String(newFile.contents));
        }
        else {
          assert.ok(cssExist);
          assert.ok(jsExist);
          assert.ok(js1Exist);
          assert.ok(js2Exist);
          done();
        }
      });

      stream.write(getFixture('many-blocks.html'));
    });

    describe('assetsDir option:', function() {
      function compare(assetsDir, done) {
        var stream = usemin({assetsDir: assetsDir});
        var expectedName = 'style.css';

        stream.on('data', function(newFile) {
          if (path.basename(newFile.path) === expectedName) {
            assert.equal(String(getExpected(expectedName).contents), String(newFile.contents));
            done();
          }
        });

        stream.write(getFixture('simple-css.html'));
      }

      it('absolute path', function(done) {
        compare(path.join(process.cwd(), 'test', 'fixtures'), done);
      });

      it('relative path', function(done) {
        compare(path.join('test', 'fixtures'), done);
      });
    });

    describe('conditional comments:', function() {
      function compare(name, expectedName, done) {
        var stream = usemin();

        stream.on('data', function(newFile) {
          if (path.basename(newFile.path) === name) {
            assert.equal(String(getExpected(expectedName).contents), String(newFile.contents));
            done();
          }
        });

        stream.write(getFixture(name));
      }

      it('conditional (js block)', function(done) {
        compare('conditional-js.html', 'conditional-js.html', done);
      });

      it('conditional (css block)', function(done) {
        compare('conditional-css.html', 'conditional-css.html', done);
      });

      it('conditional (css + js)', function(done) {
        compare('conditional-complex.html', 'conditional-complex.html', done);
      });

      it('conditional (inline js block)', function(done) {
        compare('conditional-inline-js.html', 'conditional-inline-js.html', done);
      });

      it('conditional (inline css block)', function(done) {
        compare('conditional-inline-css.html', 'conditional-inline-css.html', done);
      });

    });

    describe('globbed files:', function() {
      function compare(fixtureName, name, end) {
        var stream = usemin();

        stream.on('data', function(newFile) {
          if (path.basename(newFile.path) === name) {
            assert.equal(String(newFile.contents), String(getExpected(name).contents));
            end();
          }
        });

        stream.write(getFixture(fixtureName));
      }

      it('glob (js block)', function(done) {
        compare('glob-js.html', 'app.js', done);
      });

      it('glob (css block)', function(done) {
        compare('glob-css.html', 'style.css', done);
      });

      it('glob inline (js block)', function(done) {
        compare('glob-inline-js.html', 'glob-inline-js.html', done);
      });

      it('glob inline (css block)', function(done) {
        compare('glob-inline-css.html', 'glob-inline-css.html', done);
      });
    });

    describe('comment files:', function() {
      function compare(name, callback) {
        var stream = usemin({enableHtmlComment: true});

        stream.on('data', callback);

        stream.write(getFixture(name));
      }

      it('comment (js block)', function(done) {
        var expectedName = 'app.js';

        compare(
          'comment-js.html',
          function(newFile) {
            if (path.basename(newFile.path) === expectedName) {
              assert.equal(String(newFile.contents), String(getExpected(expectedName).contents));
              done();
            }
          }
        );
      });
    });

    describe('inline Sources:', function() {
      function compare(fixtureName, name, end) {
        var stream = usemin();

        stream.on('data', function(newFile) {
          if (path.basename(newFile.path) === name) {
            assert.equal(String(newFile.contents), String(getExpected(name).contents));
            end();
          }
        });

        stream.write(getFixture(fixtureName));
      }

      it('simple inline js block', function (done) {
        compare('simple-inline-js.html', 'simple-inline-js.html', done);
      });

      it('simple inline css block', function (done) {
        compare('simple-inline-css.html', 'simple-inline-css.html', done);
      });

      it('simple inline js block width single quotes', function (done) {
        compare('single-quotes-inline-js.html', 'single-quotes-inline-js.html', done);
      });

      it('simple inline css block with single quotes', function (done) {
        compare('single-quotes-inline-css.html', 'single-quotes-inline-css.html', done);
      });

    });

    describe('array jsAttributes:', function() {

      function compare(fixtureName, name, end) {
        var stream = usemin({
          jsAttributes: {
            seq: [1, 2, 1, 3],
            color: ['blue', 'red', 'yellow', 'pink']
          },
          js: [],
          js1: [],
          js2: [],
          js3: []

        });

        stream.on('data', function(newFile) {
          if (path.basename(newFile.path) === name) {
            assert.equal(String(newFile.contents), String(getExpected(name).contents));
            end();
          }
        });

        stream.write(getFixture(fixtureName));
      }

      it('js attributes with array define', function (done) {
        compare('array-js-attributes.html', 'array-js-attributes.html', done);
      });

    });

    it('async task', function(done) {
      var less = require('gulp-less');
      var cssmin = require('gulp-minify-css');
      var stream = usemin({
        less: [less(), 'concat', cssmin()]
      });

      var name = 'style.css';
      var expectedName = 'min-style.css';

      stream.on('data', function(newFile) {
        if (path.basename(newFile.path) === path.basename(name)) {
          assert.equal(String(getExpected(expectedName).contents), String(newFile.contents));
          done();
        }
      });

      stream.write(getFixture('async-less.html'));
    });

    it('subfolders', function(done) {
      var stream = usemin();
      var jsExist = false;
      var nameJs = path.join('subfolder', 'app.js');

      stream.on('data', function(newFile) {
        if (path.basename(newFile.path) === path.basename(nameJs)) {
          jsExist = true;
          assert.equal(path.relative(newFile.base, newFile.path), nameJs);
          assert.equal(String(getExpected(nameJs).contents), String(newFile.contents));
        }
        else {
          assert.ok(jsExist);
          done();
        }
      });

      vfs.src('test/fixtures/**/index.html')
        .pipe(stream);
    });
  });

  it('multiple files in stream', function(done) {
    var multipleFiles = function() {
      var through = require('through2');
      var File = gutil.File;

      return through.obj(function(file) {
        var stream = this;

        stream.push(new File({
          cwd: file.cwd,
          base: file.base,
          path: file.path,
          contents: new Buffer('test1')
        }));

        stream.push(new File({
          cwd: file.cwd,
          base: file.base,
          path: file.path,
          contents: new Buffer('test2')
        }));
      });
    };
    var stream = usemin({
      css: [multipleFiles],
      js: [multipleFiles]
    });

    stream.on('data', function(newFile) {
      if (path.basename(newFile.path) === path.basename('multiple-files.html')) {
        assert.equal(String(getExpected('multiple-files.html').contents), String(newFile.contents));
        done();
      }
    });

    stream.write(getFixture('multiple-files.html'));
  });
});
