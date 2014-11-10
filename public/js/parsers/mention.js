/*!
 * Copyright (c) 2014, D.C.S. LLC. All Rights Reserved. Licensed Software.
 */
'use strict';
exports = module.exports = function mentioner(inputText, next) {
    next(null, inputText.replace(/\[\~([a-z0-9]+)\]/g, '<span class="mentioned" data-mention="$1">@$1</span>'));
};
