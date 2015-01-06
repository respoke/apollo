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
exports = module.exports = function (app) {
    var success = function (callback) {
        callback = callback || function () { };
        return function (data) { callback(null, data); };
    };
    var fail = function (callback) {
        callback = callback || function () { };
        return function (err) { callback(err || { error: "Error. No response from the server." }); };
    };

    // Account
    app.factory('Account', ['$http',
        function ($http) {
            return {
                confirm: function (_id, conf, callback) {
                    $http
                    .put('/api/confirmation/' + _id + '/' + conf)
                    .success(success(callback)).error(fail(callback));
                },
                resetPassword: function (_id, conf, password, callback) {
                    $http
                    .put('/api/password-reset/' + _id + '/' + conf, { password: password })
                    .success(success(callback)).error(fail(callback));
                },
                forgotPassword: function (email, callback) {
                    $http
                    .put('/api/forgot/' + email)
                    .success(success(callback)).error(fail(callback));
                },
                create: function (account, callback) {
                    $http
                    .post('/api/accounts', account)
                    .success(success(callback)).error(fail(callback));
                },
                login: function (params, callback) {
                    $http
                    .post('/auth/local', params)
                    .success(success(callback)).error(fail(callback));
                },
                logout: function (callback) {
                    $http({
                        url: '/auth/session',
                        method: 'DELETE'
                    })
                    .success(success(callback)).error(fail(callback));
                },
                get: function (id, callback) {
                    var reqUrl = '/api/accounts';
                    if (id instanceof Function) {
                        callback = id;
                    }
                    else if (id.indexOf('?') === -1) {
                        reqUrl += '/' + id;
                    }
                    else {
                        reqUrl += id;
                    }
                    $http.get(reqUrl)
                    .success(success(callback)).error(fail(callback));
                },
                getMe: function (callback) {
                    $http.get('/api/me')
                    .success(success(callback)).error(fail(callback));
                },
                getToken: function (callback) {
                    $http.get('/auth/tokens')
                    .success(success(callback)).error(fail(callback));
                },
                update: function (params, callback) {
                    $http({
                        url: '/api/me',
                        method: 'PATCH',
                        data: params
                    })
                    .success(success(callback)).error(fail(callback));
                }
            };
        }
    ]);

    // Message
    app.factory('Message', ['$http', '$rootScope', '$log',
        function ($http, $rootScope, $log) {
            function addMessageToServerHistory(message) {
                if (!message.offRecord) {
                    $http
                    .post('/api/messages', message)
                    .success(success()).error(function (err) {
                        if (err) {
                            $log.error(err);
                        }
                        $rootScope.notifications.push('Failed to save message to the server.');
                    });
                }
            }
            return {
                create: function (message, callback) {
                    // message.content is a JSON string
                    message.content = JSON.stringify(message.content);
                    if (message.content.length > 4096) {
                        return callback(new Error('Message is too long. Consider breaking it into smaller chunks.'));
                    }

                    if (message.group) {
                        $rootScope.client.getGroup({ id: message.group })
                        .sendMessage({
                            message: message.content,
                            onSuccess: function (params) {
                                addMessageToServerHistory(message);
                                success(callback)(params);
                            },
                            onError: fail(callback)
                        });
                    }
                    else {
                        var privateMessage = {
                            endpointId: message.to,
                            message: message.content,
                            onSuccess: function (params) {
                                addMessageToServerHistory(message);
                                success(callback)(params);
                            },
                            onError: fail(callback)
                        };
                        $log.debug('privateMessage', privateMessage);
                        $rootScope.client.sendMessage(privateMessage);
                    }
                },
                get: function (id, callback) {
                    var reqUrl = '/api/messages';
                    if (id instanceof Function) {
                        callback = id;
                    }
                    else if (id.indexOf('?') === -1) {
                        reqUrl += '/' + id;
                    }
                    else {
                        reqUrl += id;
                    }
                    $http.get(reqUrl)
                    .success(function (data) {
                        // message content is JSON
                        if (data && data.length) {
                            for (var i=0; i < data.length; i++) {
                                try {
                                    data[i].content = JSON.parse(data[i].content);
                                } catch (ignored) { }
                            }
                        }
                        callback(null, data);
                    }).error(fail(callback));
                }
            };
        }
    ]);

    // Group
    app.factory('Group', ['$http', '$rootScope',
        function ($http, $rootScope) {
            return {
                create: function (group, callback) {
                    $http
                    .post('/api/groups', group)
                    .success(success(callback)).error(fail(callback));
                },
                get: function (id, callback) {
                    var reqUrl = '/api/groups';
                    if (id instanceof Function) {
                        callback = id;
                    }
                    else if (id.indexOf('?') === -1) {
                        reqUrl += '/' + id;
                    }
                    else {
                        reqUrl += id;
                    }
                    $http.get(reqUrl)
                    .success(success(callback)).error(fail(callback));
                },
                getByOwner: function (owner, callback) {
                    $http.get('/api/groups?owner=' + owner)
                    .success(success(callback)).error(fail(callback));
                },
                getPrivate: function (callback) {
                    $http.get('/api/private')
                    .success(success(callback)).error(fail(callback));
                },
                remove: function (id, callback) {
                    $http.delete('/api/groups/' + id)
                    .success(success(callback)).error(fail(callback));
                }
            };
        }
    ]);

    // File
    app.factory('File', ['$http',
        function ($http) {
            return {
                create: function (params, callback) {
                    $http
                    .post('/api/files', params)
                    .success(success(callback)).error(fail(callback));
                }
            };
        }
    ]);
};
