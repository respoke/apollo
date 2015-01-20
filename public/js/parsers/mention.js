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
var reMatchMentions = /\[\~([a-z0-9]+)\]/g;
/**
 * # mentionRenderer
 * 
 * Synchronously replace a person's username with their actual name.
 *
 * Example of its usage is in the apMessage directive.
 *
 * @param object people - an object where people's usernames are the hash keys
 * @param string inputText - the text message
 * @param function wrapFunction -
 */
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
