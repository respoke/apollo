'use strict';
var Promise = require('es6-promise').Promise;
var Deferred = require('./utils/deferred.js');
var nodeify = require('nodeify');
var events = require('events');
var util = require('util');
var request = require('request');
var io = require('socket.io-client');
var debug = require('debug')('respoke-client');
var _ = require('lodash');
var errors = require('./utils/errors');

/**
 * Determine whether the specified statusCode indicates a successful HTTP request.
 *
 * @param {number} statusCode The status code to check
 * @returns {boolean} Whether the statusCode is a 2xx status code.
 * @private
 */
function isOk(statusCode) {
    return statusCode >= 200 && statusCode < 300;
}

/**
 * # [Respoke](https://www.respoke.io) for Node
 * [![NPM version](https://badge.fury.io/js/respoke.svg)](http://badge.fury.io/js/respoke)
 * [![Build Status](https://travis-ci.org/respoke/node-respoke.svg)](https://travis-ci.org/respoke/node-respoke)
 * [![Dependency Status](https://david-dm.org/respoke/node-respoke.svg)](https://david-dm.org/respoke/node-respoke)
 * [![devDependency Status](https://david-dm.org/respoke/node-respoke/dev-status.svg)](https://david-dm.org/respoke/node-respoke#info=devDependencies)
 *
 * ```bash
 * $   npm install respoke
 * ```
 *
 * A general purpose client for communicating with Respoke over REST and web sockets.
 *
 *
 * #### Respoke platform documentation
 * https://docs.respoke.io
 *
 *
 * #### Testing and development
 * Rename `spec/helpers.example.js` to `spec/helpers.js` and put in your credentials.
 * That file is excluded from source control.
 *
 * ```bash
 * $   npm test
 * ```
 *
 * #### Display verbose output during tests
 * ```bash
 * $   npm run debug-test
 * ```
 *
 * #### Building and viewing the source documentation
 * ```bash
 * $   npm run docs
 * ```
 *
 * ----
 * ## Respoke Authentication
 * There are multiple levels of authentication to Respoke, depending on your use case.
 * In general, the hierarchy of credentials is as follows:
 *
 * > 1. "Admin-Token" (full account administrator)
 *
 * > 2. "App-Secret" (app level administration)
 *
 * > 3. "App-Token" (endpoint / end user)
 *
 * ----
 * ## Usage
 *
 *
 * ### Instantiate a client with an `App-Secret`
 *
 *      var Respoke = require('respoke');
 *      var admin = new Respoke({
 *          // from the Respoke developer console under one of your apps
 *          appId: "XXXX-XXX-XXXXX-XXXX",
 *          'App-Secret': 'XXXX-XXXXX-XXX-XXXXXXXX'
 *      });
 *      
 *      // connect to respoke
 *      // provide an `endpointId` for receiving messages
 *      admin.auth.connect({ endpointId: "superWombat"});
 *      admin.on('connect', function () {
 *          console.log('admin is connected to respoke');
 *      });
 *      admin.on('message', function (message) {
 *          if (message.endpointId === 'billy') {
 *              console.log('message from billy', message);
 *          }
 *      });
 *
 * ### Obtain a session token for an endpoint
 *
 *      admin.auth.endpoint({
 *          endpointId: "billy",
 *          roleId: "XXXX-XXX-XXXXX-XXXX"
 *      }, function (err, authData) {
 *          if (err) { console.error(err); return; }
 *
 *          // Now we have a token for an end user to authenticate as an endpoint.
 *          console.log(authData.tokenId); // "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
 *          var billy = new Respoke({ appId: 'XXXX-XXXXX-XXXX-XXX' });
 *
 *          billy.auth.sessionToken({ tokenId: authData.tokenId }, function (err, sessionData) {
 *              if (err) { console.error(err); return; }
 *
 *              // Now we have a session token from `sessionData.token`.
 *              // However, for our purposes, there is no need to do anything with it because
 *              // the library caches it automatically at `billy.tokens['App-Token']`, and
 *              // uses it when it needs it.
 *              billy.auth.connect();
 *
 *              // Respoke is an EventEmitter
 *              billy.on('connect', function () {
 *                  console.log('connected to respoke!');
 *                  billy.messages.send({
 *                      endpointId: 'superWombat',
 *                      message: 'Hi wombat'
 *                  });
 *              });
 *
 *          });
 *      });
 * ----
 *
 * @class respoke
 * @param {object} options - Optional
 * @param {string} options.appId - Optional
 * @param {object} options['Admin-Token'] - Optional header, if you already authenticated
 * @param {object} options['App-Secret'] - Optional header, from Respoke dev console
 * @param {object} options['App-Token'] - Optional header, if you already authenticated
 * @param {string} options.baseURL=https://api.respoke.io/v1 - Optional
 * @param {object} options.socket - Optional, overrides the default socket.io client
 */
