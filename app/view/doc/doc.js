'use strict';

angular.module('myApp.doc', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/doc', {
		templateUrl: 'view/doc/doc.html',
		controller: 'DocCtrl'
	});
}])
.factory('DocSvc', ['$http','$rootScope', 
            function($http , $rootScope) {
	
	return {
		getDocList : function() {
			return $http.get('/rest/doc?t='+new Date());
		}
	};
}])
.controller('DocCtrl', [ '$scope', '$rootScope', 'DocSvc', '$sce', 
                 function($scope ,  $rootScope ,  DocSvc ,  $sce) {
	var init = function () {
		selectMenu(4); /* 메뉴 선택 */
	};
	
	init();
	
	$rootScope.backdrop = 'backdrop';
	
	DocSvc.getDocList().success(function(data) {
		
		for(var i in data) {
			data[i]['meetContents'] = $sce.trustAsHtml((data[i]['meetContents']));
		}
		
		$scope.docList = data;
		$rootScope.backdrop = undefined;
	});
}])
.controller('DocDetailCtrl', [ '$scope', '$rootScope', 'DocSvc', '$sce', 
                 function($scope ,  $rootScope ,  DocSvc ,  $sce) {
	var init = function () {
		selectMenu(4); /* 메뉴 선택 */
	};
	
	init();
	
	$rootScope.backdrop = 'backdrop';
	
	DocSvc.getDocList().success(function(data) {
		
		for(var i in data) {
			data[i]['meetContents'] = $sce.trustAsHtml((data[i]['meetContents']));
		}
		
		$scope.docList = data;
		$rootScope.backdrop = undefined;
	});
}])
;