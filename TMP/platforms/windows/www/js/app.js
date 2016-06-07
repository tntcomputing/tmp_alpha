// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'ngOpenFB', 'pouchdb','ngCordova'])
    
   
.service('pouchDBService', function (pouchDB) {
    //Create pouchDB database
    // PouchDB.debug.enable('*');
    var username =  'tognimmearceonlyportsmet' ;
    var password = '5eff2322baf0ad863feaa071b3a023960946b079';
    //this.remoteDBName = '';
    var remotedb =  new pouchDB('https://tntcomputing.cloudant.com/tmp/', {skipSetup: true});
    var db = new pouchDB('TMP');
    remotedb.login(username, password, function (err, response) {
        if (err) {
            if (err.name === 'unauthorized') {
                // name or password incorrect 
            } else {
                // cosmic rays, a meteor, etc. 
            }
        }
    });
    var saveToLocalDB = function (doc) {
        //first check if already exists
        db.get(doc._id).then(function (dbdoc) {
             doc._rev = dbdoc._rev;
            db.put(JSON.parse(JSON.stringify(doc))).then(function (response) {
                // handle response
                //console.log(response.toString());
                console.log("Sucessfully updated doc with id: " + doc._id + " and REV " + doc._rev);

                replicateToRemoteDB(doc._id);
                console.log("Sucessfully replicated to remotedb doc with id: " + doc._id + " and REV " + doc._rev);

            }).catch(function (err) {
                console.log("saveToLocalDB already exists err: " + err);
            });
        }).catch(function (err) {
            db.put(JSON.parse(JSON.stringify(doc))).then(function (response) {
                // handle response
                console.log("Sucessfully written doc with id: " + doc._id );
                replicateToRemoteDB(doc._id);
                console.log("Sucessfully replicated doc with id: " + doc._id );

            }).catch(function (err) {
                console.log("saveToLocalDB new err: " + err);
            });

        });
       
    };

    var replicateToRemoteDB = function (docID) {
        remotedb.login(username, password, function (err, response) {
            if (err) {
                if (err.name === 'unauthorized') {
                    // name or password incorrect 
                    console.log('name or password incorrect');
                } else {
                    // cosmic rays, a meteor, etc. 
                    console.log('cosmic rays, a meteor, etc.');
                }
            };
            if (response) {
                db.replicate.to(remotedb, {
                    live: false,
                    filter: function (doc) {
                        return doc._id === docID;
                    }}).on('change', function (info) {
                        // handle change
                        //console.log(info.toString());
                    }).on('paused', function (err) {
                        // replication paused (e.g. replication up to date, user went offline)
                        //console.log(err.toString());
                    }).on('active', function () {
                        // replicate resumed (e.g. new changes replicating, user went back online)
                        //console.log('active');
                    }).on('denied', function (err) {
                        // a document failed to replicate, e.g. due to permissions
                        //console.log(err.toString());
                    }).on('complete', function () {
                        //console.log('Synchronised');

                    }).on('error', function (err) {
                        console.log(err);
                    })
            };

        }
        


    )
    };

    var replicateToLocalDB = function (docID) {
        remotedb.login(username, password, function (err, response) {
            if (err) {
                if (err.name === 'unauthorized') {
                    // name or password incorrect 
                    console.log('name or password incorrect');
                } else {
                    // cosmic rays, a meteor, etc. 
                    console.log('cosmic rays, a meteor, etc.');
                }
            };
            if (response) {
                remotedb.replicate.to(db, {
                    live: false,
                    filter: function (doc) {
                        return doc._id === docID;
                    }
                }).on('change', function (info) {
                    // handle change
                    //console.log(info.toString());
                }).on('paused', function (err) {
                    // replication paused (e.g. replication up to date, user went offline)
                    //console.log(err.toString());
                }).on('active', function () {
                    // replicate resumed (e.g. new changes replicating, user went back online)
                    //console.log('active');
                }).on('denied', function (err) {
                    // a document failed to replicate, e.g. due to permissions
                    //console.log(err.toString());
                }).on('complete', function () {
                    //console.log('Synchronised');

                }).on('error', function (err) {
                    //console.log(err);
                })
            };

        }



    )
    };


    return {
        password: password,
        username: username,
        remotedb: remotedb,
        db: db,
        saveToLocalDB: saveToLocalDB
    };
})

.run(function ($ionicPlatform, ngFB,pouchDB) {
    ngFB.init({ appId: '1697547563816578' });
    $ionicPlatform.ready(function () {
       
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (cordova.platformId === 'ios' && window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
        try {
            StatusBar.styleDefault();
        } catch (ex) {
            console.log("Statusbar.styleDefault() is not supported: ", ex);
        }
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider

      .state('app', {
          url: '/app',
          abstract: true,
          templateUrl: 'templates/menu.html',
          controller: 'AppCtrl'
      })

    .state('app.search', {
        url: '/search',
        views: {
            'menuContent': {
                templateUrl: 'templates/search.html'
            }
        }
    })

    .state('app.browse', {
        url: '/browse',
        views: {
            'menuContent': {
                templateUrl: 'templates/browse.html'
            }
        }
    })
      .state('app.projects', {
          url: '/projects',
          cache: false,
          views: {
              'menuContent': {
                  templateUrl: 'templates/projects.html',
                  controller: 'ProjectsCtrl'
              }
          }
      })

    .state('app.single', {
        url: '/projects/:projectId',
        cache: false,
        views: {
            'menuContent': {
                templateUrl: 'templates/project.html',
                controller: 'ProjectCtrl'
            }
        }
    })
    .state('app.profile', {
        url: "/profile",
        views: {
            'menuContent': {
                templateUrl: "templates/profile.html",
                controller: "ProfileCtrl"
            }
        }
    })
    .state('app.newproject', {
        url: "/newproject",
        views: {
            'menuContent': {
                templateUrl: "templates/newproject.html",
                controller: "NewProjectCtrl"
            }
        }
    });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/projects');
});


