'use strict';
/**
 * Change the scroll position so it is "n" elements down.
 * This fixes the scroll position from being at the very top
 * when loading previous messages on scroll.
 */
exports = module.exports = function () {
    var chat = document.getElementById('chat');
    return function (nRows) {
        var rows = document.querySelectorAll('#chat-table tr');
        if (!rows || !rows.length) {
            return;
        }
        var totalHeight = 0;
        for (var i=0; i<nRows && i<rows.length; i++) {
            totalHeight += rows[i].offsetHeight
        }
        // console.log('paddTopScroll', nRows, totalHeight);
        chat.scrollTop = totalHeight;
    };
};
