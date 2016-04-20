var inject = require('gulp-inject');
var concat = require('gulp-concat');
var path = require('path');
var fs = require('fs');
var gulp = require('gulp');

var demos = require('../app/config/demos.json');

function getFolders(dir) {
    return fs.readdirSync(dir)
      .filter(function(file) {
        return fs.statSync(path.join(dir, file)).isDirectory();
      });
}

gulp.task('tests', function() {
    var data = {};

    for (var i = 0; i < demos.tests.length; i++) {
        var name = demos.tests[i].name;
        var folders = getFolders('./app/resources/js/app/demo/' + name);
        var script = demos.tests[i].script;
        var auto_inject = demos.tests[i].auto_inject ? true : false;

        data[name] = {
          use_cdn: demos.tests[i].cdn,
          url: demos.tests[i].cdn_url,
          script_id: demos.tests[i].script_id,
        };

        for (var j = 1; j <= folders.length; j++) {

            var src = ['./tests/templates/default.html'].concat(demos.tests[i].templates);

            for (var k = 0; k < src.length; k++) {
              gulp.src(src[k])
                .pipe(inject(gulp.src(['./app/resources/js/app/demo/'+ name +'/'+ j +'/description.html', './app/resources/js/app/demo/'+ name +'/'+ j +'/demo.html']), {
                  starttag: '<!-- inject:html -->',
                  endtag: '<!-- endinject -->',
                  transform: function (filePath, file) {
                    return file.contents.toString('utf8')
                  }
                }))
                .pipe(inject(gulp.src(script), {
                  transform: function (filePath, file) {
                    var parts = filePath.split('/');
                    var widget = parts[parts.length - 1].replace('rev', '').replace('.min.js', '');//holy hack again

                    var path = data[widget].use_cdn ? data[widget].url : filePath;
                    var id = data[widget].script_id ? ' id="'+ data[widget].script_id +'"' : '';
                    return auto_inject ? '<script'+ id +' src="' + path + '"></script>' : '';
                  }
                }
                ))
                .pipe(gulp.dest('./tests/' + name + '/' + j ));
            };
        }
    }
    return;
});

gulp.task('tests-files', ['tests'], function() {
    var data = {};

    for (var i = 0; i < demos.tests.length; i++) {
        var name = demos.tests[i].name;
        var folders = getFolders('./app/resources/js/app/demo/' + name);

        data[name] = {
          folders: folders,
          templates: ['./tests/templates/default.html'].concat(demos.tests[i].templates)
        };

        gulp.src('./tests/index.html')
          .pipe(inject(gulp.src(['./tests/'+ name, '!./tests/' + name + '/index.html']), {
            starttag: '<!-- inject:html -->',
            endtag: '<!-- endinject -->',
            transform: function (filePath, file) {
              var parts = filePath.split('/');
              var widget = parts[parts.length - 1];
              var folders = data[widget].folders;
              var templates = data[widget].templates;
              var html = '';

              for (var j = 0; j < templates.length; j++) {
                var templateName = templates[j].replace('./tests/templates/', '').replace('.html', '');//holy hack
                html += '<li><h5>'+ templateName +'</h5></li>';
                html += '<li style="list-style:none;"><ol>';
                for (var k = 0; k < folders.length; k++) {
                  var index = k + 1;
                  html += '<li><a target="_blank" href="/tests/' + widget + '/' + index + '/' + templateName + '.html">Demo</a></li>';
                };
                html += '</ol></li>';
              };

              return html;
            }
          }))
          .pipe(gulp.dest('./tests/' + name ));
    };
});