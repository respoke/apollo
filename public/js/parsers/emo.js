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
