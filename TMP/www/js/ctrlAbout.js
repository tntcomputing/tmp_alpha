angular.module('starter.controllers')
.controller('AboutCtrl', function ($scope, $http) {
    var dvlaSearchKey = 't1EIKS5DAdB50Hje';
    $scope.ICR = '';
    $http.get('http://dvlasearch.appspot.com/SearchCount?apikey=' + dvlaSearchKey).then(function (response) {
        $scope.ICR = response.data.totalCredit - response.data.usedCredit;
    },
        function myError(response) {
            //console.log(response);

    });
                               
    
})