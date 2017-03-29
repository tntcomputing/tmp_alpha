angular.module('starter.controllers')
.controller('ProjectCtrl', function ( $scope, $ionicModal, $state, $stateParams, pouchDBService, $cordovaCamera, $cordovaFile, $cordovaFileTransfer, $ionicPopup, $ionicPlatform, Data, $http, Supporting) {
    var project = {};
    var currentMOT = 0;
    var dvlaSearchKey = 't1EIKS5DAdB50Hje';
   
    //$scope.fuelTypes = ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'LPG'];

    //project._id = $stateParams.projectId;
    pouchDBService.db.get($stateParams.projectId).then(function (response) {
        //Held locally
        //response.description = "Nothing here right now, but this is where you can enter your own information about your project";
       
        response.currentMOT = currentMOT;
        response.motStatus = Supporting.getMOTStatus(response.data);
        response.taxStatus = Supporting.getTaxStatus(response.data);
        response.insuranceStatus = Supporting.getInsuranceStatus(response.data);
        response.data.insuranceExpiryDate = moment(response.data.insuranceExpiryDate).toDate()
        response.maxYear = Supporting.maxYear();
        
        $scope.project = angular.copy(response);
        
        pouchDBService.db.query('insurance', {
            reduce: false, group: true
        }).then(function (result) {
            // handle result
            newRows = result.rows.map(function(row){
                return { policyRef: row.key, insuranceDetails: row.value.insuranceDetails, insuranceExpiryDate: moment(row.value.insuranceExpiryDate).format('DD/MM/YYYY') };
            });
            function uniqBy(a, key) {
                var seen = {};
                return a.filter(function (item) {
                    var k = key(item);
                    return seen.hasOwnProperty(k) ? false : (seen[k] = true);
                })
            }
            
            $scope.insuranceList = uniqBy(newRows, JSON.stringify);
            //$scope.insuranceList = result.rows.map(function (row) { return row.key });
            //console.log($scope.insuranceList);
        });
        
        if (typeof $scope.project.originalData === 'undefined') {
            $scope.project.originalData = angular.copy($scope.project.data);
        };
        $scope.fuelTypes = ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'LPG'];
        $scope.editMode = false;
        $scope.taxStatuses = [{ value: 'Not Taxed', text: 'Not Taxed' }, { value: 'Taxed', text: 'Taxed' }, { value: 'SORN', text: 'SORN' }]
        $scope.motStatuses = [ { value: 'PASS', text: 'MOT Passed' }]
    }).catch(function (err) {
        //should at this point have project locally
        //console.log(err.toString());
    });
    $scope.saveMOT = function () {
        if (($scope.project.motStatus.passFail === '') || ($scope.project.motStatus.passFail === 'FAIL')) {
            $scope.project.motStatus.passFail ='';
            return;
        };
        $scope.project.data.motDetails = 'Expires: ' + moment($scope.project.motStatus.motExpiresDate).format( 'DD MMM YYYY').toString();
        $scope.project.motDetails = 'Expires: ' + moment($scope.project.motStatus.motExpiresDate).format('DD MMM YYYY').toString();
        $scope.project.motStatus = Supporting.getMOTStatus($scope.project);

        $scope.updateProject();
    };
    $scope.saveTax = function () {
        if ($scope.project.taxStatus.taxType === 'SORN') {
            $scope.project.data.taxStatus = 'SORN in place';
            $scope.project.data.taxDetails = 'SORN';
            $scope.project.taxDetails = 'SORN';
        };
        if ($scope.project.taxStatus.taxType === 'Not taxed') {
            $scope.project.data.taxStatus = '';
            $scope.project.data.taxDetails = '';
             $scope.project.taxDetails = '';
        };
        if ($scope.project.taxStatus.taxType === 'Taxed') {
            if (moment($scope.project.taxStatus.taxExpiresDate).isAfter(moment())) {
                $scope.project.data.taxStatus = 'Taxed';
            }
            else {
                $scope.project.data.taxStatus = '';
                $scope.project.taxStatus.taxType = 'Not Taxed';

            };
            $scope.project.taxStatus.taxExpires = moment($scope.project.taxStatus.taxExpiresDate).format('DD MMMM YYYY');

            $scope.project.data.taxDetails = 'Tax due: ' + moment($scope.project.taxStatus.taxExpiresDate).format('DD MMMM YYYY');
            $scope.project.taxDetails = 'Tax due: ' + moment($scope.project.taxStatus.taxExpiresDate).format('DD MMMM YYYY');
        };
        $scope.updateProject();
    };
    $scope.policySelected = function (insurance) {
        //console.log('policySelected', insurance);
        $scope.project.data.insurancePolicyRef = insurance.policyRef;
        $scope.project.data.insuranceDetails = insurance.insuranceDetails;
        $scope.project.data.insuranceExpiryDate = insurance.insuranceExpiryDate;
        $scope.updateProject();

    }
    $scope.addImage = function (imageUrl) {
        // 2
        if (!$scope.editMode) {
            $scope.openModal(imageUrl);
        return;}
        var options = {
            destinationType: Camera.DestinationType.FILE_URI
        };
        
        // 3
        getPicture = function (PhotoOrCamera) {
            if (PhotoOrCamera === 'CAMERA')
            {
                options.sourceType = Camera.PictureSourceType.CAMERA;
                options.allowEdit = false;
                options.encodingType = Camera.EncodingType.JPEG;
                options.popoverOptions = CameraPopoverOptions;
            }
            else
            {
                options.sourceType = Camera.PictureSourceType.PHOTOLIBRARY;
                options.allowEdit = false;
                options.encodingType = Camera.EncodingType.JPEG;
            };

            $cordovaCamera.getPicture(options).then(function (imageData) {

            // 4
            onImageSuccess(imageData);

            function onImageSuccess(fileURI) {
                if (fileURI.substring(0, 10) === 'content://')
                {
                    window.FilePath.resolveNativePath(fileURI, createFileEntry, fail);

                }
                else {
                    createFileEntry(fileURI);
                }
                
            }

            function createFileEntry(fileURI) {
                window.resolveLocalFileSystemURL(fileURI, copyFile, fail);
            }

            // 5
            function copyFile(fileEntry) {
                

                if ((fileEntry.name.split('.').pop() !== 'jpg')&&(fileEntry.name.split('.').pop() !== 'jpeg')) {

                    fileEntry.name = fileEntry.name + '.jpg';
                };
                if ((fileEntry.fullPath.split('.').pop() !== 'jpg')&&(fileEntry.fullPath.split('.').pop() !== 'jpeg')) {

                    fileEntry.fullPath = fileEntry.fullPath + '.jpg';
                };
                if ((fileEntry.nativeURL.split('.').pop() !== 'jpg')&&(fileEntry.nativeURL.split('.').pop() !== 'jpeg')) {

                    fileEntry.nativeURL = fileEntry.nativeURL + '.jpg';
                };
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
                var url = "http://tntcomputing.co.uk/tmp1/uploads/upload.php";
                var filename = targetPath.split("/").pop();
                var options = {
                    fileKey: "file",
                    fileName: filename,
                    chunkedMode: false,
                    mimeType: "image/jpg",
                    params: { 'directory': sessionStorage.getItem('loggedin_id') , 'fileName': filename } // directory represents remote directory,  fileName represents final remote file name
                };
                $cordovaFileTransfer.upload(url, targetPath, options).then(function (result) {
                    console.log("SUCCESS: " + JSON.stringify(result.response));
                }, function (err) {
                    console.log("ERROR: " + JSON.stringify(err));
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
        
        
        var asoptions = {
            'buttonLabels': ['Take Picture', 'Select From Gallery'],
            'addCancelButtonWithLabel': 'Cancel'
        };
        window.plugins.actionsheet.show(asoptions, function (_btnIndex) {
            if (_btnIndex === 1) {
                getPicture('CAMERA');
            } else if (_btnIndex === 2) {
                getPicture('LIBRARY');
            }
        });

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
            return cordova.file.applicationDirectory + 'www/' + imageName;
        }
        else {
            var name = imageName.substr(imageName.lastIndexOf('/') + 1);
            var trueOrigin = cordova.file.dataDirectory + name;
            window.resolveLocalFileSystemURL(trueOrigin, function fileFound() {
                //console.log('file found');
                return trueOrigin;
            }, function fileNotFound() {
                var url = "http://tntcomputing.co.uk/tmp1/uploads/" + sessionStorage.getItem('loggedin_id') + "/" + name;


                $cordovaFileTransfer.download(url, trueOrigin   , {}, true).then(function (result) {
                    //console.log('Success');
                   
                    $state.go("app.single", { projectId: $scope.project._id }, { reload: true });
                }, function (error) {
                    //console.log('Error');
                    imageName =  cordova.file.applicationDirectory + 'www/img/lrg_img.png';
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
        $scope.project.motStatus = Supporting.getMOTStatus($scope.project);
        $scope.project.taxStatus = Supporting.getTaxStatus($scope.project);
        $scope.project.insuranceStatus = Supporting.getInsuranceStatus($scope.project);
        pouchDBService.saveToLocalDB($scope.project,true);
    };
    $scope.updateMOT = function () {
        var creditRemaining = Supporting.getUserCredits()
        
        if (creditRemaining < 1) {
            var creditPopup = $ionicPopup.alert({
                title: 'User Credits',
                template: 'No Credit Remaining'
            });
            creditPopup.then(function (res) {
                //console.log('Mot Information Updated');
                return;
            });
        };
        var confirmPopup = $ionicPopup.confirm({
            title: 'Registration No: ' + $scope.project._id,
            template: 'Are you sure you wish to update the MOT details?<br/>Credits remaining: ' + creditRemaining
        });
        confirmPopup.then(function (res) {
            if (res) {
                $http.get('https://dvlasearch.appspot.com/MotHistory?licencePlate=' + $scope.project._id + '&apikey=' + dvlaSearchKey).then(
                    function (motResponse) {
                        //handle error
                        //motTestReports, also update
                        if (motResponse.hasOwnProperty('message')) {
                            //Nothing to update

                        }
                        else {
                            Supporting.decrementCredits(1);
                            $scope.project.dateFirstUsed = motResponse.data.dateFirstUsed;
                            $scope.project.motTestReports = motResponse.data.motTestReports;
                            //motResponse.data.motTestReports.forEach(function (motTestReports) {
                            //   if (motTestReport.testReport === 'Pass') {
                            //      $scope.project.mot = true;
                            //     $scope.project.motDetails = 'Expires: ' + motTestReport.expiryDate;
                            //    break;
                            // }
                            //})
                            for (var j = 0; j < motResponse.data.motTestReports.length; j++) {
                                if (motResponse.data.motTestReports[j].testResult === 'Pass') {
                                    $scope.project.data.mot = true;
                                    $scope.project.data.motDetails = 'Expires: ' + motResponse.data.motTestReports[j].expiryDate;
                                    break;
                                }

                            }
                            //for (var motTestReport in motResponse.data.motTestReports)
                            //{
                            //    if (motTestReport.testReport === 'Pass') {
                            //        $scope.project.mot = true;
                            //        $scope.project.motDetails = 'Expires: ' + motTestReport.expiryDate;
                            //        break;
                            //    }
                            //}
                            // $scope.master = angular.copy($scope.newCar);
                            $scope.project.motStatus = Supporting.getMOTStatus($scope.project);

                            $scope.updateProject();
                            var alertPopup = $ionicPopup.alert({
                            title: 'MOT',
                            template: 'Mot Information Updated'
                            });
 
                            alertPopup.then(function(res) {
                                //console.log('Mot Information Updated');
                             });

                        };





                    },
                    function myError(motResponse) {
                        //console.log(JSON.stringify(motResponse));
                    }
                    );
            } else{
                //console.log('Cancel out of MOT Update');
            };
                
        });

    };
    $scope.updateTax = function () {
        var creditRemaining = Supporting.getUserCredits()
        
        if (creditRemaining < 1) {
            var creditPopup = $ionicPopup.alert({
                title: 'User Credits',
                template: 'No Credit Remaining'
            });
            creditPopup.then(function (res) {
                //console.log('Mot Information Updated');
                return;
            });
        };
        var confirmPopup = $ionicPopup.confirm({
            title: 'Registration No: ' + $scope.project._id,
            template: 'Are you sure you wish to update the Tax details?<br/>Credit Remaining: ' + creditRemaining
        });
        confirmPopup.then(function (res) {
            if (res) {
                $http.get('https://dvlasearch.appspot.com/DvlaSearch?licencePlate=' + $scope.project._id + '&apikey=' + dvlaSearchKey).then(
                    function (dvlaResponse) {
                        //handle error
                        //motTestReports, also update
                        if (dvlaResponse.hasOwnProperty('message')) {
                            //Nothing to update

                        }
                        else {
                            //taxStatus, taxDetails,taxed,sixMonthRate,twelveMonthRate
                            //$scope.project.taxStatus = dvlaResponse.data.taxStatus;
                            Supporting.decrementCredits(1);
                            $scope.project.taxDetails = dvlaResponse.data.taxDetails;
                            $scope.project.data.taxDetails = dvlaResponse.data.taxDetails;

                            $scope.project.taxed = dvlaResponse.data.taxed;
                            $scope.project.data.taxed = $scope.project.taxed;
                            
                            $scope.project.insuranceDetails = '';
                            $scope.project.insurancePolicyRef = '';
                            $scope.project.insuranceExpiryDate = '';
                            $scope.project.sixMonthRate = dvlaResponse.data.sixMonthRate;
                            $scope.project.twelveMonthRate = dvlaResponse.data.twelveMonthRate;
                             $scope.project.taxStatus = Supporting.getTaxStatus($scope.project);
                             $scope.project.insuranceStatus = Supporting.getInsuranceStatus($scope.project);
                            $scope.updateProject();
                            var alertPopup = $ionicPopup.alert({
                                title: 'TAX',
                                template: 'TAX Information Updated'
                            });

                            alertPopup.then(function (res) {
                                //console.log('TAX Information Updated');
                            });

                        };





                    },
                    function myError(dvlaResponse) {
                        //console.log(JSON.stringify(dvlaResponse));
                    }
                    );


            }
            else
            {
                //console.log('Cancel out of Tax Update');
            };
        });



    };
    $scope.toggleEditMode = function(){
        $scope.editMode = !$scope.editMode;
        imageName = $scope.project.mainImage;
        var name = imageName.substr(imageName.lastIndexOf('/') + 1);
        if ($scope.editMode) {
            if (name === 'lrg_img.png') {
                $scope.project.mainImage = 'img/lrg_img_edit.png';
            };

        }
        else {
            if (name === 'lrg_img_edit.png' ) {
                $scope.project.mainImage = 'img/lrg_img.png';
            };
        };
    };

    $ionicModal.fromTemplateUrl('modal.html', function (modal) {
        $scope.gridModal = modal;
    }, {
        scope: $scope,
        animation: 'slide-in-up'
    })
    $scope.openModal = function (data) {
        $scope.imgUrl = data;
        $scope.gridModal.show();
    }
    $scope.closeModal = function () {
        $scope.gridModal.hide();
    }
    $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
       // viewData.enableBack = true;
    });
   
})
