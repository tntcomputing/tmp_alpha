angular.module('starter.controllers', ['ngOpenFB','pouchdb'])

.controller('AppCtrl', function ($scope, $ionicModal, $timeout, ngFB, pouchDBService,$state) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});
    $scope.RegNo = "";
  // Form data for the login modal
  $scope.loginData = {};

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.login = function() {
    $scope.modal.show();
  };
 
  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    console.log('Doing login', $scope.loginData);

   

    // Simulate a login delay. Remove this and replace with your login
    // code if using a login system
    $timeout(function() {
      $scope.closeLogin();
    }, 1000);
  };
  $scope.exitApp = function () {
      navigator.app.exitApp();
  };
  $scope.fbLogin = function () {
      ngFB.login({ scope: 'email' }).then(
          function (response) {
              if (response.status === 'connected') {
                  console.log('Facebook login succeeded');
                  $scope.isUserLoggedOn = true;

                  ngFB.api({
                      path: '/me',
                      params: { fields: 'id,name,email' }
                  }).then(
                    function (user) {
                        $scope.user = user;
                        
                        pouchDBService.db.get(user.id).then(function (doc) {
                            $scope.user = doc;
                            return pouchDBService.db.remove(doc).catch(function (err) {
                                console.log(err.toString());
                            });;
                        }).catch(function (err) {
                            console.log(err);
                            //not on local server
                            //check remote server
                            pouchDBService.remotedb.login(pouchDBService.username, pouchDBService.password, function (err, response) {
                                if (err) {
                                    if (err.name === 'unauthorized') {
                                        // name or password incorrect 
                                    } else {
                                        // cosmic rays, a meteor, etc. 
                                    }
                                };
                                if (response) {
                                    //authorized
                                    pouchDBService.remotedb.get(user.id).then( function (doc) {
                                        //document exists on remote server
                                        $scope.user = doc;
                                        $scope.user.dateLoggedIn =  new Date();
                                       
                                        pouchDBService.saveToLocalDB($scope.user);
                                        if ($scope.projects === undefined) {

                                            $scope.notification = angular.copy({ message: '' });
                                            //$scope.notification.message = '';
                                        }
                                        //$scope.projects = { notification: "" };
                                        if (!$scope.user['projects']) {
                                            //$scope.projects = { notification: "You don't currently have any projects" };
                                            $scope.notification = angular.copy({ message: 'You don\'t currently have any projects' });
                                        };
                                       // $state.transitionTo("app.projects", {}, { reload: true, inherit: true, notify: true });
                                        //$state.go("app.projects");
                                        $state.go("app.projects", {}, { reload: true });
                                        //$state.reinit();
                                    }).catch(function (err) {
                                        //doesn't exit anywhere
                                        //$scope.user is populated by facebook
                                        $scope.user.dateLoggedIn = new Date();
                                        $scope.user._id = user.id;
                                        $scope.user.type = 'user';
                                        pouchDBService.saveToLocalDB($scope.user);
                                        if ($scope.projects === undefined) {

                                            $scope.notification = angular.copy({ message: '' });
                                            //$scope.notification.message = '';
                                        }
                                        //$scope.projects = { notification: "" };
                                        if (!$scope.user['projects']) {
                                            //$scope.projects = { notification: "You don't currently have any projects" };
                                            $scope.notification = angular.copy({ message: 'You don\'t currently have any projects' });
                                        };
                                        //$state.transitionTo("app.projects", {}, { reload: true, inherit: true, notify: true });
                                        //$state.go("app.projects");
                                        $state.go("app.projects", {}, { reload: true });
                                        //$state.reinit();
                                    });
                                    
                                    
                                }
                            });

                        });

                        
                        
                        
                  
        },
        function (error) {
            alert('Facebook error: ' + error.error_description);
        });
                  $scope.isUserLoggedIn = true;
                  $scope.closeLogin();
              } else {
                  alert('Facebook login failed');
              }
          });
  };
  $scope.fbLogout = function () {
      ngFB.logout().then(function (success) {
          // success
          $scope.isUserLoggedIn = false;
          pouchDBService.db.get($scope.user._id).then(function (user) {
              return pouchDBService.db.remove(user._id).catch(function (err) {
                  console.log(err.toString());
              });
          }).catch(function (err) {
              console.log(err.toString());
          });
      }, function (error) {
          // error
          console.log(error.toString());
      });
  };

})

