gulp build --widget=feed
cp build/files/feed/feed.pkgd.js showcase/revcontent-api-showcase-feed-1.0/js/feed.pkgd.js
rsync -rtv -e ssh ./showcase/revcontent-api-showcase-feed-1.0/* $1@code.revcontent.com:/srv/www/revcontent.com/code/htdocs/mockrc11/feedhack
