var app = angular.module('beat', ['ionic', 'ionic.service.core', 'ngCordova', 'leaflet-directive', 'monospaced.qrcode'])

    .constant('MobileEndpoint', {
        //url: 'http://localhost:8080',
       // url: 'http://192.168.4.156:8080',
        //Global hosthttp://193.93.77.203:8080/
        //url: 'http://193.93.77.203:8080',
        url: 'http://192.168.4.164:8080',
        // url: '',
        username: 'mobile',
        password: 'ulan'
    })

    .constant('$ionicLoadingConfig', {
        template: '<h3><ion-spinner></ion-spinner></h3>Loading...'
    })

    .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {

        // routing
        $urlRouterProvider.otherwise('/');
        $stateProvider
            .state('/', {
                url: '/',
                templateUrl: 'partials/main.html',
                controller: 'mainCtrl'
            })
            .state('/services', {
                url: '/services',
                templateUrl: 'partials/services.html',
                controller: 'servicesCtrl'
            })
            .state('/branches', {
                url: '/branches',
                params: {'service': {}},
                templateUrl: 'partials/branches.html',
                controller: 'branchesCtrl'
            })
            .state('/ticket', {
                url: '/ticket',
                params: {'ticket': {}, 'branch': {}, 'service': {}, 'delay': 0},
                templateUrl: 'partials/ticket.html',
                controller: 'ticketCtrl'
            });
    }])

    .config(['$httpProvider', 'MobileEndpoint', function ($httpProvider, MobileEndpoint) {

        function encodeBase64(input) {
            var keyStr = 'ABCDEFGHIJKLMNOP' +
                'QRSTUVWXYZabcdef' +
                'ghijklmnopqrstuv' +
                'wxyz0123456789+/' +
                '=';

            var output = '';
            var chr1, chr2, chr3 = '';
            var enc1, enc2, enc3, enc4 = '';
            var i = 0;

            do {
                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);

                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;

                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }

                output = output +
                    keyStr.charAt(enc1) +
                    keyStr.charAt(enc2) +
                    keyStr.charAt(enc3) +
                    keyStr.charAt(enc4);
                chr1 = chr2 = chr3 = '';
                enc1 = enc2 = enc3 = enc4 = '';
            } while (i < input.length);

            return output;
        }

        // base64 encode auth header
        $httpProvider.defaults.headers.common['Authorization'] = 'Basic ' + encodeBase64(MobileEndpoint.username + ':' + MobileEndpoint.password);

        // broadcast loading events via http interceptor
        $httpProvider.interceptors.push(function ($rootScope) {
            return {
                request: function (config) {
                    $rootScope.$broadcast('loading:show')
                    return config
                },
                response: function (response) {
                    $rootScope.$broadcast('loading:hide')
                    return response
                }
            }
        });
    }])

    .run(['$rootScope', '$ionicPlatform', '$ionicLoading', '$cordovaStatusbar', '$cordovaPush', '$cordovaToast', '$cordovaDialogs', 'MobileEndpoint', 'MobileService',
        function ($rootScope,  $ionicPlatform, $ionicLoading, $cordovaStatusbar, $cordovaPush, $cordovaToast, $cordovaDialogs, MobileEndpoint, MobileService) {
            $ionicPlatform.ready(function () {
                // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
                // for form inputs)
                if (window.cordova && window.cordova.plugins.Keyboard) {
                    cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
                }
                if (window.StatusBar) {
                    StatusBar.styleDefault();
                }

                // configure IOS status bar
                $cordovaStatusbar.overlaysWebView(true);
                $cordovaStatusbar.style(1);

            });

            // show loading screen
            $rootScope.$on('loading:show', function () {
                $ionicLoading.show();
            });

            // hide loading screen
            $rootScope.$on('loading:hide', function () {
                $ionicLoading.hide();
            });

            //====== PUSH NOTIFICATION REGISTERS
            document.addEventListener("deviceready", function () {
                storeDevice();
                registerForPushNotifications();
                //configureBackgroundMode();
            }, function (err) {
                alert("Registration error: " + err)
            });


            // Notification Received
            $rootScope.$on('$cordovaPush:notificationReceived', function (event, notification) {
                console.log("EventPushNotificationReceived:" + JSON.stringify([notification]));
                if (ionic.Platform.isAndroid()) {
                    handleAndroid(notification);
                }
                else if (ionic.Platform.isIOS()) {
                    handleIOS(notification);
                    $scope.$apply(function () {
                        $scope.notifications.push(JSON.stringify(notification.alert));
                    })
                }
            });

            // call to register automatically upon device ready
            function storeDevice(){
                $rootScope.device = ionic.Platform.device();
                console.log("======DEVICE READY====");
                console.log($rootScope.device);
                console.log("======DEVICE READY FINISHED====");
            }
            function configureBackgroundMode() {
                cordova.plugins.backgroundMode.enable();
                cordova.plugins.backgroundMode.configure({
                    silent: true
                });
                // Called when background mode has been activated
                cordova.plugins.backgroundMode.onactivate = function () {
                    console.log("===BACKGROUND ACTIVATED==");
                };

                cordova.plugins.backgroundMode.ondeactivate = function () {
                    console.log("===BACKGROUND DEACTIVATED==");
                }

            }

            // Register
            function registerForPushNotifications() {
                var config = null;
                if (ionic.Platform.isAndroid()) {
                    config = {
                        "senderID": "397143508367"// REPLACE THIS WITH YOURS FROM GCM CONSOLE - also in the project URL like: https://console.developers.google.com/project/434205989073
                    };
                }
                else if (ionic.Platform.isIOS()) {
                    config = {
                        "badge": "true",
                        "sound": "true",
                        "alert": "true"
                    }
                }

                if ($rootScope.regId != undefined) {
                    //not registering if we already registered
                    console.log("===current app regId=" + $rootScope.regId);
                    return;
                }

                MobileService.checkDeviceToken().then(function (regId) {
                    if (regId != undefined) {
                        $rootScope.regId = regId;
                    } else {
                        $cordovaPush.register(config).then(function (result) {
                            console.log("Register success " + result);

                            //$cordovaToast.showShortCenter('Registered for push notifications');
                            $rootScope.registerDisabled = true;
                            // ** NOTE: Android regid result comes back in the pushNotificationReceived, only iOS returned here
                            if (ionic.Platform.isIOS()) {
                                $rootScope.regId = result;
                                storeDeviceToken("ios");
                            }
                        }, function (err) {
                            console.log("Register error " + err)
                        });
                    }
                });
            }

            // Android Notification Received Handler
            function handleAndroid(notification) {
                // ** NOTE: ** You could add code for when app is in foreground or not, or coming from coldstart here too
                //             via the console fields as shown.
                console.log("In foreground " + notification.foreground + " Coldstart " + notification.coldstart);
                if (notification.event == "registered") {
                    console.log("Handle Android, storing regid to $rootScope.regId=" + notification.regId);
                    $rootScope.regId = notification.regid;
                    MobileService.storeDeviceToken();
                }
                else if (notification.event == "message") {
                    console.log("===MESSAGE===")
                    console.log(notification);
                    console.log("===END MESSAGE===")
                    var message = decodeString(JSON.stringify(notification.payload.message));
                    console.log("Decoded Message:" + message);
                    $cordovaDialogs.alert(message, "Вас вызывают");
                }
                else if (notification.event == "error")
                    $cordovaDialogs.alert(notification.msg, "Push notification error event");
                else $cordovaDialogs.alert(notification.event, "Push notification handler - Unprocessed Event");
            }

            function decodeString(str) {
                return decodeURI(str).replace(/\+/g, " ");
            }

            // IOS Notification Received Handler
            function handleIOS(notification) {
                // The app was already open but we'll still show the alert and sound the tone received this way. If you didn't check
                // for foreground here it would make a sound twice, once when received in background and upon opening it from clicking
                // the notification when this code runs (weird).
                if (notification.foreground == "1") {
                    // Play custom audio if a sound specified.
                    if (notification.sound) {
                        var mediaSrc = $cordovaMedia.newMedia(notification.sound);
                        mediaSrc.promise.then($cordovaMedia.play(mediaSrc.media));
                    }

                    if (notification.body && notification.messageFrom) {
                        $cordovaDialogs.alert(notification.body, notification.messageFrom);
                    }
                    else $cordovaDialogs.alert(notification.alert, "Push Notification Received");

                    if (notification.badge) {
                        $cordovaPush.setBadgeNumber(notification.badge).then(function (result) {
                            console.log("Set badge success " + result)
                        }, function (err) {
                            console.log("Set badge error " + err)
                        });
                    }
                }
                // Otherwise it was received in the background and reopened from the push notification. Badge is automatically cleared
                // in this case. You probably wouldn't be displaying anything at this point, this is here to show that you can process
                // the data in this situation.
                else {
                    if (notification.body && notification.messageFrom) {
                        $cordovaDialogs.alert(notification.body, "(RECEIVED WHEN APP IN BACKGROUND) " + notification.messageFrom);
                    }
                    else $cordovaDialogs.alert(notification.alert, "(RECEIVED WHEN APP IN BACKGROUND) Push Notification Received");
                }
            }

            // Stores the device token in a db using node-pushserver (running locally in this case)
            //
            // type:  Platform type (ios, android etc)

            // Removes the device token from the db via node-pushserver API unsubscribe (running locally in this case).
            // If you registered the same device with different userids, *ALL* will be removed. (It's recommended to register each
            // time the app opens which this currently does. However in many cases you will always receive the same device token as
            // previously so multiple userids will be created with the same token unless you add code to check).
            function removeDeviceToken() {
                var tkn = {"token": $rootScope.regId};
                $http.post(MobileEndpoint.url + '/qpevents/android/unsubscribe', JSON.stringify(tkn))
                    .success(function (data, status) {
                        console.log("Token removed, device is successfully unsubscribed and will not receive push notifications.");
                    })
                    .error(function (data, status) {
                            console.log("Error removing device token." + data + " " + status)
                        }
                    );
            }

            // Unregister - Unregister your device token from APNS or GCM
            // Not recommended:  See http://developer.android.com/google/gcm/adv.html#unreg-why
            //                   and https://developer.apple.com/library/ios/documentation/UIKit/Reference/UIApplication_Class/index.html#//apple_ref/occ/instm/UIApplication/unregisterForRemoteNotifications
            //
            // ** Instead, just remove the device token from your db and stop sending notifications **
            $rootScope.unregister = function () {
                console.log("Unregister called");
                removeDeviceToken();
                $scope.registerDisabled = false;
                //need to define options here, not sure what that needs to be but this is not recommended anyway
//        $cordovaPush.unregister(options).then(function(result) {
//            console.log("Unregister success " + result);//
//        }, function(err) {
//            console.log("Unregister error " + err)
//        });
            }


            //====== PUSH NOTIFICATION END

        }])

    .factory('GeoService', ['$cordovaGeolocation', function ($cordovaGeolocation) {
        return {
            getLocation: function () {
                return $cordovaGeolocation.getCurrentPosition({timeout: 10000, enableHighAccuracy: true});
            }
        };
    }])

    .factory('MobileService', ['$rootScope', '$http', '$cordovaDialogs', 'MobileEndpoint', function ($rootScope, $http, $cordovaDialogs, MobileEndpoint) {
        return {
            transfer: function (ticket) {
                var body = {
                    'fromBranchId': ticket.branchId,
                    'fromId': ticket.queueId,
                    'visitId': ticket.visitId,
                    'sortPolicy': "LAST"
                };
                return $http.post(MobileEndpoint.url + '/qsystem/mobile/rest/services/' + ticket.serviceId + '/branches/' + ticket.branchId + '/queues/' + ticket.queueId + '/visits/', body)
                    .then(
                        function (response) {
                            return response.data;
                        },
                        function (err) {
                            var title = "Ваша очередь прошла";
                            var body = "Станьте в очередь еще раз";
                            $cordovaDialogs.alert(body, title);
                            return err;
                        });
            },
            services: function () {

                return $http.get(MobileEndpoint.url + '/qsystem/mobile/rest/services')
                    .then(
                        function (response) {
                            return response.data;
                        },
                        function (err) {
                            throw err.status + ':' + err.data;
                        });
            },

            branches: function (serviceId, lng, lat, rad) {

                return $http.get(MobileEndpoint.url + '/qsystem/mobile/rest/services/' + serviceId + '/branches?longitude=' + lng + '&latitude=' + lat + '&radius=' + rad)
                    .then(
                        function (response) {
                            return response.data;
                        },
                        function (err) {
                            throw err.status + ':' + err.data;
                        });
            },

            issue: function (serviceId, branchId, delay) {

                return $http.post(MobileEndpoint.url + '/qsystem/mobile/rest/services/' + serviceId + '/branches/' + branchId + '/ticket/issue?delay=' + delay)
                    .then(
                        function (response) {
                            return response.data;
                        },
                        function (err) {
                            throw err.status + ':' + err.data;
                        });
            },

            dispose: function (serviceId, branchId, visitId) {

                return $http.delete(MobileEndpoint.url + '/qsystem/mobile/rest/services/' + serviceId + '/branches/' + branchId + '/ticket/' + visitId)
                    .then(
                        function (response) {
                            return;
                        },
                        function (err) {
                            console.log(err.status + ':' + err.data);
                            return;
                        });
            },
            storeVisit: function (ticket, service, branch) {
                var body = {
                    visitId: ticket.visitId,
                    branchId: ticket.branchId,
                    queueId: ticket.queueId,
                    serviceId: ticket.serviceId,
                    serviceName: service.name,
                    branchId: branch.id,
                    clientId: ticket.clientId,
                    branchName: branch.name,
                    branchAddressLine1: branch.addressLine1,
                    branchAddressLine2: branch.addressLine2,
                    branchAddressLine3: branch.addressLine3,
                    branchAddressLine4: branch.addressLine4

                };
                $http.post(MobileEndpoint.url + '/qpevents/visit/store/' + $rootScope.device.uuid, JSON.stringify(body))
                    .success(function (data, status) {
                        console.log("Visit stored, visit is successfully subscribed to receive push notifications.");
                    })
                    .error(function (data, status) {
                            console.log("Error storing visit token." + data + " " + status)
                        }
                    );
            },
            checkTicketForDevice: function () {
                return $http.get(MobileEndpoint.url + '/qpevents/visit/device/' + $rootScope.device.uuid)
                    .then(
                        function (response) {
                            console.log("checkTicketForDevice | SUCCESS |");
                            console.log(response.data);
                            return response.data;
                        }, function (err) {
                            console.log("checkTicketForDevice | ERROR |" + err.code);
                            return undefined;
                        }
                    )
            },
            checkDeviceToken: function () {
                return $http.get(MobileEndpoint.url + '/qpevents/android/token/' + $rootScope.device.uuid)
                    .then(
                        function (response) {
                            console.log("CheckDeviceToken | SUCCESS |" + response.data);
                            return response.data;
                        }, function (err) {
                            console.log("CheckDeviceToken | ERROR |" + err.code);
                            return undefined;
                        }
                    )
            },
            storeDeviceToken: function () {
                var type = ionic.Platform.isAndroid() ? "android" : "ios";
                // link deviceUUID to regId
                var user = {deviceUUID: $rootScope.device.uuid, type: type, token: $rootScope.regId};
                console.log("Post token for registered device with data " + JSON.stringify(user));

                $http.post(MobileEndpoint.url + '/qpevents/android/user/register', JSON.stringify(user))
                    .success(function (data, status) {
                        console.log("Token stored, device is successfully subscribed to receive push notifications.");
                    })
                    .error(function (data, status) {
                            console.log("Error storing device token." + data + " " + status)
                        }
                    );
            }
        };
    }])

    .controller('mainCtrl', ['$rootScope','$scope', '$state', '$log', 'MobileService', function ($rootScope, $scope, $state, $log, MobileService) {
        $scope.navigateToServices = function () {
            $state.go('/services');
        };

        $scope.navigateToTicket = function () {
            var ticket = {
                ticketNumber: $scope.issuedTicket.ticketNumber,
                visitId: $scope.issuedTicket.visitId,
                serviceId: $scope.issuedTicket.serviceId,
                branchId: $scope.issuedTicket.branchId,
                queueId: $scope.issuedTicket.queueId,
                clientId: $scope.issuedTicket.clientId
            };

            var branch = {
                id: $scope.issuedTicket.branchId,
                name: $scope.issuedTicket.branchName,
                addressLine1: $scope.issuedTicket.branchAddressLine1,
                addressLine2: $scope.issuedTicket.branchAddressLine2,
                addressLine3: $scope.issuedTicket.branchAddressLine3,
                addressLine4: $scope.issuedTicket.branchAddressLine4
            };

            var service = {
                serviceId: $scope.issuedTicket.serviceId,
                name: $scope.issuedTicket.serviceName
            };

            $state.go('/ticket', {ticket: ticket, branch: branch, service: service, delay: 0});
        };

        $scope.$on('$ionicView.enter', function() {
            // Code you want executed every time view is opened
            console.log("====EVENT HEPPEND: $ionicView.enter ===");
            $scope.checkTicketForDevice();
        });

        $scope.checkTicketForDevice = function() {
            console.log("===CHECK TICKET FOR DEVICE===");
            //setTimeout($scope.checkTicketForDeviceInternal(), 2000);//setting timeout for 1.5s; device should loaded


            MobileService.checkTicketForDevice().then(function (data) {
                if (data != undefined) {
                    // TODO: Activate BUTTON YOUR TICKET
                    $scope.issuedTicket = data;
                } else {
                    // TODO: Activate BUTTON GET TICKET
                    $scope.issuedTicket = undefined;
                }
            }).then(function () {
                $rootScope.$broadcast('loading:hide');
            });
        };

    }])

    .controller('servicesCtrl', ['$scope', '$state', '$log', 'MobileService', function ($scope, $state, $log, MobileService) {

        $scope.getServices = function () {

            MobileService.services()
                .then(function (services) {
                    $scope.services = services;
                })
                .then(function () {
                    // Stop the ion-refresher from spinning
                    $scope.$broadcast('scroll.refreshComplete');

                });

        };

        $scope.selectService = function (service) {
            $state.go('/branches', {service: service});
        };

        $scope.getServices();
    }])

    .controller('branchesCtrl', ['$scope', '$rootScope', '$state', '$stateParams', '$log', '$timeout', '$ionicViewSwitcher', '$ionicModal','$ionicHistory', 'GeoService', 'MobileService', function ($scope, $rootScope, $state, $stateParams, $log, $timeout, $ionicViewSwitcher, $ionicModal,$ionicHistory, GeoService, MobileService) {
        $scope.service = $stateParams.service;

        $scope.listVisible = true;
        $scope.mapVisible = false;
        $scope.radius = 999999999; // set to the radius within which you want to allow users to see branches based on their current location
        $scope.markers = {};

        $scope.map = {
            defaults: {
                tileLayer: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
                maxZoom: 18,
                zoomControlPosition: 'bottomleft',
                scrollWheelZoom: false
            },
            center: {
                lat: 0,
                lng: 0,
                zoom: 12
            },
            markers: {}
        };

        $scope.getBranches = function () {
            $rootScope.$broadcast('loading:show');

            GeoService.getLocation()
                .then(function (geolocation) {
                    $scope.lng = geolocation.coords.longitude;
                    $scope.lat = geolocation.coords.latitude;

                    $scope.map.center = {
                        lat: $scope.lat,
                        lng: $scope.lng,
                        zoom: 12
                    };

                    $scope.markers.now = {
                        lat: $scope.lat,
                        lng: $scope.lng,
                        message: "You are here",
                        focus: true,
                        draggable: false
                    };

                    MobileService.branches($scope.service.id, $scope.lng, $scope.lat, $scope.radius)
                        .then(function (branches) {
                            $scope.branches = [];
                            var i = 0;

                            branches.forEach(function (branch) {
                                if (branch.branchOpen) {
                                    branch.distance = getDistance(branch.longitude, branch.latitude);

                                    $scope.branches.push(branch);

                                    $scope.markers[branch.id] = {
                                        lat: branch.latitude,
                                        lng: branch.longitude,
                                        getMessageScope: function () {
                                            return $scope;
                                        },
                                        message: "<p><strong>" + branch.name + "</strong></p>" +
                                        "<a ng-click=\"openModal(" + i + ")\">Get Ticket</a>" +
                                        "<p>" + branch.addressLine1 + ", " + branch.addressLine2 + "</p>" +
                                        "<p>" + branch.addressPostalCode + ", " + branch.addressLine4 + "</p>" +
                                        "<p class=\"distance\">{{ (" + branch.distance + " * 0.001) | number:2 }} km</p>",
                                        focus: false,
                                        draggable: false
                                    };
                                }

                                i++;
                            });
                        })
                        .then(function () {
                            $rootScope.$broadcast('loading:hide');
                        });
                }, function (err) {
                    alert('Пожалуйста включите GPS!');
                });
        };

        $scope.showList = function () {
            $scope.mapVisible = false;
            $scope.listVisible = true;

            $scope.map.markers = {};
        };

        $scope.showMap = function () {
            $scope.listVisible = false;
            $scope.mapVisible = true;

            $timeout(function () {
                $scope.map.markers = $scope.markers;
            }, 100);
        };

        $scope.issueTicket = function (delay) {
            $scope.modal.hide();

            var branch = $scope.branches[$scope.branchIndex];

            MobileService.issue($scope.service.id, branch.id, delay)
                .then(function (ticket) {
                    /**
                     * ticket {
              * branchId: 2
                clientId: "SQIX-ANUK-MKEM-SUZA-CPJE-TFKO-CJNX"
                queueId: 4
                serviceId: 1
                ticketNumber: "008"
                visitId: 888 }
                     **/
                    console.log("ticket = " + ticket);
                    MobileService.storeVisit(ticket, $scope.service, branch);
                    $ionicViewSwitcher.nextDirection('exit');

                    $ionicHistory.nextViewOptions({
                        disableBack: true
                    });

                    $state.go('/ticket', {ticket: ticket, branch: branch, service: $scope.service, delay: delay});
                });
        };

        $ionicModal.fromTemplateUrl('delay-modal.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modal = modal;
        });

        $scope.openModal = function (branchIndex) {
            $scope.branchIndex = branchIndex;
            $scope.modal.show();
        };

        $scope.closeModal = function () {
            $scope.modal.hide();
        };

        $scope.$on('$destroy', function () {
            $scope.modal.remove();
        });

        $scope.getBranches();

        function getDistance(lng, lat) {
            var lo1 = Number(lng);
            var la1 = Number(lat);
            var lo2 = Number($scope.lng);
            var la2 = Number($scope.lat);

            var dlat = ($scope.lat - lat).toRad();
            var dlng = (lo2 - lo1).toRad();

            var a = Math.sin(dlat / 2) * Math.sin(dlat / 2) +
                Math.cos(la1.toRad()) *
                Math.cos(la2.toRad()) * Math.sin(dlng / 2) *
                Math.sin(dlng / 2);

            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

            return 3958.75 * c * 1609;
        }

        /** Converts numeric degrees to radians */
        if (typeof Number.prototype.toRad == 'undefined') {
            Number.prototype.toRad = function () {
                return this * Math.PI / 180;
            }
        }

    }])

    .controller('ticketCtrl', ['$scope', '$state', '$stateParams', '$ionicActionSheet','$ionicHistory', '$timeout', '$log', 'MobileService', function ($scope, $state, $stateParams, $ionicActionSheet,$ionicHistory, $timeout, $log, MobileService) {
        $scope.ticket = $stateParams.ticket;
        $scope.branch = $stateParams.branch;
        $scope.service = $stateParams.service;
        $scope.delay = $stateParams.delay;

        $scope.deleteTicket = function () {
            var actionSheet = $ionicActionSheet.show({
                titleText: 'Are you sure you want to delete this ticket?',
                cancelText: 'Cancel',
                destructiveText: 'Delete',
                cancel: function () {
                    return true;
                },
                destructiveButtonClicked: function () {
                    MobileService.dispose($scope.ticket.serviceId, $scope.ticket.branchId, $scope.ticket.visitId)
                        .then(function () {
                            $state.go('/');
                        });
                }
            });

            $timeout(function () {
                actionSheet();
            }, 10 * 1000);
        };

        $scope.navigateToMain = function(){
            $state.go('/');
        };

        $scope.returnToQueue = function () {
            var actionSheet = $ionicActionSheet.show({
                titleText: 'Are you sure you want to stay at the end of the Queue',
                cancelText: 'Cancel',
                destructiveText: 'ReturnToQueue',
                cancel: function () {
                    return true;
                },
                destructiveButtonClicked: function () {
                    MobileService.transfer($scope.ticket)
                        .then(function () {
                            //TODO add logic based on return value to show correct screen
                            $state.go('/');
                        });
                }
            });

            $timeout(function () {
                actionSheet();
            }, 10 * 1000);
        };
    }]);
