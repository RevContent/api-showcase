/**
 * Revcontent View Event
 */

( function( window, factory ) {
    /*global define: false, module: false, require: false */
    'use strict';
    // universal module definition
    // browser global
    window.revView = factory(
        window,
        window.revApi,
        window.revUtils
    );

}( window, function factory( window, revApi, revUtils ) {

    'use strict';

    var view = {};

    var widget;

    view.init = function(that) {
        widget = that;
        revUtils.addEventListener(window, 'scroll', view.viewable);
        view.viewable();
    };

    view.viewable = function() {
        var viewBottom = (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight)
            + (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop);
        var divTop = document.getElementById(widget.containerElement.id).getBoundingClientRect().top;

        if(viewBottom >= divTop) {
            revUtils.removeEventListener(window, 'scroll', view.viewable);

            var count = widget.perRow;

            var viewsUrl = widget.options.url + '?uitm=true&viewed=true&api_key='+ widget.options.api_key +'&pub_id='+ widget.options.pub_id +'&widget_id='+ widget.options.widget_id +'&domain='+ widget.options.domain +'&api_source=' + widget.source;
            viewsUrl += '&sponsored_count=' + (widget.options.internal ? 0 : count) + '&internal_count=' + (widget.options.internal ? count : 0) + '&sponsored_offset=0&internal_offset=0';

            revApi.request(viewsUrl, function() { return });
        }
    };

    return view;

}));