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
 * Router attached at `/api`.
 * @class api
 */
var router = express.Router();
var config = require('../config');
var middleware = require('../lib/middleware');
var async = require('async');

/**
 * GET /me
 *
 * Get my Account. Also good for checking if you are logged in.
 * @returns object Account || null
 */
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

/**
 * PATCH /me
 *
 * Update my own account. All body properties are optional.
 *
 * @arg string password
 * @arg string display
 * @arg string email
 * @arg object settings
 * @returns object Account
 */
router.patch('/me', middleware.isAuthorized, function (req, res, next) {
    var updateFields = {};
    ['password', 'display', 'email', 'settings'].forEach(function (field) {
        if (req.body[field]) {
            updateFields[field] = req.body[field];
        }
    });
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

/**
 * PUT /forgot/:emailOrId
 *
 * Forgot password.
 *
 * @returns object { message: "" }
 */
router.put('/forgot/:emailOrId', function (req, res, next) {
    if (!req.params.emailOrId) {
        return res.send(400, { error: "Missing identifier for password reset. Need email or account ID." });
    }
    req.db.Account.findOne()
    .or([{ email: req.params.emailOrId }, { _id: req.params.emailOrId }])
    .select('+conf')
    .exec(function (err, account) {
        if (err) {
            return next(err);
        }

        if (account.conf && account.conf.slice(0, 7) === 'confirm') {
            return res.status(400).send({
                message: "Your account must be confirmed before you may reset your password."
            });
        }

        var message = { message: 'A password reset has been requested. Check your email.' };
        // give no indication if the email was wrong
        if (!account || !account.email) {
            return res.send(message);
        }

        account.passwordReset(function (err, acct) {
            if (err) {
                req.log.error(err);
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
                    req.log.error(err);
                    return next(err);
                }
                res.send(message);
            });

        });
    });
});

/**
 * PUT /password-reset/:_id/:conf
 *
 * Reset password using confirmation token.
 *
 * @arg string password
 * @returns object Account
 */
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
                    req.log.error(err);
                }
            });

        });
    });
});

/**
 * GET /accounts
 *
 * List all accounts.
 * @returns Array of Accounts
 */
router.get('/accounts', middleware.isAuthorized, function (req, res, next) {
    var query = req.db.Account.find().select('+conf').lean();

    if (req.query.ids && typeof req.query.ids === 'string') {
        query
        .where('_id').in(req.query.ids.split(','))
        .exec(handler);
    }
    else {
        query.exec(handler);
    }
    function handler(err, accounts) {
        if (err) {
            return next(err);
        }
        accounts.forEach(function (acct) {
            if (acct.conf && acct.conf.slice(0, 5) === 'reset') {
                delete acct.conf;
            }
            if (!acct.conf) {
                delete acct.conf;
            }
            delete acct.settings;
        });
        res.send(accounts);
    }
});

/**
 * GET /accounts/:id
 *
 * Fetch a specific account.
 *
 * @returns object Account
 */
router.get('/accounts/:id', middleware.isAuthorized, function (req, res, next) {
    req.db.Account.findById(req.params.id).select('+conf').exec(function (err, account) {
        if (err) {
            return next(err);
        }
        if (!account) {
            return res.status(404).send({ error: 'Account not found by id ' + req.params.id });
        }
        res.send(account);
    });
});

/**
 * DELETE /account/:id
 *
 * #### TODO: rework this
 *
 * Remove an account. Does not delete all of their messages/files so may cause breakage or
 * orphan data.
 *
 * @returns object { message: "" }
 */
router.delete('/accounts/:id', middleware.isAuthorized, function (req, res, next) {
    req.db.Account.remove({ _id: req.params.id }).exec(function (err) {
        if (err) {
            return next(err);
        }
        res.send({ message: 'Account was removed.'});

        req.respoke.groups.publish({
            groupId: config.systemGroupId,
            message: JSON.stringify({
                meta: {
                    type: 'removeaccount',
                    value: req.params.id
                }
            })
        }, function (err) {
            if (err) {
                req.log.error('failed to send delete account notification', err);
            }
        });
    });
    req.db.Message.remove({ from: req.params.id });
    req.db.File.remove({ owner: req.params.id });
});

