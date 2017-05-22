angular.module('starter.controllers')
.controller('AppCtrl', function ($scope, $rootScope, $ionicModal, $timeout, ngFB, pouchDBService, $state, Data, $ionicHistory) {
//console.log('AppCtrl);')
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
    $scope.$on('$ionicView.enter', function (e) {
        //console.log('AppCtrl');
  });
    $scope.RegNo = "";
    //$scope.isUserLoggedOn = false;
  // Form data for the login modal
  $scope.loginData = {};
  //$scope.isUserLoggedOn = false;
    // Create the login modal that we will use later
  loadLoginModal = function (show) {
      $ionicModal.fromTemplateUrl('templates/login.html', {

          scope: $scope
      }).then(function (modal) {
          //console.log('Load Login, scope loaded');
          //Login gets loaded, projects controller is still trying to figure out if user exists or not at this point.
          $scope.userState = { isUserLoggedIn: false };
          Data.userState = { isUserLoggedIn: false };
          $rootScope.userState = { isUserLoggedIn: false };
          $scope.modal = modal;
          if (show)
              $scope.modal.show();
      });
  };

  loadChangePasswordModal = function (show) {
      
      $ionicModal.fromTemplateUrl('templates/newpassword.html', {

          scope: $scope
      }).then(function (modal) {
          //console.log('Load Login, scope loaded');
          //Login gets loaded, projects controller is still trying to figure out if user exists or not at this point.
          
          $scope.modalPW = modal;
          if (show)
              $scope.modalPW.show();
      });
  };
loadResetPasswordModal = function (show) {
    $ionicModal.fromTemplateUrl('templates/resetpassword.html', {

        scope: $scope
    }).then(function (modal) {
        //console.log('Load Login, scope loaded');
        //Login gets loaded, projects controller is still trying to figure out if user exists or not at this point.

        $scope.modalRPW = modal;
        if (show)
            $scope.modalRPW.show();
    });
};


  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
  //console.log('close Login');
    $scope.modal.hide();
  };
  $scope.closePW = function () {
      //console.log('close Login');
      $scope.modalPW.hide();
  };
  $scope.closeRPW = function () {
      //console.log('close Login');
      $scope.modalRPW.hide();
  };


  // Open the login modal
  $scope.login = function() {
      //console.log('Login function');
      loadLoginModal(true);
    //$scope.modal.show();
  };
 $scope.changePassword = function(){
 loadChangePasswordModal(true);
 };
$scope.resetPasswordView = function(){
 loadResetPasswordModal(true);
 };
  
  $scope.signup = function () {

      $scope.modal.hide();
      $ionicModal.fromTemplateUrl('templates/signup.html', {

          scope: $scope
      }).then(function (modal) {
          //console.log('Load Login, scope loaded');
          //Login gets loaded, projects controller is still trying to figure out if user exists or not at this point.
          $scope.modal = modal;
          $scope.modal.show();
      });
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
                     //console.log('AppCtrl, fbLogin: ',err);
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


  $scope.afterFBlogout = function () {
      
      $scope.userState = { isUserLoggedIn: false };
      Data.userState = { isUserLoggedIn: false };
      pouchDBService.db.get(Data.latestUser.id).then(function (user) {
          user._deleted = true;
           return pouchDBService.db.put(user).then(function (response) {
              delete $scope.user;
              delete Data.user;
              pouchDBService.db.get('LatestUser').then(function (latestUser) {
                  latestUser._deleted = true;
                  return pouchDBService.db.put(latestUser).then(function (response) {
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

      }).catch(function (err) {
          //console.log(err.toString());
      });
  };



  $scope.fbLogout = function () {
      ngFB.logout().then(function (response) {
          // success
          $scope.afterFBlogout();
          
      }, function (error) {
          // error
          //console.log(error.toString());
      });
  };

  
  $scope.myGoBack = function () {
      if ($state.current.name == "app.single" ) {
          //To be here must be adding project
          $state.go('app.projects');
      }
      else {
          $state.go('app.projects');
      };
          
      };

  $scope.$on('loggedIn', function (event, message) {

      if (message.loggedIn === true) {
          console.log('LOGGED IN!');
          $scope.userState = { isUserLoggedIn: true };
          Data.userState = { isUserLoggedIn: true };
          
         
          $scope.modal.hide();
      } else {
          console.log('NOT LOGGED IN!');
          $scope.userState = { isUserLoggedIn: false };
          Data.userState = { isUserLoggedIn: false };
          $scope.modal.show();

      }
  });

})
