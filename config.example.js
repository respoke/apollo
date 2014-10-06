// This file is excluded from source control by the .gitignore file.

var config = {};
config.name = 'Apollo';
config.port = process.env.PORT || 3000;

// Password hashing salt.
// Once implemented, DO NOT CHANGE or all passwords will cease to work
config.salt = 'change-this-please-1234';

// Where the application lives, with no trailing slash
config.baseURL = 'http://localhost:' + config.port;

// main DB
config.mongoURI = 'mongodb://localhost/apollo';

// session store
config.mongoSessions = {
    db: 'apollosessions',
    secret: 'change-this-1234'
};

config.email = {
    from: 'Apollo <system@example.com.'
};

// Respoke settings
// Get appId and appSecret from the developer console:
// https://portal.respoke.io
config.respoke = {
    appId: "",
    appSecret: "",
    roleId: ""
};

// Email - SMTP transport options for Nodemailer
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


// Put your environment specific configurations here.
if (process.env.NODE_ENV === 'production') {

}

exports = module.exports = config;
