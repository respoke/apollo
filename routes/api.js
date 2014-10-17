var express = require('express');
var router = express.Router();
var config = require('../config');
var debug = require('debug')('apollo-api');
var middleware = require('../lib/middleware');
var async = require('async');

router.get('/me', function (req, res, next) {
    if (!req.user) {
        return res.send(req.user);
    }
    req.db.Account.findById(req.user._id).exec(function (err, account) {
        if (err) {
            return next(err);
        }
        res.send(account);
    });
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
    if (req.body.settings) {
        updateFields.settings = req.body.settings;
    }
    if (!Object.keys(updateFields).length) {
        return res.send(req.user);
    }
    req.db.Account.findById(req.user._id).exec(function (err, account) {
        if (err) {
            return next(err);
        }
        for (var f in updateFields) {
            account[f] = updateFields[f]
        }
        var settings = account.settings;
        account.save(function (err, saved) {
            if (err) {
                return next(err);
            }
            saved = saved.toObject();
            saved.settings = settings; // these are normally excluded
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
    if (!config.localSignupEnabled) {
        return res.status(403).send({
            error: 'Local account signups are disabled by the system administrator.'
        });
    }
    if (req.body._id === config.systemEndpointId) {
        return res.status(400).send({
            error: 'Name not available'
        });
    }
    debug('trying to create new account', req.body._id);
    var newAccount = new req.db.Account(req.body);
    var conf = newAccount.conf;
    newAccount.save(function (err, account) {
        if (err) {
            debug(err);
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
                debug('failed to send new account notification', err);
            }
        });
    });
});

router.get('/groups', middleware.isAuthorized, function (req, res, next) {
    if (req.query.ids) {
        req.db.Group.find()
        .where('_id').in(req.query.ids.split(','))
        .exec(handler);
    }
    else if (req.query.owner) {
        req.db.Group.find()
        .where('owner', req.query.owner)
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

        req.respoke.groups.publish({
            groupId: config.systemGroupId,
            message: JSON.stringify({
                meta: {
                    type: 'newgroup',
                    value: group._id
                }
            })
        }, function (err) {
            if (err) {
                debug('failed to send new account notification', err);
            }
        });
    });
});
router.delete('/groups/:id', middleware.isAuthorized, function (req, res, next) {
    req.db.Group.findById(req.params.id, function (err, group) {
        if (err) {
            return next(err);
        }
        if (!group) {
            return res.status(404).send({ error: 'Group not found by id ' + req.params.id });
        }
        if (group.owner.toString() !== req.user._id.toString()) {
            return res.status(401).send({ error: 'Unable to remove group that does not belong to you.' });
        }

        // kick everyone out first
        req.respoke.groups.publish({
            groupId: config.systemGroupId,
            message: JSON.stringify({
                meta: {
                    type: 'removegroup',
                    value:  group._id
                }
            })
        }, function (err) {
            if (err) {
                debug('failed to send new account notification', err);
            }
        });

        async.series([
            function (cb) {
                req.db.Message.distinct('file', {
                    group: req.params.id
                })
                .exec(function (err, ids) {
                    if (err) {
                        return cb(err);
                    }
                    debug('files', ids);
                    req.db.File.remove({
                        _id: { $in: ids }
                    })
                    .exec(cb);
                });
            },
            function (cb) {
                req.db.Message.remove({
                    group: req.params.id
                })
                .exec(function (err) {
                    if (err) {
                        return cb(err);
                    }
                    cb();
                });
            },
            function (cb) {
                group.remove(cb);
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            res.send({ message: 'Group was removed successfully.' });
        });
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
    if (req.query.limit) {
        query = query.limit(req.query.limit);
    }
    else {
        query = query.limit(50);
    }

    // skip
    if (req.params.skip) {
        query = query.skip(req.query.skip);
    }

    if (req.query.before) {
        query = query.where('created').lt(req.query.before);
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
        content: req.body.content,
        file: req.body.file
    }).save(function (err, message) {
        if (err) {
            return next(err);
        }
        res.send(message);

        // send offline indication email
        if (req.body.recipientOffline) {
            if (req.body.file) {
                return;
            }
            req.db.Account.findById(req.body.to).exec(function (err, account) {
                if (err) {
                    debug(err);
                }
                if (!account) {
                    return;
                }
                if (!account.settings.offlineNotifications) {
                    return;
                }

                var content;
                try {
                    content = JSON.parse(req.body.content);
                }
                catch (ex) {
                    debug('Failed parsing message.content for offline notif send', req.body, ex);
                    return;
                }

                var emailContent = {
                    from: config.email.from,
                    replyTo: req.user.email,
                    to: account.email,
                    subject: '[' + config.name + '] ' 
                        + req.user.display + ' sent you a message while you were offline',
                    text: req.user.display + ' said:\n\n' + content.text
                        + '\n---\nUnsubscribe from these messages in the '
                        + config.name + ' settings. '
                        + config.baseURL
                };

                if (account.settings.htmlEmails) {
                    emailContent.html = req.user.display + ' said:<br /><br />' 
                        + content.text
                        + '<hr /><a href="' + config.baseURL + '">'
                        + 'Unsubscribe from these messages in the '
                        + config.name + ' settings</a>';
                }

                req.email.sendMail(emailContent, function (err) {
                    if (err) {
                        debug(err);
                        return;
                    }
                    debug('offline email sent', req.user.email, account.email);
                });
            });
        }


    });
});

router.post('/files', middleware.isAuthorized, function (req, res, next) {
    var contentType = req.body.contentType || 'text/plain';

    new req.db.File({
        content: req.body.content,
        contentType: contentType,
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
