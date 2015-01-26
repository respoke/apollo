/*!
 * Copyright 2014, Digium, Inc.
 * All rights reserved.
 *
 * This source code is licensed under The AGPL v3 License found in the
 * LICENSE file in the root directory of this source tree.
 *
 * For all details and documentation:  https://www.respoke.io
 */
'use strict';
var _ = require('lodash');
exports = module.exports = function (config) {
    var errors = [];
    function e (text) {
        errors.push(text);
    }
    if (!config) {
        e('config is empty');
        return errors;
    }

    if (
        _.isEmpty(config.smtp)
        || _.isEmpty(config.smtp.auth)
        || _.isEmpty(config.smtp.auth.user)
        || _.isEmpty(config.smtp.auth.pass)
    ) {
        e('smtp settings are required');
    }
    var incompleteGoogle = !config.google.clientID || !config.google.clientSecret;
    if (config.google.enabled && incompleteGoogle) {
        e('Google auth requires setup of clientID and clientSecret in config.js google section.');
        e('Visit https://console.developers.google.com to setup OAuth 2.0');
    }

    return errors;
};
