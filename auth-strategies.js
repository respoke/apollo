var passport = require('passport');
var mongoose = require('mongoose');
var GoogleStrategy = require('passport-google').Strategy;
var config = require('./config');

function strategize() {
    // bind passport strategies here

    if (config.google.enabled) {
        passport.use(new GoogleStrategy({
                returnURL: config.google.returnURL,
                realm: config.google.realm
            },
            function (identifier, profile, done) {
                console.log('identifier', identifier);
                console.log('profile', profile);

                var email = "";

                mongoose.model('Account').findOne()
                .or([{ openId: identifier }, email: email])
                .exec(function (err, user) {
                    return done(new Error("hi there"));
                });
            }
        ));
    }

    return passport;
}

exports = module.exports = strategize;
