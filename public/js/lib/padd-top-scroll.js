/*!
 * Copyright 2014, Digium, Inc.
 * All rights reserved.
 *
 * This source code is licensed under The AGPL v3 License found in the
 * LICENSE file in the root directory of this source tree.
 *
 * For all details and documentation:  https://www.respoke.io
 */
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
            totalHeight += rows[i].offsetHeight;
        }
        chat.scrollTop = totalHeight;
    };
};
