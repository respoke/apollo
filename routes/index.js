var express = require('express');
var router = express.Router();
var config = require('../config');

router.get('/', function(req, res) {
    res.render('index', { title: config.name });
});

router.get('/conf/:_id/:conf', function(req, res, next) {
    req.db.Account
    .findOne({ _id: req.params._id, conf: req.params.conf })
    .exec(function (err, account) {
        var genericMessage = new Error("Invalid ID or confirmation code. It may have already been used.");
        genericMessage.status = 404;
        if (err) {
            debug('confirmation error', err);
            return next(genericMessage);
        }
        if (!account) {
            return next(genericMessage);
        }
        account.conf = null;
        account.save(function (err, saved) {
            if (err) {
                return next(err);
            }

            req.login(saved, function (err) {
                if (err) {
                    return next(err);
                }

                res.render('conf', { 
                    title: 'Email confirmed',
                    message: 'Welcome!'
                });
            });

        });
    });
});

router.get('/password-reset/:_id/:conf', function(req, res, next) {
    req.db.Account
    .findOne({ _id: req.params._id, conf: req.params.conf })
    .select('+conf')
    .exec(function (err, account) {
        var genericMessage = new Error("Invalid ID or reset code.");
        genericMessage.status = 404;
        if (err) {
            debug('password reset error', err);
            return next(genericMessage);
        }
        if (!account) {
            return next(genericMessage);
        }
        res.render('reset', { 
            title: 'Password reset',
            message: 'Reset your password',
            conf: account.conf,
            _id: account._id
        });
    });
});

module.exports = router;
