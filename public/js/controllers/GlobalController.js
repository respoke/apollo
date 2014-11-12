/*!
 * Copyright (c) 2014, D.C.S. LLC. All Rights Reserved. Licensed Software.
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
    'respoke',

    function ($log, $location, $window, $rootScope, $scope, $timeout, Account, respoke) {
        respoke.log.setLevel('debug');
        $rootScope.justLoggedIn = false;
        $rootScope.justLoggedOut = false;
        $scope.authFailureMessage = $location.search().authFailure;

        // When failing to get a token from the server, the interval will count up
        // during respokeConnect() and continue to request tokens.
        $scope.tokenRefreshInterval = 0;

        $rootScope.systemGroupId = '';
        $rootScope.systemEndpointId = '';

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

        $rootScope.recents = $window.recents = {};
        $rootScope.notifications = [];
        $rootScope.account = {};
        $rootScope.client = $window.client = respoke.createClient();
        $rootScope.client.listen('connect', function () {
            $log.debug('connected');
            $rootScope.notifications = [];
            $rootScope.$apply();

            $rootScope.client.join({
                id: $rootScope.systemGroupId,
                onSuccess: function (evt) {
                    $log.debug('joined ' + $rootScope.systemGroupId);
                },
                onError: function (evt) {
                    $log.debug('FAIL joining ' + $rootScope.systemGroupId, evt);
                }
            });

        });

        $scope.loadAccount = function (callback) {
            Account.getMe(function (err, account) {
                if (err) {
                    $log.error('getMe', err);
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

        $scope.signin = {
            email: "",
            password: ""
        };
        $scope.signup = {
            email: "",
            password: ""
        };
        $scope.confirming = {
            _id: "",
            conf: ""
        };
        $scope.resetPass;

        $scope.respokeConnect = function () {
            $log.debug('respokeConnect');
            if ($rootScope.doNotConnectRespoke) {
                return;
            }
            Account.getToken(function (err, respokeAuth) {
                if (err) {
                    $log.error('failed attempt to get token', err);
                    $rootScope.notifications.push(err);
                    if (!$scope.tokenRefreshInterval) {
                        $scope.tokenRefreshInterval = 1000;
                    }
                    $scope.tokenRefreshInterval = $scope.tokenRefreshInterval * 2;
                    $timeout($scope.respokeConnect, $scope.tokenRefreshInterval);
                    return;
                }
                if (!respokeAuth.token) {
                    $log.error('token request to server did not return token', respokeAuth);
                    $scope.tokenRefreshInterval = $scope.tokenRefreshInterval * 2;
                    $timeout($scope.respokeConnect, $scope.tokenRefreshInterval);
                    return;
                }
                $scope.tokenRefreshInterval = 0;

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
            $timeout(function () {
                $rootScope.recents[$rootScope.account._id].presence = strPresence;
            });
        };

        $scope.setDisplayName = function (name) {
            $log.debug('setDisplayName', name);
            Account.update({ display: name }, function (err, acct) {
                if (err) {
                    $rootScope.notifications.push(err);
                    return;
                }
                $rootScope.account.display = name;
            });
        };

        $scope.login = function () {

            if (!$scope.signin.email) {
                $rootScope.notifications.push("Missing email / username");
                return;
            }
            if (!$scope.signin.password) {
                $rootScope.notifications.push("Missing password");
                return;
            }

            Account.login({
                email: $scope.signin.email,
                password: $scope.signin.password
            }, function (err, data) {
                if (err) {
                    $rootScope.notifications.push(err);
                    return;
                }
                $rootScope.notifications = [];
                $scope.signin = {};
                $rootScope.account = $rootScope.recents[data._id] = data;
                $rootScope.justLoggedIn = true;
                $scope.respokeConnect();
                $timeout(function () {
                    $location.search('authFailure', null).path('/');
                    $rootScope.justLoggedIn = false;
                });
            });
        };

        $scope.logout = function () {
            Account.logout(function (err) {
                if (err) {
                    $rootScope.notifications.push(err.error);
                    return;
                }
                $rootScope.account = null;
                $rootScope.justLoggedOut = true;
                $timeout(function () {
                    $window.open('/', '_self');
                });
            });
        };

        $scope.register = function () {
            Account.create($scope.signup, function (err, account) {
                if (err) {
                    $rootScope.notifications.push(err);
                    return;
                }
                // do not log them in. need to confirm account first.
                $rootScope.notifications.push("Success! Check your email to confirm your account.");
                $scope.signup = {};
                $rootScope.account = account;
                $rootScope.recents[account._id] = account;
            });
        };

        $scope.forgot = function () {
            if (!$scope.signin.email) {
                $rootScope.notifications.push("Put in your email first");
                return;
            }
            Account.forgotPassword($scope.signin.email, function (err, data) {
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

    }

];
