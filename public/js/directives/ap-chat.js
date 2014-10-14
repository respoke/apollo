'use strict';
/**
 * The chat window.
 * The parent scope **must** implement the object `selectedChat`.
 */
exports = module.exports = [
    '$rootScope',
    '$timeout',
    function ($rootScope, $timeout) {
        return {
            scope: false,
            link: function (scope, element, attrs) {
                $rootScope.autoScrollDisabled = false;

                var apOnscrolltop = attrs.apOnscrolltop 
                    ? scope.$eval(attrs.apOnscrolltop) 
                    : function (data) { };

                // load previous elements
                element.on('scroll', function (evt) {
                    if (evt.target.scrollTop === 0) {
                        apOnscrolltop();
                    }
                    // scroll automatically when close to the bottom of the chat window.
                    if (evt.target.scrollHeight - evt.target.scrollTop < 600
                        || evt.target.scrollTop / evt.target.scrollHeight > 0.7
                    ) {
                        $rootScope.autoScrollDisabled = false;
                    }
                    else {
                        $rootScope.autoScrollDisabled = true;
                    }
                });
            },
            controller: 'ChatController'
        };
    }
];
