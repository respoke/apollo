/*!
 * Copyright 2014, Digium, Inc.
 * All rights reserved.
 *
 * This source code is licensed under The AGPL v3 License found in the
 * LICENSE file in the root directory of this source tree.
 *
 * For all details and documentation:  https://www.respoke.io
 */
'use strict';
var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;
var uuid = require('uuid');
var emailValidation = require('email-validation');
var config = require('./config');
var appUtilities = require('./lib/app-utilities');

var logger;

/**
 * For the most part, all errors would be passed back and not logged here.
 */
var models = {};


/**
 * Account Model
 */
var AccountSchema = new mongoose.Schema({
    // _id is also username
    _id: {
        type: String,
        required: true,
        unique: true
    },
    __v: {
        type: Number,
        select: false
    },
    email: {
        type: String
    },
    display: {
        type: String,
        required: true
    },
    password: {
        type: Object,
        select: false
    },
    google: {
        type: String,
        select: false
    },
    conf: {
        type: String,
        select: false
    },
    settings: {
        type: {},
        default: {
            privateMessageSounds: true,
            groupDesktopNotifications: true,
            privateDesktopNotifications: true,
            groupMessageSounds: true,
            offlineNotifications: true,
            htmlEmails: true,
            notifyOnMention: true,
            mutedGroups: [],
            theme: 'dark'
        },
        required: true
    },
    created: {
        type: Date,
        default: Date.now,
        select: false
    }
});
AccountSchema.pre('validate', function (next) {
    if (!this._id) {
        return next(new Error("Account username (ID) is required."));
    }
    if (/[^a-z0-9]/g.test(this._id)) {
        return next(new Error("Account username (ID) may only have numbers and lowercase letters."));
    }
    if (!this.display) {
        return next(new Error("Display name is required."));
    }
    if (!this.google) {
        if (!this.email) {
            return next(new Error("Email is required."));
        }
        this.email = this.email.toLowerCase();
        var emailInvalid = this.isEmailInvalid(this.email);
        if (emailInvalid) {
            return next(new Error("Email address is not in a valid format."));
        }
        if (this.isNew || this.isDirectModified('password')) {
            if (!this.password) {
                return next(new Error("Password is required."));
            }
            var passwordInvalid = this.isPasswordInvalid(this.password);
            if (passwordInvalid) {
                return next(new Error(passwordInvalid));
            }
        }
    }

    if (this.isNew && !this.google) {
        this.conf = 'confirm-' + uuid.v4() + '-' + uuid.v4() + '-' + uuid.v4();
        this._id = this._id.toLowerCase();
        logger.info('new account conf', config.baseURL + '/conf/' + this._id + '/' + this.conf);
    }

    if (this.isDirectModified('password')) {
        this.password = appUtilities.hash(this.password);
    }

    next();
});
// pre-validate that the email is unique
AccountSchema.pre('validate', function (next) {
    if (!this.isDirectModified('email')) {
        return next();
    }
    var doc = this;
    mongoose.model('Account').findOne({ email: doc.email }).exec(function (err, account2) {
        if (err) {
            return next(err);
        }
        if (!account2) {
            return next();
        }
        // of course, if this is their email it's ok
        if (account2._id.toString() !== doc._id.toString()) {
            return next(new Error("That email is already registered."));
        }
        next();
    });
});
// pre-validate that the _id / username is unique
AccountSchema.pre('validate', function (next) {
    if (!this.isDirectModified('_id')) {
        return next();
    }
    var doc = this;
    mongoose.model('Account').findOne({ _id: doc._id }).exec(function (err, account1) {
        if (err) {
            return next(err);
        }
        if (account1) {
            return next(new Error("That username is already taken."));
        }
        next();
    });
});
AccountSchema.method('isPasswordInvalid', function (password) {
    if (!password) {
        return 'Missing password';
    }
    if (typeof password !== 'string') {
        return 'Password must be a string.';
    }

    //
    // Add more password validators here.
    //

    return null;
});
AccountSchema.method('isEmailInvalid', function (email) {
    return !emailValidation.valid(email);
});
AccountSchema.method('passwordReset', function (callback) {
    this.conf = 'reset-' + uuid.v4() + '-' + uuid.v4() + '-' + uuid.v4();
    this.save(callback);
});
models.Account = mongoose.model('Account', AccountSchema);


/**
 * Group Model
 * Types of groups: public, private, conversation
 */
var GroupSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        unique: true,
        default: uuid.v4
    },
    owner: {
        type: String,
        required: true,
        ref: 'Account'
    },
    accounts: {
        type: [{
            type: String,
            ref: 'Account'
        }],
        default: []
    },
    created: {
        type: Date,
        default: Date.now
    }
});
function isUUID(input) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input);
}
GroupSchema.virtual('isPrivate').get(function () {
    return isUUID(this._id) && this.accounts.length;
});
GroupSchema.virtual('isPublic').get(function () {
    return !isUUID(this._id) && !this.accounts.length;
});
GroupSchema.virtual('isConversation').get(function () {
    return !isUUID(this._id) && this.accounts.length;
});
GroupSchema.pre('validate', function (next) {
    if (/[^a-z0-9]/gi.test(this._id)) {
        return next(new Error("Group name must be alphanumeric."));
    }
    if (!this.owner) {
        return next(new Error("A group must have an owner."));
    }
    next();
});
models.Group = mongoose.model('Group', GroupSchema);


/**
 * Message model
 * These are group and 1+1 messages.
 */
var MessageSchema = new mongoose.Schema({
    __v: {
        type: Number,
        select: false
    },
    from: {
        type: String,
        ref: 'Account',
        required: true
    },
    to: {
        type: String,
        ref: 'Account'
    },
    group: {
        type: String,
        ref: 'Group'
    },
    content: {
        type: String,
        required: true,
        default: '',
        description: 'A JSON string'
    },
    file: {
        type: ObjectId,
        ref: 'File'
    },
    created: {
        type: Date,
        default: Date.now
    }
});
MessageSchema.pre('validate', function (next) {
    if (!this.from) {
        return next(new Error("The message 'from' field is required."));
    }
    if (!this.to && !this.group) {
        return next(new Error("Either message 'group' or 'to' is required."));
    }
    if (!this.content && !this.file) {
        return next(new Error("Message 'content' is required."));
    }
    if (this.content) {
        try {
            var test = JSON.parse(this.content);
            if (!test.text && !this.file) {
                return next(new Error("Message content.text is missing."));
            }
        }
        catch (ignored) {
            return next(new Error("Message 'content' is not a valid JSON string."));
        }
    }
    next();
});
models.Message = mongoose.model('Message', MessageSchema);

/**
 * File model
 */
var FileSchema = new mongoose.Schema({
    __v: {
        type: Number,
        select: false
    },
    content: {
        type: String,
        required: true,
        description: 'Base64 content'
    },
    contentType: {
        type: String,
        required: true
    },
    name: {
        type: String
    },
    owner: {
        type: String,
        ref: 'Account',
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    }
});
models.File = mongoose.model('File', FileSchema);


exports = module.exports = function (initializedLogger) {
    logger = initializedLogger;
    mongoose.connect(config.mongoURI);
    mongoose.connection.on('connected', function () {
        logger.info('mongo connected');
    });
    mongoose.connection.on('error', function (err) {
        logger.error('mongo connect error', err);
    });
    return models;
};
