gulp build --widget=powrvideo
cp build/files/powrvideo/revpowrvideo.pkgd.js showcase/revcontent-api-showcase-powr-video-1.0/js/revpowrvideo.pkgd.js
cp build/revpowrvideo.min.js showcase/revcontent-api-showcase-powr-video-1.0/js/revpowrvideo.min.js
rsync -rtv -e ssh ./showcase/revcontent-api-showcase-powr-video-1.0/* $1@code.revcontent.com:/srv/www/revcontent.com/code/htdocs/mock/powr
# rsync -rtv -e ssh ./showcase/revcontent-api-showcase-powr-video-1.0/* root@alpha.powr.com:powr/src/main/webapp/demo
