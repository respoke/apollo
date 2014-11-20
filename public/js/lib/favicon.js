/*!
 * Copyright 2014, Digium, Inc.
 * All rights reserved.
 *
 * This source code is licensed under The GPL v2 License found in the
 * LICENSE file in the root directory of this source tree.
 *
 * For all details and documentation:  https://www.respoke.io
 */
/* global WIN */
'use strict';
/**
 * Favicon with count of unread messages.
 */
exports = module.exports = function (count) {
    var canvas = document.createElement('canvas');
    var ctx;
    var img = document.createElement('img');
    var link = document.getElementById('favicon');

    if (canvas.getContext) {
        canvas.height = canvas.width = 16; // set the size
        ctx = canvas.getContext('2d');
        img.onload = function () { // once the image has loaded
            ctx.drawImage(this, 0, 0);
            ctx.font = '9px "helvetica", sans-serif';
            ctx.fillStyle = '#000000';
            if (count > 9) {
                ctx.fillText('+', 10, 9);
            }
            else if (count) {
                ctx.fillText(count, 10, 9);
            }
            link.href = canvas.toDataURL('image/png');
        };
        img.src = '/favicon.ico';
    }

    // node-webkit
    if (typeof WIN !== 'undefined' && WIN.setBadgeLabel) {
        WIN.setBadgeLabel(count || '');
    }
};
