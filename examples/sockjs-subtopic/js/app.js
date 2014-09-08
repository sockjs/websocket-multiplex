var sockjs = new SockJS('/multiplex');
var multiplexer = new WebSocketMultiplex(sockjs);

var aChannel = multiplexer.channel('a.12');
var bChannel = multiplexer.channel('b.5');

var app = angular.module('subTopicSample', ['chartjs']);

app.controller('MainCtrl', function($scope) {

        $scope.lineData = {
            labels: ["Paris", "New York", "London", "Berlin"],
            datasets: [{
                fillColor: "rgba(220,220,220,0.5)",
                strokeColor: "rgba(220,220,220,1)",
                pointColor: "rgba(220,220,220,1)",
                pointStrokeColor: "#fff",
                data: [10, 20, 5, 35]
            }]
        };
        $scope.bMessages = [];

        aChannel.onmessage = function(e) {
            var obj = JSON.parse(e.data);
            $scope.lineData = {
                labels: ["Paris", "New York", "London", "Berlin"],
                datasets: [{
                    fillColor: "rgba(220,220,220,0.5)",
                    strokeColor: "rgba(220,220,220,1)",
                    pointColor: "rgba(220,220,220,1)",
                    pointStrokeColor: "#fff",
                    data: [obj.paris, obj.newYork, obj.london, obj.berlin]
                }]
            };
            $scope.$apply();
        };

        bChannel.onmessage = function(e) {
            var obj = JSON.parse(e.data);
            $scope.bMessages.push("Nb de contacts : " + obj.value);

            if ($scope.bMessages.length > 15) {
                bMessage.pop();
            }

            $scope.$apply();
        };
    }
);
