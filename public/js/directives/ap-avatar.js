exports = module.exports = ['crypto', function (crypto) {
    return {
        restrict: 'A',
        scope: {
            'email': '=email'
        },
        link: function (scope, element, attrs) {
            element[0].src = 'https://secure.gravatar.com/avatar/';
            if (scope.email) {
                element[0].src += crypto.createHash('md5').update(scope.email).digest("hex");
            }
        }
    };
}];
