var crypto = require('crypto');

exports = module.exports = [
    '$log',
    '$location',
    '$window',
    '$rootScope',
    '$scope',
    'Account',
    'respoke',

    function ($log, $location, $window, $rootScope, $scope, Account, respoke) {
        respoke.log.setLevel('debug');
        $rootScope.recents = {};
        $rootScope.connected = false;
        $rootScope.notifications = [];
        $rootScope.account = {};
        $rootScope.client = respoke.createClient();
        $rootScope.client.listen('connect', function () {
            $log.debug('connected');
            $rootScope.connected = true;
            $rootScope.client.setPresence({ presence: 'online' });
            $rootScope.$apply();
        });
        $rootScope.client.listen('disconnect', function () {
            $rootScope.connected = false;
        });
        
        Account.getMe(function (err, account) {
            if (err) {
                $log.error(err);
                return;
            }
            $log.debug('account', account);
            $rootScope.account = account;
            if (!account || !account._id) {
                $location.path('/welcome');
                return;
            }
            $scope.respokeConnect();
        });
        
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

        $scope.gravatar = function(email) {
            return 'https://secure.gravatar.com/avatar/' 
                + crypto.createHash('md5').update(email).digest("hex");
        };

        $scope.respokeConnect = function () {
            Account.getToken(function (err, respokeAuth) {
                if (err) {
                    $rootScope.notifications.push(err);
                    return;
                }
                $log.debug('respoke auth', respokeAuth);
                $rootScope.client.listen('disconnect', function () {
                    $scope.respokeConnect();
                });
                $rootScope.client.connect({
                    token: respokeAuth.token,
                    appId: respokeAuth.appId,
                    resolveEndpointPresence: function (presenceList) {
                        var nonOffline = presenceList.filter(function (presence) {
                            return presence !== 'unavailable';
                        });
                        if (nonOffline.length) {
                            return nonOffline.join(', ');
                        }
                        else {
                            return 'unavailable';
                        }
                    }
                });
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
                $rootScope.account = data;
                $location.path('/');
                $scope.respokeConnect();
            });
        };

        $scope.logout = function () {
            Account.logout(function (err) {
                if (err) {
                    $rootScope.notifications.push(err.error);
                    return;
                }
                $rootScope.account = null;
                $window.open('/', '_self');
            });
        };

        $scope.register = function () {
            Account.create($scope.signup, function (err, account) {
                if (err) {
                    $rootScope.notifications.push(err.error);
                    return;
                }
                // do not log them in. need to confirm account first.
                $rootScope.notifications.push("Success! Check your email to confirm your account.");
                $scope.signup = {};
            });
        };

        $scope.forgot = function () {
            if (!$scope.signin.email) {
                $rootScope.notifications.push("Put in your email first");
                return;
            }
            Account.forgotPassword($scope.signin.email, function (err, data) {
                if (err) {
                    $rootScope.notifications.push(err.error);
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
                        $rootScope.notifications.push(err.error);
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
