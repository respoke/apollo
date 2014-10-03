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
// app utilities
var appUtilities = require('./lib/app-utilities');
// mongoose ODM models
var models = require('./models');

// App routes and controllers
var routes = require('./routes/index');
var api = require('./routes/api');
var auth = require('./routes/auth');

var app = express();
var respoke = new Respoke({
    'App-Secret': config.respoke.appSecret,
    appId: config.respoke.appId
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
app.use(bodyParser.json({ limit: '15.6mb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '15.6mb' }));
app.use(cookieParser());
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use('/js', browserify('./public/js'));
app.use(express.static(path.join(__dirname, 'public')));
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

// Error handlers
// will respond with JSON or HTML depending upon request

// Development error handler
// will print stacktrace
if (process.env.NODE_ENV !== 'production') {
    app.use(function(err, req, res, next) {
        if (req.accepts('json')) {
            res.send(err.status || 500, {
                error: err.message,
                stack: err.stack
            });
            return;
        }
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}
// Production error handler
// no stacktraces leaked to user
else {
    app.use(function(err, req, res, next) {
        if (req.accepts('json')) {
            res.send(err.status || 500, { error: err.message });
            return;
        }
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: {}
        });
    });
}

module.exports = app;


var server = app.listen(config.port, function() {
    debug(config.name + ' is listening at http://localhost:' + server.address().port + '/');
});
