﻿(function () {
    'use strict';

    angular
        .module('myApp')
        .controller('LoginController', LoginController);

    LoginController.$inject = ['$location', 'AuthenticationService', 'FlashService'];

    function LoginController($location, AuthenticationService, FlashService) {
			var vm = this;
			vm.login = login;
			vm.departments = [
				{text:'영아부', value:'infant'},
				{text:'유년부', value:'kindergarten'},
				{text:'중등부', value:'middle'},
				{text:'고등부', value:'high'}
			];

			vm.authtypes = [
				{text:'관리자', value:'admin'},
				{text:'선생님', value:'teacher'}
			];

		  console.log("LOGIN");
			(function initController() {
					// reset login status
					AuthenticationService.ClearCredentials();
			})();

			function login() {
					vm.dataLoading = true;
					AuthenticationService.Login(vm.department, vm.password, vm.authtype, function (response) {

						console.log(response);
							if (response.success) {
									AuthenticationService.SetCredentials(vm.department, vm.password, vm.authtype);
									$location.path('/main');
							} else {
									$.notify(response.message);
									vm.dataLoading = false;
							}
					});
			};
    }

})();
