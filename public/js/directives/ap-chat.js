'use strict';
/**
 * The chat window.
 * Parent scope must have $scope.selectedChat. (TODO refactor)
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
                    var bottomTopDiffSmall = evt.target.scrollHeight - evt.target.scrollTop < 400;
                    var chatWindowIsShort = evt.target.scrollTop / evt.target.scrollHeight > 0.7;
                    if (bottomTopDiffSmall || chatWindowIsShort) {
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
