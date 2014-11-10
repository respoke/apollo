/*!
 * Copyright (c) 2014, D.C.S. LLC. All Rights Reserved. Licensed Software.
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
