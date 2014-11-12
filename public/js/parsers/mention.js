/*!
 * Copyright (c) 2014, D.C.S. LLC. All Rights Reserved. Licensed Software.
 */
'use strict';
var reMatchMentions = /\[\~([a-z0-9]+)\]/g;
exports = module.exports = function mentioner(people, inputText, wrapFunction) {
    var matches = inputText.match(reMatchMentions);
    if (!matches || !matches.length) {
        return inputText;
    }
    matches.forEach(function (match) {
        var cleanId = match.replace(/\[|\~|\]/g, '');
        var replacer = people[cleanId].display;
        if (wrapFunction) {
            replacer = wrapFunction(replacer);
        }
        inputText = inputText.replace(new RegExp('\\[\\~' + cleanId + '\\]', 'g'), replacer);
    });
    return inputText;
};
