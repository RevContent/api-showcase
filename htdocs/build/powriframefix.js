(function () {
    document.querySelectorAll('iframe[class*="powr_embed"]').forEach(function(a,b){
	a.setAttribute("style", "width: 100%;");
	var d=a.offsetWidth;
	var h=parseInt(0.5625 * d);
	a.setAttribute("style", "width: 100%; height: " + h + "px;");
    });
})();