/**
 * POST /accounts
 *
 * Create a new local account and kick off confirmation by email (if required by configuration).
 *
 * @fires newaccount
 * @arg string _id  The username and unique identifier and endpoint.
 * @arg string email
 * @arg string display  The display name for this user.
 * @arg string password
 * @returns object Account, { error: "" }
 */
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
    if (req.body.email && config.restrictLocalAccountsToDomains && config.restrictLocalAccountsToDomains.length) {
        var emailParts = req.body.email.toLowerCase().split('@');
        if (emailParts[1] && config.restrictLocalAccountsToDomains.indexOf(emailParts[1]) === -1) {
            return res.status(400).send({
                error: 'You must sign up with an email from of the following domains: ' + config.restrictLocalAccountsToDomains.join(',')
            });
        }
    }
    req.log.info('trying to create new account', req.body._id);
    var newAccount = new req.db.Account(req.body);
    var conf = newAccount.conf;
    newAccount.save(function (err, account) {
        if (err) {
            req.log.error(err);
            err.status = 400;
            return next(err);
        }
        res.send({ message: 'Account created successfully. Check your email to confirm.'});

        // now send account confirmation email
        // this can take a little while, so send the email in the background
        var confirmURI = config.baseURL + '/conf/' + account._id + '/' + newAccount.conf;

        // send email confirmation link if they are allowed in configuration
        if (config.allowSelfConfirmation) {
            sendConfirmationEmail();

        }
        // it is possible that this is the first person to sign up.
        // if that is the case, they will need to be given a confirmation email.
        else {
            req.db.Account.count(function (err, totalAccounts) {
                if (err) {
                    req.log.error('Error counting number of accounts', err);
                    return;
                }
                if (totalAccounts === 0) {
                    sendConfirmationEmail();
                }
            });
        }

        function sendConfirmationEmail() {
            req.email.sendMail({
                from: config.email.from,
                to: account.email,
                subject: 'Account confirmation - ' + config.name,
                text: 'Visit the following link to confirm your ' + config.name + ' account. ' + confirmURI
            }, function (err) {
                if (err) {
                    req.log.error('Account confirmation email failed to send.', err, "Visit link to confirm.", confirmURI);
                    return;
                }
                req.log.error('Sent account confirmation email', account.email, 'with confirmation link', confirmURI)
            });
        }

        account = account.toObject();
        account.conf = conf;

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

/**
 * GET /groups
 *
 * List the groups this person can see. (currently all groups!)
 *
 * @arg string ?ids= Optional comma separated list of ids only you are wanting to list.
 * @arg string ?owner= Optional Account._id to limit only to that user's groups.
 * @returns Array of Groups
 */
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

/**
 * GET /groups/:id
 *
 * Get a specific group object by `_id`.
 *
 * @returns object Group  ||  404 { error: '' }
 */
router.get('/groups/:_id', middleware.isAuthorized, function (req, res, next) {
    req.db.Group.findById(req.params._id, function (err, group) {
        if (err) {
            return next(err);
        }
        if (!group) {
            return res.status(404).send({ error: 'Group not found by id ' + req.params._id });
        }
        res.send(group);
    });
});

/**
 * POST /groups
 *
 * Create a new group. Forces you to be the owner.
 *
 * @fires newgroup
 * @arg string _id  The group name.
 * @returns object Group
 */
router.post('/groups', middleware.isAuthorized, function (req, res, next) {
    req.db.Group.findById(req.body._id).exec(function (err, existingGroup) {
        if (err) {
            err.status = 500;
            return next(err);
        }
        if (existingGroup) {
            err = new Error("A group by that name already exists.");
            err.status = 400;
            return next(err);
        }
        new req.db.Group({
            _id: req.body._id,
            owner: req.user._id
        })
        .save(function (err, group) {
            if (err) {
                err.status = 400;
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
                    req.log.error('failed to send new account notification', err);
                }
            });
        });
    });
});
/**
 * DELETE /groups
 *
 * Remove a group by _id if you own it.
 *
 * @fires removegroup
 * @returns object Group
 */
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
                req.log.error('failed to send new account notification', err);
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

/**
 * PATCH /groups/:_id/owner/:accountId
 *
 * Change ownership of a group (param `_id`).
 *
 * New owner is the `Account._id` in URL param `accountId`.
 *
 * @returns object Group
 */
router.patch('/groups/:_id/owner/:accountId', middleware.isAuthorized, function (req, res, next) {
    req.db.Group
    .findById(req.params._id)
    .populate('owner')
    .exec(function (err, group) {
        if (err) {
            return next(err);
        }
        if (!group) {
            return res.status(404).send({ error: 'Group ' + req.params._id + ' was not found.' });
        }
        if (group.owner._id.toString() !== req.user._id.toString()) {
            return res.status(401).send({
                error: 'Group ' + req.params._id + ' is owned by ' + group.owner.display + '.'
            });
        }
        req.db.Account.findById(req.params.accountId, function (err, account) {
            if (err) {
                return next(err);
            }
            if (!account) {
                return res.status(404).send({ error: "Account " + req.params.accountId + " does not exist."});
            }
            group.owner = req.params.accountId;
            group.save(function (err, group) {
                if (err) {
                    return next(err);
                }
                res.send(group);
            });
        });
    });
});

