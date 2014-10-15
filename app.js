'use strict';
var express = require('express');
var path = require('path');
var nodemailer = require('nodemailer');
var Respoke = require('respoke');
var debug = require('debug')('apollo-app');

// Express middleware
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var jadeStatic = require('connect-jade-static');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var passport = require('./auth-strategies')();
var browserify = require('browserify-middleware');

// local configuration settings
var config = require('./config');
var clientConfig = require('./public/js/client-config');
// app utilities
var appUtilities = require('./lib/app-utilities');
// mongoose ODM models
var models = require('./models');

// App routes and controllers
var routes = require('./routes/index');
var api = require('./routes/api');
var auth = require('./routes/auth');

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

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');


app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
// sessions
app.use(session({
    secret: config.mongoSessions.secret,
    store: new MongoStore({
        db: config.mongoSessions.db,
        url: config.mongoURI
    }),
    saveUninitialized: true,
    resave: true
}));
app.use(bodyParser.json({ limit: config.maxUploadSize }));
app.use(bodyParser.urlencoded({ extended: false, limit: config.maxUploadSize }));
app.use(cookieParser());
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

// Attaching app locals and utils to request
app.use(function (req, res, next) {
    res.locals = req.locals || {};
    res.locals.config = config;
    res.locals.clientConfig = clientConfig;
    
    req.db = models;
    req.email = nodemailer.createTransport(config.smtp);
    req.utils = appUtilities;
    req.respoke = respoke;

    next();
});

// Passport sessions and user population on req.user
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(function(account, done) {
    done(null, account._id);
});
passport.deserializeUser(function(id, done) {
    models.Account.findById(id, done);
});

// Bind routes
app.use('/', routes);
app.use('/api', api);
app.use('/auth', auth);

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// Error handler
// will respond with JSON or HTML depending upon request
app.use(function(err, req, res, next) {
    err.status = err.status || res.statusCode || 500;

    var errOut = {
        error: err,
        message: err.message,
        status: err.status
    };
    var prefersJson = req.accepts(['html', 'json']);

    if (process.env.NODE_ENV !== 'production') {
        errOut.stack = err.stack;
    }

    res.status(err.status);

    if (prefersJson === 'json') {
        res.send(errOut);
        return;
    }
    else {
        res.render('error', errOut);
    }
    
});

module.exports = app;


var server = app.listen(config.port, function() {
    debug(config.name + ' is listening at http://localhost:' + server.address().port + '/');
});
