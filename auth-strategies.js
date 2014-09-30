var passport = require('passport');
var mongoose = require('mongoose');
var LocalStrategy = require('passport-local').Strategy;

function strategize() {
    // bind passport strategies here

    return passport;
}

exports = module.exports = strategize;
