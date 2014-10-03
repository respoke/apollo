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

config.localSignupEnabled = true;

// Allow Google authentication?
// See PassportJS docs. http://passportjs.org/guide/google/
config.google = {

    // Apollo option: enable this feature?
    enabled: false,

    // Apollo option: restrict to a list of email domains?
    // Leave empty for any domain.
    domains: [],

    // passport options
    returnURL: '',
    realm: ''
};


// Put your environment specific configurations here.
if (process.env.NODE_ENV === 'production') {

}

exports = module.exports = config;
