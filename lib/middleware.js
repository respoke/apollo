exports.isAuthorized = function (req, res, next) {
    if (!req.user || !req.user._id) {
        return res.status(401).send({ message: "Not authorized." });
    }
    next();
};
