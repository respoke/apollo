/*!
 * Copyright 2014, Digium, Inc.
 * All rights reserved.
 *
 * This source code is licensed under The AGPL v3 License found in the
 * LICENSE file in the root directory of this source tree.
 *
 * For all details and documentation:  https://www.respoke.io
 */
var passport = require('passport');
var mongoose = require('mongoose');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var config = require('./config');
var uuid = require('uuid');

/**
 * Setup passport. Creating account.
 * @param object respoke - Respoke client instance
 */
function strategize(respoke, logger) {
    // bind passport strategies here


    if (config.google.enabled) {
        passport.use(new GoogleStrategy({
                clientID: config.google.clientID,
                clientSecret: config.google.clientSecret,
                callbackURL: config.google.callbackURL
            },
            function (accessToken, refreshToken, profile, done) {
                logger.info('google auth', {
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                    profile: profile
                });

                var email = "";
                // just so there is something.
                // TODO: something better
                var display = uuid.v4();

                if (profile.emails && profile.emails.length && profile.emails[0]) {
                    email = profile.emails[0].value;
                }
                if (!email) {
                    logger.error('ERROR google - no email', profile);
                    return done(new Error("Google auth succeeded, but we did not get your email address."));
                }
                // Ensure the email address is available from google,
                // for apollo account creation.
                if (config.google.domains && config.google.domains.length) {
                    var emailArr = email.split('@');
                    var emailDomain = emailArr[emailArr.length - 1];
                    if (config.google.domains.indexOf(emailDomain) === -1) {
                        var errMsg = "Please use an email address from an authorized domain.";
                        logger.error('ERROR google - unauthorized email attempted to signup.', profile);
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
                .select('+google')
                .exec(function (err, account) {
                    if (err) {
                        logger.error(
                            'Error while trying to lookup a google auth user account in Mongo',
                            err,
                            profile
                        );
                        return;
                    }

                    // Create one if doesnt exist
                    if (!account) {
                        logger.info('new google account', email);
                        // TODO: implement a more proper solution throughout the app for
                        // _id / endpointId.
                        // currently we'll just force it lowercase and remove any characters
                        // that we don't like
                        var newId = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/gi, '');
                        new Account({
                            _id: newId,
                            email: email,
                            google: profile.id,
                            display: display
                        }).save(function (err, saved) {
                            if (err) {
                                logger.error('ERROR google new account save', err);
                                var userError = new Error("Something did not work quite right when creating your account. Please contact support.");
                                return done(userError);
                            }
                            done(null, saved);

                            // Let people who are logged in know that a new account was created
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
                                    logger.error('failed to send new account notification', err);
                                }
                            });

                        });
                        return;
                    }

                    // auto-link to the google account if it already exists
                    // for this email
                    if (!account.google) {
                        logger.info('linking google account', email);
                        account.google = profile.id;
                        account.save(function (err, saved) {
                            if (err) {
                                logger.error('ERROR google linking account save', err, profile);
                                done(new Error("Oops. Something broke when we tried to link your Google account. Please contact support."));
                                return;
                            }
                            done(null, saved);
                        });
                        return;
                    }

                    logger.info('google auth successful', email);
                    done(null, account);
                });
            }
        ));
    }

    return passport;
}

exports = module.exports = strategize;
