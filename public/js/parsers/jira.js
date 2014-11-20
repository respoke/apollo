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
 * Replace jira tickets with 'MER-3433' with the link to that jira ticket.
 */
exports = module.exports = function (jiraBaseURL) {

    return function jiraLinkReplacer(input, next) {
        var err = null;
        next(
            err,
            input.replace(/([^\/]|^)MER\-(\d+)/g, ' <a href="' + jiraBaseURL + 'MER-$2" target="_blank">MER-$2</a> ')
        );
    };

};
