var passport = require('passport');
var mongoose = require('mongoose');
var LocalStrategy = require('passport-local').Strategy;

function strategize() {

    var localStrategy = new LocalStrategy(function(username, password, done) {
        
        mongoose.model('Account').findOne({ username: username }, function (err, account) {
            if (err) {
                return done(err);
            }
            if (!account) {
                return done(null, false, { message: 'Incorrect username.' });
            }
            if (!account.isPasswordInvalid(password)) {
                return done(null, false, { message: 'Incorrect password.' });
            }
            return done(null, account);
        });

    });
    passport.use(localStrategy);

    return passport;
}

exports = module.exports = strategize;
