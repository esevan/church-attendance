// Generated by CoffeeScript 1.10.0
(function() {
  var angularModule;

  angularModule = angular.module('myApp.main', ['ngRoute']);

  angularModule.config([
    '$routeProvider', function($routeProvider) {
      return $routeProvider.when('/main', {
        templateUrl: 'view/main/main.html',
        controller: 'MainCtrl'
      });
    }
  ]);

  angularModule.controller("MainCtrl", function() {
    var init;
    init = function() {
      return selectMenu(0);
    };
    init();
    if (document) {
      return document.body.scrollTop = 0;
    }
  });

}).call(this);

//# sourceMappingURL=main.js.map
