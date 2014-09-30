var config = {};
config.name = 'Apollo';
config.port = process.env.PORT || 3000;

// password hashing salt
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
    appSecret: ""
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

if (process.env.NODE_ENV === 'production') {

}

exports = module.exports = config;
