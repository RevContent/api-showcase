gulp build --widget=powrvideo
cp showcase/revcontent-api-showcase-powr-video-1.0/js/powriframefix.js build/powriframefix.js

cp build/files/powrvideo/revpowrvideo.pkgd.js showcase/revcontent-api-showcase-powr-video-1.0/js/revpowrvideo.pkgd.js
cp build/files/powrutils/revpowrutils.pkgd.js showcase/revcontent-api-showcase-powr-video-1.0/js/revpowrutils.pkgd.js
cp build/revpowrvideo.min.js showcase/revcontent-api-showcase-powr-video-1.0/js/revpowrvideo.min.js
cp build/revpowrutils.min.js showcase/revcontent-api-showcase-powr-video-1.0/js/revpowrutils.min.js
rsync -rtv -e ssh ./showcase/revcontent-api-showcase-powr-video-1.0/* $1@code.revcontent.com:/srv/www/revcontent.com/code/htdocs/mockrc11/powr3