.controller('ProjectsCtrl', function ($scope, pouchDBService, $state) {
    //if ($scope.master.projects === undefined){
     //   $scope.master.notification = "" ;
    //};
   
    var projects = [];
    var notification = {};
   
    //$scope.notification = "";
    //$scope.master.notification = angular.copy($scope.notification);
    if (!$scope.isUserLoggedIn) {
        notification.message = 'Sign In to see your projects'
        //$scope.notification =  "Sign In to see your projects" ;
        $scope.notification = angular.copy(notification);
    };
    if ($scope.isUserLoggedIn) {
        //$scope.notification = "";
        notification.message = '';
        $scope.notification = angular.copy(notification);
        if (!$scope.user.hasOwnProperty('projects')) {
            notification.message = "You don't currently have any projects";
            $scope.notification = angular.copy(notification);
        }
        else {
            var notFound = [];
            pouchDBService.db.allDocs({
                include_docs: true,
                keys: $scope.user.projects
            }).then(function (result) {
                for (var i = 0; i < result.rows.length;i++){
                    
                    if (typeof result.rows[i].error !== "undefined") {
                        notFound.push(result.rows[i].key);

                    }
                    else {
                        var project = {};
                        project.id = result.rows[i].doc._id;
                        project.make = result.rows[i].doc.data.make;
                        project.model = result.rows[i].doc.data.model;
                        if (typeof result.rows[i].doc.mainImage === 'undefined') {
                            project.mainImage = "img/lrg_img.png";
                        }
                        else {
                            project.mainImage = result.rows[i].doc.mainImage;
                        };
                        if (typeof result.rows[i].doc.smallImage === 'undefined') {
                            project.smallImage = "img/sm_img.png";
                        }
                        else {
                            project.smallImage = result.rows[i].doc.smallImage;
                        };
                        projects.push(project);
                        $scope.projects = angular.copy(projects);
                    };
                    if (i === (result.rows.length -1) && (notFound.length > 0)){
                        pouchDBService.remotedb.allDocs({
                            include_docs: true,
                            keys: notFound
                        }).then(function (remoteResult) {
                            for (var j = 0; j < remoteResult.rows.length; j++){
                                if (typeof remoteResult.rows[j].error !== "undefined") {
                                    var project = {};
                                    project.id = remoteResult.rows[i].key
                                    project.make = "No data found";
                                    project.model = "No data found";
                                    projects.push(project);
                               

                                }
                                else {
                                    var project = {};
                                    project.id = remoteResult.rows[j].doc._id;
                                    project.make = remoteResult.rows[j].doc.data.make;
                                    project.model = remoteResult.rows[j].doc.data.model;
                                    if (typeof remoteResult.rows[j].doc.mainImage === 'undefined') {
                                        project.mainImage = "img/lrg_img.png";
                                       
                                    }
                                    else {
                                        project.mainImage = remoteResult.rows[j].doc.mainImage;
                                    };
                                    if (typeof remoteResult.rows[j].doc.smallImage === 'undefined') {
                                        project.smallImage = "img/sm_img.png";
                                    }
                                    else {
                                        project.smallImage = remoteResult.rows[j].doc.smallImage;
                                    };
                                   
                                    
                                    //console.log(location.href);
                                    projects.push(project);
                                    $scope.projects = angular.copy(projects);
                                    //if ((remoteResult.rows[j].doc.mainImage != project.mainImage) || remoteResult.rows[j].doc.smallImage != project.smallImage) {
                                        remoteResult.rows[j].doc.mainImage = project.mainImage;
                                        remoteResult.rows[j].doc.smallImage = project.smallImage;
                                        pouchDBService.saveToLocalDB(remoteResult.rows[j].doc);
                                    //}; 
                                };

                            };
                                                    });

                    };
                    
                    
                };

            }).catch(function (err) {
                console.log(err);
            });
            /*
            for (var i = 0; i < $scope.user.projects.length; i++) {
                //check to see if document locally, else get from remote database
                var project = {};
                var projectID = $scope.user.projects[i];
                
                pouchDBService.db.get(projectID).then(function (response) {
                    //Held locally
                    project.id = response._id;
                    project.make = response.data.make;
                    project.model = response.data.model;
                    projects.push(project);
                    $scope.projects = angular.copy(projects);
                }).catch(function (err) {
                    //held remotely?
                    pouchDBService.remotedb.get(projectID).then(function (response) {
                        //Held locally
                        project.id = response._id;
                        project.make = response.data.make;
                        project.model = response.data.model;
                        projects.push(project);
                        $scope.projects = angular.copy(projects);
                        
                        pouchDBService.saveToLocalDB(response);
                    }).catch(function (err) {
                        //held remotely?
                        project.id = projectID;
                        project.make = 'Data missing';
                        project.model = 'Data missing';
                        projects.push(project);

                        $scope.projects = angular.copy(projects);
                    });

                });
                
            };
            */
        };
    };
  /*$scope.projects = [
    { title: 'X98RDB - Renault Megane, Scenic', id: 1 },
    { title: 'E832WHD Mini', id: 2 },
    { title: 'G324WFR Morris Minor', id: 3 },
    
  ];*/
    $scope.createProject = function () {
        $state.go("app.newproject");
    };
})

