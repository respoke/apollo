var debug = require('debug')('apollo-db');
var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;
var uuid = require('uuid');
var emailValidation = require('email-validation');
var config = require('./config');
var appUtilities = require('./lib/app-utilities');

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
    if (/[^a-z0-9]/gi.test(this._id)) {
        return next(new Error("Account username (ID) must be alphanumeric."));
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

    if (this.isNew) {
        this.conf = 'confirm-' + uuid.v4() + '-' + uuid.v4() + '-' + uuid.v4();
        this._id = this._id.toLowerCase();
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
        unique: true,
        default: uuid.v4
    },
    accounts: [{
        type: ObjectId,
        required: true,
        ref: 'Account'
    }],
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
