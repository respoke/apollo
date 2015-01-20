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
var express = require('express');
var path = require('path');
var fs = require('fs');
var nodemailer = require('nodemailer');
var Respoke = require('respoke-admin');
var debug = require('debug')('apollo-app');

// Express middleware
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var jadeStatic = require('connect-jade-static');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var browserify = require('browserify-middleware');
var middleware = require('./lib/middleware');

// local configuration settings
var config;
var clientConfig;
(function () {
    try {
        config = require('./config');
    } catch (ex) {
        console.error('\nYou did not set up the application config correctly at ./config.js');
        console.error('Copy the example from ./config.example.js and fill in your specific values.');
        console.error('For setup instructions see ./README.md\n');
        throw ex;
    }
    try {
        clientConfig = require('./public/js/client-config');
    } catch (ex) {
        console.warn('\nYou did not set up browser config correctly at ./public/js/client-config.js');
        console.warn('Attempting to use ./public/js/client-config.example.js instead.\n');
        debug(ex, '\n');
        clientConfig = require('./public/js/client-config.example.js');
    }
})();

var mailTransport = nodemailer.createTransport(config.smtp);
// app utilities
var appUtilities = require('./lib/app-utilities');
// mongoose ODM models
var models = require('./models');

var app = express();

// Respoke setup
var respoke = new Respoke({
    'App-Secret': config.respoke.appSecret,
    appId: config.respoke.appId,
    baseURL: config.respoke.baseURL
});
respoke.auth.connect({ endpointId: config.systemEndpointId });
respoke.on('connect', function () {
    debug('connected to respoke');
    respoke.groups.join({ groupId: config.systemGroupId }, function (err) {
        if (err) {
            debug('failed to join system group', config.systemGroupId, err);
            return;
        }
        debug('joined system group', config.systemGroupId);
    });
});
respoke.on('error', function (err) {
    debug('failed to connect to respoke', err);
});
var passport = require('./auth-strategies')(respoke);

// Attaching app locals and utils to request
app.use(function (req, res, next) {
    // res.set('Access-Control-Allow-Origin', '*');
    res.locals = req.locals || {};
    res.locals.config = config;
    res.locals.clientConfig = clientConfig;

    req.db = models;
    req.email = mailTransport;
    req.utils = appUtilities;
    req.respoke = respoke;

    next();
});

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));

// Sessions in mongo
app.use(session({
    secret: config.mongoSessions.secret,
    store: new MongoStore(config.mongoSessions),
    saveUninitialized: true,
    resave: true,
    cookie: {
        maxAge: config.cookieMaxAge
    }
}));

// Request parsers
app.use(bodyParser.json({ limit: config.maxUploadSize }));
app.use(bodyParser.urlencoded({ extended: false, limit: config.maxUploadSize }));
app.use(cookieParser());

// Serving static assets
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use('/js', browserify('./public/js'));
app.use(express.static(path.join(__dirname, 'public')));
if (config.respokeLocalPath) {
    app.use(express.static(config.respokeLocalPath));
}
app.use(jadeStatic({
    baseDir: path.join(__dirname, '/views/partials'),
    baseUrl: '/partials',
    jade: {
        pretty: true,
        config: config
    }
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Passport sessions and user population on req.user
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(function (account, done) {
    done(null, account._id);
});
passport.deserializeUser(function (id, done) {
    models.Account.findById(id, done);
});

// Bind application routes
app.use('/', require('./routes/home'));
app.use('/api', require('./routes/api'));
app.use('/auth', require('./routes/auth'));

// Loading Apollo plugins
var normalizedPath = path.join(__dirname, 'plugins');
var pluginVars = {
    db: models,
    config: config,
    clientConfig: clientConfig,
    email: mailTransport,
    respoke: respoke
};
if (fs.existsSync(normalizedPath)) {
    fs.readdirSync(normalizedPath).forEach(function (file) {
        var fullPath = './plugins/' + file;
        debug('loading plugin', fullPath);
        require(fullPath)(pluginVars, app);
    });
}

// Error handling routes
// after plugins in case the plugins extend the app routes
app.use(middleware.fourOhFour);
app.use(middleware.errorHandler);


module.exports = app;


var server = app.listen(config.port, function() {
    debug(config.name + ' is listening at http://localhost:' + server.address().port + '/');
    app.emit('loaded');
});
