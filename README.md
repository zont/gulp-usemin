[![Build Status](https://travis-ci.org/zont/gulp-usemin.svg?branch=master)](https://travis-ci.org/zont/gulp-usemin)

# gulp-usenew
> Replaces references to non-optimized scripts or stylesheets into a set of HTML files (or any templates/views).

This task is designed for gulp >= 3 and node >= 4.0.
> Attention: v0.3.0 options is not compatible with v0.2.0.

## Usage

First, install `gulp-usenew` as a development dependency:

```shell
npm install --save-dev gulp-usenew
```

Then, add it to your `gulpfile.js`:

```javascript
var usemin = require('gulp-usenew');
var uglify = require('gulp-uglify');
var minifyHtml = require('gulp-minify-html');
var minifyCss = require('gulp-minify-css');
var rev = require('gulp-rev');


gulp.task('usemin', function() {
  return gulp.src('./*.html')
    .pipe(usemin({
      css: [ rev() ],
      html: [ minifyHtml({ empty: true }) ],
      js: [ uglify(), rev() ],
      inlinejs: [ uglify() ],
      inlinecss: [ minifyCss(), 'concat' ]
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
      html: [ function () {return minifyHtml({ empty: true });} ],
      js: [ uglify, rev ],
      inlinejs: [ uglify ],
      inlinecss: [ minifyCss, 'concat' ]
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

#####0.1
基于 gulp-usemin,改进错误提示;
