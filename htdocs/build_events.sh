gulp build --widget=rcevents
cp build/files/rcevents/revrcevents.pkgd.js showcase/revcontent-api-showcase-events-api-1.0/js/revrcevents.pkgd.js
rsync -rtv -e ssh ./showcase/revcontent-api-showcase-events-api-1.0/* $1@code.revcontent.com:/srv/www/revcontent.com/code/htdocs/mockrc11/events
