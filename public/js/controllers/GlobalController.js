/*!
 * Copyright 2014, Digium, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the AGPL v3 License found in the
 * LICENSE file in the root directory of this source tree.
 *
 * For all details and documentation:  https://www.respoke.io
 */
'use strict';
exports = module.exports = [
    '$log',
    '$location',
    '$window',
    '$rootScope',
    '$scope',
    '$timeout',

    'Account',
    'Group',
    'respoke',
    'scrollChatToBottom',

    function GlobalController($log,
        $location,
        $window,
        $rootScope,
        $scope,
        $timeout,
        Account,
        Group,
        respoke,
        scrollChatToBottom
    ) {
        // Output all of the Respoke logs
        respoke.log.setLevel('debug');

        $rootScope.justLoggedIn = false;
        $rootScope.justLoggedOut = false;
        $scope.authFailureMessage = $location.search().authFailure;

        // When failing to get a token from the server, the interval will count up
        // during respokeConnect() and continue to request tokens.
        $scope.tokenRefreshInterval = 0;
        $scope.nextRetry = 0;

        $rootScope.systemGroupId = '';
        $rootScope.systemEndpointId = '';

        var checkingConnectedTimeout;

        function alwaysCheckConnected() {
            // $log.debug('alwaysCheckConnected');
            if (!$rootScope.client.isConnected()) {
                if (!$scope.tokenRefreshInterval) {
                    $scope.respokeConnect();
                }
            }
            checkingConnectedTimeout = $timeout(alwaysCheckConnected, 1000 * 15);
        }

        // Audio notifications
        $rootScope.audio = {
            callIncoming: new Audio('/audio/call-incoming.ogg'),
            callOutgoing: new Audio('/audio/call-outgoing.ogg'),
            callTimeout: new Audio('/audio/call-timeout.ogg'),
            error: new Audio('/audio/error.ogg'),
            mention: new Audio('/audio/mention.ogg'),
            message: new Audio('/audio/message.ogg'),
            videoIncoming: new Audio('/audio/call-video-incoming.ogg'),
            videoOutgoing: new Audio('/audio/call-video-outgoing.ogg'),
        };
        // keep the audio a little low - these sounds are pretty loud.
        for (var a in $rootScope.audio) {
            if ($rootScope.audio[a].volume) {
                $rootScope.audio[a].volume = 0.1;
            }
        }

        // Settings
        $rootScope.showSettings = false;
        $rootScope.toggleSettings = function (override) {
            $rootScope.showSettings = typeof override !== 'undefined' ? override : !$rootScope.showSettings;
            if (!$rootScope.showSettings) {
                $timeout(function () {
                    scrollChatToBottom(true);
                }, 200);
            }
            else {
                $timeout(function () {
                    $rootScope.loadGroups();
                    scrollChatToBottom(false);
                }, 100);
            }
        };
        $rootScope.ownedGroups = null;
        $rootScope.loadGroups = function loadGroups() {
            Group.getByOwner($rootScope.account._id, function (err, groups) {
                if (err) {
                    $rootScope.notification.push(err);
                    return;
                }
                $rootScope.ownedGroups = groups;
            });
        };

        // Automatically keep trying to connect to Respoke
        function refreshAfterWaiting() {
            $scope.tokenRefreshInterval = Math.min($scope.tokenRefreshInterval * 2, 1000*60);
            $scope.nextRetry = +new Date() + $scope.tokenRefreshInterval;
            $timeout($scope.respokeConnect, $scope.tokenRefreshInterval);
        }

        // "recents" are the sidebar items
        $rootScope.recents = $window.recents = {};
        $rootScope.notifications = [];
        $rootScope.account = {};
        $rootScope.client = $window.client = respoke.createClient();

        $scope.loadAccount = function loadAccount(callback) {
            Account.getMe(function onAfterGetMe(err, account) {
                if (err) {
                    $log.error('getMe not successful', err);
                    if (!$rootScope.client.isConnected()) {
                        refreshAfterWaiting();
                    }
                    return;
                }
                $log.debug('getMe', account);
                $rootScope.account = $rootScope.recents[account._id] = account;
                if (!account || !account._id) {
                    $location.path('/welcome');
                    return;
                }
                if (callback) {
                    callback();
                }
            });
        };

        // when signing in, hold the properties here
        $scope.signin = {
            email: "",
            password: ""
        };
        // when signing up, hold the properties here
        $scope.signup = {
            email: "",
            password: ""
        };
        // when confirming account, hold the properties here
        $scope.confirming = {
            _id: "",
            conf: ""
        };
        // when resetting password, hold the properties here
        $scope.resetPass = {
            password: "",
            passwordConf: ""
        };

        // Listen for respoke connection
        $rootScope.client.listen('connect', function onAfterRespokeConnect() {
            $log.debug('connected to respoke');
            $rootScope.notifications = [];
            // kick this off here
            if (!checkingConnectedTimeout) {
                checkingConnectedTimeout = alwaysCheckConnected();
            }
            $rootScope.$apply();

            // Join the system group to get meta messages
            $rootScope.client.join({
                id: $rootScope.systemGroupId,
                onSuccess: function onSystemGroupConnectSuccess(evt) {
                    $log.debug('joined ' + $rootScope.systemGroupId);
                },
                onError: function onSystemGroupConnectFail(evt) {
                    $log.debug('FAIL joining ' + $rootScope.systemGroupId, evt);
                }
            });

        });

        // Make the connection to Respoke
        $scope.respokeConnect = function () {
            if ($rootScope.doNotConnectRespoke) {
                return;
            }
            $log.debug('respokeConnect initiated');
            $rootScope.notifications = [];
            Account.getToken(function afterGotRespokeToken(err, respokeAuth) {
                if (err) {
                    $log.error('failed attempt to get token', err);
                    $rootScope.notifications.push(err);
                    if (!$scope.tokenRefreshInterval) {
                        $scope.tokenRefreshInterval = 1000;
                    }
                    refreshAfterWaiting();
                    return;
                }
                if (!respokeAuth.token) {
                    $log.error('token request to server did not return token', respokeAuth);
                    refreshAfterWaiting();
                    return;
                }
                $scope.tokenRefreshInterval = 0;
                $scope.nextRetry = 0;

                $log.debug('respoke auth', respokeAuth);
                $rootScope.client.ignore('disconnect');
                $rootScope.client.listen('disconnect', function () {
                    $rootScope.$apply();
                    $scope.loadAccount($scope.respokeConnect);
                });

                $rootScope.systemGroupId = respokeAuth.systemGroupId;
                $rootScope.systemEndpointId = respokeAuth.systemEndpointId;

                $rootScope.client.connect({
                    reconnect: false,
                    token: respokeAuth.token,
                    appId: respokeAuth.appId,
                    baseURL: respokeAuth.baseURL ? respokeAuth.baseURL.replace('/v1','') : undefined,
                    resolveEndpointPresence: function (presenceList) {
                        var nonOffline = presenceList.filter(function (presence) {
                            return presence !== 'unavailable';
                        });
                        if (nonOffline.length) {
                            return nonOffline[nonOffline.length - 1];
                        }
                        else {
                            return 'unavailable';
                        }
                    }
                });
            });
        };

        // execute
        $scope.loadAccount($scope.respokeConnect);

        $rootScope.setPresence = function (strPresence) {
            $rootScope.client.setPresence({ presence: strPresence });
            $rootScope.recents[$rootScope.account._id].presence = '';
            $timeout(function afterSetOwnPresence() {
                $rootScope.recents[$rootScope.account._id].presence = strPresence;
            });
        };

        $scope.setDisplayName = function setDisplayName(name) {
            $log.debug('setDisplayName', name);
            Account.update({ display: name }, function (err, acct) {
                if (err) {
                    $rootScope.notifications.push(err);
                    return;
                }
                $rootScope.account.display = name;
            });
        };

        $scope.login = function login() {

            if (!$scope.signin.email) {
                $rootScope.notifications.push("Missing email / username");
                return;
            }
            if (!$scope.signin.password) {
                $rootScope.notifications.push("Missing password");
                return;
            }
            $rootScope.notifications = [];

            $rootScope.justLoggedIn = true;

            Account.login({
                email: $scope.signin.email,
                password: $scope.signin.password
            }, function afterLoggedIn(err, data) {
                if (err) {
                    $rootScope.justLoggedIn = false;
                    $rootScope.notifications.push(err);
                    return;
                }
                $window.open('/', '_self');
            });
        };

        $scope.logout = function logout() {
            $rootScope.justLoggedOut = true;
            $timeout(function refreshAfterLogoutAnimation() {
                Account.logout(function (err) {
                    if (err) {
                        $rootScope.justLoggedOut = false;
                        $rootScope.notifications.push(err.error);
                        return;
                    }
                    $window.location.reload();
                });
            }, 500); // let animations finish
        };

        $scope.register = function register() {
            $rootScope.notifications = [];
            Account.create($scope.signup, function (err, account) {
                $log.debug(err, account);
                if (err) {
                    $rootScope.notifications.push(err);
                    return;
                }
                // do not log them in. need to confirm account first.
                $rootScope.notifications.push(
                    "Success! You will be able to log in after your account is confirmed."
                );
                $scope.signup = {};
                $rootScope.account = account;
                $rootScope.recents[account._id] = account;
            });
        };

        $scope.forgot = function forgot(email) {
            if (!email) {
                $rootScope.notifications.push("Put in your email first");
                return;
            }
            Account.forgotPassword(email, function (err, data) {
                if (err) {
                    $rootScope.notifications.push(err);
                    return;
                }
                $scope.signin = {};
                $rootScope.notifications.push(data);
            });
        };

        $scope.doPasswordReset = function () {
            if (!$scope.resetPass.password) {
                $rootScope.notifications.push("Password is required.");
                return;
            }
            if ($scope.resetPass.password !== $scope.resetPass.passwordConf) {
                $rootScope.notifications.push("Passwords must match.");
                return;
            }

            Account.resetPassword(
                $scope.resetPass._id,
                $scope.resetPass.conf,
                $scope.resetPass.password,
                function (err, account) {
                    if (err) {
                        $rootScope.notifications.push(err);
                        return;
                    }
                    $rootScope.account = account;
                    $scope.resetPass = {};
                    $window.open('/', '_self');
                }
            );
        };

        $rootScope.removeUser = function (user) {
            Account.removeUser(user._id, function (err) {
                if (err) {
                    $rootScope.notifications.push(err);
                    return;
                }
                $rootScope.notifications.push('Success.');
            });
        };
        $rootScope.confirmUser = function (user) {
            Account.confirmUser(user._id, user.conf, function (err) {
                if (err) {
                    $rootScope.notifications.push(err);
                    return;
                }
                $rootScope.notifications.push('Success.');
            });
        };

    }

];
