angular.module('starter.controllers')
.controller('NewProjectCtrl', function ($scope, $state, $stateParams, pouchDBService, $http, $ionicPopup,Data,Supporting,$ionicModal) {
    

    $scope.checkDVLA = function () {

        var loadBlankCar = function(){
            //Loads Blank car into $scope.newCar
            $scope.newCar.data = {};
            $scope.newCar.data.make = 'Unknown';
            $scope.newCar.data.model = 'Unknown';
            $scope.newCar.data.vin = '';
            $scope.newCar.data.dateOfFirstRegistration = '';
            $scope.newCar.data.yearOfManufacture='';
            $scope.newCar.data.cylinderCapacity='';
            $scope.newCar.data.co2Emissions='';
            $scope.newCar.data.fuelType='';
            $scope.newCar.data.taxStatus = '';
            $scope.newCar.data.colour='';
            $scope.newCar.data.typeApproval='';
            $scope.newCar.data.wheelPlan='';
            $scope.newCar.data.revenueWeight='';
            $scope.newCar.data.taxDetails = '';
            $scope.newCar.taxDetails = '';
            $scope.newCar.data.insuranceDetails = '';
            $scope.newCar.insuranceDetails = '';
            $scope.newCar.insurancePolicyRef = '';
            $scope.newCar.insuranceExpiryDate = '';
            $scope.newCar.data.motDetails = '';
            $scope.newCar.motDetails = '';
            $scope.newCar.data.taxed = '';
            $scope.newCar.taxed = '';
            $scope.newCar.data.mot = '';
            $scope.newCar.mot='';
            $scope.newCar.data.transmission='';
            $scope.newCar.data.numberOfDoors='';
            $scope.newCar.data.sixMonthRate='';
            $scope.newCar.data.twelveMonthRate='';
            $scope.newCar.sixMonthRate = '';
            $scope.newCar.twelveMonthRate = '';
            $scope.newCar.regNo = $scope.master.regNo;
            $scope.newCar._id = $scope.master.regNo;
            $scope.newCar.type = 'vehicle';
            $scope.newCar.mainImage = "img/lrg_img.png";
            $scope.newCar.smallImage = "img/sm_img.png";

            $scope.newCar.dateFirstUsed = '';
            $scope.newCar.motTestReports = [];
            $scope.newCar.fav = false;
        };
        var manuallySaveCar = function (copyToRemote) {
            loadBlankCar();
            $scope.newCar.regNo = $scope.newCar.regNo;
            $scope.newCar._id = $scope.newCar.regNo;
            
            
            saveCar(copyToRemote);
        };
        var saveCar = function (copyToRemote) {

            pouchDBService.saveToLocalDB($scope.newCar, copyToRemote).then(
                            function (response) {
                                addToUser();

                            },
                            function (error) {
                                //console.log('Failed Save to LocalDB', error);
                            });
        };
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
                        doc.fav = false;
                        $scope.newCar = angular.copy(doc);
                        // $scope.master = angular.copy($scope.newCar);
                        saveCar(false);
                        
                        //Add to user




                    }).catch(function (err) {
                        //Go get record
                        var creditRemaining = Supporting.getUserCredits();
        
                        if (creditRemaining < 1) {
                            var creditPopup = $ionicPopup.alert({
                                title: 'User Credits',
                                template: 'No Credit Remaining for search, enter data manually'
                            });
                            creditPopup.then(function (res) {
                                manuallySaveCar(true);
                                return;
                            });
                        };
                        var confirmPopup = $ionicPopup.confirm({
                            title: 'Registration No: ' +  $scope.newCar.regNo,
                            template: 'Are you sure you wish to retrieve this car?<br/>Credits remaining: ' + creditRemaining
                        });
                        confirmPopup.then(function (res) {
                            if (!res) {
                                return;
                            } else {
                                $http.get('https://dvlasearch.appspot.com/DvlaSearch?licencePlate=' + $scope.newCar.regNo + '&apikey=' + dvlaSearchKey).then(function (response) {
                                    if (response.data.hasOwnProperty('message')) {

                                        if (response.data.error === 0) {
                                            //$scope.newCar.message = 'No vehicle information found';
                                            manuallySaveCar(true);
                                        }
                                        else {
                                            if (response.data.message === 'API key or vrm invalid') {
                                                //$scope.newCar.message = "Invalid Licence Plate";
                                                manuallySaveCar(true);
                                            }
                                            else {
                                                //$scope.newCar.message = response.data.message;
                                                $scope.newCar.fav = false;
                                                manuallySaveCar(true);
                                            };
                                        };
                                        //$scope.master = angular.copy($scope.newCar);
                                    }
                                    else {
                                        Supporting.decrementCredits(1);
                                        delete response.status;
                                        delete response.config;
                                        delete response.statusText;
                                        $scope.newCar = angular.copy(response);
                                        $scope.newCar.regNo = $scope.master.regNo;
                                        $scope.newCar._id = $scope.master.regNo;
                                        $scope.newCar.type = 'vehicle';
                                        $scope.newCar.mainImage = "img/lrg_img.png";
                                        $scope.newCar.smallImage = "img/sm_img.png";
                                        $scope.newCar.fav = false;
                                        $scope.newCar.taxDetails = response.data.taxDetails;
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
                                                Supporting.decrementCredits(1);

                                                $scope.newCar.dateFirstUsed = motResponse.data.dateFirstUsed;
                                                $scope.newCar.motTestReports = motResponse.data.motTestReports;
                                                
                                                // $scope.master = angular.copy($scope.newCar);
                                                saveCar(true);


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

                            };
                        })
                        


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
