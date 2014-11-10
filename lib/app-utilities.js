/*!
 * Copyright (c) 2014, D.C.S. LLC. All Rights Reserved. Licensed Software.
 */
'use strict';
var crypto = require('crypto');
var config = require('../config');

exports = module.exports = {
    hash: function (pass) {
        return crypto.createHash('sha256').update(pass + config.salt).digest('base64');
    }
};
