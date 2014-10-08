exports = module.exports = [
    
    '$sce',

    // from client-config.js
    'messageRenderingMiddleware',
    'scrollChatToBottom',

    function ($sce, middleware, scrollChatToBottom) {
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
                    else {
                        setTimeout(function () {
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
            template: '<div ng-bind-html="trustAsHtml(content)"></div>'
        };
    }
];
