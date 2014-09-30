var express = require('express');
var router = express.Router();

router.get('/me', function (req, res, next) {
    res.send(req.user);
});

router.patch('/me', function (req, res, next) {
    req.db.Account.findByIdAndUpdate(req.user._id, req.body, function (err, account) {
        if (err) {
            return next(err);
        }
        res.send(account);
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
        var message = { message: 'If the account was found, a reset will be sent to the email address.' };
        // give no indication if the email was wrong
        if (!account) {
            return res.send(message);
        }
        account.passwordReset(function (err, acct) {
            if (err) {
                return next(err);
            }
            // send an e-mail
            // TODO
            req.email.send({

            }, function (err) {
                if (err) {
                    return next(err);
                }
                req.send(message);
            });

        });
    });
});

router.put('/password-reset/:_id/:conf', function (req, res, next) {
    req.Account
    .findOne({ _id: req.params._id, conf: req.params.conf })
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
        });
    });
});

router.get('/accounts/:id', function (req, res, next) {
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
    new req.db.Account(req.body).save(function (err, account) {
        if (err) {
            return next(err);
        }
        req.login(account, function (err) {
            if (err) {
                return next(err);
            }
            res.send(req.user);
        });
    });
});

module.exports = router;
