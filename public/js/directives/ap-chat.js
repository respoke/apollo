exports = module.exports = [
    '$rootScope',
    '$timeout',
    function ($rootScope, $timeout) {
        return {
            scope: false,
            link: function (scope, element, attrs) {
                var apOnscrolltop = attrs.apOnscrolltop ? scope.$eval(attrs.apOnscrolltop) : function (data) { };
                // load previous elements
                element.on('scroll', function (evt) {
                    if (evt.target.scrollTop === 0) {
                        apOnscrolltop();
                        $rootScope.autoScrollDisabled = true;
                        $timeout(function () {
                            $rootScope.autoScrollDisabled = false;
                        }, 1000);
                    }
                    if (evt.target.scrollHeight - evt.target.scrollTop < 600) {
                        $rootScope.autoScrollDisabled = false;
                    }
                    else {
                        $rootScope.autoScrollDisabled = true;
                    }
                });
            }
        };
    }
];
