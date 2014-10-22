'use strict';

var Promise = require('es6-promise').Promise;

var Deferred = function () {
    var d = {};
    d.promise = new Promise(function (resolve, reject) {
        d.resolve = resolve;
        d.reject = reject;
    });
    return d;
};

module.exports = Deferred;
