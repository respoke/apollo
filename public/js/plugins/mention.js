exports = module.exports = function (inputText, next) {
    next(inputText.replace(/\[\~([a-z0-9]+)\]/g, '<span class="mentioned $1">@$1</span>'));
};
