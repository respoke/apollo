'use strict';
/**
 * A directive for showing a gravatar on an image.
 * Usage:
 *
 *      <img ap-avatar email="billy@respoke.io" />
 *
 */
exports = module.exports = ['crypto', 'clientConfig', function (crypto, clientConfig) {
    return {
        restrict: 'A',
        scope: {
            'email': '=email'
        },
        link: function (scope, element, attrs) {
            scope.gravatar = function () {
                if (scope.email) {
                    var h = crypto.createHash('md5').update(scope.email).digest("hex");
                    element[0].src = 'https://secure.gravatar.com/avatar/' + h + '?d=retro';
                }
                else {
                    element[0].src = '/img/avatar.png';
                }
            };
            scope.$watch('email', scope.gravatar);
        }
    };
}];
