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
    req.db.Account.findById(req.params.id, function (err, account) {
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
        res.send({ message: 'Account created successfully. Check your email to confirm.'});

        // now send account confirmation email
        // this can take a little while, so send the email in the background
        req.email.sendMail({
            from: config.email.from,
            to: account.email,
            subject: 'Account confirmation - ' + config.name,
            text: 'Visit the following link to confirm your ' + config.name + ' account. '
                + config.baseURL + '/conf/' + account._id + '/' + newAccount.conf
        }, function (err) {
            if (err) {
                debug('ERROR: Account confirmation email failed to send.', err);
                return;
            }
            debug('Sent account confirmation email', account.email);
        });
    });
});

router.get('/groups', middleware.isAuthorized, function (req, res, next) {
    if (req.query.ids && typeof req.query.ids === 'string') {
        req.db.Group.find()
        .where('_id').in(req.query.ids.split(','))
        .exec(handler);
    }
    else {
        req.db.Group.find().exec(handler);
    }
    function handler(err, groups) {
        if (err) {
            return next(err);
        }
        res.send(groups);
    }
});

router.get('/groups/:id', middleware.isAuthorized, function (req, res, next) {
    req.db.Group.findById(req.params.id, function (err, group) {
        if (err) {
            return next(err);
        }
        if (!group) {
            return res.status(404).send({ error: 'Group not found by id ' + req.params.id });
        }
        res.send(group);
    });
});

router.post('/groups', middleware.isAuthorized, function (req, res, next) {
    new req.db.Group({
        _id: req.body._id,
        owner: req.user._id
    }).save(function (err, group) {
        if (err) {
            return next(err);
        }
        res.send(group);
    });
});

// change ownership of a group
router.patch('/groups/:id/:account', middleware.isAuthorized, function (req, res, next) {
    req.db.Group
    .findById(req.params.id)
    .populate('owner')
    .exec(function (err, group) {
        if (err) {
            return next(err);
        }
        if (!group) {
            return res.status(404).send({ error: 'Group ' + req.params.id + ' was not found.' });
        }
        if (group.owner._id.toString() !== req.user._id.toString()) {
            return res.status(401).send({ 
                error: 'Group ' + req.params.id + ' is owned by ' + group.owner.display + '.'
            });
        }
        req.db.Account.findById(req.params.account, function (err, account) {
            if (err) {
                return next(err);
            }
            if (!account) {
                return res.status(404).send({ error: "Account " + req.params.account + " does not exist."});
            }
            group.owner = req.params.account;
            group.save(function (err, group) {
                if (err) {
                    return next(err);
                }
                res.send(group);
            });
        });
    });
});

router.get('/messages', middleware.isAuthorized, function (req, res, next) {

    // Build a message query.
    // Always sorted descending by created.

    var query = req.db.Message.find().sort('-created');

    // specific message _id list
    if (req.query.ids) {
        query = query.where('_id').in(req.query.ids.split(','));
    }

    // messages for a group
    if (req.query.group) {
        query = query.where('group', req.query.group);
    }

    // messages between two accounts
    if (req.query.account) {
        query = query.or([
            { to: req.query.account,   from: req.user._id },
            { from: req.query.account, to: req.user._id }
        ]);
    }

    // limit
    if (req.params.limit) {
        query = query.limit(req.params.limit);
    }
    else {
        query = query.limit(200);
    }

    // skip
    if (req.params.skip) {
        query = query.skip(req.params.skip);
    }


    query
    .populate('from to group')
    .exec(function (err, messages) {
        if (err) {
            return next(err);
        }
        res.send(messages);
    });
    
});

router.post('/messages', middleware.isAuthorized, function (req, res, next) {
    new req.db.Message({
        from: req.user._id,
        to: req.body.to,
        group: req.body.group,
        content: req.body.content
    }).save(function (err, message) {
        if (err) {
            return next(err);
        }
        res.send(message);
    });
});

router.post('/files', middleware.isAuthorized, function (req, res, next) {
    new req.db.File({
        content: req.body.content,
        contentType: req.body.contentType,
        name: req.body.name,
        owner: req.user._id
    }).save(function (err, file) {
        if (err) {
            return next(err);
        }
        res.send(file);
    });
});

// this is /api/files/:id
// get the actual file at /files/:id
router.get('/files/:id', middleware.isAuthorized, function (req, res, next) {
    req.db.File.findById(req.params.id, function (err, file) {
        if (err) {
            return next(err);
        }
        if (!file) {
            return res.status(404).send({ error: 'Not found'});
        }
        res.send(file);
    });
});

module.exports = router;
