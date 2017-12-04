gulp build --widget=powrvideo
gulp build --widget=powrapi
cp showcase/revcontent-api-showcase-powr-video-1.0/js/powriframefix.js build/powriframefix.js

cp build/files/powrvideo/revpowrvideo.pkgd.js showcase/revcontent-api-showcase-powr-video-1.0/js/revpowrvideo.pkgd.js
cp build/revpowrvideo.min.js showcase/revcontent-api-showcase-powr-video-1.0/js/revpowrvideo.min.js
cp build/files/powrapi/revpowrapi.pkgd.js showcase/revcontent-api-showcase-powr-video-1.0/js/revpowrapi.pkgd.js
cp build/revpowrapi.min.js showcase/revcontent-api-showcase-powr-video-1.0/js/revpowrapi.min.js
rsync -rtv -e ssh ./showcase/revcontent-api-showcase-powr-video-1.0/* deepak@code.revcontent.com:/srv/www/revcontent.com/code/htdocs/mockrc11/deepak
