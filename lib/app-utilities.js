'use strict';
var crypto = require('crypto');
var config = require('../config');

exports = module.exports = {
    hash: function (pass) {
        return crypto.createHash('sha256').update(pass + config.salt).digest('base64');
    }
};
