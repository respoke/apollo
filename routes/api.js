var express = require('express');
var router = express.Router();
var config = require('../config');
var debug = require('debug')('apollo-api');
var middleware = require('../lib/middleware');

router.get('/me', function (req, res, next) {
    res.send(req.user);
});

router.patch('/me', middleware.isAuthorized, function (req, res, next) {
    var updateFields = {};
    if (req.body.password) {
        updateFields.password = req.body.password;
    }
    if (req.body.display) {
        updateFields.display = req.body.display;
    }
    if (req.body.email) {
        updateFields.email = req.body.email;
    }
    if (!Object.keys(updateFields).length) {
        return res.send(req.user);
    }
    req.db.Account.findById(req.user._id, function (err, account) {
        if (err) {
            return next(err);
        }
        for (var f in updateFields) {
            account[f] = updateFields[f]
        }
        account.save(function (err, saved) {
            if (err) {
                return next(err);
            }
            res.send(saved);
        });
    });
});

router.put('/forgot/:emailOrId', function (req, res, next) {
    if (!req.params.emailOrId) {
        return res.send(400, { error: "Missing identifier for password reset. Need email or account ID." });
    }
    req.db.Account.findOne()
    .or([{ email: req.params.emailOrId }, { _id: req.params.emailOrId }])
    .exec(function (err, account) {
        if (err) {
            return next(err);
        }
        var message = { message: 'If the account was found with an email on file, a reset will be sent to the email address.' };
        // give no indication if the email was wrong
        if (!account || !account.email) {
            return res.send(message);
        }

        account.passwordReset(function (err, acct) {
            if (err) {
                debug(err);
                return next(err);
            }
            
            // send an e-mail
            req.email.sendMail({
                from: config.email.from,
                to: acct.email,
                subject: 'Password reset - ' + config.name,
                text: 'Visit the following link to reset your ' + config.name + ' password.\n\n'
                    + config.baseURL + '/password-reset/' + acct._id + '/' + acct.conf
            }, function (err) {
                if (err) {
                    debug(err);
                    return next(err);
                }
                res.send(message);
            });

        });
    });
});

router.put('/password-reset/:_id/:conf', function (req, res, next) {
    req.db.Account
    .findOne({ _id: req.params._id, conf: req.params.conf })
    .select('+conf')
    .exec(function (err, account) {
        if (err) {
            return next(err);
        }
        if (!account) {
            return res.send(404);
        }
        var passCheckFail = account.isPasswordInvalid(req.body.password);
        if (passCheckFail) {
            return res.send(400, { error: passCheckFail });
        }
        account.password = req.body.password;
        account.conf = null;
        account.save(function (err, saved) {
            if (err) {
                return next(err);
            }
            req.login(saved, function (err) {
                if (err) {
                    return next(err);
                }
                res.send(saved);
            });

            // notify people that their password was reset
            req.email.sendMail({
                from: config.email.from,
                to: account.email,
                subject: 'Your ' + config.name + ' password was reset',
                text: 'This is a notification that the password has been reset on your ' + config.name + ' account.'
            }, function (err) {
                if (err) {
                    debug(err);
                }
            });

        });
    });
});

router.get('/accounts', middleware.isAuthorized, function (req, res, next) {
    if (req.query.ids && typeof req.query.ids === 'string') {
        req.db.Account.find()
        .where('_id').in(req.query.ids.split(','))
        .exec(handler);
    }
    else {
        req.db.Account.find().exec(handler);
    }
    function handler(err, accounts) {
        if (err) {
            return next(err);
        }
        res.send(accounts);
    }
});

router.get('/accounts/:id', middleware.isAuthorized, function (req, res, next) {
    req.db.Account.findById(req.params.account, function (err, account) {
        if (err) {
            return next(err);
        }
        if (!account) {
            return res.status(404).send({ error: 'Account not found by id ' + req.params.id });
        }
        res.send(account);
    });
});

router.post('/accounts', function (req, res, next) {
    var newAccount = new req.db.Account(req.body);
    var conf = newAccount.conf;
    newAccount.save(function (err, account) {
        if (err) {
            return next(err);
        }
        // now send account confirmation email
        req.email.sendMail({
            from: config.email.from,
            to: account.email,
            subject: 'Account confirmation - ' + config.name,
            text: 'Visit the following link to confirm your ' + config.name + ' account. '
                + config.baseURL + '/conf/' + account._id + '/' + newAccount.conf
        }, function (err) {
            if (err) {
                return next(err);
            }
            res.send({ message: 'Account created successfully. Check your email to confirm.'});
        });
    });
});

module.exports = router;
