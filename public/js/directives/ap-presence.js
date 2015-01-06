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
/**
 * Presence indication by circle color.
 */
exports = module.exports = [
    '$rootScope',
    '$timeout',
    function ($rootScope, $timeout) {
        return {
            scope: {
                presence: '@presence'
            },
            link: function (scope, element, attrs) {
                scope.colors = {
                    'unavailable': 'gray',
                    'available': 'text-success',
                    'busy': 'text-warning',
                    'away': 'text-danger',
                };
            },
            template: '<span class="presence"><i class="fa fa-circle {{colors[presence]}}"></i></span>'
        };
    }
];
