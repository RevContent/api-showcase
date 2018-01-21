( function( window, factory ) {
  'use strict';
    // browser global
    window.AnyGrid = factory(
      window.Outlayer
    );

}( window, function factory( Outlayer) {
'use strict';

var AnyGrid = Outlayer.create( 'anyGrid', {
    masonry: false,
    orderMasonry: true,
    stacked: false,
    perRow: {
        xxs: 1,
        xs: 1,
        sm: 2,
        md: 3,
        lg: 4,
        xl: 5,
        xxl: 6
    },
    breakpoints: {
        xxs: 0,
        xs: 250,
        sm: 500,
        md: 750,
        lg: 1000,
        xl: 1250,
        xxl: 1500
    },
    itemBreakpoints: {
        xxs: 200,
        xs: 275,
        sm: 350,
        md: 425,
        lg: 500,
        xl: 575,
        xxl: 650,
    },
    imageRatio: 'wide_rectangle',
    isLayoutInstant: true,
    hiddenStyle: {
        opacity: 0
    },
    visibleStyle: {
        opacity: 1
    },
    adjustGutter: false,
    removeVerticalGutters: false,
    column_spans: false
});

AnyGrid.prototype.getGreaterLessThanBreakPoints = function() {
  var breakpoints = [];
  var index = 0;
  var indexed = false;
  for (var key in this.options.breakpoints) {
    if (this.options.breakpoints.hasOwnProperty(key)) {
      breakpoints.push(key);
      if (this.getBreakPoint() == key) {
        indexed = true;
      }
      if (!indexed) {
        index++;
      }
    }
  }

  return {
    gt: breakpoints.slice(0, index),
    lt: breakpoints.slice(index + 1)
  }
};

AnyGrid.prototype.getBreakPoint = function() {
    return this.breakPoint;
};

AnyGrid.prototype.getPerRow = function() {
    return this.perRow;
};

/**
 * turn elements into Outlayer.Items to be used in layout
 * @param {Array or NodeList or HTMLElement} elems
 * @returns {Array} items - collection of new Outlayer Items
 */
AnyGrid.prototype._itemize = function( elems ) {

  var itemElems = this._filterFindItemElements( elems );
  var Item = this.constructor.Item;

  // create new Outlayer Items for collection
  var items = [];
  for ( var i=0, len = itemElems.length; i < len; i++ ) {
    var elem = itemElems[i];
    var item = new Item( elem, this );
    item.span = 1;
    for (var j = 0; j < this.options.column_spans.length; j++) {
      if ((!this.options.column_spans[j].media || window.matchMedia(this.options.column_spans[j].media).matches)
        && (!this.options.column_spans[j].selector || matchesSelector(item.element, this.options.column_spans[j].selector))) {
        item.span = this.options.column_spans[j].spans;
      }
    }
    items.push( item );
  }

  return items;
};

AnyGrid.prototype.resize = function() {
    if ( !this.isResizeBound || !this.needsResizeLayout() ) {
        return;
    }
    // this._setUp();
    this._resetLayout();
    this.emitEvent( 'resize', [ this ] );
    // this.layout(6);
    // this.emitEvent( 'resized', [ this ] );
};

AnyGrid.prototype._resetLayout = function(check) {
    this.rows = {};
    this.nextRow = 0;
    this.row = 0;
    this.rowCounter = 0;
    this.spanCounter = 0;
    this.nextColumn = 0;
    this.heights = {};
    this.maxHeight = 0;
    this.index = 0;

    this.getSize();

    this.containerWidth = this.size.outerWidth;

    if (this.containerWidth >= this.options.breakpoints.xxl) {
        this.perRow = this.options.perRow.xxl;
        this.breakPoint = 'xxl';
    }else if (this.containerWidth >= this.options.breakpoints.xl) {
        this.perRow = this.options.perRow.xl;
        this.breakPoint = 'xl';
    }else if (this.containerWidth >= this.options.breakpoints.lg) {
        this.perRow = this.options.perRow.lg;
        this.breakPoint = 'lg';
    }else if (this.containerWidth >= this.options.breakpoints.md) {
        this.perRow = this.options.perRow.md;
        this.breakPoint = 'md';
    }else if (this.containerWidth >= this.options.breakpoints.sm) {
        this.perRow = this.options.perRow.sm;
        this.breakPoint = 'sm';
    }else if (this.containerWidth >= this.options.breakpoints.xs) {
        this.perRow = this.options.perRow.xs;
        this.breakPoint = 'xs';
    }else {
        this.perRow = this.options.perRow.xxs;
        this.breakPoint = 'xxs';
    }

    if (!this.perRow) { // try to just set it to what was passed
        this.perRow = parseInt(this.options.perRow);
    }

    if (this.options.masonry) {
      this.columns = [];
      this.rows = {};
      for (var i = 0; i < this.perRow; i++) {
          this.columns[i] = 0;
      }
    } else {
      this.columns = {};
    }

    this.rowCount = this.options.rows[this.breakPoint] ? this.options.rows[this.breakPoint] : this.options.rows;
};

AnyGrid.prototype._postLayout = function() {
  this.resizeContainer();
  this.emitEvent( 'postLayout', [ this ] );
};

AnyGrid.prototype._create = function() {
    this.items = [];
    // this.reloadItems();

    this.element.style.position = "relative";

    if ( this.options.isResizeBound ) {
        this.bindResize();
    }

    this._resetLayout('create');
};


AnyGrid.prototype.getComputedStyle = function (el) {
    if (getComputedStyle !== 'undefined') {
        return getComputedStyle(el, null);
    } else {
        return el.currentStyle;
    }
};


AnyGrid.prototype.getItemBreakpoint = function(width) {
    if (width >= this.options.itemBreakpoints.xxl) { // 650
        return 'xxl';
    }else if (width >= this.options.itemBreakpoints.xl) { // 575
        return 'xl';
    }else if (width >= this.options.itemBreakpoints.lg) { // 500
        return 'lg';
    }else if (width >= this.options.itemBreakpoints.md) { // 425
        return 'md';
    }else if (width >= this.options.itemBreakpoints.sm) { // 350
        return 'sm';
    }else if (width >= this.options.itemBreakpoints.xs) { // 275
        return 'xs';
    }else { // 200
        return 'xxs';
    }
};

AnyGrid.prototype.getGreaterLessThanBreakPoints = function(breakpoint) {
    var breakpoints = [];
    var index = 0;
    var indexed = false;
    for (var key in this.options.itemBreakpoints) {
        if (this.options.itemBreakpoints.hasOwnProperty(key)) {
        breakpoints.push(key);
        if (breakpoint == key) {
            indexed = true;
        }
        if (!indexed) {
            index++;
        }
    }
  }

  return {
    gt: breakpoints.slice(0, index),
    lt: breakpoints.slice(index + 1)
  }
};

AnyGrid.prototype.setImageSize = function(item) {
    var setImageSize = function(ratio) {
        switch(ratio) {
            case 'rectangle':
                item.imageHeight = 300;
                item.imageWidth = 400;
                break;
            case 'wide_rectangle':
                item.imageHeight = 450;
                item.imageWidth = 800;
                break;
            case 'tall_rectangle':
                item.imageHeight = 400;
                item.imageWidth = 300;
                break;
            case 'square':
                item.imageHeight = 400;
                item.imageWidth = 400;
            default:
                var ratioParts = ratio.split(':');
                if (ratioParts[0] && ratioParts[1]) {
                    item.imageWidth = ratio.split(':')[0];
                    item.imageHeight = ratio.split(':')[1];
                } else { // something went horribly wrong just do this
                    item.imageHeight = 300;
                    item.imageWidth = 400;
                }
        }
    }

    setImageSize(this.options.imageRatio);

    if (revUtils.isArray(this.options.imageRatio)) {
        for (var i = 0; i < this.options.imageRatio.length; i++) {
            if ((!this.options.imageRatio[i].media || window.matchMedia(this.options.imageRatio[i].media).matches)
                && (!this.options.imageRatio[i].selector || matchesSelector(item.element, this.options.imageRatio[i].selector))) {
                setImageSize(this.options.imageRatio[i].ratio);
            }
        }
    }
};

AnyGrid.prototype._getItemLayoutPosition = function( item ) {
    var computedStyle = this.getComputedStyle(item.element);
    var paddingLeft = parseInt(computedStyle.getPropertyValue('padding-left'));
    var paddingRight = parseInt(computedStyle.getPropertyValue('padding-right'));

    var width = ((this.containerWidth / this.perRow) + ((paddingLeft + paddingRight) / this.perRow)) * item.span;

    item.element.style.width = width + 'px';

    if (this.index == 0 && this.options.adjustGutter) {
      this.element.parentNode.style.marginLeft = (paddingLeft * -1) + 'px';
    }

    item.width = width;
    item.breakpoint = this.getItemBreakpoint(width);
    item.greaterLessThanBreakPoints = this.getGreaterLessThanBreakPoints(item.breakpoint);
    var image = item.element.querySelector('.rev-image');
    if (image) {
      this.setImageSize(item);
      var rect = image.getBoundingClientRect();
      var imageWidth = Number(Math.round((rect.width ? rect.width : (rect.right - rect.left)) + 'e2') + 'e-2');

      item.preloaderHeight = Number(Math.round((imageWidth * (item.imageHeight / item.imageWidth)) + 'e2') + 'e-2');
      item.preloaderWidth =  Number(Math.round((item.preloaderHeight * (item.imageWidth / item.imageHeight)) + 'e2') + 'e-2');

      image.style.height = item.preloaderHeight + 'px';
    }

    if (this.stacking) {
      var stacking = true;
    } else {
      var stacking = false;
    }

    var row = this.nextRow;
    this.row = row;

    var column = this.nextColumn;

    item.row = row;
    item.column = column;

    if (!this.rows[row]) {
      this.rows[row] = {
          top: 0,
          count: 0,
          maxHeight: 0
      };
    }

    if (!this.rows[row].perRow) {
      this.rows[row].perRow = this.perRow;
    }

    // revUtils.removeClass(item.element, 'rev-content-', true);

    var className = 'rev-content';

    className += ' rev-content-' + item.type;
    // revUtils.addClass(item.element, 'rev-content-' + item.type);

    className += ' rev-content-breakpoint-' + item.breakpoint;


    // revUtils.addClass(item.element, 'rev-content-breakpoint-' + item.breakpoint);
    // var greaterLessThanBreakPoints = this.getGreaterLessThanBreakPoints(breakpoint);
    for (var i = 0; i < item.greaterLessThanBreakPoints.gt.length; i++) {
      className += ' rev-content-breakpoint-gt-' + item.greaterLessThanBreakPoints.gt[i];
    }
    for (var i = 0; i < item.greaterLessThanBreakPoints.lt.length; i++) {
      className += ' rev-content-breakpoint-lt-' + item.greaterLessThanBreakPoints.lt[i];
    }

    className += ' rev-content-row-' + (row);

    item.element.className = className;


    if (this.perRow === 1) {

        this.rowCounter++;

        if (this.rowCounter == this.rows[row].perRow) {
            this.rowCounter = 0;
            this.spanCounter = 0;
            this.nextRow++;
        }

        return {
            x: false,
            y: false
        }
    } else if (this.options.masonry) {
        item.getSize();

        var column = this.index % this.columns.length;

        var x = column * width;
        var y = this.columns[column];

        var itemHeight = (this.options.itemHeight ? this.options.itemHeight : item.size.height);

        this.rowsCount = (this.items.length / this.columns.length);

        if (this.options.orderMasonry) {
            this.columns[column] = this.columns[column] + item.size.height;
            this.maxHeight = Math.max(this.maxHeight, this.columns[column]);
        } else {
            var minimumY = Math.min.apply( Math, this.columns );
            var shortColIndex = this.columns.indexOf( minimumY );
            var x = width * shortColIndex;
            var y = minimumY;
            this.columns[ shortColIndex ] = minimumY + itemHeight;
            this.maxHeight = Math.max.apply( Math, this.columns );
        }

        this.rows[row] = this.rows[row] || {};
        if (!this.rows[row].maxHeight || (this.columns[column] > this.rows[row].maxHeight)) {
            this.rows[row].maxHeight = this.columns[column];
        }
        if (!this.rows[row].height || (itemHeight > this.rows[row].height)) {
            this.rows[row].height = itemHeight;
        }

        this.rowCounter++;

        if (this.rowCounter == this.rows[row].perRow) {
            this.rowCounter = 0;
            this.spanCounter = 0;
            this.nextRow++;
        }

        this.index++;

        return {
          x: x,
          y: y
        }
    }
};

Outlayer.prototype._positionItem = function( item, x, y, isInstant ) {

    if (x === false && y === false) {
        item.element.style.position = 'relative';
        item.element.style.top = null;
        item.element.style.left = null;
        return;
    }

    item.element.style.position = 'absolute';

    if ( isInstant ) {
        // if not transition, just set CSS
        item.goTo( x, y );
    } else {
        item.moveTo( x, y );
    }
};

AnyGrid.prototype._getContainerSize = function() {
    return {
        height: this.perRow === 1 ? 'auto' : this.maxHeight
    };
};

return AnyGrid;

}));