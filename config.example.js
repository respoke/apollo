/*!
 * Copyright (c) 2014, D.C.S. LLC. All Rights Reserved. Licensed Software.
 */

// When saved as config.js, the file is excluded from source control
// by the .gitignore file.

var config = {};
config.name = 'Apollo';
config.port = process.env.PORT || 3000;

// Password hashing salt.
// Once implemented, DO NOT CHANGE or all passwords will cease to work
config.salt = 'change-this-please-1234';

// configuration for application level messages
config.systemGroupId = 'apollo-system-messages';
config.systemEndpointId = 'apollo-system-endpoint';

// Where the application lives, with no trailing slash
config.baseURL = 'http://localhost:' + config.port;

// URL to the respoke library.
config.respokeJS = 'https://cdn.respoke.io/respoke.min.js';
// You can also specify a folder where a local copy of respoke is located.
// (primarily for development purposes)
//
//      config.respokeJS = '/respoke.min.js';
//      config.respokeLocalPath = __dirname + '/../mercury/javascript/transporter/';
//
config.respokeLocalPath = null;

// main DB
config.mongoURI = 'mongodb://localhost/apollo';

// session store
// passed directly to MongoStore
// https://github.com/kcbanner/connect-mongo
config.mongoSessions = {
    secret: 'change-this-1234',
    url: 'mongodb://localhost/apollosessions'
};

// miliseconds for cookie to live
config.cookieMaxAge = 1000 * 60 * 60 * 24 * 7; // one week

config.email = {
    from: 'Apollo <system@example.com>'
};

// Respoke settings
// Get appId and appSecret from the developer console:
// https://portal.respoke.io
config.respoke = {
    appId: "",
    appSecret: "",
    roleId: ""
};

// Email
// Optional. Leaving smtp options blank will result in failed
// emails being logged, but will not affect app stability.
// The options are the SMTP transport options for Nodemailer.
// https://github.com/andris9/nodemailer-smtp-transport#usage
config.smtp = {
    port: '',
    host: '',
    secure: true,

    // or
    service: '', // 'gmail'


    auth: {
        user: '',
        pass: ''
    }
};

// Let people sign up using their local account?
config.localSignupEnabled = true;

// Allow Google OAuth 2.0?
// Create a project and go to APIs & Auth > Credentials
// - https://console.developers.google.com
// - be sure to setup the consent screen as well
//
// Using Passport.js google oauth plugin:
// -  https://github.com/jaredhanson/passport-google-oauth
config.google = {

    // Apollo option: enable authentication via google?
    enabled: false,

    // Apollo option: restrict to a list of email domains?
    // Leave empty for any domain.
    domains: [],

    // passport options
    clientID: 'GOOGLE_CLIENT_ID',
    clientSecret: 'GOOGLE_CLIENT_SECRET',
    callbackURL: config.baseURL + '/auth/google/callback'
};

// Keep in mind, the maximum size for a MongoDB record is 16mb.
config.maxUploadSize = '15.6mb';

// Put your environment specific configurations here.
if (process.env.NODE_ENV === 'production') {

}

exports = module.exports = config;
