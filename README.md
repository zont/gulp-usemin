[![Build Status](https://travis-ci.org/zont/gulp-usemin.svg?branch=master)](https://travis-ci.org/zont/gulp-usemin)

> Deprecated. Please use [Browserify](https://www.npmjs.com/package/browserify) or [Webpack](https://www.npmjs.com/package/webpack)

# gulp-usemin
> Replaces references to non-optimized scripts or stylesheets into a set of HTML files (or any templates/views).

This task is designed for gulp >= 3 and node >= 4.0.
> Attention: v0.3.0 options is not compatible with v0.2.0.

## Usage

First, install `gulp-usemin` as a development dependency:

```shell
npm install --save-dev gulp-usemin
```

Then, add it to your `gulpfile.js`:

```javascript
var usemin = require('gulp-usemin');
var uglify = require('gulp-uglify');
var htmlmin = require('gulp-htmlmin');
var cleanCss = require('gulp-clean-css');
var rev = require('gulp-rev');


gulp.task('usemin', function() {
  return gulp.src('./*.html')
    .pipe(usemin({
      css: [ rev() ],
      html: [ htmlmin({ collapseWhitespace: true }) ],
      js: [ uglify(), rev() ],
      inlinejs: [ uglify() ],
      inlinecss: [ cleanCss(), 'concat' ]
    }))
    .pipe(gulp.dest('build/'));
});
```

If you need to call the same pipeline twice, you need to define each task as a function that returns the stream object that should be used.

```javascript
gulp.task('usemin', function() {
  return gulp.src('./*.html')
    .pipe(usemin({
      css: [ rev ],
      html: [ function () {return htmlmin({ collapseWhitespace: true });} ],
      js: [ uglify, rev ],
      inlinejs: [ uglify ],
      inlinecss: [ cleanCss, 'concat' ]
    }))
    .pipe(gulp.dest('build/'));
});
```


## API

### Blocks
Blocks are expressed as:

```html
<!-- build:<pipelineId>(alternate search path) <path> -->
... HTML Markup, list of script / link tags.
<!-- endbuild -->
```

- **pipelineId**: pipeline id for options or *remove* to remove a section
- **alternate search path**: (optional) By default the input files are relative to the treated file. Alternate search path allows one to change that
- **path**: the file path of the optimized file, the target output

An example of this in completed form can be seen below:

```html
<!-- build:css style.css -->
<link rel="stylesheet" href="css/clear.css"/>
<link rel="stylesheet" href="css/main.css"/>
<!-- endbuild -->

<!-- build:htmlimport components-packed.html -->
<link rel="import" href="components-a.html">
<link rel="import" href="components-b.html">
<!-- endbuild -->

<!-- build:js js/lib.js -->
<script src="../lib/angular-min.js"></script>
<script src="../lib/angular-animate-min.js"></script>
<!-- endbuild -->

<!-- build:js1 js/app.js -->
<script src="js/app.js"></script>
<script src="js/controllers/thing-controller.js"></script>
<script src="js/models/thing-model.js"></script>
<script src="js/views/thing-view.js"></script>
<!-- endbuild -->

<!-- build:remove -->
<script src="js/localhostDependencies.js"></script>
<!-- endbuild -->

<!-- build:inlinejs -->
<script src="../lib/angular-min.js"></script>
<script src="../lib/angular-animate-min.js"></script>
<!-- endbuild -->

<!-- build:inlinecss -->
<link rel="stylesheet" href="css/clear.css"/>
<link rel="stylesheet" href="css/main.css"/>
<!-- endbuild -->
```

### Options

#### assetsDir
Type: `String`

Alternate root path for assets. New concated js and css files will be written to the path specified in the build block, relative to this path. Currently asset files are also returned in the stream.

#### path
Type: `String`

Default alternate search path for files. Can be overridden by the alternate search path option for a given block.

#### any pipelineId
Type: `Array`

If exist used for modify files. If does not contain string 'concat', then it added as first member of pipeline

#### outputRelativePath
Type: `String`
Relative location to html file for new concatenated js and css.

#### enableHtmlComment
Type: `Boolean`

Keep HTML comment when processing

#### jsAttributes
Type: `Object`

Attach HTML attributes to the output js file.
For Example :
```js
gulp.task('usemin', function() {
  return gulp.src('./index.html')
    .pipe(usemin({
      html: [],
      jsAttributes : {
        async : true,
        lorem : 'ipsum',
        seq   : [1, 2, 1]
      },
      js: [ ],
      js1:[ ],
      js2:[ ]
    }))
    .pipe(gulp.dest('./'));
});
```
Will give you :
```html
<script src="./lib.js" async lorem="ipsum" seq="1"></script>
<script src="./app.js" async lorem="ipsum" seq="2"></script>
<script src="./extra.js" async lorem="ipsum" seq="1"></script>
```
As your built script tag.

#### skipMissingResources
Type: `Boolean`

Allows missing resources to be skipped, instead of throwing an error.

## Use case

```
|
+- app
|   +- index.html
|   +- assets
|       +- js
|          +- foo.js
|          +- bar.js
|   +- css
|       +- clear.css
|       +- main.css
+- dist
```

We want to optimize `foo.js` and `bar.js` into `optimized.js`, referenced using relative path. `index.html` should contain the following block:

```
    <!-- build:css style.css -->
    <link rel="stylesheet" href="css/clear.css"/>
    <link rel="stylesheet" href="css/main.css"/>
    <!-- endbuild -->

    <!-- build:js js/optimized.js -->
    <script src="assets/js/foo.js"></script>
    <script src="assets/js/bar.js"></script>
    <!-- endbuild -->
```

We want our files to be generated in the `dist` directory. `gulpfile.js` should contain the following block:

```javascript
gulp.task('usemin', function () {
  return gulp.src('./app/index.html')
      .pipe(usemin({
        js: [uglify()]
        // in this case css will be only concatenated (like css: ['concat']).
      }))
      .pipe(gulp.dest('dist/'));
});
```

This will generate the following output:

```
|
+- app
|   +- index.html
|   +- assets
|       +- js
|          +- foo.js
|          +- bar.js
+- dist
|   +- index.html
|   +- js
|       +- optimized.js
|   +- style.css
```

`index.html` output:

```
    <link rel="stylesheet" href="style.css"/>

    <script src="js/optimized.js"></script>
```

## Changelog

#####0.3.29
- Migrate gulp-util to individual modules (by pioug)

#####0.3.28
- Update dependancies and replace deprecated packages (by JamyGolden)

#####0.3.27
- Updated glob dependency (by icholy)

#####0.3.26
- Fix for css media queries (by akempes)

#####0.3.24
- Added option to skip missing resources (by adamhenson)

#####0.3.23
- Added support array value for cssAttributes (by MillerRen)

#####0.3.22
- Added html import support (by linfaxin)

#####0.3.21
- Added support paths with querystring or hash (by Lanfei)

#####0.3.20
- Added support array value for jsAttributes (by kuitos)

#####0.3.18
- Fixed relative path for script in subfolder bug

#####0.3.17
- Fixed block output when stream returns multiple files (by maksidom)

#####0.3.16
- Added feature to assign attributes to js script tags (by sohamkamani)

#####0.3.15
- Allow proper html output when blocks are empty (by ppowalowski)

#####0.3.14
- fixed #91

#####0.3.13
- works fine only with gulp-foreach

#####0.3.12
- fixed #121. Depending on the node >= 0.12.

#####0.3.11
- fixed #88

#####0.3.10
- fixed uppercase Q bug (on case-sensetive file systems)

#####0.3.9
- async tasks support

#####0.3.8
- allow removal option (by tejohnso)
- added support for single quotes (by adicirstei)

#####0.3.7
- ouputRelativePath renamed outputRelativePath

#####0.3.6
- ouputRelativePath option (by bhstahl)

#####0.3.5
- Support for conditional comments inside build blocks (by simplydenis)

#####0.3.4
- When a file does not exist an error containing the missing path is thrown

#####0.3.3
- fixed dependencies
- Add support for multiple alternative paths (by peleteiro)

#####0.3.2
- fixed assetsDir option (by rovjuvano)

#####0.3.1
- fixed fails to create source map files by uglify({outSourceMap: true})

#####0.3.0
- new version of options

#####0.2.3
- fixed html minify bug

#####0.2.2
- allow gulp-usemin to work with minified source HTML (by CWSpear)
- fixed alternate path bug (by CWSpear)
- add assetsDir option (by pursual)
- add rev option (by pursual)

#####0.2.1
- fixed subfolders bug

#####0.2.0
- no minification by default. New options API

#####0.1.4
- add alternate search path support

#####0.1.3
- add support for absolute URLs (by vasa-chi)

#####0.1.1
- fixed aggressive replace comments

#####0.1.0
- fixed some bugs. Add tests.

#####0.0.2
- add minification by default

#####0.0.1
- initial release
