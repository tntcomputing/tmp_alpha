angular.module('starter.controllers')
.controller('ProjectsCtrl', function ($scope, $ionicHistory, $rootScope, pouchDBService, $state, Data, Supporting, $cordovaFile, $cordovaFileTransfer, $ionicSideMenuDelegate, $ionicPlatform, $ionicPopup) {
   
        $scope.hideBackground = false;
    setupScreen = function (e) {
        //console.log('ProjectsCtrl');
        var newDate = new Date();
        if (!Data.hasOwnProperty('userState')) {
            $scope.userState = { isUserLoggedIn: false };
            Data.userState = { isUserLoggedIn: false };
            $rootScope.userState = { isUserLoggedIn: false };
        }
        else {
            $scope.userState = Data.userState;
            $rootScope.userState = Data.userState;
        };
        
        
        $scope.userState = Data.userState;
        pouchDBService.db.get('LatestUser').then(function (doc) {
            //console.log('ProjectsCtrl: Latest User Found');
            userID = doc.userid
            //Now check to see if user record is held locally
            pouchDBService.db.get(userID).then(function (userDoc) {
                //console.log('ProjectsCtrl: User Found in local Database');

                handleUserfound(userDoc);



            }).catch(function (err) {
                //console.log('ProjectsCtrl: User Not Found in local database', err);
                //Lets check to see if they are in the remote database
                pouchDBService.remotedb.get(userID).then(function (doc) {
                    //console.log('ProjectsCtrl: User Found in remote database');
                    handleUserfound(doc);

                }).catch(function (err) {
                    //$scope.user in memory will be the user with no projects
                    //console.log('ProjectsCtrl: User Not Found in remote database, save new user', err);
                    $scope.user = {};
                    $scope.user._id = sessionStorage.getItem('loggedin_id');
                    $scope.user.id = sessionStorage.getItem('loggedin_id');
                    $scope.user.name = sessionStorage.getItem('loggedin_name');
                    $scope.user.email = sessionStorage.getItem('loggedin_name');
                    $scope.user.dateLoggedIn = Data.latestUser.dateLoggedIn;
                    console.log(JSON.stringify($scope.user));
                    handleUserfound($scope.user);

                    
                    
                });


            });

        }).catch(function (err) {

            //$scope.isUserLoggedIn = false;
            //console.log('Latest User Not Found');
            
            //$scope.isUserLoggedIn = false;
            //$scope.update();
            console.log(JSON.stringify(err));
            userNotLoggedIn();
        });

    };
    $scope.$on("$ionicView.enter", function (scopes, states) {
        //$ionicHistory.clearHistory();
        //$ionicHistory.clearCache();
        
        

    });
    $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
       // viewData.enableBack = false;
    });
    $scope.$on('$ionicView.enter',
      setupScreen());
    $scope.$on('floating-menu:open', function(){
        //console.log('Open');
        $scope.hideBackground = true;
    });
    $scope.$on('floating-menu:close', function () {
        //console.log('Close');
        $scope.hideBackground = false;
    });
    //console.log('ProjectsCtrl');
    $scope.$on('loggedIn', function (event, message) {

      if (message.loggedIn === true) {
          console.log('LOGGED IN!');
          $scope.userState = { isUserLoggedIn: true };
          Data.userState = { isUserLoggedIn: true };

          //setupScreen();
          //$scope.modal.hide();
      } else {
          console.log('NOT LOGGED IN!');
          $scope.userState = { isUserLoggedIn: false };
          Data.userState = { isUserLoggedIn: false };
          //$scope.modal.show();

      }
  });

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
                        //console.log('Failed Save to LocalDB', error);
                    });
    };
    
    var userNotLoggedIn = function () {
        //console.log('userNotLoggedIn function');
        $scope.userState = { isUserLoggedIn: false };
        Data.userState = { isUserLoggedIn: false };
        $rootScope.userState = { isUserLoggedIn: false };
     notification.message = 'Sign In to see your projects'
        //$scope.notification =  "Sign In to see your projects" ;
        $scope.notification = angular.copy(notification);
    };
  
    var userLoggedIn = function () {
        //console.log('userLoggedIn function');
        
        notification.message = '';
        Data.userState = { isUserLoggedIn: true };
        $scope.userState = { isUserLoggedIn: true };
        $rootScope.userState = { isUserLoggedIn: true };
       
        
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
                        project.fav = result.rows[i].doc.fav;
                        project.dateOfFirstRegistration = result.rows[i].doc.data.dateOfFirstRegistration;

                        project.motDetails = result.rows[i].doc.data.motDetails;
                        project.taxDetails = result.rows[i].doc.data.taxDetails;
                        
                        project.insuranceDetails = result.rows[i].doc.data.insuranceDetails || '';
                        project.insurancePolicyRef = result.rows[i].doc.data.insurancePolicyRef || '';
                        project.insuranceExpiryDate = result.rows[i].doc.data.insuranceExpiryDate || '';
                        project.motStatus = Supporting.getMOTStatus(project);
                        project.taxStatus = Supporting.getTaxStatus(project);
                        project.insuranceStatus = Supporting.getInsuranceStatus(project);
                        project.motIssue = motIssueStatus(project);
                        project.taxIssue = taxIssueStatus(project);
                        project.insuranceIssue = insuranceIssueStatus(project);
                       
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

                        setupThumb(project,projects.length);



                        //project.thumb = urlForImage(project.smallImage);
                        projects.push(project);
                        $scope.projects = angular.copy(projects);
                        
                        $scope.search = {};
                        
                        $scope.orderBy = ['make', 'model'];
                        $scope.orderText = "Make, Model";

                        //$scope.search.fav = false;
                        
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
                                    project.dateOfFirstRegistration = remoteResult.rows[i].doc.data.dateOfFirstRegistration;

                                    project.motStatus = Supporting.getMOTStatus(project);
                                    project.taxStatus = Supporting.getTaxStatus(project);
                                    project.insuranceStatus = Supporting.getInsuranceStatus(project);
                                    project.motIssue = motIssueStatus(project);
                                    project.taxIssue = taxIssueStatus(project);
                                    project.insuranceIssue = insuranceIssueStatus(project);
                                    setupThumb(project,projects.length);
                                    
                                    projects.push(project);
                               

                                }
                                else {
                                    var project = {};
                                    project.id = remoteResult.rows[j].doc._id;
                                    project.make = remoteResult.rows[j].doc.data.make;
                                    project.model = remoteResult.rows[j].doc.data.model;
                                    project.fav = remoteResult.rows[j].doc.fav;
                                    project.dateOfFirstRegistration = remoteResult.rows[j].doc.data.dateOfFirstRegistration;

                                    project.motDetails = remoteResult.rows[j].doc.data.motDetails;
                                    project.taxDetails = remoteResult.rows[j].doc.data.taxDetails;
                                    project.insuranceDetails = remoteResult.rows[j].doc.data.insuranceDetails || '';
                                    project.insurancePolicyRef = remoteResult.rows[j].doc.data.insurancePolicyRef || '';
                                    project.insuranceExpiryDate = remoteResult.rows[j].doc.data.insuranceExpiryDate || '';
                                    project.motStatus = Supporting.getMOTStatus(project);
                                    project.taxStatus = Supporting.getTaxStatus(project);
                                    project.insuranceStatus = Supporting.getInsuranceStatus(project);
                                    project.motIssue = motIssueStatus(project);
                                    project.taxIssue = taxIssueStatus(project);
                                    project.insuranceIssue = insuranceIssueStatus(project);

                                    
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
                                    setupThumb(project,projects.length);
                                    projects.push(project);
                                    $scope.projects = angular.copy(projects);
                                    
                                    $scope.search = {};
                                    
                                    $scope.orderBy = ['make', 'model'];
                                    $scope.orderText = "Make, Model";
                                    //$scope.search.fav = false;
                                    
                                    //if ((remoteResult.rows[j].doc.mainImage != project.mainImage) || remoteResult.rows[j].doc.smallImage != project.smallImage) {
                                        remoteResult.rows[j].doc.mainImage = project.mainImage;
                                        remoteResult.rows[j].doc.smallImage = project.smallImage;
                                        remoteResult.rows[j].doc.dateOfFirstRegistration = remoteResult.rows[j].doc.data.dateOfFirstRegistration;

                                        remoteResult.rows[j].doc.motDetails = remoteResult.rows[j].doc.data.motDetails;
                                        remoteResult.rows[j].doc.taxDetails = remoteResult.rows[j].doc.data.taxDetails;
                                        remoteResult.rows[j].insuranceDetails = remoteResult.rows[j].doc.data.insuranceDetails || '';
                                        remoteResult.rows[j].insurancePolicyRef = remoteResult.rows[j].doc.data.insurancePolicyRef || '';
                                        remoteResult.rows[j].insuranceExpiryDate = remoteResult.rows[j].doc.data.insuranceExpiryDate || '';
                                        remoteResult.rows[j].doc.motStatus = Supporting.getMOTStatus(remoteResult.rows[j].doc);
                                        remoteResult.rows[j].doc.taxStatus = Supporting.getTaxStatus(remoteResult.rows[j].doc);
                                        remoteResult.rows[j].doc.insuranceStatus = Supporting.getInsuranceStatus(remoteResult.rows[j].doc);
                                        remoteResult.rows[j].doc.motIssue = motIssueStatus(remoteResult.rows[j].doc);
                                        remoteResult.rows[j].doc.taxIssue = taxIssueStatus(remoteResult.rows[j].doc);
                                        remoteResult.rows[j].doc.insuranceIssue = insuranceIssueStatus(remoteResult.rows[j].doc);

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
    
    var setupThumb = function (project,scopeIdx) {
        var imageName = "www/img/sm_img.png";
        
        var trueOrigin = cordova.file.applicationDirectory + imageName;

        project.thumb = trueOrigin;
        if (project.smallImage.indexOf('img/') === -1) {
            //Need to load image
            imageName = project.smallImage;
            var name = imageName.substr(imageName.lastIndexOf('/') + 1);
            var trueOrigin = cordova.file.dataDirectory + name;
            window.resolveLocalFileSystemURL(trueOrigin, function fileFound() {
                console.log('file found');
                project.thumb = trueOrigin;
                if ($scope.projects.length >= scopeIdx){
                    $scope.projects[scopeIdx].thumb = trueOrigin;
                };
            }, function fileNotFound() {
                var url = "http://tntcomputing.co.uk/tmp1/uploads/" + $scope.user._id + "/" + name;
                $cordovaFileTransfer.download(url, trueOrigin, {}, true).then(function (result) {
                    console.log('Success');
                    project.thumb = trueOrigin;
                    if ($scope.projects.length >= scopeIdx) {
                        $scope.projects[scopeIdx].thumb = trueOrigin;
                    };
                },
                     function (error) {
                         //thumb already loaded
                         console.log(error);
                     }, function (progress) {
                         // PROGRESS HANDLING GOES HERE
                     });

            });
        };
       
    };
    var motIssueStatus = function (project) {
        if (project.motStatus.motText !== 'MOT') {
            return true;
        }
        else {
            return false;
        };
    };

    var taxIssueStatus = function (project) {
        
        if (project.taxStatus.taxText !== 'Taxed') {
            return true;
        }
        else {
            return false;
        };
    };
    var insuranceIssueStatus = function (project) {
        if (project.insuranceStatus.insuranceText !== 'Insured') {
            return true;
        }
        else {
            return false;
        };
    };
    $scope.createProject = function () {
        if (Supporting.getUserCredits() < 2) {
            window.alert('Not Enough Credits to automatically populate vehicle details, manual editing only');
            $state.go("app.newproject");
             }
             else{
            $state.go("app.newproject");
        };
    };
    $scope.toggleList = function (listName) {
        
    if (listName === 'AZ'){
        $scope.search = {};
        //$scope.orderBy = ['id'];
        $scope.showPopup();
        

    };
    
    if (listName === 'fav') {
        $scope.search = { fav: true };
        
        $scope.orderBy = ['make', 'model'];
        $scope.orderText = "Make, Model";
        
    };
    if (listName === 'mot') {
        $scope.search = { motIssue: true };
        
        $scope.orderBy = ['make', 'model'];
        $scope.orderText = "Make, Model";
    };
    if (listName === 'tax') {
        $scope.search = { taxIssue: true };
        
        $scope.orderBy = ['make', 'model'];
        $scope.orderText = "Make, Model";
    };
    if (listName === 'insurance') {
        $scope.search = { insuranceIssue: true };
        
        $scope.orderBy = ['make', 'model'];
        $scope.orderText = "Make, Model";
    };
    if (listName === 'new') {
        $scope.createProject();
    };



    };
    $scope.showPopup = function () {
        console.log($scope.orderBy);
        $scope.sort = {};
        $scope.sort.orderBy = $scope.orderBy;
        var sortPopup = $ionicPopup.show({
            title: 'Sorting your projects',
            subTitle: 'Choose how you want your projects sorted',
            scope: $scope,
            buttons: [ {
                text: '<b>OK</b>',
                type: 'button-positive',
                onTap: function (e) {
                    // Returning a value will cause the promise to resolve with the given value.
                    //
                    //$scope.orderBy = $scope.sort.orderBy;
                    //console.log($scope.orderBy);
                    
                    return $scope.sort.orderBy;
                }
            }],
            template: '<ion-list><ion-radio ng-model="sort.orderBy" ng-value="[\'make\', \'model\']">Make Model</ion-radio><ion-radio ng-model="sort.orderBy" ng-value="[\'id\']">Registration</ion-radio></ion-list>'
        });
        sortPopup.then(function (res) {
           
            if (JSON.stringify(res) == JSON.stringify(['make','model'])) {
                $scope.orderText = "Make, Model";
            }
            if (JSON.stringify(res) == JSON.stringify(['id'])) {
                $scope.orderText = "Registration";
            }
            $scope.orderBy = res;
        })
    }
})
