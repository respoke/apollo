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

// Some libs
var fs = require('fs');
var path = require('path');
var express = require('express');
var nodemailer = require('nodemailer');
var Respoke = require('respoke-admin');
var bunyan = require('bunyan');

// Local configuration settings.
// Make sure we have the things that we need and give some friendly messages
// if stuff is missing.
var config;
var clientConfig;
(function () {
    // server configuration file.
    try {
        config = require('./config');
    } catch (ex) {
        console.error('\nYou did not set up the application config correctly at ./config.js');
        console.error('Copy the example from ./config.example.js and fill in your specific values.');
        console.error('For setup instructions see ./README.md\n');
        throw ex;
    }
    // Ensure all of the config values are filled out. Otherwise the app will crash later anyways.
    var errors = require('./lib/check-server-config')(config);
    if (errors.length) {
        console.warn('\nSome configuration options are not setup properly. The app may be unstable.');
        console.warn(errors, '\n');
    }
})();


// Logging
var logfilePath = config.logfilePath || __dirname + "/apollo.log";
var loggerOpts = {
    name: config.name,
    serializers: {
        req: bunyan.stdSerializers.req,
        res: bunyan.stdSerializers.res,
        err: bunyan.stdSerializers.err
    },
    streams: [{
        stream: process.stdout,
        level: 'info'
    }, {
        type: 'file',
        path: logfilePath,
        level: 'info'
    }]
};
var logger = require('bunyan')(loggerOpts);
var loggerMiddleware = require('express-bunyan-logger')({ logger: logger });
// if logstash rotates the files, bunyan needs to know
process.on('SIGHUP', function () {
    logger.reopenFileStreams();
});


// Browser configuration file

(function () {
    try {
        clientConfig = require('./public/js/client-config');
    } catch (ex) {
        logger.warn('\nYou did not set up browser config correctly at ./public/js/client-config.js');
        logger.warn('Attempting to use ./public/js/client-config.example.js instead.\n');
        logger.warn('To get rid of this message, copy "client-config.example.js" to "client-config.js"\n');
        logger.warn(ex, '\n');
        clientConfig = require('./public/js/client-config.example.js');
    }
})();


// Express middleware

var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var jadeStatic = require('connect-jade-static');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var browserify = require('browserify-middleware');
var middleware = require('./lib/middleware');


// Chat style themes

var themes = [];
(function () {
    var files = fs.readdirSync(__dirname + '/public/css/themes');
    files.forEach(function (f) {
        var parts = f.split('.');
        var ext = parts[1];
        if (ext === 'less') themes.push(parts[0]);
    });
    logger.warn('loaded themes', themes);
})();

// Email sending service
var mailTransport = nodemailer.createTransport(config.smtp);

// app utilities
var appUtilities = require('./lib/app-utilities');

// MongoDB - Mongoose ODM models
var models = require('./models')(logger);

var app = express();

// Respoke setup
var respoke = new Respoke({
    'App-Secret': config.respoke.appSecret,
    appId: config.respoke.appId,
    baseURL: config.respoke.baseURL
});
respoke.auth.connect({ endpointId: config.systemEndpointId });
respoke.on('connect', function () {
    logger.info('connected to respoke');
    respoke.groups.join({ groupId: config.systemGroupId }, function (err) {
        if (err) {
            logger.info('failed to join system group', config.systemGroupId, err);
            return;
        }
        logger.info('joined system group', config.systemGroupId);
    });
});
respoke.on('error', function (err) {
    logger.error('failed to connect to respoke', err);
});
var passport = require('./auth-strategies')(respoke, logger);

app.use(favicon(__dirname + '/public/favicon.ico'));

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
app.use(function (req, res, next) {
    req.session.touch();
    next();
});
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
        config: config,
        themes: themes
    }
}));


// Attaching app locals and utils to request
app.use(function (req, res, next) {
    // res.set('Access-Control-Allow-Origin', '*');
    res.set('X-Powered-By', '100-duck-sized-horses');
    res.locals = req.locals || {};
    res.locals.config = config;
    res.locals.clientConfig = clientConfig;
    res.locals.themes = themes;

    req.db = models;
    req.email = mailTransport;
    req.utils = appUtilities;
    req.respoke = respoke;

    next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Logger comes after the static files
app.use(loggerMiddleware);

// Passport sessions and user population on req.user
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(function (account, done) {
    done(null, account._id);
});
passport.deserializeUser(function (id, done) {
    models.Account.findById(id, done);
});
app.use(function (req, res, next) {
    if (req.user) {
        res.locals.user = req.user;
    }
    next();
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
        logger.info('loading plugin', fullPath);
        require(fullPath)(pluginVars, app);
    });
}


// Error handling routes
// after plugins in case the plugins extend the app routes
app.use(middleware.fourOhFour);
app.use(middleware.errorHandler);


module.exports = app;

var server = app.listen(config.port, function() {
    logger.info(config.name + ' is listening at http://localhost:' + server.address().port + '/');
    app.emit('loaded');
});
