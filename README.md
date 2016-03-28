#mobile-example
Hybrid mobile app example demonstrating [Qmatic](http://www.qmatic.com) mobile API using [Ionic Framework](http://ionicframework.com/)

##Overview
A simple example that provides functionality to select a service, branch, issue and delete tickets.
Built with [Ionic Framework](http://ionicframework.com/), shows how easy it is to develop hybrid apps against the [Qmatic](http://www.qmatic.com) mobile extension API.

##Using
* Install [Node.js](https://nodejs.org/)
* Install [Gulp](https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md)
* Install [Ionic Framework](http://ionicframework.com/docs/guide/installation.html)
* Install JDK (android only)
* Install [Android SDK](http://developer.android.com) (android only)
* Clone this repo `git clone git@github.com:qmatic/mobile-example.git`
* From the repo root run the following commands:

		$ npm install
		$ gulp install
		$ cordova platform add ios
		$ cordova platform add android
		$ cordova plugin add cordova-plugin-device
		$ cordova plugin add cordova-plugin-statusbar
		$ cordova plugin add cordova-plugin-geolocation
		$ cordova plugin add cordova-plugin-whitelist

//for push notifications
		$ ionic plugin add org.apache.cordova.console
        $ ionic plugin add org.apache.cordova.device
        $ ionic plugin add org.apache.cordova.dialogs
        $ ionic plugin add org.apache.cordova.file
        $ ionic plugin add org.apache.cordova.media
        $ ionic plugin add https://github.com/phonegap-build/PushPlugin
//for push notifications

		$ cordova plugin add https://github.com/EddyVerbruggen/Toast-PhoneGap-Plugin.git

		$ ionic resources
		$ gulp sass
		$ ionic build (ios / android)
		$ ionic emulate (ios / android)

For more information see the [Ionic documentation](http://ionicframework.com/docs/)

Configure URL, username, and password of Orchestra Mobile API endpoint in www/js/app.js:

        .constant('MobileEndpoint', {
          //url: 'http://localhost:8080',
          url: '',
          username: 'xxxx',
          password: 'xxxx'
        })


         graceful-fs@3.0.8: graceful-fs version 3 and before will fail on newer node releases. Please update to graceful-fs@^4.0.0 as soon as possible.
        npm WARN engine deep-extend@0.4.1: wanted: {"node":">=0.12.0","iojs":">=1.0.0"} (current: {"node":"0.10.37","npm":"1.4.28"})
        npm WARN deprecated lodash@1.0.2: lodash@<3.0.0 is no longer maintained. Upgrade to lodash@^4.0.0.
        npm WARN deprecated graceful-fs@1.2.3: graceful-fs version 3 and before will fail on newer node releases. Please update to graceful-fs@^4.0.0 as soon as possible.
        npm WARN deprecated npmconf@2.1.2: this package has been reintegrated into npm and is now out of date with respect to npm
        npm WARN deprecated pangyp@2.3.3: use node-gyp@3+ instead
        npm WARN deprecated graceful-fs@2.0.3:

When testing in browser via `ionic serve` leave URL empty and configure proxyURL in ionic.project:

    "proxies": [
        {
            "path": "/qsystem/mobile/rest",
            "proxyUrl": "http://localhost:8080/qsystem/mobile/rest"
        }
    ]

##Screenshots
![mobile-1](mobile-1.png)
![mobile-2](mobile-2.png)
![mobile-3](mobile-3.png)
![mobile-4](mobile-4.png)
![mobile-5](mobile-5.png)
