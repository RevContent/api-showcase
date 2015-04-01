jQuery(window).load(function($){
	"use strict";

	function eborLoadIsotope(){
		var $container = jQuery('#container'),
			$optionContainer = jQuery('#options'),
			$options = $optionContainer.find('a[href^="#"]').not('a[href="#"]'),
			isOptionLinkClicked = false;
		
		$container.isotope({
			itemSelector : '.element',
			resizable: false,
			masonry: { columnWidth: $container.width() / 12 },
			filter: '*',
			sortBy: 'original-order',
			sortAscending: true,
			transitionDuration: '0.6s',
			layoutMode: 'masonry',
			
		});
		
		  if( jQuery('body').hasClass('video-detail') )
		  $container.isotope({
			transformsEnabled: false,
		});	
			
		jQuery(window).smartresize(function(){
			$container.isotope({
				masonry: { columnWidth: $container.width() / 12 }
			});
		});
	  
		$options.click(function(){
		    var $this = jQuery(this),
		    	href = $this.attr('href');
		    	
		    if ( $this.hasClass('selected') ) {
		    	return;
		    } else {
		    	$options.removeClass('selected');
		    	$this.addClass('selected');
		    }

		    jQuery.bbq.pushState( '#' + href );
		    isOptionLinkClicked = true;
		    return false;
		});
	
		jQuery(window).bind( 'hashchange', function( event ){
			var theFilter = window.location.hash.replace( /^#/, '');
			
			if( theFilter == false )
				theFilter = 'home';
				
			$container.isotope({
				filter: '.' + theFilter
			});
			
			if ( isOptionLinkClicked == false ){
				$options.removeClass('selected');
				$optionContainer.find('a[href="#'+ theFilter +'"]').addClass('selected');
			}
			
			isOptionLinkClicked = false;
		}).trigger('hashchange');
		
		
	}
	
	/**
	 * Load isotope conditionally, if we've got a flexslider we wait until that's ready, otherwise go straight ahead.
	 */
	if ( jQuery('.flexslider')[0] ) {
		jQuery('.flexslider').flexslider({
		animation: "slide",
		start: function(slider){
		    setTimeout(function(){ eborLoadIsotope(); }, 420);
		}
	});
	} else {
		eborLoadIsotope();
	}
	
	jQuery('form').submit(function(){
		setTimeout(function(){
			$container.isotope('layout');
		}, 1000);
	});
	
	jQuery(window).trigger('resize').trigger('smartresize');
	
});

jQuery(window).load(function(){
	setTimeout(function(){
		jQuery('#container').isotope('reLayout');
	}, 1000);
});