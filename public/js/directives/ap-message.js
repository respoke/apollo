/*!
 * Copyright 2014, Digium, Inc.
 * All rights reserved.
 *
 * This source code is licensed under The GPL v2 License found in the
 * LICENSE file in the root directory of this source tree.
 *
 * For all details and documentation:  https://www.respoke.io
 */
/* global $ */
'use strict';
/**
 * A chat message, intended to be inside of the ap-chat directive.
 */
exports = module.exports = [

    '$sce', // secure context environment for overriding html
    '$rootScope',

    // from client-config.js
    'messageRenderingMiddleware',
    'mentionRenderer',
    'scrollChatToBottom',
    '$timeout',

    function ($sce, $rootScope, middleware, mentionRenderer, scrollChatToBottom, $timeout) {
        // First, validate that the middleware functionas are valid
        var invalidMiddlware = new Error("ap-message middleware must be an array of functions");
        if (!middleware || !(middleware instanceof Array)) {
            throw invalidMiddlware;
        }
        middleware.forEach(function (mw) {
            if (typeof mw !== 'function') {
                throw invalidMiddlware;
            }
        });

        return {
            scope: true,
            link: function (scope, element, attrs) {
                scope.trustAsHtml = $sce.trustAsHtml;

                scope.content = scope.$eval(attrs.apContent || '');
                scope.file = scope.$eval(attrs.apFile || '');

                var mwIndex = -1;
                // Use each of the middleware to async render the content.
                // Then render a file descriptor, if it exists.
                var next = function (err, renderedContent) {
                    if (err) {
                        scope.content = err;
                        return;
                    }
                    scope.content = renderedContent;
                    mwIndex++;
                    if (mwIndex < middleware.length) {
                        middleware[mwIndex](scope.content, next);
                    }
                    // when middleware is done
                    else {
                        // apply mentions
                        scope.content = mentionRenderer(
                            $rootScope.recents,
                            scope.content,
                            function (input) {
                                return '<span class="mentioned">@' + input + '</span>';
                            }
                        );
                        $timeout(scrollChatToBottom);
                        // async render images
                        if (scope.content.indexOf('<img') !== -1) {
                            $timeout(function () {
                                var imgs = element.find('img');
                                if (imgs.length) {
                                    imgs.on('load', function (evt) {
                                        scrollChatToBottom();
                                    });
                                }
                            });
                        }
                    }
                };

                next(null, scope.content);
            },
            template: '<div class="message" ng-bind-html="trustAsHtml(content)"></div>'
        };
    }
];
