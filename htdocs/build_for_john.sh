gulp build --widget=feed2
cp build/files/feed2/revfeed2.pkgd.js showcase/revcontent-api-showcase-feed-1.0/js/revfeed2.pkgd.js
cp build/revfeed2.min.js showcase/revcontent-api-showcase-feed-1.0/js/revfeed2.min.js
rsync -rtv -e ssh ./showcase/revcontent-api-showcase-feed-1.0/* $1@code.revcontent.com:/srv/www/revcontent.com/code/htdocs/mock/feed4
