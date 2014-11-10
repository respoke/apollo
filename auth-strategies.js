/*!
 * Copyright (c) 2014, D.C.S. LLC. All Rights Reserved. Licensed Software.
 */
var passport = require('passport');
var mongoose = require('mongoose');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var config = require('./config');
var debug = require('debug')('passport');
var uuid = require('uuid');

/**
 * @param object respoke - Respoke client instance
 */
function strategize(respoke) {
    // bind passport strategies here


    if (config.google.enabled) {
        passport.use(new GoogleStrategy({
                clientID: config.google.clientID,
                clientSecret: config.google.clientSecret,
                callbackURL: config.google.callbackURL
            },
            function (accessToken, refreshToken, profile, done) {
                debug('google accessToken', accessToken);
                debug('google refreshToken', refreshToken);
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
                .or([{ google: profile.id }, { email: email }])
                .exec(function (err, account) {
                    if (err) {
                        debug('ERROR google', err);
                        return;
                    }

                    // Create one if doesnt exist
                    if (!account) {
                        debug('new google account', email);
                        var newId = email.split('@')[0];
                        new Account({
                            _id: newId,
                            email: email,
                            google: profile.id,
                            display: display
                        }).save(function (err, saved) {
                            if (err) {
                                debug('ERROR google new account save', err);
                                return;
                            }
                            done(null, saved);

                            respoke.groups.publish({
                                groupId: config.systemGroupId,
                                message: JSON.stringify({
                                    meta: {
                                        type: 'newaccount',
                                        value: saved._id
                                    }
                                })
                            }, function (err) {
                                if (err) {
                                    debug('failed to send new account notification', err);
                                }
                            });

                        });
                        return;
                    }

                    // auto-link to the google account if it already exists
                    // for this email
                    if (!account.google) {
                        debug('linking google account', email);
                        account.google = profile.id;
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
