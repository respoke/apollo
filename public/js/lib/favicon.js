'use strict';
/**
 * Custom favicon with count.
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
            ctx.fillStyle = '#F0EEDD';
            if (count > 99) {
                ctx.fillText('99+', 0, 9);
            }
            else if (count) {
                ctx.fillText(count, 0, 9);
            }
            link.href = canvas.toDataURL('image/png');
        };
        img.src = '/favicon.ico';
    }
};
