var express = require('express');
var path = require('path');

// Express middleware
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var jadeStatic = require('connect-jade-static');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

// local configuration settings
var config = require('./config');
// mongoose ODM models
var models = require('./models');

// App routes and controllers
var routes = require('./routes/index');
var api = require('./routes/api');

var app = express();

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
    }),
    saveUninitialized: true,
    resave: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(jadeStatic({
    baseDir: path.join(__dirname, '/views/partials'),
    baseUrl: '/partials',
    jade: { pretty: true }
}));

app.use(function (req, res, next) {
    req.locals = req.locals || {};
    req.locals.config = config;
    req.db = models;

    next();
});
// Bind routes
app.use('/', routes);
app.use('/api', api);

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
        if (req.is('json')) {
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
        if (req.is('json')) {
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
