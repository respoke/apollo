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

exports.isAuthorized = function (req, res, next) {
    if (!req.user || !req.user._id) {
        res.status(401);
        next(new Error("Not authorized. You may need to log in first."));
        return;
    }
    next();
};

exports.fourOhFour = function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
};

// will respond with JSON or HTML depending upon request
exports.errorHandler = function (err, req, res, next) {
    err.status = err.status || (res.statusCode !== 200 ? res.statusCode : 500);

    var errOut = {
        error: err,
        message: err.message,
        status: err.status
    };
    var prefersJson = req.accepts(['html', 'json']);

    if (process.env.NODE_ENV !== 'production') {
        errOut.stack = err.stack;
    }

    res.status(err.status);

    if (prefersJson === 'json') {
        res.send(errOut);
        return;
    }
    else {
        res.render('error', errOut);
    }

};
