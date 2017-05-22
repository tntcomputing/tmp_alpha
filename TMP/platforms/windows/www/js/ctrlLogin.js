angular.module('starter.controllers')
    .controller('LoginCtrl', function ($scope, $rootScope, $http, $ionicPopup, $state, $ionicHistory, pouchDBService,Data) {
        $scope.user = {};  //declares the object user
        $scope.user.enableResend = false;
    $scope.login = function() {
        str="http://tmp1.tntcomputing.co.uk/login.php?e="+$scope.user.email+"&p="+$scope.user.password;
        $http.get(str)
        .success(function (response) {
            
            // if login request is Accepted
            // records is the 'server response array' variable name.
            console.log(JSON.stringify(response));
            $scope.user_details = response.records;  // copy response values to user-details object.
            //stores the data in the session. if the user is logged in, then there is no need to show login again.
            if ($scope.user_details.u_id === '') {
               
                var alertPopup = $ionicPopup.alert({
                    title: 'Login failed!',
                    template: 'Please check your credentials!'
                });
            }
            else {
                if ($scope.user_details.u_verified === "1") {
                    sessionStorage.setItem('loggedin_name', $scope.user_details.u_name);
                    sessionStorage.setItem('loggedin_id', $scope.user_details.u_id);
                    sessionStorage.setItem('loggedin', true);
                    nDate = new Date();
                    $scope.latestUser = { _id: 'LatestUser', userid: $scope.user_details.u_id, dateLoggedIn: nDate };
                    Data.latestUser = { _id: 'LatestUser', userid: $scope.user_details.u_id, dateLoggedIn: nDate };
                    pouchDBService.saveToLocalDB($scope.latestUser).then(function (response) {
                        // remove the instance of login page, when user moves to profile page.
                        // if you dont use it, you can get to login page, even if you are already logged in .
                        $ionicHistory.nextViewOptions({
                            disableAnimate: true,
                            disableBack: true
                        });
                        $scope.userState = { isUserLoggedIn: true };
                        Data.userState = { isUserLoggedIn: true };
                        lastView = $ionicHistory.backView();
                        $rootScope.$broadcast('loggedIn', { 'loggedIn': true });
                        $scope.closeLogin();
                        $state.go("app.projects", {}, { reload: true });
                       
                    }).catch(function (err) { console.log(err.toString()); });
                }
                else {
                    var alertPopup = $ionicPopup.alert({
                        title: 'Account Not Verified!',
                        template: 'Please check your email for verification email'
                    });
                    $scope.user.enableResend = true;
                    $scope.user.accountEmail = $scope.user_details.u_id;
                };
            };
            
           
           

            
        }).error(function (error) {   						//if login failed
            console.log(JSON.stringify(error));
            var alertPopup = $ionicPopup.alert({
                title: 'Login failed!',
                template: 'Please check your credentials!'
            });
        });
    };
    $scope.resend = function () {
        str="http://tmp1.tntcomputing.co.uk/resend.php?e="+$scope.user.accountEmail;
        $http.get(str)
        .success(function (response) {

            var alertPopup = $ionicPopup.alert({
                title: 'Account verification!',
                template: 'Please check your email for verification email'
            });

        }).error(function (error) {   						//if login failed
            console.log(JSON.stringify(error));
            var alertPopup = $ionicPopup.alert({
                title: 'Account verification!',
                template: 'No account with that email!'
            });
        });
    };
    $scope.updatePassword = function(data){
        str = "http://tmp1.tntcomputing.co.uk/newpassword.php?e=" + data.email + "&p=" + data.password + "&np=" + data.newPassword;
        $http.get(str)
       .success(function (response) {
           if (response.result.success === "0") {
               var alertPopup = $ionicPopup.alert({
                   title: 'Update Password',
                   template: response.result.message
               });
           };
           if (response.result.success === "1") {
               var alertPopup = $ionicPopup.alert({
                   title: 'Update Password',
                   template: 'Password Updated'
               });
               $scope.closePW();
           };
       }).error(function (error) {   						//if login failed
           console.log(JSON.stringify(error));
           var alertPopup = $ionicPopup.alert({
               title: 'Update Password',
               template: 'Update password failed'
           });
       });
    };
    $scope.resetPassword = function (data) {
        str = "http://tmp1.tntcomputing.co.uk/pwunlock.php?e=" + data.email;
        $http.get(str)
       .success(function (response) {
          
               var alertPopup = $ionicPopup.alert({
                   title: 'Reset Password',
                   template: response.result.message
               });
               $scope.closeRPW();
           
       }).error(function (error) {   						//if login failed
           console.log(JSON.stringify(error));
           var alertPopup = $ionicPopup.alert({
               title: 'Reset Password',
               template: 'Update password failed'
           });
       });
    };
})