function Client(options) {

    var self = this;
    events.EventEmitter.call(this);
    options = options || { };

    /**
     * Container object for header tokens.
     * These are used when performing REST or web socket requests to Respoke.
     * @type {object}
     */
    self.tokens = { };
    /**
     * Header `Admin-Token`
     * @type {string}
     */
    self.tokens['Admin-Token'] = options['Admin-Token'] || null;
    /**
     * Header `App-Secret`
     * @type {string}
     */
    self.tokens['App-Secret'] = options['App-Secret'] || null;
    /**
     * Header `App-Token`
     * @type {string}
     */
    self.tokens['App-Token'] = options['App-Token'] || null;
    /**
     * App id
     * @type {string}
     */
    self.appId = options.appId || null;

    /**
     * If connected, this is the web socket connection ID with Respoke.
     * @type {string}
     */
    self.connectionId = null;
    /**
     * If connected, this is the endpointId.
     * @type {string}
     */
    self.endpointId = null;

    /**
     * The base respoke api to use. In most circumstances there is no reason
     * to change this.
     *
     * It should include the API version with no trailing `/`.
     *
     * `https://api.respoke.io/v1`
     *
     * @type {string}
     */
    self.baseURL = options.baseURL || "https://api.respoke.io/v1";


    /**
     * The web socket connection instance from socket.io.
     *
     * @type WebSocket
     * @private
     */
    self.socket = options.socket ? options.socket : null;

    /**
     * General purpose method for doing a REST call to Respoke.
     *
     * @param {object} params
     * @param {object} params.body
     * @param {boolean} params.json=true
     * @param {object} params.headers=self.tokens
     * @param {function} callback (err, body)
     */
    self.request = function (params, callback) {
        params = _.defaults(params || {}, {
            json: true,
            headers: self.tokens
        });
        debug('request', params);

        request(params, callback);
    };

    /**
     * Make a general purpose web socket call over the active `.socket`.
     *
     * @param string httpMethod
     * @param string urlPath - Relative to `baseUrl`
     * @param object data - Optional; to be sent over web socket
     * @param object [data.headers] - Optional WS header object
     * @auth endpoint, web-socket
     */
    self.wsCall = function (httpMethod, urlPath, data) {
        var deferred = Deferred();

        // Defaults to App-Token header since that will have an associated endpoint
        var headers = {};
        if (self.tokens['App-Token']) {
            headers['App-Token'] = self.tokens['App-Token'];
        }
        // Be sure to set own endpointId when not using App-Token.
        else {
            headers = self.tokens;
        }

        var wsBody = {
            url: self.baseURL + urlPath,
            headers: headers,
            data: data
        };

        return new Promise(function (resolve, reject) {
            debug('socket send ' + httpMethod, wsBody);
            self.socket.emit(httpMethod.toLowerCase(), JSON.stringify(wsBody), function (response) {
                try {
                    response = JSON.parse(response);
                }
                catch (ignored) {
                    debug('socket response error', 'could not be parsed as JSON', response);
                    reject(new errors.UnparseableResponse());
                    return;
                }
                if (response && response.error) {
                    debug('socket response error', response);
                    reject(new errors.SocketErrorResponseFromServer(
                        response,
                        httpMethod,
                        urlPath
                    ));
                    return;
                }

                debug('socket response ok', httpMethod, self.baseURL + urlPath, typeof response, response);
                resolve(response);
            });
        });
    };

    /**
     * Namespace object. The methods at `respoke.auth` are used for
     * obtaining auth credentials and connecting with Respoke.
     * @type {object}
     */
    self.auth = { };

    /**
     * As an admin (with `respoke.tokens['App-Token']` or `respoke.tokens['App-Secret']`),
     * obtain a `tokenId` which can be used to authenticate to Respoke as an endpoint.
     *
     *      respoke.auth.endpoint({
     *          endpointId: "user-billy",
     *          roleId: "XXXX-XXX-XXXXX-XXXX"
     *      }, function (err, authData) {
     *          if (err) { console.error(err); return; }
     *
     *          console.log(authData.tokenId); // "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
     *      });
     *
     * @param {object} opts
     * @param {object} opts.appId required
     * @param {object} opts.endpointId required
     * @param {object} opts.roleId required unless app is in development mode
     * @param {object} opts.ttl=86400 optional seconds time-to-live
     * @param {object} opts.headers['App-Secret'] optional; override cached token
     * @param {object} opts.headers['Admin-Token'] optional; override cached token
     * @param {function} callback - (err, clientAuthData)
     * @auth app-secret, rest
     */
    self.auth.endpoint = function (opts, callback) {
        opts = _.defaults(opts || {}, {
            appId: self.appId,
            endpointId: null,
            roleId: null,
            ttl: 84600
        });

        var requestOptions = {
            uri: self.baseURL + '/tokens',
            method: 'POST',
            headers: opts.headers,
            json: true,
            body: opts
        };

        if (callback) {
            nodeify(self.auth.endpoint(opts), callback);
            return;
        }

        return new Promise(function (resolve, reject) {
            if (!opts.appId) {
                return reject(new Error(
                    "Cannot authenticate endpoint when appId is " + opts.appId
                ));
            }
            if (!opts.endpointId) {
                return reject(new Error(
                    "Cannot authenticate endpoint when endpointId is " + opts.endpointId
                ));
            }

            self.request(requestOptions, function (err, res, body) {
                if (err) {
                    return reject(err);
                }

                if (!isOk(res.statusCode)) {
                    return reject(new errors.UnexpectedServerResponseError(res));
                }

                return resolve(body);
            });
        });
    };

    /**
     * As an endpoint, obtain an app auth session. This creates a session for the user
     * to connect to your Respoke app.
     *
     * Upon successful authentication, it sets the property `respoke.tokens['App-Token']`
     * which will be used during HTTP requests, or to establish a web socket.
     * `{ token: 'XXXX-XXX-XXXXX-XXXX' }`
     *
     * In most cases, you will immediately call `.connect()` to initiate the web socket.
     *
     * @param {object} opts required
     * @param {string} [opts.tokenId] required
     * @param {function} callback (err, body)
     * @auth app-secret, rest
     */
    self.auth.sessionToken = function (opts, callback) {
        opts = _.defaults(opts || {}, {
            tokenId: null
        });

        if (callback) {
            nodeify(self.auth.sessionToken(opts), callback);
            return;
        }

        return new Promise(function (resolve, reject) {
            if (!opts.tokenId) {
                return reject(new Error("Cannot authenticate without tokenId"));
            }

            self.request({
                uri: self.baseURL + '/session-tokens',
                method: "POST",
                json: true,
                headers: {},
                body: {
                    tokenId: opts.tokenId
                }
            }, function (err, res, body) {
                if (err) {
                    return reject(err);
                }

                if (!isOk(res.statusCode)) {
                    return reject(new errors.UnexpectedServerResponseError(res));
                }

                debug('session-tokens', body);
                self.tokens['App-Token'] = body.token;

                return resolve(body);
            });
        });
    };

    /**
     * Connect as a web socket client using the highest authentication token
     * currently available.
     *
     * After calling this, attach event listeners such as
     * `respoke.on('connect')` and `respoke.on('error')`.
     *
     * @param {object} opts optional
     * @param {string} opts.endpointId required if not connecting using App-Token
     * @param {string} opts['Admin-Token'] optional
     * @param {string} opts['App-Secret'] optional
     * @param {string} opts['App-Token'] optional
     * @param {object} opts.connectParams optional Socket.io connection parameters
     * @auth app-token
     */
    self.auth.connect = function (opts) {
        opts = _.defaults(opts || {}, {
            'Admin-Token': self.tokens['Admin-Token'],
            'App-Secret': self.tokens['App-Secret'],
            'App-Token': self.tokens['App-Token'],
            endpointId: null,
            connectParams: {
                'connect timeout': 2000,
                // Don't try to reuse old connection.
                'force new connection': true,
                // have Socket.io call disconnect() on the browser unload event.
                'sync disconnect on unload': true,
            }
        });

        debug('auth connect', opts);

        if (!opts['Admin-Token'] && !opts['App-Secret'] && !opts['App-Token']) {
            return self.emit('error', new errors.NoAuthenticationTokens());
        }

        var adminAuth = opts['Admin-Token'] || opts['App-Secret'];
        if (adminAuth && !opts.endpointId) {
            return self.emit('error', new errors.MissingEndpointIdAsAdmin());
        }

        var tokenQS = "?";
        if (opts['App-Token']) {
            tokenQS += "&app-token=" + opts['App-Token'];
        }
        else if (opts['App-Secret']) {
            tokenQS += "&app-secret=" + opts['App-Secret'];
        }
        else if (opts['Admin-Token']) {
            tokenQS += "&admin-token=" + opts['Admin-Token'];
        }

        var dataBody = null;
        if (opts.endpointId) {
            dataBody = { endpointId: opts.endpointId };
        }

        var nopathUrl = self.baseURL.substring(0, self.baseURL.length - 3); // split off the api version
        var connectionString = nopathUrl + tokenQS;

        // TODO: refactor out io.connection to use DI for better test coverage
        if (!self.socket) {
            debug('web socket connecting', connectionString, opts.connectParams);
            self.socket = io.connect(connectionString, opts.connectParams);
        }

        // TODO: create tests for these event listeners, especially the ones
        // with logic
        self.socket.on('connect', function () {
            debug('event connect', self.endpointId);
            self.wsCall('post', '/connections', dataBody)
                .then(function (data) {
                    self.endpointId = data.endpointId;
                    self.connectionId = data.id;
                    /**
                     * Connected to respoke.
                     * @event connect
                     */
                    self.emit('connect');
                }, function (error) {
                    self.emit('error', error);
                }).catch(function (error) {
                    process.nextTick(function () { throw error; });
                });
        });
        self.socket.on('disconnect', function() {
            debug('event disconnect', self.endpointId);
            /**
             * Disconnected from respoke.
             * @event disconnect
             */
            self.emit('disconnect');
        });
        self.socket.on('reconnect', function (num) {
            debug('event reconnect', self.endpointId, num);
            /**
             * Reconnected with respoke.
             * @event reconnect
             * @property {number} num
             */
            self.emit('reconnect', num);
        });
        self.socket.on('reconnecting', function (num) {
            debug('event reconnecting', self.endpointId, num);
            /**
             * Reconnecting with respoke.
             * @event reconnecting
             * @property {number} num
             */
            self.emit('reconnecting', num);
        });
        self.socket.on('error', function (err) {
            debug('event error', self.endpointId, err);
            /**
             * An error occurred.
             * @event error
             * @property {error} err
             */
            self.emit('error', err);
        });
        self.socket.on('connect_error', function (err) {
            debug('event connect_error', self.endpointId, err);
            /**
             * An error occurred while trying to connect.
             * @event connect_error
             * @property {error} err
             */
            self.emit('connect_error', err);
        });
        self.socket.on('connect_timeout', function () {
            debug('event connect_timeout', self.endpointId);
            /**
             * A connection timeout.
             * @event connect_timeout
             */
            self.emit('connect_timeout');
        });
        self.socket.on('message', function (msg) {
            debug('event message', self.endpointId, msg);
            /**
             * There is an incoming private message, from an endpoint.
             * @event message
             * @property {object} msg
             */
            self.emit('message', msg);
        });
        self.socket.on('presence', function (res) {
            debug('event presence', self.endpointId, res);
            /**
             * Presence for an endpoint has changed or is now available.
             * @event presence
             * @property {object} res
             */
            self.emit('presence', res);
        });
        self.socket.on('join', function (res) {
            debug('event join', self.endpointId, res);
            res.header.groupId = res.header.channel;
            delete res.header.channel;
            /**
             * An endpoint (which can include this client) has joined a group.
             * @event join
             * @property {object} res
             */
            self.emit('join', res);
        });
        self.socket.on('leave', function (res) {
            debug('event leave', self.endpointId, res);
            res.header.groupId = res.header.channel;
            delete res.header.channel;
            /**
             * An endpoint (which can include this client) has left a group.
             * @event leave
             * @property object res
             */
            self.emit('leave', res);
        });
        self.socket.on('pubsub', function (res) {
            debug('event pubsub', self.endpointId, res);
            res.header.groupId = res.header.channel;
            delete res.header.channel;
            /**
             * A group message has been received.
             * @event pubsub
             * @property object res
             */
            self.emit('pubsub', res);
        });
    };

    /**
     * Authenticate with full admin privileges. This is not a recommended auth strategy
     * and should only be used in rare circustances when `App-Secret` auth is not
     * enough.
     *
     * Upon successful authentication, it sets the property `respoke.tokens['Admin-Token']`
     * which will be used during HTTP requests or to establish a web socket.
     * `{ token: 'XXXX-XXX-XXXXX-XX' }`
     *
     * @param {object} opts - Required
     * @param {string} opts.username
     * @param {string} opts.password
     * @param {function} callback (err, body)
     * @auth rest
     */
    self.auth.admin = function (opts, callback) {

        if (callback) {
            nodeify(self.auth.admin(opts), callback);
            return;
        }

        return new Promise(function (resolve, reject) {
            if (!opts.username) {
                return reject(new Error("Cannot authenticate without username"));
            }
            if (!opts.password) {
                return reject(new Error("Cannot authenticate without password"));
            }

            var authParams = {
                uri: self.baseURL + '/adminsessions',
                method: 'POST',
                json: true,
                body: {
                    username: opts.username,
                    password: opts.password
                }
            };

            self.request(authParams, function(err, res, body) {
                if (err) {
                    return reject(err);
                }

                if (!isOk(res.statusCode)) {
                    return reject(new errors.UnexpectedServerResponseError(res));
                }

                debug('admin session token', body);
                self.tokens['Admin-Token'] = body.token;

                return resolve(body);
            });
        });
    };

    /**
     * Delete the app auth session, disconnect the web socket, and remove all listeners.
     * @param {function} callback (err)
     */
    self.close = function (callback) {
        var deferred = Deferred();

        if (callback) {
            nodeify(self.close(), callback);
            return;
        }

        self.socket.on('disconnect', function () {
            self.connectionId = null;
            self.socket.removeAllListeners();
            deferred.resolve();
        });

        self.wsCall(
            'delete',
            '/connections/' + encodeURIComponent(self.connectionId),
            {
                endpointId: self.endpointId
            }
        ).then(function (response) {
            debug('deleted endpoint connection session', self.endpointId);
        }).catch(function (err) {
            throw new errors.FailedEndpointDeletion();
        });

        return deferred.promise;
    };

    /**
     * Namespace object. Methods for interacting with presence indication.
     * @type {object}
     */
    self.presence = { };
    /**
     * Register as an observer of presence for the specified endpoint ids.
     *
     * @param {array<string>} endpoints
     * @param {function} callback
     * @auth endpoint, web socket
     */
    self.presence.observe = function (endpoints, callback) {
        if (callback) {
            nodeify(self.presence.observe(endpoints), callback);
            return;
        }

        return self.wsCall('post', '/presence-observers', {
            endpointList: endpoints
        });
    };
    /**
     * Set your own presence.
     *
     * @param {object} params
     * @param {string|number|object|array} params.presence - Your presence object. Format varies,
     * depending on how your application decides to implement presence.
     * @param {string} params.status - Human readable status message.
     * @param {function} callback
     * @auth endpoint, web socket
     */
    self.presence.set = function (params, callback) {
        if (callback) {
            nodeify(self.presence.set(params), callback);
            return;
        }

        var body = {
            presence: {
                show: params.show || true,
                status: params.status,
                type: params.presence || "available"
            }
        };

        return self.wsCall('post', '/presence', body);
    };

    /**
     * Namespace object. Messaging.
     * @type {object}
     */
    self.messages = { };

    /**
     * Send a message to an endpoint or specific connection of an endpoint.
     *
     * @param {object} params
     * @param {string} params.to endpointId
     * @param {string} params.connectionId optional
     * @param {string} params.message required
     * @param {string} params.type='message' optional
     * @auth endpoint, web socket
     */
    self.messages.send = function (params, callback) {
        if (callback) {
            nodeify(self.messages.send(params), callback);
            return;
        }

        params = _.defaults(params || {}, {
            type: 'message'
        });
        return self.wsCall('post', '/messages', params);
    };

    /**
     * Namespace object. Groups.
     * @type {object}
     */
    self.groups = { };

    /**
     * Send a message to a group.
     *
     * @param {object} params
     * @param {string} params.groupId
     * @param {string} params.message
     * @auth endpoint, web-socket
     */
    self.groups.publish = function (params, callback) {
        if (callback) {
            nodeify(self.groups.publish(params), callback);
            return;
        }

        if (!params.groupId) {
            return Promise.reject(
                new Error("Cannot send group message without groupId")
            );
        }

        return self.wsCall(
            'post',
            '/channels/' + encodeURIComponent(params.groupId) + '/publish',
            {
                endpointId: self.endpointId,
                message: params.message
            }
        );
    };

    /**
     * Get the members of a group.
     *
     * @param {object} params
     * @param {string} params.groupId
     * @param {function} callback
     * @auth endpoint, web-socket
     */
    self.groups.getSubscribers = function (params, callback) {
        if (callback) {
            nodeify(self.groups.getSubscribers(params), callback);
            return;
        }

        if (!params.groupId) {
            return Promise.reject(
                new Error("Cannot get group members without groupId")
            );
        }

        return self.wsCall(
            'get',
            '/channels/' + encodeURIComponent(params.groupId) + '/subscribers',
            null
        );
    };
    /**
     * Join a group.
     * @param {object} params
     * @param {string} params.groupId
     * @param {function} callback
     * @auth endpoint, web-socket
     */
    self.groups.join = function (params, callback) {
        if (callback) {
            nodeify(self.groups.join(params), callback);
            return;
        }

        var body = {
            endpointId: self.endpointId
        };

        if (!params.groupId) {
            return Promise.reject(
                new Error("Cannot join group without groupId")
            );
        }

        if (params.connectionId) {
            body.connectionId = params.connectionId;
        }

        return self.wsCall(
            'post',
            '/channels/' + encodeURIComponent(params.groupId) + '/subscribers',
            body
        );
    };
    /**
     * Leave a group.
     * @param {object} params
     * @param {string} params.groupId
     * @param {string} params.endpointId optional
     * @param {function} callback
     * @auth endpoint, web-socket
     */
    self.groups.leave = function (params, callback) {
        if (callback) {
            nodeify(self.groups.leave(params), callback);
            return;
        }

        if (!params.groupId) {
            return Promise.reject(
                new Error("Cannot leave group without groupId")
            );
        }

        var body = {
            endpointId: self.endpointId
        };
        return self.wsCall(
            'delete',
            '/channels/' + encodeURIComponent(params.groupId) + '/subscribers',
            body
        );
    };

    /**
     * Namespace object. For full admin only.
     * @type {object}
     */
    self.apps = { };

    /**
     * Get an app by `opts.appId`, or get all apps when `opts.appId` is not supplied.
     *
     *
     * @param {object} opts optional
     * @param {string} [opts.appId] optional
     * @param {object} [opts.headers] optional
     * @param {function} callback (err, app)
     * @auth admin-token, rest
     */
    self.apps.get = function (opts, callback) {
        if (opts instanceof Function && !callback) {
            callback = opts;
            opts = {};
        }
        opts = opts || {};

        if (callback) {
            nodeify(self.apps.get(opts), callback);
            return;
        }

        return new Promise(function (resolve, reject) {
            var requestOptions = _.defaults(opts || {}, {
                uri: self.baseURL + '/apps' + (opts.appId ? '/' + opts.appId : ''),
                method: 'GET',
                headers: self.tokens
            });

            self.request(requestOptions, function (err, res, body) {
                if (err) {
                    return reject(err);
                }

                if (!isOk(res.statusCode)) {
                    return reject(new errors.UnexpectedServerResponseError(res));
                }

                return resolve(body);
            });
        });
    };


    /**
     * Namespace object. For full admin only.
     * @type {object}
     */
    self.roles = { };

    /**
     * Retrieve a security role
     *
     * @param {object} options required
     * @param {string} [options.appId] required
     * @param {string} [options.roleId] optional
     * @param {function} callback(err, role)
     */
    self.roles.get = function (opts, callback) {
        if (opts instanceof Function && !callback) {
            callback = opts;
            opts = {};
        }
        opts = opts || {};

        if (callback) {
            nodeify(self.roles.get(opts), callback);
            return;
        }

        return new Promise(function (resolve, reject) {
            if (!opts.appId) {
                return reject(new Error('appId is required to retrieve roles'));
            }

            var requestOptions = _.defaults(opts || {}, {
                uri: self.baseURL + '/roles' + (opts.roleId ? '/' + opts.roleId : '') + '?appId=' + opts.appId,
                method: 'GET',
                headers: opts.headers
            });

            self.request(requestOptions, function (err, res, body) {
                if (err) {
                    return reject(err);
                }

                if (!isOk(res.statusCode)) {
                    return reject(new errors.UnexpectedServerResponseError(res));
                }

                return resolve(body);
            });
        });
    };

    /**
     * Create a security role.
     *
     * The callback data object contains the `id` of the created role,
     * which can be used for authenticating endpoints.
     *
     * @param {object} role the role to create required
     * @param {string} [role.appId] required
     * @param {string} [role.name] required
     * @param {object} opts optional request opts
     * @param {object} [opts.headers] optional
     * @param {function} callback(err, createdRole)
     */
    self.roles.create = function (role, opts, callback) {
        role = role || {};
        opts = opts || {};
        if (opts instanceof Function && !callback) {
            callback = opts;
            opts = {};
        }

        if (callback) {
            nodeify(self.roles.create(role, opts), callback);
            return;
        }

        return new Promise(function (resolve, reject) {
            if (!role.appId) {
                return reject(new Error("Cannot create role when appId is " + role.appId));
            }
            if (!role.name) {
                return reject(new Error("Cannot create role when name is " + role.name));
            }

            var requestOptions = _.defaults(opts || {}, {
                uri: self.baseURL + '/roles',
                method: 'POST',
                headers: opts.headers,
                body: role
            });
            self.request(requestOptions, function (err, res, body) {
                if (err) {
                    return reject(err);
                }

                if (!isOk(res.statusCode)) {
                    return reject(new errors.UnexpectedServerResponseError(res));
                }

                return resolve(body);
            });
        });
    };

    /**
     * Remove a security role.
     *
     * @param {object} opts required
     * @param {string} [opts.roleId] required
     * @param {object} [opts.headers] optional
     * @param {function} callback(err)
     */
    self.roles.delete = function (opts, callback) {
        opts = opts || {};

        if (callback) {
            nodeify(self.roles.delete(opts), callback);
            return;
        }

        return new Promise(function (resolve, reject) {
            if (!opts.roleId) {
                return reject(new Error("Cannot delete role when roleId is " + opts.roleId));
            }

            var requestOptions = ({
                uri: self.baseURL + '/roles/' + opts.roleId,
                method: 'DELETE',
                headers: opts.headers
            });

            self.request(requestOptions, function (err, res, body) {
                if (err) {
                    return reject(err);
                }

                if (!isOk(res.statusCode)) {
                    return reject(new errors.UnexpectedServerResponseError(res));
                }

                return resolve(body);
            });
        });
    };

    return self;
}
util.inherits(Client, events.EventEmitter);
exports = module.exports = Client;