/**
 * GET /messages
 *
 * Fetch messages. Requires one or more querystring params to determine what you need.
 *
 * Always sorts *descending by `created`* (most recent are last).
 *
 * The following properties are **populated** with the objects, instead of being
 * just an _id field:
 * * `message.from`
 * * `message.to`
 * * `message.group`
 *
 * @arg string ?ids=  Comma separated list of `Message._id`s.
 * @arg string ?group=  `Message.group` of the messages.
 * @arg string ?account=  Messages between the logged in user and another account.
 * @arg number ?limit=50  Integer; how many messages to fetch.
 * @arg number ?skip=0  Integer; how many messages to skip when fetching (descending order by created).
 * @arg date ?before=  Fetch messages that were created no later than this date.
 * @returns Array of Messages
 */
router.get('/messages', middleware.isAuthorized, function (req, res, next) {

    // Build a message query.
    // Always sorted descending by created.

    var DEFAULT_LIMIT = 50;

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
        query = query.limit(DEFAULT_LIMIT);
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

/**
 * POST /messages
 *
 * Create a message which persists it to the server.
 *
 * Does not send it through Respoke as a web socket. That is done by the client.
 *
 * @arg string to  Optional Account._id for a private message.
 * @arg string group  Optional Group._id for a group message.
 * @arg string content  The message text.
 * @arg string file  Optional File._id that is considered related to this message.
 * @returns object Message
 */
router.post('/messages', middleware.isAuthorized, function (req, res, next) {
    if (req.body.content && req.body.content.length > 4096) {
        var err = new Error('Message is too long. Consider breaking it into smaller chunks.');
        err.status = 400;
        return next(err);
    }
    new req.db.Message({
        from: req.user._id,
        to: req.body.to,
        group: req.body.group,
        content: req.body.content,
        file: req.body.file
    }).save(function (err, message) {
        if (err) return next(err);

        //
        // Response to client is here.
        //
        res.send(message);


        var content;
        try {
            content = JSON.parse(req.body.content);
        }
        catch (ex) {
            return;
        }

        // send offline notification email
        if (req.body.recipientOffline) {
            if (req.body.file) {
                return;
            }
            req.db.Account.findById(req.body.to).exec(function (err, account) {
                if (err) {
                    req.log.error(err);
                }
                if (!account) {
                    return;
                }
                if (!account.settings.offlineNotifications) {
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
                    emailContent.html = '<em>' + req.user.display + '</em>&nbsp;&nbsp;&nbsp;'
                        + content.text
                        + '<br />---<br /><a href="' + config.baseURL + '">'
                        + 'Unsubscribe from these messages in the '
                        + config.name + ' settings</a>';
                }

                req.email.sendMail(emailContent, function (err) {
                    if (err) {
                        req.log.error(err);
                        return;
                    }
                    req.log.info('offline conversation email sent', req.user.email, account.email);
                });
            });
        }

        // send offline mention email, but only for groups.
        if (req.body.group && req.body.offlineMentions) {
            var mentions = req.body.offlineMentions instanceof Array ? req.body.offlineMentions : req.body.offlineMentions.split(',');

            req.db.Account.find().where('_id').in(mentions).exec(function (err, accounts) {
                if (err) {
                    req.log.error(err);
                    return;
                }

                accounts.forEach(function sendNotifEmail(account) {
                    if (!account) {
                        return;
                    }

                    var emailContent = {
                        from: config.email.from,
                        replyTo: req.user.email,
                        to: account.email,
                        subject: '[' + config.name + '] '
                            + req.user.display + ' mentioned you in ' + req.body.group,
                        text: req.user.display + ' said:\n\n' + content.text
                            + '\n---\n'
                            + config.name + '   '
                            + config.baseURL
                    };

                    if (account.settings.htmlEmails) {
                        emailContent.html = '<em>' + req.user.display + '</em>&nbsp;&nbsp;&nbsp;'
                            + content.text
                            + '<br />---<br /><a href="' + config.baseURL + '">'
                            + config.name + '</a>';
                    }

                    req.email.sendMail(emailContent, function (err) {
                        if (err) {
                            req.log.error(err);
                            return;
                        }
                        req.log.info('offline mention email sent', req.user.email, account.email);
                    });
                });
            });
        }


    });
});

/**
 * POST /files
 *
 * Upload a file.
 *
 * @arg string content  The file as Base64 encoded string.
 * @arg string contentType  MIME type of the file.
 * @arg string owner  The Account._id of the logged in user uploading the file.
 * @arg string name  Optional file name.
 * @returns object File (model - not actual file)
 */
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

/**
 * GET /files/:_id
 *
 * Fetch an entire File document.
 *
 * Get _only_ the file by doing `GET /files/:_id`.
 * @returns object File
 */
router.get('/files/:_id', middleware.isAuthorized, function (req, res, next) {
    req.db.File.findById(req.params._id, function (err, file) {
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
