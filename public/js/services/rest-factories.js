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

/**
 * This function applies the following factories to the `app`. It is not using the angular
 * service $resource.
 *
 * The signature of a rest factory is as follows. It may accept some or no arguments.
 * The last argument is always the callback in the format below.
 *
 *     Account.someMethod(some, args, function (httpErrorRes, httpSuccessData) {
 *
 *     });
 *
 */
exports = module.exports = function bindRestFactories(app) {
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
        /**
         * The Account REST functionality.
         */
        function Account($http) {
            return {
                /**
                 * @param string _id username
                 * @param string conf token
                 * @param callback
                 */
                confirm: function (_id, conf, callback) {
                    $http
                    .put('/api/confirmation/' + _id + '/' + conf)
                    .success(success(callback)).error(fail(callback));
                },
                /**
                 * @param string _id username
                 * @param string conf token
                 * @param string password the new password
                 * @param callback
                 */
                resetPassword: function (_id, conf, password, callback) {
                    $http
                    .put('/api/password-reset/' + _id + '/' + conf, { password: password })
                    .success(success(callback)).error(fail(callback));
                },
                /**
                 * @param string email
                 * @param callback
                 */
                forgotPassword: function (email, callback) {
                    $http
                    .put('/api/forgot/' + email)
                    .success(success(callback)).error(fail(callback));
                },
                /**
                 * @param object account
                 * @param callback
                 */
                create: function (account, callback) {
                    $http
                    .post('/api/accounts', account)
                    .success(success(callback)).error(fail(callback));
                },
                /**
                 * @param object params data to post when logging in via local auth
                 * @param string params._id
                 * @param string params.password
                 * @param callback
                 */
                login: function (params, callback) {
                    $http
                    .post('/auth/local', params)
                    .success(success(callback)).error(fail(callback));
                },
                /**
                 * @param callback
                 */
                logout: function (callback) {
                    $http({
                        url: '/auth/session',
                        method: 'DELETE'
                    })
                    .success(success(callback)).error(fail(callback));
                },
                /**
                 * @param string id account._id
                 * @param callback
                 */
                removeUser: function (id, callback) {
                    $http({
                        url: '/api/accounts/' + id,
                        method: 'DELETE'
                    })
                    .success(success(callback)).error(fail(callback));
                },
                /**
                 * @param string id account._i
                 * @param string token conf token
                 * @param callback
                 */
                confirmUser: function (id, token, callback) {
                    $http.get('/conf/' + id + '/' + token)
                    .success(success(callback))
                    .error(fail(callback));
                },
                /**
                 * @param string id account._id
                 * @param callback
                 */
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
                /**
                 * @param callback
                 */
                getMe: function (callback) {
                    $http.get('/api/me')
                    .success(success(callback)).error(fail(callback));
                },
                /**
                 * Get an authorization token for the Respoke api
                 * @param callback
                 */
                getToken: function (callback) {
                    $http.get('/auth/tokens')
                    .success(success(callback)).error(fail(callback));
                },
                /**
                 * Update my account data.
                 * @param object params
                 * @param callback
                 */
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
        /**
         * The Message REST functionality.
         */
        function Message($http, $rootScope, $log) {

            function addMessageToServerHistory(message) {
                if (!message.offRecord) {
                    $http
                    .post('/api/messages', message)
                    .success(success())
                    .error(function (err) {
                        if (err) {
                            $log.error('fail while saving message to server history', err);
                        }
                        $rootScope.notifications.push('Failed to save message to the server.');
                    });
                }
            }

            return {
                create: function (message, callback) {
                    // message.content is a JSON string
                    message.content = JSON.stringify(message.content);
                    var errTooLarge = new Error('Message is too long. Consider breaking it into smaller chunks.');
                    if (message.content.length > 4096) {
                        return callback(errorTooLarge);
                    }

                    if (message.group) {
                        $log.debug('sending group message', message.group, message.content);
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
                        $log.debug('sending private message', privateMessage);
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
        /**
         * The Group REST functionality.
         */
        function Group($http, $rootScope) {
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
        /**
         * The File REST functionality.
         */
        function File($http) {
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
