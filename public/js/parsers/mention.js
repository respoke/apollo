exports = module.exports = function mentioner(inputText, next) {
    next(null, inputText.replace(/\[\~([a-z0-9]+)\]/g, '<span class="mentioned" data-mention="$1">@$1</span>'));
};
