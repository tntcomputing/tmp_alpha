angular.module('starter.controllers')
.controller('PurchasesCtrl', function ($scope, $http, pouchDBService, Supporting, Data) {
    
    $scope.loadPage = function () {
        pouchDBService.db.get(Data.user._id).then(function (doc) {
            $scope.user = doc;
            $scope.user.credits = Supporting.getUserCredits();
            $scope.loadProducts();
        }).catch(function (err) {
            //console.log(err);
        });
    };
     
    $scope.loadProducts = function () {
        
        inAppPurchase
        .getProducts(['cr10','cr20','cr100'])
        .then(function (products) {
            console.log(products);
      /*
         [{ productId: 'com.yourapp.prod1', 'title': '...', description: '...', price: '...' }, ...]
      */
            console.log(JSON.stringify(products));
           
            for (i = 0; i < products.length; i++) {
                products[i].title = products[i].title.replace(' (Too Many Projects)', '');
                };

            $scope.products = products;
            $scope.$applyAsync()
            //$state.go("app.products", { reload: true });
        })
        .catch(function (err) {
            console.log(JSON.stringify(err));
        });
       };

    $scope.buy = function(productId){
    inAppPurchase
  .buy(productId)
  .then(function (data) {
    console.log(JSON.stringify(data));
    // The consume() function should only be called after purchasing consumable products
      // otherwise, you should skip this step

    
    
    return inAppPurchase.consume(data.type, data.receipt, data.signature);
  })
  .then(function () {
      console.log('consume done!');
      switch (productId) {
          case 'cr10':
              Supporting.addCredits(10);
              break;
          case 'cr20':
              Supporting.addCredits(20);
              break;
          case 'cr100':
              Supporting.addCredits(100);
              break;
      };
      $scope.user.credits = Supporting.getUserCredits();
     

  })
  .catch(function (err) {
    console.log(err);
  });
    };
    $scope.loadPage();
});