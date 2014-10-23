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
    'scrollChatToBottom',
    '$timeout',

    function ($sce, $rootScope, middleware, scrollChatToBottom, $timeout) {
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
                        $timeout(function () {
                            var mentions = $(element).find('.mentioned');
                            mentions.each(function () {
                                var _id = ($(this).data('mention') || '').replace('@', '');

                                if (_id && $rootScope.recents[_id]) {
                                    $(this).text('@' + $rootScope.recents[_id].display);
                                }
                            });
                        });

                        $timeout(function () {
                            var imgs = element.find('img');
                            if (imgs.length) {
                                imgs.on('load', function (evt) {
                                    scrollChatToBottom();
                                });
                            }
                            else {
                                scrollChatToBottom();
                            }
                        });
                    }
                };
                
                next(null, scope.content);
            },
            template: '<div class="message" ng-bind-html="trustAsHtml(content)"></div>'
        };
    }
];
