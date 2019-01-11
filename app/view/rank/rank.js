// Generated by CoffeeScript 1.10.0
(function() {
  var angularModule;

  angularModule = angular.module("myApp.rank", ["ngRoute"]);

  angularModule.config([
    "$routeProvider", function($routeProvider) {
      return $routeProvider.when("/rank", {
        templateUrl: 'view/rank/rank.html',
        controller: 'RankCtrl'
      });
    }
  ]);

  angularModule.factory("RankSvc", [
    "$http", function($http) {
      return {
        getRankList: function() {
          return $http.get('/rest/rank?t=' + new Date());
        }
      };
    }
  ]);

  angularModule.controller("RankCtrl", [
    "$scope", "$rootScope", "RankSvc", function($scope, $rootScope, RankSvc) {
      var curDate, curMonth, curYear, init;
      init = function() {
        return selectMenu(3);
      };
      init();
      $scope.mock = true;
      curDate = new Date();
      curYear = curDate.getFullYear();
      curMonth = curDate.getMonth() + 1;
      if (curMonth === 12) {
        $scope.startDt = curYear + "-12-01";
        $scope.endDt = (curYear + 1) + "-11-30";
      } else {
        $scope.startDt = (curYear - 1) + "-12-01";
        $scope.endDt = curYear + "-11-30";
      }
      $rootScope.backdrop = 'backdrop';
      return RankSvc.getRankList().success(function(data) {
        var prevAmCnt, prevPmCnt, prevSpCnt, rankNo;
        $scope.rankList = data;
        prevAmCnt = 0;
        prevPmCnt = 0;
        prevSpCnt = 0;
        rankNo = 1;
        $scope.rankList.forEach(function(rank) {
          if (rank.amCnt < prevAmCnt) {
            ++rankNo;
          } else if (rank.pmCnt < prevPmCnt) {
            ++rankNo;
          } else if (rank.spCnt < prevSpCnt) {
            ++rankNo;
          }
          rank.rankNo = rankNo;
          prevAmCnt = rank.amCnt;
          prevPmCnt = rank.pmCnt;
          return prevSpCnt = rank.spCnt;
        });
        $scope.mock = false;
        return $rootScope.backdrop = void 0;
      });
    }
  ]);

}).call(this);
