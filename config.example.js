var config = {};

config.mongoURI = "mongodb://localhost/apollo";

if (process.env.NODE_ENV === 'production') {

}

exports = module.exports = config;
