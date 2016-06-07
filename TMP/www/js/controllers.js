angular.module('starter.controllers', ['ngOpenFB','pouchdb'])

.controller('AppCtrl', function ($scope, $ionicModal, $timeout, ngFB, pouchDBService,$state,Data) {
//console.log('AppCtrl);')
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
    $scope.$on('$ionicView.enter', function (e) {
        console.log('AppCtrl');
  });
    $scope.RegNo = "";
    //$scope.isUserLoggedOn = false;
  // Form data for the login modal
  $scope.loginData = {};
  //$scope.isUserLoggedOn = false;
  // Create the login modal that we will use later
    $ionicModal.fromTemplateUrl('templates/login.html', {
        
    scope: $scope
    }).then(function (modal) {
        //console.log('Load Login, scope loaded');
        //Login gets loaded, projects controller is still trying to figure out if user exists or not at this point.
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
  //console.log('close Login');
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.login = function() {
  //console.log('Login function');
    $scope.modal.show();
  };
 
  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    //console.log('Doing login', $scope.loginData);

   

    // Simulate a login delay. Remove this and replace with your login
    // code if using a login system
    $timeout(function () {
        //console.log('Login timeout function');
      $scope.closeLogin();
    }, 1000);
  };
  $scope.exitApp = function () {
      //console.log('Exit App function');
      navigator.app.exitApp();
  };
  $scope.fbLogin = function () {
     
      
      //console.log('FBLogin function');
      ngFB.login({ scope: 'email' }).then(
          function (response) {
              //console.log('FBLogin function, received response');
              if (response.status === 'connected') {
                  //console.log('Facebook login succeeded');
                  

                  ngFB.api({
                      path: '/me',
                      params: { fields: 'id,name,email' }
                  }).then(function (user) {
                      //console.log('FBLogin function, received response, connected and got user');
                      $scope.user = user;
                      $scope.user._id = user.id;
                      $scope.user.dateLoggedIn = new Date();
                      $scope.latestUser = { _id: 'LatestUser', userid: user.id, dateLoggedIn: $scope.user.dateLoggedIn };
                      Data.latestUser = { _id: 'LatestUser', userid: user.id, dateLoggedIn: $scope.user.dateLoggedIn };
                      pouchDBService.saveToLocalDB($scope.latestUser).then(function (response) {
                          $scope.closeLogin();
                          $scope.userState = { isUserLoggedIn: true };
                          Data.userState = { isUserLoggedIn: true };
                          $state.go("app.projects", {}, { reload: true });
                      }).catch(function (err) { console.log(err.toString());});

                      //saveUserandLoadProjects();
                  }).catch(function (err) {
                     console.log('AppCtrl, fbLogin: ',err);
                  });

                        
                        
                        
                  
                  //$scope.userState = {isUserLoggedIn : true};
                  //$scope.closeLogin();
              } else {
                  alert('Facebook login failed');
              }},
        function (error) {
            alert('Facebook error: ' + error.error_description);
        });

                  
         
};






  $scope.fbLogout = function () {
      ngFB.logout().then(function (success) {
          // success
          $scope.userState = { isUserLoggedIn: false };
          Data.userState = { isUserLoggedIn: false };
          pouchDBService.db.get(Data.latestUser.userid).then(function (user) {
              return pouchDBService.db.remove(Data.latestUser.userid).then(function (response) {
                  delete $scope.user;
                  delete Data.user;
                  pouchDBService.db.remove('LatestUser').then(function (response) {

                      delete $scope.latestUser;
                      delete Data.latestUser;
                      $state.go("app.projects", {}, { reload: true });
                  }).catch(function (err) {
                      //console.log(err.toString());
                  });
                  
              }).catch(function (err) {
                  //console.log(err.toString());
                  
              });
              
          }).catch(function (err) {
              //console.log(err.toString());
          });
      }, function (error) {
          // error
          //console.log(error.toString());
      });
  };

})

.controller('ProjectsCtrl', function ($scope, pouchDBService, $state,Data) {
   
    $scope.$on('$ionicView.enter', function (e) {
        console.log('ProjectsCtrl');
        $scope.userState = Data.userState;
        pouchDBService.db.get('LatestUser').then(function (doc) {
            console.log('ProjectsCtrl: Latest User Found');
            userID = doc.userid
            //Now check to see if user record is held locally
            pouchDBService.db.get(userID).then(function (userDoc) {
                console.log('ProjectsCtrl: User Found in local Database');

                handleUserfound(userDoc);



            }).catch(function (err) {
                console.log('ProjectsCtrl: User Not Found in local database', err);
                //Lets check to see if they are in the remote database
                pouchDBService.remotedb.get(userID).then(function (doc) {
                    console.log('ProjectsCtrl: User Found in remote database');
                    handleUserfound(doc);

                }).catch(function (err) {
                    //$scope.user in memory will be the user with no projects
                console.log('ProjectsCtrl: User Not Found in remote database, save new user', err);
                handleUserfound($scope.user);

                    
                    
                });


            });

        }).catch(function (err) {

            //$scope.isUserLoggedIn = false;
            console.log('Latest User Not Found');
            
            //$scope.isUserLoggedIn = false;
            //$scope.update();

            userNotLoggedIn();
        });

    });
    //console.log('ProjectsCtrl');
    var projects = [];
    var notification = {};
    handleUserfound = function (userdoc) {
        //$scope.isUserLoggedIn = true;
        Data.latestUser = userdoc;
        $scope.latestUser = userdoc;
        userdoc.dateLoggedIn = new Date();
        $scope.user = angular.copy(userdoc);
        Data.user = angular.copy(userdoc);
        //$scope.update();

        pouchDBService.saveToLocalDB($scope.user).then(
                    function (response) {
                        //User and LatestUser saved ok to try and load projects
                        userLoggedIn();

                    },
                    function (error) {
                        console.log('Failed Save to LocalDB', error);
                    });
    };
    
    var userNotLoggedIn = function () {
        console.log('userNotLoggedIn function');
        $scope.userState = { isUserLoggedIn: false };
        Data.userState = { isUserLoggedIn: false };
     notification.message = 'Sign In to see your projects'
        //$scope.notification =  "Sign In to see your projects" ;
        $scope.notification = angular.copy(notification);
    };
    var userLoggedIn = function () {
        console.log('userLoggedIn function');
        notification.message = '';
        Data.userState = { isUserLoggedIn: true };
        $scope.userState = { isUserLoggedIn: true };
        $scope.notification = angular.copy(notification);
        if (!Data.user.hasOwnProperty('projects')) {
            notification.message = "You don't currently have any projects";
            $scope.notification = angular.copy(notification);
        }
        else {
            var notFound = [];
            pouchDBService.db.allDocs({
                include_docs: true,
                keys: Data.user.projects.filter(function(val) { return val !== null; })
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
                                   
                                    
                                    ////console.log(location.href);
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
                //console.log(err);
            });
            
        };
    };
    
    $scope.createProject = function () {
        $state.go("app.newproject");
    };
})

.controller('ProjectCtrl', function ($scope, $state, $stateParams, pouchDBService, $cordovaCamera, $cordovaFile, $cordovaFileTransfer, $ionicPopup,Data) {
    var project = {};
    var currentMOT = 0;
    
    //project._id = $stateParams.projectId;
    pouchDBService.db.get($stateParams.projectId).then(function (response) {
        //Held locally
        //response.description = "Nothing here right now, but this is where you can enter your own information about your project";
       
        response.currentMOT = currentMOT;
        $scope.project = angular.copy(response);
    }).catch(function (err) {
        //should at this point have project locally
        //console.log(err.toString());
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
                    uploadToServer(entry.nativeURL);
                    pouchDBService.saveToLocalDB($scope.project);
                });
            }
            function uploadToServer(nativeURL) {
                var name = nativeURL.substr(nativeURL.lastIndexOf('/') + 1);
                var targetPath = cordova.file.dataDirectory + name;
                var url = "http://tmp.tntcomputing.co.uk/uploads/upload.php";
                var filename = targetPath.split("/").pop();
                var options = {
                    fileKey: "file",
                    fileName: filename,
                    chunkedMode: false,
                    mimeType: "image/jpg",
                    params: { 'directory': $scope.user._id , 'fileName': filename } // directory represents remote directory,  fileName represents final remote file name
                };
                $cordovaFileTransfer.upload(url, targetPath, options).then(function (result) {
                    //console.log("SUCCESS: " + JSON.stringify(result.response));
                }, function (err) {
                    //console.log("ERROR: " + JSON.stringify(err));
                }, function (progress) {
                    // PROGRESS HANDLING GOES HERE
                });
            }
            function fail(error) {
                //console.log("fail: " + error.code);
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
            //console.log(err);
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
                //console.log('file found');
            }, function fileNotFound() {
                var url = "http://tmp.tntcomputing.co.uk/uploads/" + $scope.user._id + "/" + name;


                $cordovaFileTransfer.download(url, trueOrigin   , {}, true).then(function (result) {
                    //console.log('Success');
                   
                    $state.go("app.single", { projectId: $scope.project._id }, { reload: true });
                }, function (error) {
                    //console.log('Error');
                    imageName = 'img/lrg_img.png';
                    return imageName;
                }, function (progress) {
                    // PROGRESS HANDLING GOES HERE
                })

                return trueOrigin;


               // trueOrigin = 'img/lrg_img.png';
            });

            return trueOrigin;
        }
    }
    $scope.next = function () {
             $scope.project.currentMOT--;
    }
    $scope.latest = function () {
              $scope.project.currentMOT = 0;
    }
    $scope.previous = function () {
             $scope.project.currentMOT++;
    }
    $scope.removeProject = function () {


        var confirmPopup = $ionicPopup.confirm({
            title: 'Registration No: ' + $scope.project._id,
            template: 'Are you sure you wish to remove this project?'
        });

        confirmPopup.then(function (res) {
            if (res) {
                //console.log('Sure!');
                var idx = Data.user.projects.indexOf($scope.project._id);
                if (idx !== -1) {
                    Data.user.projects.splice(idx, 1);
                    Data.user.projects = Data.user.projects.filter(function(val) { return val !== null; });
                    pouchDBService.saveToLocalDB(Data.user).then(function (response) {
                        pouchDBService.db.remove($scope.project._id, $scope.project.rev).then(function (response) {
                            $state.go("app.projects", {}, { reload: true });
                        }).catch(function (err) {
                            $state.go("app.projects", {}, { reload: true });
                        });
                    }).catch(function (err) {
                        $state.go("app.projects", {}, { reload: true });
                    });
                    
                    

                };

            } else {
                //console.log('Not sure!');
            }
        });



    }
    $scope.updateProject = function () {
        
        pouchDBService.saveToLocalDB($scope.project,true);
    };
})
.controller('NewProjectCtrl', function ($scope, $state, $stateParams, pouchDBService, $http, $ionicPopup,Data) {
    

    $scope.checkDVLA = function () {
        var getProject = function () {
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
                        //clear any image information
                        var dirtyRecord = false
                        if ((doc.mainImage !== "img/lrg_img.png") || (doc.smallImage !== "img/sm_img.png")) {
                            dirtyRecord = true;
                            doc.mainImage = "img/lrg_img.png";
                            doc.smallImage = "img/sm_img.png";
                        };
                        //pouchDBService.replicateToLocalDB(doc._id)

                        $scope.newCar = angular.copy(doc);
                        // $scope.master = angular.copy($scope.newCar);
                        pouchDBService.saveToLocalDB($scope.newCar, false).then(
                            function (response) {
                                addToUser();

                            },
                            function (error) {
                                //console.log('Failed Save to LocalDB', error);
                            });
                        //Add to user




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
                                //$scope.master = angular.copy($scope.newCar);
                            }
                            else {
                                delete response.status;
                                delete response.config;
                                delete response.statusText;
                                $scope.newCar = angular.copy(response);
                                $scope.newCar.regNo = $scope.master.regNo;
                                $scope.newCar._id = $scope.master.regNo;
                                $scope.newCar.type = 'vehicle';
                                $scope.newCar.mainImage = "img/lrg_img.png";
                                $scope.newCar.smallImage = "img/sm_img.png";
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
                                        // $scope.master = angular.copy($scope.newCar);
                                        pouchDBService.saveToLocalDB($scope.newCar).then(
                                            function (response) {
                                                addToUser();

                                            },
                                            function (error) {
                                                //console.log('Failed Save to LocalDB', error);
                                            });

                                    };

                                }, function myError(motResponse) {


                                });

                                //pouchDBService.replicateToRemoteDB($scope.newCar._id);

                            };

                        }, function myError(response) {
                            $scope.newCar = angular.copy(response);
                            $scope.newCar.regNo = $scope.master.regNo;
                            //$scope.master = angular.copy($scope.newCar);
                        });


                    })

                };

            });
        };
        var addToUser = function () {
            //Add to user
            if (!$scope.newCar.hasOwnProperty("message")) {
                //no error message so ok to add to user

                if (!Data.user.hasOwnProperty('projects')) {
                    Data.user.projects = [];
                };
                if (Data.user.projects.indexOf($scope.newCar._id) === -1) {
                    Data.user.projects.push($scope.newCar._id);
                    Data.user.projects = Data.user.projects.filter(function (val) { return val !== null; });
                };
                pouchDBService.saveToLocalDB(Data.user).then(
                            function (response) {
                                $state.go("app.single", { projectId: $scope.newCar._id }, { reload: true });

                            },
                            function (error) {
                                //console.log('Failed Save to LocalDB', error);
                            });

            }
            else {
                displayError($scope.newCar.message);
            };
        };
        var displayError = function (errMsg) {
            //console.log("Error:" + errMsg);
        };
        $scope.newCar.regNo = $scope.newCar.regNo.replace(/ /g, '').toUpperCase();
        $scope.newCar._id = $scope.newCar.regNo;
        $scope.master = angular.copy($scope.newCar);
        var dvlaSearchKey = 't1EIKS5DAdB50Hje';
        
       
        //check to see if already using this project

        if (!Data.user.hasOwnProperty('projects')) {
            //user doesn't have any cars as yet so will not have this one
            getProject();
    }
else {

            pouchDBService.db.get($scope.newCar.regNo).then(function (response) {
                //already have car locally in database
                addToUser();
            }).catch(function (err) {
                //don't have project locally so will need to get it remotly
                getProject();
            });


           /* if (remoteResult.rows[j].doc._id.indexOf($scope.newCar.regNo) !== -1) {
           
                //message user that already have that project
                $scope.newCar.message = 'You already have a project setup for this registration number';
                $scope.master = angular.copy($scope.newCar);

        }
            else {
                getProject();
                };*/
        };



        
        

    };
})

.controller('ProfileCtrl', function ($scope, ngFB, pouchDBService) {
    
    pouchDBService.db.get($scope.user._id).then(function (doc) {
        $scope.user = doc;
        
    }).catch(function (err) {
        //console.log(err);
    });


   
});
