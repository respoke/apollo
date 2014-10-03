var passport = require('passport');
var mongoose = require('mongoose');
var GoogleStrategy = require('passport-google').Strategy;
var config = require('./config');
var debug = require('debug')('passport');
var uuid = require('uuid');

function strategize() {
    // bind passport strategies here


    if (config.google.enabled) {
        passport.use(new GoogleStrategy({
                returnURL: config.google.returnURL,
                realm: config.google.realm
            },
            function (identifier, profile, done) {
                debug('google identifier', identifier);
                debug('google profile', profile);

                var email = "";
                var display = uuid.v4();

                if (profile.emails && profile.emails.length && profile.emails[0]) {
                    email = profile.emails[0].value;
                }
                if (!email) {
                    debug('ERROR google - no email');
                    return done(new Error("Google auth succeeded, but we did not get your email address."));
                }

                if (config.google.domains && config.google.domains.length) {
                    var emailArr = email.split('@');
                    var emailDomain = emailArr[emailArr.length - 1];
                    if (config.google.domains.indexOf(emailDomain) === -1) {
                        var errMsg = "Please use an email address from an authorized domain.";
                        return done(new Error(errMsg));
                    }
                }

                if (profile.displayName) {
                    display = profile.displayName;
                }
                

                var Account = mongoose.model('Account');
                Account
                .findOne()
                .or([{ google: identifier }, { email: email }])
                .exec(function (err, account) {
                    if (err) {
                        debug('ERROR google', err);
                        return;
                    }

                    // Create one if doesnt exist
                    if (!account) {
                        debug('new google account', email);
                        new Account({
                            _id: (email).toLowerCase().replace(/[^a-z]/g, ''),
                            email: email,
                            google: identifier,
                            display: display
                        }).save(function (err, saved) {
                            if (err) {
                                debug('ERROR google new account save', err);
                                return;
                            }
                            done(null, saved);
                        });
                        return;
                    }

                    // auto-link to the google account if it already exists
                    // for this email
                    if (!account.google) {
                        debug('linking google account', email);
                        account.google = identifier;
                        account.save(function (err, saved) {
                            if (err) {
                                debug('ERROR google linking account save', err);
                                return;
                            }
                            done(null, saved);
                        });
                        return;
                    }

                    debug('google auth successful', email);
                    done(null, account);
                });
            }
        ));
    }

    return passport;
}

exports = module.exports = strategize;
