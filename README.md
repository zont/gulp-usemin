# gulp-usemin
> Replaces references to non-optimized scripts or stylesheets into a set of HTML files (or any templates/views).

This task is designed for gulp 3.

## Usage

First, install `gulp-usemin` as a development dependency:

```shell
npm install --save-dev gulp-usemin
```

Then, add it to your `gulpfile.js`:

```javascript
var usemin = require('gulp-usemin');

gulp.task('usemin', function() {
  gulp.src('./*.html')
    .pipe(usemin({
      cssmin: false,
      htmlmin: false,
      jsmin: false
    }))
    .pipe(gulp.dest('build/'));
});
```

## API

### Blocks
Blocks are expressed as:

```html
<!-- build:<type> <path> -->
... HTML Markup, list of script / link tags.
<!-- endbuild -->
```

- **type**: either `js` or `css`
- **path**: the file path of the optimized file, the target output

An example of this in completed form can be seen below:

```html
<!-- build:css style.css -->
<link rel="stylesheet" href="css/clear.css"/>
<link rel="stylesheet" href="css/main.css"/>
<!-- endbuild -->

<!-- build:js js/app.js -->
<script src="js/app.js"></script>
<script src="js/controllers/thing-controller.js"></script>
<script src="js/models/thing-model.js"></script>
<script src="js/views/thing-view.js"></script>
<!-- endbuild -->
```

### Options

#### cssmin
Type: `Boolean`
Default: `true`

If true, minify output css.

#### htmlmin
Type: `Boolean`
Default: `true`

If true, minify output html.

#### jsmin
Type: `Boolean`
Default: `true`

If true, minify output js.


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
gulp.task('usemin', function(){
  gulp.src('./app/index.html')
    .pipe(usemin())
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