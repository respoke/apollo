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
