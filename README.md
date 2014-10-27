# gulp-usemin
> Replaces references to non-optimized scripts or stylesheets into a set of HTML files (or any templates/views).

This task is designed for gulp 3.
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
var minifyHtml = require('gulp-minify-html');
var minifyCss = require('gulp-minify-css');
var rev = require('gulp-rev');

gulp.task('usemin', function () {
  return gulp.src('./*.html')
    .pipe(usemin({
      css: function (stream, concat) {
        return stream
          .pipe(minifyCss())
          .pipe(concat);
      },
      html: function (stream) {
        return stream
          .pipe(minifyHtml({empty: true}));
      },
      js: function (stream, concat) {
        return stream
          .pipe(concat)
          .pipe(uglify())
          .pipe(rev());
      }
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
```

### Options

#### assetsDir
Type: `String`

Alternate root path for assets. New concated js and css files will be written to the path specified in the build block, relative to this path. Currently asset files are also returned in the stream.

#### path
Type: `String`

Default alternate search path for files. Can be overridden by the alternate search path option for a given block.

#### any pipelineId
Type: `Function`

If exist used for modify files. Each pipeline gets input stream and concat task, except for html. Function is called separately on demand for each block.

#### 'other' pipelineId
Type: `Function`

Special pipeline for files not matched by any block, but passed to asssets stream.

#### assetsStream
Type: `Function`

Stream constructor (works with lazypipe) of assets stream.
When passed, usemin search for files requested by blocks inside this stream instead on filesystem.

#### debugStreamFiles
Type: `Boolean`
Default: false

Show paths of all files passed to assets stream in console.

#### outputRelativePath
Type: `String`
Relative location to html file for new concatenated js and css.

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
