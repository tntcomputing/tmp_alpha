angular.module('starter.controllers')
.controller('ProfileCtrl', function ($scope, $rootScope, pouchDBService,$ionicHistory,$state,Supporting) {
    $scope.loggedin_name = sessionStorage.getItem('loggedin_name');
    $scope.loggedin_id = sessionStorage.getItem('loggedin_id');
    
    pouchDBService.db.get($scope.loggedin_id).then(function (doc) {
        $scope.user = doc;
        $scope.user.credits = Supporting.getUserCredits();
        
    }).catch(function (err) {
        //console.log(err);
    });

    $scope.creditAccount = function(){
        if ($scope.user.passcode === 'credit10') {
            Supporting.addCredits(10);
            $scope.user.credits = Supporting.getUserCredits();
        };
        delete $scope.user.passcode;
    };
    $scope.logout = function () {

        //delete all the sessions 
        delete sessionStorage.loggedin_name;
        delete sessionStorage.loggedin_id;
        sessionStorage.setItem('loggedin', false);
        $scope.afterFBlogout();
        // remove the profile page backlink after logout.
        $ionicHistory.nextViewOptions({
            disableAnimate: true,
            disableBack: true
        });

        // After logout you will be redirected to the menu page,with no backlink
        //$state.go('menu', {}, { location: "replace", reload: true });
    };
});