var express = require('express');
var router = express.Router();
var config = require('../config');
var middleware = require('../lib/middleware');
var Moniker = require('moniker');
var moniker = Moniker.generator([]);
moniker.use(__dirname + '/../lib/words.txt');
moniker.use(__dirname + '/../lib/words.txt');
moniker.use(__dirname + '/../lib/words.txt');

router.get('/', function (req, res) {
    res.render('index', { title: config.name });
});

router.get('/private', middleware.isAuthorized, function (req, res) {
    res.redirect('/private/' + moniker.choose());
});
router.get('/api/private', middleware.isAuthorized, function (req, res) {
    res.send({ _id: moniker.choose() });
});
router.get('/private/:tempCallName', middleware.isAuthorized, function (req, res) {
    res.render('call', {
        title: req.params.tempCallName
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
