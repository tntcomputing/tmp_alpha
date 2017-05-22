angular.module('starter.controllers')
.controller('SignupCtrl', function($scope,Data,$rootScope,$http,$ionicPopup,$state,$ionicHistory,pouchDBService) {
    $scope.signup=function(data){
        var link = 'http://tntcomputing.co.uk/tmp1/register.php';
        //using http post as we are passing password.
        
    $http.post(link,{n : data.name, un : data.username, ps : data.password   })
        .then(
        function (res) {	 //if a response is recieved from the server.
            console.log(JSON.stringify(res));
            $scope.response = res.data.result; //contains Register Result				
            //Shows the respective popup and removes back link
            if ($scope.response.created == "1") {
                //ar alertPopup2 = $ionicPopup.alert({
                 //   title: 'Account Created!',
                  //  template: 'Your account has been successfully created! Please check your email for Activation email'
                //});
                $scope.title="Account Created!";
                $scope.template="Your account has been successfully created! Please check your email for Activation email";
                $scope.login();
                //$state.go('login', {}, { location: "replace", reload: true });
                //no back option
               /* $ionicHistory.nextViewOptions({
                    disableAnimate: true,
                    disableBack: true
                });*/
                // the user is redirected to login page after sign up
                //$state.go('login', {}, {location: "replace", reload: true});
                /*$scope.userState = { isUserLoggedIn: true };
                Data.userState = { isUserLoggedIn: true };
                str = "http://tmp1.tntcomputing.co.uk/login.php?e=" + data.username + "&p=" + data.password;
                $http.get(str)
                .success(function (response) {   // if login request is Accepted
                    // records is the 'server response array' variable name.
                    console.log(JSON.stringify(response));
                    $scope.user_details = response.records;  // copy response values to user-details object.
                    //stores the data in the session. if the user is logged in, then there is no need to show login again.
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
                        $state.go("app.projects", {}, { reload: true });
                    }).catch(function (err) { console.log(err.toString()); });
                    

                }).error(function (error) {   						//if login failed
                    console.log(JSON.stringify(error));
                    var alertPopup = $ionicPopup.alert({
                        title: 'Login failed!',
                        template: 'Please check your credentials!'
                    });
                });
                */
            }else if($scope.response.exists=="1"){
                $scope.title="Email Already exists";
                $scope.template="Please click forgot password if necessary";
            }else{
                $scope.title="Failed";
                $scope.template="Contact Our Technical Team";
            }
            var alertPopup = $ionicPopup.alert({
                title: $scope.title,
                template: $scope.template
            });
        });
    }
})