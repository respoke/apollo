/*!
 * Copyright (c) 2014, D.C.S. LLC. All Rights Reserved. Licensed Software.
 */
'use strict';
exports = module.exports = function () {
    return {
        scope: true,
        link: function (scope, element, attrs) {
            scope.settingKey = attrs.key;
            scope.setting = scope.$eval(attrs.initial);
        },
        controller: 'SettingsController',
        templateUrl: '/partials/ap-toggle-setting.html'
    };
};
