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
 * Turn things into icons.
 * A few emoticons are supported.
 *  :)  :-)  :(  :-(  :'(  \o/
 * All font-awesome icons are `:name` which will output `<i class="fa fa-name"></i>`.
 */
exports = module.exports = function emojiIconRenderer(input, next) {
    var err = null;
    next(
        err,
        input
            .replace(/\:\)|\:\-\)/g, '<i class="fa fa-smile-o"></i>')
            .replace(/\:\(|\:\-\(/g, '<i class="fa fa-frown-o"></i>')
            .replace(/\\\o\//g, '<i class="fa fa-child"></i>')
            // font awesome icons
            .replace(/\:([a-z\-]+)\b\:/g, '<i class="fa fa-$1"></i>')
    );
};
