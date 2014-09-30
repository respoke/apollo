var config = {};
config.name = 'Apollo';
config.port = process.env.PORT || 3000;

// main DB
config.mongoURI = 'mongodb://localhost/apollo';

// session store
config.mongoSessions = {
    db: 'apollosessions',
    secret: 'change-this-1234'
};

if (process.env.NODE_ENV === 'production') {

}

exports = module.exports = config;
