/*!
 * Copyright 2014, Digium, Inc.
 * All rights reserved.
 *
 * This source code is licensed under The AGPL v3 License found in the
 * LICENSE file in the root directory of this source tree.
 *
 * For all details and documentation:  https://www.respoke.io
 */
var express = require('express');
/**
 * Router attached at `/auth`.
 * @class auth
 */
var router = express.Router();
var passport = require('passport');
var middleware = require('../lib/middleware');
var config = require('../config');

/**
 * DELETE /session
 *
 * Log out
 * @returns object { message: '' }
 */
router.delete('/session', function (req, res) {
    req.logout();
    res.send({ message: 'Logged out' });
});

/**
 * GET /tokens
 *
 * Fetch a Respoke token brokered authentication. Endpoint ID is automatically assigned
 * as the logged in user `Account._id`.
 *
 * @returns object {
 *      token: '',
 *      appId: '',
 *      baseURL: '',
 *      systemGroupId: '',
 *      systemEndpointId: ''
 *  }
 */
router.get('/tokens', middleware.isAuthorized, function (req, res, next) {
    var authSettings = {
        endpointId: req.user._id,
        roleId: config.respoke.roleId
    };
    // return next(new Error('testing'));

    req.respoke.auth.endpoint(authSettings, function (err, authData) {
        if (err) {
            req.log.error('auth.endpoint', err);
            return next(new Error("Failed to get connection credentials for the chat provider."));
        }

        if (!authData || !authData.tokenId) {
            req.log.error('invalid response from Respoke auth.endpoint method', authData);
            return next(new Error("Invalid response from server. Please try again later."));
        }

        res.send({
            token: authData.tokenId,
            appId: req.respoke.appId,
            baseURL: config.respoke.baseURL,
            systemGroupId: config.systemGroupId,
            systemEndpointId: config.systemEndpointId
        });
    });
});

/**
 * POST /local
 *
 * Local login.
 * @arg string email  Account._id or email address
 * @arg string password
 * @returns object Account
 */
router.post('/local', function (req, res, next) {
    if (typeof req.body.email !== 'string') {
        return res.status(400).send({ message: 'Missing email or username.'});
    }
    req.db.Account.findOne()
    .or([{ _id: req.body.email.toLowerCase() }, { email: req.body.email.toLowerCase() }])
    .select('+password +conf')
    .exec(function (err, account) {
        if (err) {
            return next(err);
        }
        if (!account) {
            return res.status(400).send({ message: 'Incorrect username.' });
        }
        if (account.conf && account.conf.slice(0, 7) === 'confirm') {
            return res.status(400).send({
                message: 'Your account must be confirmed before you may log in.'
            });
        }
        if (!account.password) {
            return res.status(401).send({
                message: 'A password has not been set for this account yet.'
            });
        }
        var hashedPassword = req.utils.hash(req.body.password);
        if (hashedPassword !== account.password) {
            return res.status(401).send({ message: 'Incorrect password.' });
        }
        account = account.toObject();
        delete account.password;
        req.login(account, function (err) {
            if (err) {
                return next(err);
            }
            res.send(req.user);
        });
    });
});

/**
 * GET /google
 *
 * Typically you would visit this page from a web browser.
 *
 * Redirect the user to Google for authentication.  When complete, Google
 * will redirect the user back to the application at `/auth/google/callback`.
 */
router.get(
    '/google',
    passport.authenticate('google', {
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email'
        ]
    })
);
router.get('/google/callback', passport.authenticate('google', {
    failureRedirect: '/#/welcome?authFailure=Google+auth+failed'
}), function (req, res) {
    res.redirect('/');
});

module.exports = router;
