var debug = require('debug')('apollo-db');
var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;
var uuid = require('uuid');
var emailValidation = require('email-validation');
var config = require('./config');

mongoose.connect(config.mongoURI);
mongoose.connection.on('connected', function () {
    debug('connected');
});
mongoose.connection.on('error', function (err) {
    debug('error', err);
});

var models = {};


/**
 * Account Model
 */
var AccountSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        unique: true
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
        type: String
    },
    conf: {
        type: String
    },
    admin: {
        type: Boolean,
        default: false
    },
    created: {
        type: Date,
        default: Date.now
    }
});
AccountSchema.pre('validate', function (next) {
    if (!this._id) {
        return next(new Error("Account ID is required."));
    }
    if (/[a-z0-9]/gi.test(this._id)) {
        return next(new Error("Account ID must be alphanumeric."));
    }
    if (!this.display) {
        return next(new Error("Display name is required."));
    }
    if (!this.google) {
        if (!this.email) {
            return next(new Error("Email is required."));
        }
        var emailInvalid = this.isEmailInvalid(this.email);
        if (emailInvalid) {
            return next(new Error(emailInvalid));
        }
        if (!this.password) {
            return next(new Error("Password is required."));
        }
        var passwordInvalid = this.isPasswordInvalid(this.password);
        if (passwordInvalid) {
            return next(new Error(passwordInvalid));
        }
    }
    next();
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
    return emailValidation.valid(email);
});
AccountSchema.method('passwordReset', function (callback) {
    this.conf = 'reset-' + uuid.v4() + '-' + uuid.v4() + '-' + uuid.v4()
    this.save(callback);
});
models.Account = mongoose.model('Account', AccountSchema);


/**
 * Group Model
 */
var GroupSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        unique: true
    },
    accounts: [{
        type: ObjectId,
        required: true,
        ref: 'Account'
    }],
    content: {
        type: String,
        required: true,
        default: ''
    },
    created: {
        type: Date,
        default: Date.now
    }
});
models.Group = mongoose.model('Group', GroupSchema);


/**
 * Message model
 */
var MessageSchema = new mongoose.Schema({
    from: {
        type: ObjectId,
        ref: 'Account',
        required: true
    },
    to: {
        type: ObjectId,
        ref: 'Account'
    },
    group: {
        type: ObjectId,
        required: true,
        ref: 'Group'
    },
    content: {
        type: String,
        required: true,
        default: ''
    },
    created: {
        type: Date,
        default: Date.now
    }
});
models.Message = mongoose.model('Message', MessageSchema);


exports = module.exports = models;
