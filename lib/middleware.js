exports.isAuthorized = function (req, res, next) {
    if (!req.user || !req.user._id) {
        res.status(401);
        next(new Error("Not authorized. You may need to log in first."));
        return;
    }
    next();
};
