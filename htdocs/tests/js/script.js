(function(){
    var pathParts = window.location.pathname.split('/');
    // active env button
    var button = document.getElementById(pathParts[pathParts.length - 1].replace('.html', '') + '-button');
    if (button) {
        button.classList.add('mdl-button--colored');
    }
    // active env link
    var link = document.getElementById(pathParts[pathParts.length - 2] + '-link').classList.add('active');
    if (link) {
        link.classList.add('active')
    }

})()