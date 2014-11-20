/*!
 * Copyright 2014, Digium, Inc.
 * All rights reserved.
 *
 * This source code is licensed under The GPL v2 License found in the
 * LICENSE file in the root directory of this source tree.
 *
 * For all details and documentation:  https://www.respoke.io
 */
'use strict';
var crypto = require('crypto');
var config = require('../config');

exports = module.exports = {
    hash: function (pass) {
        return crypto.createHash('sha256').update(pass + config.salt).digest('base64');
    }
};
