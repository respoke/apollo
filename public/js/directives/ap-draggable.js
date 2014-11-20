/*!
 * Copyright 2014, Digium, Inc.
 * All rights reserved.
 *
 * This source code is licensed under The GPL v2 License found in the
 * LICENSE file in the root directory of this source tree.
 *
 * For all details and documentation:  https://www.respoke.io
 */
'use strict';
/**
 * Makes an element draggable. That element should have the css property
 * 'position' set to fixed.
 */
exports = module.exports = ['$window', function ($window) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var clientX = 0;
            var clientY = 0;
            var origX = 0;
            var origY = 0;

            var trackDrag = function (evt) {

                var moveX = clientX - evt.clientX;
                var moveY = clientY - evt.clientY;
                element[0].style.left = (origX -= moveX) + 'px';
                element[0].style.top = (origY -= moveY) + 'px';

                clientX = evt.clientX;
                clientY = evt.clientY;
                origX = parseFloat(element[0].style.left.replace('px', ''));
                origY = parseFloat(element[0].style.top.replace('px', ''));
            };
            var trackDragOff = function (evt) {
                $(document).off('mousemove', trackDrag);
                $(document).off('mouseup', trackDragOff);
                clientX = 0;
                clientY = 0;
            };
            var trackDragOn = function (evt) {
                origX = parseFloat(element[0].style.left.replace('px', '') || 0);
                origY = parseFloat(element[0].style.top.replace('px', '') || 0);
                clientX = evt.clientX;
                clientY = evt.clientY;
                $(document).on('mousemove', trackDrag);
                $(document).on('mouseup', trackDragOff);
            };

            element.on('mousedown', trackDragOn);

        }
    };
}];
