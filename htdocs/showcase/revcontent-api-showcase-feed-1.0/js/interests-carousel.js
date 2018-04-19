/*
Project: EngageInterestsCarousel
Version: 1
Author: michael@revcontent.com
*/

// universal module definition
( function( window, factory ) {
    'use strict';
    // browser global
    window.EngageInterestsCarousel = factory(window, window.revUtils);

}( window, function factory(window, revUtils) {
'use strict';

    var EngageInterestsCarousel = function(opts) {

        var defaults = {
            per_row: {
                xxs: 1,
                xs: 2,
                sm: 3,
                md: 4,
                lg: 5,
                xl: 6,
                xxl: 7
            },
            breakpoints: {
                xxs: 0,
                xs: 350,
                sm: 550,
                md: 750,
                lg: 950,
                xl: 1150,
                xxl: 1350
            },
            cell_margin: 8, // TODO make this relative to container
            next_width_percentage: 20,
            next_width: false,
            item: false
        };

        // merge options
        this.options = Object.assign(defaults, opts);

        this.init();
    };

    EngageInterestsCarousel.prototype.init = function() {
        this.containerElement = document.createElement('div');
        this.containerElement.className = 'rev-carousel-container';

        this.header = document.createElement('h1');
        this.header.innerHTML = '<span></span><small><sup></sup></small>';

        this.flickityContainer = document.createElement('div');
        this.flickityContainer.id = 'rev-feed-interests';
        this.flickityContainer.className = 'feed-interests-carousel';

        revUtils.append(this.options.item.element, this.containerElement);
        revUtils.append(this.containerElement, this.header);
        revUtils.append(this.containerElement, this.flickityContainer);

        this.setUp();

        // create flickity
        this.flickity = new Flickity( this.flickityContainer, {
            wrapAround: false,
            prevNextButtons: false,
            pageDots: false,
            adaptiveHeight: true,
            freeScroll: true,
            // freeScroll: false,
            selectedAttraction: 0.15,
            freeScrollFriction: 0.03,
            // cellAlign: 'left',
            percentPosition: false
        });

        var that = this;

        this.flickity.on( 'staticClick', function( event, pointer, cellElement, cellIndex ) {
            var target = event.target || event.srcElement;
            if ( !cellElement ) {
                return;
            }
            if (target.classList.contains('selector')) {
                var interestId = parseInt(cellElement.getAttribute('data-id'), 10);
                if (cellElement.classList.contains('selected-interest')) {
                    cellElement.classList.remove('selected-interest');
                    cellElement.querySelectorAll('span.selector')[0].classList.remove('subscribed');

                    that.options.emitter.emitEvent('updateInterstsSubscription', ['unsubscribe', interestId]);
                    //that.notify('Topic removed from your feed.', {label: 'continue', link: '#'});
                } else {
                    cellElement.classList.add('selected-interest');
                    cellElement.querySelectorAll('span.selector')[0].classList.add('subscribed');
                    that.options.emitter.emitEvent('updateInterstsSubscription', ['subscribe', interestId]);
                    //that.notify('Topic added, new content available.', {label: 'continue', link: '#'});
                }
            }

            if (target.classList.contains('cell-wrapper') || target.classList.contains('interest-title')) {
                that.options.emitter.emitEvent('feedLink', ['topic', {
                    reason_topic_id: parseInt(cellElement.getAttribute('data-id'), 10),
                    reason_topic: cellElement.getAttribute('data-title'),
                    iconHtml: '<span class="rev-headline-icon-image" style="background-image:url(' + cellElement.getAttribute('data-image') + '&h=36&w=36' + ')"></span>'
                }]);
            }

        });

        this.flickity.on( 'dragStart', function( event, pointer ) {
            that.flickityContainer.classList.add('is-dragging');
        });

        this.flickity.on( 'dragEnd', function( event, pointer ) {
            that.flickityContainer.classList.remove('is-dragging');
        });
    };

    EngageInterestsCarousel.prototype.update = function(data, authenticated, topic_id) {
        if(typeof data !== "object" || (typeof data == "object" && data.length == 0)) {
            this.options.item.element.setAttribute('style','margin:0!important;padding:0!important;height:0;border:0');
            this.options.item.element.classList.add('revcontent-carousel-is-empty');
            this.options.item.element.classList.add('revcontent-remove-element');
            return;
        }


        var pubDomain = this.options.domain?revUtils.capitalize(this.options.domain):revUtils.capitalize(revUtils.extractRootDomain(window.location.href));
        var title = "Trending topics on " + pubDomain;
        var sub = '';
        if (authenticated) {
            title = 'Content You Love';
            sub = 'SIMILAR TOPICS';
        }

        this.header.querySelector('h1 span').innerText = title;
        this.header.querySelector('h1 small sup').innerText = sub;

        var interests_data = data;

        var interests_count = 0;
        var initialIndex = 3;
        var topicFeed = topic_id > 0;
        if (typeof interests_data !== 'undefined') {
            if (topicFeed) {
                interests_data = interests_data.filter(function (t) {
                    return t.id != topic_id;
                });
            }
            interests_count = interests_data.length;
            if (topicFeed && interests_count >= 6) {
                initialIndex = 6;
            }
        }

        var cells = [];

        for (var i=0; i < interests_count; i++) {
            var interest = interests_data[i];
            var cell = document.createElement('div');
            cell.style.width = this.columnWidth + 'px';
            cell.style.marginRight = this.options.cell_margin + 'px';
            if (interest.image) {
                cell.style.background = 'transparent url(' + interest.image + ') top left no-repeat';
                cell.style.backgroundSize = 'cover';
            }
            cell.setAttribute('data-id', interest.id);
            cell.setAttribute('data-title', interest.title);
            cell.setAttribute('data-image', interest.image);
            cell.setAttribute('data-interest', interest.title.toLowerCase());

            cell.className = 'carousel-cell interest-cell interest-' + interest.title.toLowerCase() + ' selected-interest';

            cell.innerHTML = '<div class="cell-wrapper">' +
                (authenticated ? '<span class="selector subscribed"></span>' : '') +
                    '<div class="interest-title ' + (interest.lightMode ? ' light-mode' : '') + '">' + interest.title + '</div>' +
                '</div>';

            cells.push(cell);
        }

        this.flickity.remove(this.options.item.element.querySelectorAll('.carousel-cell'));

        this.flickity.append(cells);

        this.flickity.reposition();

        this.flickity.select(initialIndex, false, true);
    };

    EngageInterestsCarousel.prototype.setUp = function() {
        this.containerWidth = this.containerElement.offsetWidth;

        // determine elements per row based on container width
        if (typeof this.options.per_row == 'number') { // if a number is passed just use that
            this.perRow = this.options.per_row;
        }else if (this.containerWidth >= this.options.breakpoints.xxl) {
            this.perRow = this.options.per_row.xxl;
        }else if (this.containerWidth >= this.options.breakpoints.xl) {
            this.perRow = this.options.per_row.xl;
        }else if (this.containerWidth >= this.options.breakpoints.lg) {
            this.perRow = this.options.per_row.lg;
        }else if (this.containerWidth >= this.options.breakpoints.md) {
            this.perRow = this.options.per_row.md;
        }else if (this.containerWidth >= this.options.breakpoints.sm) {
            this.perRow = this.options.per_row.sm;
        }else if (this.containerWidth >= this.options.breakpoints.xs) {
            this.perRow = this.options.per_row.xs;
        }else {
            this.perRow = this.options.per_row.xxs;
        }

        var width = this.containerWidth / this.perRow;

        // this.margin = this.options.cell_margin ? this.options.size.cell_margin : ((width * this.marginMultiplier).toFixed(2) / 1);

        if (this.options.next_width) { // percentage of the columnWidth
            this.columnWidth = (((this.containerWidth - (this.options.cell_margin * this.perRow)) / (this.perRow)).toFixed(2) / 1);
            this.columnWidth = this.columnWidth - (this.options.next_width / this.perRow);
        } else if (this.options.next_width_percentage) { // fixed
            this.columnWidth = (((this.containerWidth - (this.options.cell_margin * this.perRow)) / (this.perRow)).toFixed(2) / 1);
            this.columnWidth = this.columnWidth - (((this.options.next_width_percentage * .01) * this.columnWidth) / this.perRow);
        } else { // half
            this.columnWidth = (((this.containerWidth - (this.options.cell_margin * this.perRow)) / (this.perRow + (1/2))).toFixed(2) / 1);
        }
    };

    // TODO
    // EngageInterestsCarousel.prototype.resize = function() {
    // };

    return EngageInterestsCarousel;
}));