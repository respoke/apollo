'use strict';
/**
 * A sorting filter which accepts an object where the keys are the `_id` and the
 * values are the `Account` or `Group`.
 * 
 * This establishes the sort order of the buddy list / recent conversations. It has 
 * some built-in assumptions and business logic.
 */
exports = module.exports = function () {
    return function (items) {
        var filtered = [];
        angular.forEach(items, function (item) {
            filtered.push(item);
        });
        filtered.sort(function (a, b) {

            // -1 means closer to beginning of array
            // +1 means closer to end of array
            // 0  means leave it how it is

            // Users and groups are both in the sidebar.
            // Groups do not have a display or presence property.

            // Rank the most recent conversations at the top.

            // If a conversation has a message, and the other doesn't, then it is 
            // more recent.
            if (a.messages && a.messages.length && b.messages && !b.messages.length) {
                return -1;
            }
            if (a.messages && !a.messages.length && b.messages && b.messages.length) {
                return 1;
            }
            // Compare the latest message dates, if they exist, and rank the
            // more recent conversation higher - whether it is a group or person.
            if (a.messages && b.messages && a.messages.length && b.messages.length) {
                var adate = +new Date(a.messages[a.messages.length - 1].created);
                var bdate = +new Date(b.messages[b.messages.length - 1].created);
                console.log('adate', adate);
                console.log('bdate', bdate);
                if (adate > bdate) {
                    return -1;
                }
                if (adate < bdate) {
                    return 1;
                }
            }

            // In general, groups higher than people.
            var aIsGroup = !a.display;
            var bIsGroup = !b.display;
            if (!aIsGroup && bIsGroup) {
                return 1;
            }
            if (aIsGroup && !bIsGroup) {
                return -1;
            }

            // In general, rank people who are available higher than those who are 
            // unavailable.
            if (a.presence !== 'unavailable' && b.presence === 'unavailable') {
                return -1;
            }
            if (a.presence === 'unavailable' && b.presence !== 'unavailable') {
                return 1
            }
            return 0;
        });
        return filtered;
    };
};
