var express = require('express');
var router = express.Router();
var passport = require('passport');
var middleware = require('../lib/middleware');
var config = require('../config');
var debug = require('debug')('apollo-auth');

router.delete('/session', function (req, res) {
    req.logout();
    res.send({ message: 'Logged out' });
});

router.get('/tokens', middleware.isAuthorized, function (req, res, next) {
    var authSettings = {
        endpointId: req.user._id,
        roleId: config.respoke.roleId
    };

    req.respoke.auth.endpoint(authSettings, function (err, authData) {
        if (err) {
            debug(err);
            return next(err);
        }
        res.send({
            token: authData.tokenId,
            appId: req.respoke.appId
        });
    });
});

// Local login
router.post('/local', function (req, res, next) {
    if (typeof req.body.email !== 'string') {
        return res.status(400).send({ message: 'Missing email or username.'});
    }
    req.db.Account.findOne()
    .or([{ _id: req.body.email.toLowerCase() }, { email: req.body.email.toLowerCase() }])
    .select('+password')
    .exec(function (err, account) {
        if (err) {
            return next(err);
        }
        if (!account) {
            return res.status(400).send({ message: 'Incorrect username.' });
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

module.exports = router;
