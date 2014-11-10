/*!
 * Copyright (c) 2014, D.C.S. LLC. All Rights Reserved. Licensed Software.
 */
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
                    var elem = $(evt.target);
                    var bottomTopDiffSmall = elem[0].scrollHeight - elem.scrollTop() === elem.outerHeight();
                    if (bottomTopDiffSmall) {
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
