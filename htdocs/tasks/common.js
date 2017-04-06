var yargs = require('yargs').argv;
var minifycss = require('gulp-minify-css');
var concat    = require('gulp-concat');
var autoprefixer = require('gulp-autoprefixer');
var inject       = require('gulp-inject');
var rename    = require('gulp-rename');
var uglify    = require('gulp-uglify');
var header       = require('gulp-header');
var gulp      = require('gulp');
var pump      = require('pump');
var notify    = require("gulp-notify");
var sass      = require('gulp-sass');
const fs      = require('fs');

var widget = yargs.widget;

var banner = ['/**',
    ' * <%= pkg.name %> - <%= pkg.description %>',
    ' * @date - <%= new Date() %>',
    ' * @version v<%= pkg.version %>',
    ' * @link <%= pkg.homepage %>',
    ' */',
    ''].join('\n');

var config = require('./config.json');

if (!config[widget]) {
  return false;
}

gulp.task('minifycss', function() {
    return gulp.src(config[widget].css)
        .pipe(sass().on('error', function (err) {
            notify().write(err);
            this.emit('end');
        }))
        .pipe(concat('rev'+ widget +'.min.css'))
        .pipe(autoprefixer({
            browsers: ['> 1%'],
            cascade: false
        }))
        .pipe(minifycss({keepSpecialComments: 0}))
        .pipe(gulp.dest('./build/files/' + widget));
});

gulp.task('embedcss', ['minifycss'], function () {
    return gulp.src(config[widget].js)
        .pipe(inject(gulp.src(['./build/files/'+ widget +'/*.css']), {
            starttag: '/* inject:css */',
            endtag: '/* endinject */',
            transform: function (filePath, file) {
                return file.contents.toString('utf8');
            }
        }))
        .pipe(rename('rev'+ widget +'.embed.js'))
        .pipe(gulp.dest('./build/files/' + widget));
});

gulp.task('build', ['minifycss', 'embedcss'], function(cb) {

    var missingFiles = [];
    config[widget].build.forEach(function(file) {
        try {
            !fs.statSync(file).isFile();
        } catch(e) {
            missingFiles.push(file);
        }
    });

    if (missingFiles.length) {
        console.log('\x1b[31m ', 'Missing Files! ' + missingFiles, '\x1b[0m');
        return;
    }

      pump([
            gulp.src(config[widget].build),
            concat('rev'+ widget +'.pkgd.js'),
            gulp.dest('./build/files/' + widget),
            uglify({
                mangle: true
            }).on('error', function (err) {
                var fileArr = err.fileName.split('/');
                var messageArr = err.message.split(': ');
                notify().write(fileArr[fileArr.length - 1] + ' Line: ' + err.lineNumber + ' ' + messageArr[messageArr.length - 1]);
                this.emit('end');
            }),
            rename('rev'+ widget +'.min.js'),
            header(banner, { pkg : config[widget] } ),
            gulp.dest('./build')
        ],
        cb
      );
});

gulp.task('watch', function () {
    gulp.watch(config[widget].watch, ['build']);
});