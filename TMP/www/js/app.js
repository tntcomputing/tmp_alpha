// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'ngOpenFB', 'pouchdb','ngCordova','xeditable','ui.bootstrap','ion-floating-menu','ui.select'])
 .service('pouchDBService', function (pouchDB,$q) {
    //Create pouchDB database
    // PouchDB.debug.enable('*');
     var username = 'tognimmearceonlyportsmet';
     username = 'areshatersearmusentandle';

     var password = '5eff2322baf0ad863feaa071b3a023960946b079';
     password = 'd958014505271414789b08a2ec8773eb187b6e5f;'
    //this.remoteDBName = '';
     var remotedb = new pouchDB('https://' + username + ':' + password +'@65562c3c-82cc-4734-9628-e971749cb27f-bluemix.cloudant.com/tmp', { skipSetup: true });
    var db = new pouchDB('TMP');
   
    var tmpDesign = {
        _id: '_design/insurance',
        views: {
            'insurance': {
                map: function (doc) {
                    if (doc.hasOwnProperty('data')) {
                        if (doc.data.hasOwnProperty('insurancePolicyRef')) {
                            if (moment(doc.data.insuranceExpiryDate).isSameOrAfter(moment(0, 'HH'))) {
                                emit(doc.data.insurancePolicyRef, { insuranceDetails: doc.data.insuranceDetails, insuranceExpiryDate: doc.data.insuranceExpiryDate });

                            }
                              }
                    }
                    
                }.toString(),
                reduce: '_count'
                    
            }
        }
    };
    db.put(tmpDesign).then(function (info) {
        // kick off an initial build, return immediately
        db.query('insurance', { stale: 'update_after' });
    }).catch(function (err) {
        // if err.name === 'conflict', then
        // design doc already exists

    });
    
    remotedb.login(username, password, function (err, response) {
        if (err) {
            if (err.name === 'unauthorized') {
                // name or password incorrect 
            } else {
                // cosmic rays, a meteor, etc. 
            }
        }
    });
    var saveToLocalDB = function (doc, copyToRemote) {
        return $q(function (resolve, reject) {
            var replicate = function (docId, rev) {
                return $q(function (resolve, reject) {
                    saveToRemoteDB(doc).then(function (response) {
                        //console.log("Sucessfully replicated to remotedb doc with id: " + docId + " and REV " + rev);
                        resolve(response);
                    }, function (error) {
                        //console.log('replicateToRemoteDB error',error);
                        reject(error);
                    });
                })
            };
            var myDeltaFunction = function (doc) {
                doc.counter = doc.counter || 0;
                doc.counter++;
                return doc;
            };
            var copyDoc = false;
            if (copyToRemote === undefined) {
                copyDoc = true;
            }
            else {
                copyDoc = copyToRemote;
            };
            //first check if already exists
            db.get(doc._id).then(function (dbdoc) {
                doc._rev = dbdoc._rev;
                //console.log('found local document');
                db.put(JSON.parse(JSON.stringify(doc))).then(function (response) {
                    // handle response
                    ////console.log(response.toString());

                    //console.log("Sucessfully updated doc with id: " + doc._id + " and REV " + doc._rev);
                    if (copyDoc) {
                        replicate(doc._id, doc._rev).then(function (response) {
                            resolve(response);
                        }, function (error) {
                            reject(error)
                        });
                        
                    }
                    else{
                        resolve(dbdoc);
                    };

                    
                }).catch(function (err) {
                    //console.log("saveToLocalDB already exists err: " + err);
                    reject(err);
                });
            }).catch(function (err) {
                //console.log(doc._id + " SaveToLocalDB get error: " + err);
                delete doc._rev
                db.put(JSON.parse(JSON.stringify(doc))).then(function (response) {
                    // handle response
                    //console.log("Sucessfully written doc with id: " + doc._id);
                    if (copyDoc) {
                        replicate(doc._id, doc._rev).then(function (response) {
                            resolve(response);
                        }, function (error) {
                            reject(error)
                        });
                        
                        
                    }
                    else
                    {resolve(response)
                    };
                   
                }).catch(function (err) {
                    //console.log("saveToLocalDB new err: " + err);
                    reject(err);
                });

            });


        });
        
       
    };
    var saveToRemoteDB = function(doc){
        return $q(function (resolve, reject) {
            remotedb.login(username, password, function (err, response) {
                if (err) {
                    if (err.name === 'unauthorized') {
                        // name or password incorrect 

                        //console.log('name or password incorrect');
                    } else {
                        // cosmic rays, a meteor, etc. 
                        //console.log('cosmic rays, a meteor, etc.');
                    };
                    reject(err);
                };
                if (response) {
                    remotedb.get(doc._id).then(function (dbdoc) {
                        doc._rev = dbdoc._rev;
                        remotedb.put(JSON.parse(JSON.stringify(doc))).then(function (response) {
                            resolve(response);
                        }).catch(function (err) {
                            reject(err);
                        });
                    }).catch(function (err) {
                        //Doesn't exist in remote database, ok to copy it straight over
                        delete doc._rev;
                        remotedb.put(JSON.parse(JSON.stringify(doc))).then(function (response) {
                            resolve(response);
                        }).catch(function (err) {
                            reject(err);
                        });
                       
                        
                    });
                }
            });
        });
    };
    var replicateToRemoteDB = function (docID) {
        return $q(function (resolve, reject) {

            remotedb.login(username, password, function (err, response) {
                if (err) {
                    if (err.name === 'unauthorized') {
                        // name or password incorrect 

                        //console.log('name or password incorrect');
                    } else {
                        // cosmic rays, a meteor, etc. 
                        //console.log('cosmic rays, a meteor, etc.');
                    };
                    reject(err);
                };
                if (response) {
                    db.replicate.to(remotedb, {
                        live: false,
                        filter: function (doc) {
                            return doc._id === docID;
                        }
                    }).on('change', function (info) {
                        // handle change
                        ////console.log(info.toString());
                        resolve(info);
                    }).on('paused', function (err) {
                        // replication paused (e.g. replication up to date, user went offline)
                        ////console.log(err.toString());
                        //reject(err);
                    }).on('active', function () {
                        // replicate resumed (e.g. new changes replicating, user went back online)
                        ////console.log('active');
                    }).on('denied', function (err) {
                        // a document failed to replicate, e.g. due to permissions
                        ////console.log(err.toString());
                        reject(err);
                    }).on('complete', function (info) {
                        ////console.log('Synchronised');
                        resolve(info);
                    }).on('error', function (err) {
                        //console.log(err);
                        reject(err);
                    })
                };

            }



        )




        });
        
    };

    var replicateToLocalDB = function (docID) {
        remotedb.login(username, password, function (err, response) {
            if (err) {
                if (err.name === 'unauthorized') {
                    // name or password incorrect 
                    //console.log('name or password incorrect');
                } else {
                    // cosmic rays, a meteor, etc. 
                    //console.log('cosmic rays, a meteor, etc.');
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
                    ////console.log(info.toString());
                }).on('paused', function (err) {
                    // replication paused (e.g. replication up to date, user went offline)
                    ////console.log(err.toString());
                }).on('active', function () {
                    // replicate resumed (e.g. new changes replicating, user went back online)
                    ////console.log('active');
                }).on('denied', function (err) {
                    // a document failed to replicate, e.g. due to permissions
                    ////console.log(err.toString());
                }).on('complete', function () {
                    ////console.log('Synchronised');

                }).on('error', function (err) {
                    ////console.log(err);
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
.service('Data',function(){
    return {};
})   
.service('Supporting', ['Data','pouchDBService', function (Data,pouchDBService) {
    this.maxYear = function () { 
        return moment(0, 'HH').add(2, 'Y').format('YYYY');
    };
this.getMOTStatus = function (project) {
        if (project.motDetails === undefined) {
            return { motText: 'No MOT Detail', motClass: 'badge badge-dark', motExpiresDate: moment(0, 'H').add(12, 'M').toDate(), passFail: '' };
        };
        if (project.motDetails === 'No details held by DVLA') {
            var dateFirstRegistration = moment(project.dateOfFirstRegistration,'DD MMM YYYY','en');
            var dateOfFirstMOTDue = moment(project.dateOfFirstRegistration,'DD MMM YYYY','en').add(35,'M');
            var dateOfFirstMOT = moment(project.dateOfFirstRegistration,'DD MMM YYYY','en').add(36,'M');
            if (moment(0, 'HH').isSameOrAfter(dateOfFirstMOT)) {
                return { motText: 'MOT Overdue', motClass: 'badge badge-assertive', motExpiresDate: dateOfFirstMOT.add(12, 'M').toDate(), passFail: '' };
            }
            else if (moment(0, 'HH').isSameOrAfter(dateOfFirstMOTDue)) {
                return { motText: 'MOT Due', motClass: 'badge badge-energized', motExpiresDate: dateOfFirstMOT.add(12, 'M').toDate(), passFail: '' };
            }
            else {
                return { motText: 'MOT', motClass: 'badge badge-balanced', motExpiresDate: dateOfFirstMOT.add(12, 'M').toDate(), passFail: '' };
            };
        };

        if (project.motDetails.substr(0,7) === 'Expires') {
            var dateOfMOTExpires = moment(project.motDetails,'DD MMM YYYY','en');
            var dateOfMOTDue = moment(project.motDetails,'DD MMM YYYY','en').add(-1,'M');

            if (moment(0, 'HH').isSameOrAfter(dateOfMOTExpires)) {
                return { motText: 'MOT Overdue', motClass: 'badge badge-assertive', motExpiresDate:  moment().add(12, 'M').toDate(), passFail: '' };
            }
            else if (moment(0, 'HH').isSameOrAfter(dateOfMOTDue)) {
                return { motText: 'MOT Due', motClass: 'badge badge-energized', motExpiresDate: dateOfMOTExpires.add(12, 'M').toDate(), passFail: '' };
            }
            else {
                return { motText: 'MOT', motClass: 'badge badge-balanced', motExpiresDate: moment().add(12, 'M').toDate(), passFail: '' };
            };
        };
        if (project.motDetails === '') {
            return { motText: 'No MOT Detail', motClass: 'badge badge-dark', motExpiresDate: moment(0,'H').add(12, 'M').toDate(), passFail: '' };
        };


        
        return { motText: project.motDetails, motClass: 'badge badge-dark', motExpiresDate: moment(0,'H').add(12, 'M').toDate(), passFail: '' };
    };
 this.getTaxStatus = function (project) {
        if (project.taxDetails === undefined) {
            return { taxText: 'No Tax Detail', taxClass: 'badge badge-dark tax', taxType: 'Not Taxed', taxExpires: moment(0,'H').format('DD/MM/YYYY').toString(),taxExpiresDate : moment(0,'HH').toDate() };
        };
        if (project.taxDetails === 'Not taxed') {
            return { taxText: 'Not taxed', motClass: 'badge badge-assertive tax', taxType: 'Not Taxed', taxExpires: moment(0, 'H').format('DD/MM/YYYY').toString(), taxExpiresDate: moment(0, 'HH').toDate() };
        };
        if (project.taxDetails.substr(0, 7) === 'Tax due') {
            var dateOfTaxExpires = moment(project.taxDetails, 'DD MMM YYYY', 'en');
            var dateOfTaxDue = moment(project.taxDetails, 'DD MMM YYYY', 'en').add(-1, 'M');

            if (moment(0, 'HH').isSameOrAfter(dateOfTaxExpires)) {
                return { taxText: 'Tax Overdue', taxClass: 'badge badge-assertive tax', taxType: 'Not Taxed', taxExpires: dateOfTaxExpires.format('DD/MM/YYYY').toString(), taxExpiresDate: dateOfTaxExpires.toDate() };
            }
            else if (moment(0, 'HH').isSameOrAfter(dateOfTaxDue)) {
                return { taxText: 'Tax Due', taxClass: 'badge badge-energized tax', taxType: 'Taxed', taxExpires: dateOfTaxExpires.format('DD/MM/YYYY').toString(), taxExpiresDate: dateOfTaxExpires.toDate() };
            }
            else {
                return { taxText: 'Taxed', taxClass: 'badge badge-balanced tax', taxType: 'Taxed', taxExpires: dateOfTaxExpires.format('DD/MM/YYYY').toString(), taxExpiresDate: dateOfTaxExpires.toDate() };
            };
        };
        if (project.taxDetails === '') {
            return { taxText: 'No Tax Detail', taxClass: 'badge badge-dark tax', taxType: 'Not Taxed', taxExpires: moment(0, 'HH').format('DD/MM/YYYY').toString(),taxExpiresDate : moment(0,'HH').toDate() };
        };
        if (project.taxDetails.toUpperCase().indexOf('SORN') !== -1) {
            return { taxText: 'SORN', taxClass: 'badge badge-balanced tax', taxType: 'SORN', taxExpires: moment(0, 'HH').format('DD/MM/YYYY').toString(),taxExpiresDate : moment(0,'HH').toDate() };
        };
        return { taxText: project.taxDetails, taxClass: 'badge badge-dark tax', taxType: 'Not Taxed', taxExpires: moment(0, 'HH').format('DD/MM/YYYY').toString(), taxExpiresDate: moment(0, 'HH').toDate() };
 };
this.getInsuranceStatus = function(project){
    if (project.insuranceExpiryDate === '') {
        return { insuranceText: 'No Insurance Info', insuranceClass: 'badge badge-dark insurance' };
    };
    var dateInsuranceExpires = moment(project.insuranceExpiryDate);
    var dateInsuranceDue = moment(project.insuranceExpiryDate).add(-1, 'M');
    if (moment(0, 'HH').isSameOrAfter(dateInsuranceExpires)) {
        return { insuranceText: 'No Insurance', insuranceClass: 'badge badge-assertive insurance' };
            }
    else if (moment(0, 'HH').isSameOrAfter(dateInsuranceDue)) {
                return { insuranceText: 'Insurance Due', insuranceClass: 'badge badge-energized insurance' };
            }
            else {
                return { insuranceText: 'Insured', insuranceClass: 'badge badge-balanced insurance' };
            };

    return { insuranceText: 'Not Enough Insurance Info', insuranceClass: 'badge badge-dark insurance' };
};
this.getUserCredits = function () {
    if (!Data.user.hasOwnProperty('credits')) {
        //No credits ever given start with 10
        Data.user.credits = 10;
        pouchDBService.saveToLocalDB(Data.user).then(
                            function (response) {
                                return Data.user.credits;

                            },
                            function (error) {
                                console.log('Failed Save to LocalDB', error);
                            });
    }
    else
    {
        return Data.user.credits;
    };
    return 
};
this.addCredits = function (numberToAdd) {
    if (Data.user.hasOwnProperty('credits')) {
        //No credits ever given start with 10
        Data.user.credits = Data.user.credits + numberToAdd;
        pouchDBService.saveToLocalDB(Data.user).then(
                            function (response) {
                                return Data.user.credits;

                            },
                            function (error) {
                                
                            });
    }
    else {
        console.log('Credits not setup', error);
    };
};

this.decrementCredits = function (numberToRemove) {
    if (Data.user.hasOwnProperty('credits')) {
        //No credits ever given start with 10
        Data.user.credits = Data.user.credits - numberToRemove;
        pouchDBService.saveToLocalDB(Data.user).then(
                            function (response) {
                                return Data.user.credits;

                            },
                            function (error) {

                            });
    }
    else {
        console.log('Credits not setup', error);
    };
};

}])   

.run(function ($ionicPlatform, $ionicPopup, ngFB, pouchDB, editableOptions, $state, $ionicHistory) {
    
    // Disable BACK button on home
    $ionicPlatform.registerBackButtonAction(function (event) {

        if ($state.current.name == "app.projects") { // your check here
            $ionicPopup.confirm({
                title: 'System warning',
                template: 'are you sure you want to exit?'
            }).then(function (res) {
                if (res) {
                    ionic.Platform.exitApp();
                    //navigator.app.exitApp();
                }
                else
                    $ionicHistory.goBack();
            })
        } else {
            if ($state.current.name == "app.single")
            {
                $state.go('app.projects');
            }
            else{
            //console.log(JSON.stringify($ionicHistory.viewHistory()));
            $ionicHistory.goBack();}
        }


    }, 100);
    
    //console.log('Run');
    ngFB.init({ appId: '1697547563816578' });
    editableOptions.theme = 'bs3';
   
    $ionicPlatform.ready(function () {
     //console.log('Ionic Ready');  
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
            //  ("Statusbar.styleDefault() is not supported: ", ex);
        }
    }
  });
    
})
.directive('appVersion', function () {
    return function (scope, elm, attrs) {
        cordova.getAppVersion(function (version) {
            elm.text(version);
        });
    };
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
        url: '/profile',
        views: {
            'menuContent': {
                templateUrl: 'templates/profile.html',
                controller: 'ProfileCtrl'
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
    })
        .state('app.purchases', {
        url: "/purchases",
        views: {
            'menuContent': {
                templateUrl: "templates/purchases.html",
                controller: "PurchasesCtrl"
            }
        }
    })
    .state('app.about',{
        url: "/about",
        cache: false,
        views:{
            'menuContent': {
                templateUrl: "templates/about.html",
                controller: "AboutCtrl"
            }
        }
    })
    .state('app.login', {
        url: '/login',
        views: {
            'menuContent': {
                templateUrl: 'templates/login.html',
                controller: 'LoginCtrl'
            }
        }
     
    })
    .state('app.signup', {
        url: '/signup',
        views: {
            'menuContent': {
                templateUrl: 'templates/signup.html',
                controller: 'SignupCtrl'
            }
        }

    });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/projects');
});


