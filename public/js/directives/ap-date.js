/*!
 * Copyright 2014, Digium, Inc.
 * All rights reserved.
 *
 * This source code is licensed under The GPL v2 License found in the
 * LICENSE file in the root directory of this source tree.
 *
 * For all details and documentation:  https://www.respoke.io
 */
'use strict';
/**
 * This used to be a filter, however custom filters in angular to not update automatically
 * during $digest, so it was refactored into an attribute directive.
 */
exports = module.exports = ['moment', function (moment) {
    var oneMinute = 1000 * 60;
    var oneHour = 60 * oneMinute;
    var oneDay = 24 * oneHour;
    var oneWeek = 7 * oneDay;
    var oneYear = 52 * oneWeek; // ok it's not perfect

    function makeReadableDate(item) {
        if (!item) {
            return item;
        }

        var now = moment();
        var date = moment(item.toString());
        var diff = now.diff(date);

        if (!diff) {
            return now.fromNow();
        }
        else if (diff < oneMinute) {
            return 'just now';
        }
        else if (diff < oneHour) {
            return date.fromNow(true);
        }
        // it was yesterday, but not a full 24 hrs ago
        else if (diff < oneDay && date.format('dd') === now.format('dd')) {
            return date.format('h:mm a');
        }
        // it was today
        else if (diff < oneDay * 1.3) {
            return date.format('ddd ha');
        }
        else if (diff < oneWeek) {
            return date.format('dddd');
        }
        else if (diff < oneYear) {
            return date.format('MMM Do');
        }
        else {
            return date.format('MMM Do, YYYY');
        }
    }

    return {
        restrict: 'A',
        scope: {
            'date': '=apDate'
        },
        controller: ['$scope', function ($scope) {
            $scope.makeReadableDate = makeReadableDate;
        }],
        template: '{{ makeReadableDate(date) }}'
    };
}];
