/*!
 * Copyright 2014, Digium, Inc.
 * All rights reserved.
 *
 * This source code is licensed under The AGPL v3 License found in the
 * LICENSE file in the root directory of this source tree.
 *
 * For all details and documentation:  https://www.respoke.io
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
