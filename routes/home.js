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
var router = express.Router();
var config = require('../config');
var middleware = require('../lib/middleware');

router.get('/', function (req, res) {
    req.log.info('saying something here');
    res.render('index', { title: config.name });
});

router.get('/private', middleware.isAuthorized, function (req, res) {
    res.render('call', {
        title: 'Video call'
    });
});

router.get('/files/:id', middleware.isAuthorized, function (req, res, next) {
    req.db.File.findById(req.params.id, function (err, file) {
        if (err) {
            return next(err);
        }
        if (!file) {
            return res.status(404).send({ error: 'Not found'});
        }
        res.set('Content-Type', file.contentType);
        res.send(new Buffer(file.content, 'base64'));
    });
});

router.get('/conf/:_id/:conf', function (req, res, next) {
    req.db.Account
    .findOne({ _id: req.params._id, conf: req.params.conf })
    .exec(function (err, account) {
        var genericMessage = new Error("Invalid ID or confirmation code. It may have already been used.");
        genericMessage.status = 404;
        if (err) {
            req.log.error('confirmation error', err);
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

            res.render('conf', {
                title: 'Email confirmed',
                message: 'Welcome!'
            });

            req.respoke.groups.publish({
                groupId: config.systemGroupId,
                message: JSON.stringify({
                    meta: {
                        type: 'newaccount',
                        value: account._id
                    }
                })
            }, function (err) {
                if (err) {
                    req.log.error('failed to send new account notification', err);
                }
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
            req.log.error('password reset error', err);
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