.controller('ProjectCtrl', function ($scope, $stateParams, pouchDBService, $cordovaCamera, $cordovaFile) {
    var project = {};
    var currentMOT = 0;
    
    //project._id = $stateParams.projectId;
    pouchDBService.db.get($stateParams.projectId).then(function (response) {
        //Held locally
        response.description = "Nothing here right now, but this is where you can enter your own information about your project";
       
        response[currentMOT] = currentMOT;
        $scope.project = angular.copy(response);
    }).catch(function (err) {
        //should at this point have project locally
        console.log(err.toString());
    });
    $scope.addImage = function () {
        // 2
        var options = {
            destinationType: Camera.DestinationType.FILE_URI,
            sourceType: Camera.PictureSourceType.CAMERA, // Camera.PictureSourceType.PHOTOLIBRARY
            allowEdit: false,
            encodingType: Camera.EncodingType.JPEG,
            popoverOptions: CameraPopoverOptions,
        };

        // 3
        $cordovaCamera.getPicture(options).then(function (imageData) {

            // 4
            onImageSuccess(imageData);

            function onImageSuccess(fileURI) {
                createFileEntry(fileURI);
            }

            function createFileEntry(fileURI) {
                window.resolveLocalFileSystemURL(fileURI, copyFile, fail);
            }

            // 5
            function copyFile(fileEntry) {
                var name = fileEntry.fullPath.substr(fileEntry.fullPath.lastIndexOf('/') + 1);
                var newName = makeid() + name;

                window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (fileSystem2) {
                    fileEntry.copyTo(
                        fileSystem2,
                        newName,
                        onCopySuccess,
                        fail
                    );
                },
                fail);
            }

            // 6
            function onCopySuccess(entry) {
                $scope.$apply(function () {
                    $scope.project.mainImage = entry.nativeURL;
                    $scope.project.smallImage = entry.nativeURL;
                    pouchDBService.saveToLocalDB($scope.project);
                });
            }

            function fail(error) {
                console.log("fail: " + error.code);
            }

            function makeid() {
                var text = "";
                var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

                for (var i = 0; i < 5; i++) {
                    text += possible.charAt(Math.floor(Math.random() * possible.length));
                }
                return text;
            }

        }, function (err) {
            console.log(err);
        })
    };
    $scope.urlForImage = function () {
        var imageName = 'img/lrg_img.png';

        if (arguments.length > 0) {
            if (arguments[0] !== undefined){
                imageName = arguments[0];

            };
        };
        if (imageName.indexOf('img/') !== -1) {
            //using internal image
            return imageName;
        }
        else {
            var name = imageName.substr(imageName.lastIndexOf('/') + 1);
            var trueOrigin = cordova.file.dataDirectory + name;
            window.resolveLocalFileSystemURL(trueOrigin, function fileFound() {
                console.log('file found');
            }, function fileNotFound() {
                trueOrigin = 'img/lrg_img.png';
            });

            return trueOrigin;
        }
    };
    $scope.next = function () {
        //      $scope.currentMOT--;
    };
    $scope.latest = function () {
        //      $scope.currentMOT = 0;
    };
    $scope.previous = function () {
        //     $scope.currentMOT++;
    };
})
.controller('NewProjectCtrl', function ($scope, $stateParams,pouchDBService,$http) {
    $scope.checkDVLA = function () {
        $scope.newCar.regNo = $scope.newCar.regNo.replace(/ /g, '').toUpperCase();
        $scope.master = angular.copy($scope.newCar);
        var dvlaSearchKey = 't1EIKS5DAdB50Hje';
        //check to see if already using this project
        if ($scope.user.projects.indexOf($scope.newCar.regNo) !== -1) {
           
            //message user that already have that project
            $scope.newCar.message = 'You already have a project setup for this registration number';
            $scope.master = angular.copy($scope.newCar);

        }
        else {
            //This is a new project for the user, check to see if regNo is recorded in the online database and replicate locally
            //if not then checkdvla, add to online and local db and add to projects field on user
            pouchDBService.remotedb.login(pouchDBService.username, pouchDBService.password, function (err, response) {
                if (err) {
                    if (err.name === 'unauthorized') {
                        // name or password incorrect 
                    } else {
                        // cosmic rays, a meteor, etc. 
                    };
                };
                if (response) {
                    //Check to see if already recorded regno
                    pouchDBService.remotedb.get($scope.newCar.regNo).then(function (doc) {
                        //Database already has record
                        pouchDBService.replicateToLocalDB(doc._id)
                        $scope.newCar = angular.copy(doc);
                        $scope.master = angular.copy($scope.newCar);
                    }).catch(function (err) {
                        //Go get record
                        $http.get('https://dvlasearch.appspot.com/DvlaSearch?licencePlate=' + $scope.newCar.regNo + '&apikey=' + dvlaSearchKey).then(function (response) {
                            if (response.hasOwnProperty('message')) {

                                if (response.error === 0) {
                                    $scope.newCar.message = 'No vehicle information found';
                                }
                                else {
                                    if (response.message === 'API key or vrm invalid') {
                                        $scope.newCar.message = "Invalid Licence Plate";
                                    }
                                    else {
                                        $scope.newCar.message = response.message;
                                    };
                                };
                                $scope.master = angular.copy($scope.newCar);
                            }
                            else {
                                delete response.status;
                                delete response.config;
                                delete response.statusText;
                                $scope.newCar = angular.copy(response);
                                $scope.newCar.regNo = $scope.master.regNo;
                                $scope.newCar._id = $scope.master.regNo;
                                $scope.newCar.type = 'vehicle';
                                $http.get('https://dvlasearch.appspot.com/MotHistory?licencePlate=' + $scope.newCar.regNo + '&apikey=' + dvlaSearchKey).then(function (motResponse) {
                                    if (motResponse.hasOwnProperty('message')) {

                                        if (motResponse.error === 0) {
                                            $scope.newCar.message = 'No vehicle information found';
                                        }
                                        else {
                                            if (motResponse.message === 'API key or vrm invalid') {
                                                $scope.newCar.message = "Invalid Licence Plate";
                                            }
                                            else {
                                                $scope.newCar.message = motResponse.message;
                                            };
                                        };
                                    }
                                    else {
                                        $scope.newCar.dateFirstUsed = motResponse.data.dateFirstUsed;
                                        $scope.newCar.motTestReports = motResponse.data.motTestReports;
                                        $scope.master = angular.copy($scope.newCar);
                                        pouchDBService.saveToLocalDB($scope.newCar);
                                        //Add to user
                                        if (!$scope.user.hasOwnProperty('projects')) {
                                            $scope.user.projects = [];
                                        };
                                        if ($scope.user.projects.indexOf($scope.newCar._id) === -1) {
                                            $scope.user.projects.push($scope.newCar._id);
                                        };
                                        pouchDBService.saveToLocalDB($scope.user);
                                        $state.go("app.single", { projectId: $scope.newCar._id });
                                    };

                                }, function myError(motResponse) {


                                });

                                //pouchDBService.replicateToRemoteDB($scope.newCar._id);

                            };

                        }, function myError(response) {
                            $scope.newCar = angular.copy(response);
                            $scope.newCar.regNo = $scope.master.regNo;
                            $scope.master = angular.copy($scope.newCar);
                        });


                    })

                };

            });
        };
    };
})

.controller('ProfileCtrl', function ($scope, ngFB, pouchDBService) {
    
    pouchDBService.db.get($scope.user._id).then(function (doc) {
        $scope.user = doc;
        
    }).catch(function (err) {
        console.log(err);
    });


   /* ngFB.api({
        path: '/me',
        params: {fields: 'id,name,email'}
    }).then(
        function (user) {
            $scope.user = user;
            var db = pouchDB('TMP');
            db.get('loggedInUser').then(function (doc) {
                return db.remove(doc);
            }).catch(function (err) {
                console.log(err);
            });
            $scope.user.dateLoggedIn = new Date();  
            $scope.user._id = 'loggedInUser';
            db.put($scope.user);
        },
        function (error) {
            alert('Facebook error: ' + error.error_description);
        });*/
});
