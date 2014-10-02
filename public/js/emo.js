/* 
 * Turn things into icons.
 * A few emoticons are supported.
 *  :)  :-)  :( :-(
 * All font-awesome icons are `:name` which will output `<i class="fa fa-name"></i>`.
 */
exports = module.exports = function (input) {
    return input
        .replace(/\:\)|\:\-\)/g, '<i class="fa fa-smile-o"></i>')
        .replace(/\:\(|\:\-\(/g, '<i class="fa fa-frown-o"></i>')
        // font awesome icons
        .replace(/\:([a-z\-]+)\b\:/g, '<i class="fa fa-$1"></i>');
};
