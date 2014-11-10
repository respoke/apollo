/*!
 * Copyright (c) 2014, D.C.S. LLC. All Rights Reserved. Licensed Software.
 */
'use strict';
exports = module.exports = function () {
    return {
        link: function (scope, element, attrs) {
            element.bind("keypress", function (event) {
                if (event.which === 13 && !event.shiftKey) {
                    scope.$apply(function () {
                        scope.$eval(attrs.apEnter);
                    });
                    event.preventDefault();
                }
            });
        }
    };
};
