/**
 * Server sample to allow sub topic on multiplexed SockJS
 *
 * @author GregoryDepuille
 */

var _ = require('underscore-node');
var http = require('http');
var express = require('express');
var sockjs = require('sockjs');
var multiplex_server = require('websocket-multiplex');
var log4js = require('log4js');
var random = require("random-js")();

log4js.configure('log4js.json');
var logger = log4js.getLogger("sub-topic-sample");

// Registered connection by topic
var aSockets = [];
var bSockets = [];

function makeChannel(sockJsMux, channelName) {
    logger.info("Add channel " + channelName);
    return sockJsMux.registerChannel(channelName);
}

function filterTopicPredicate(topicSocket) {
    return this === topicSocket.conn;
}

function cleanTopic(connection, arrays) {
    var f = _.filter(arrays, filterTopicPredicate, connection);
    for (var i = 0 ; i < f.length ; i++) {
        var idx = arrays.indexOf(f[i]);
        arrays.splice(idx, 1);
    }
}

function configureMasterEvents(sockJsServer) {
    sockJsServer.on('connection', function (socket) {
        logger.info("Main socket opened " + socket);

        // Manage closed connection from browser
        socket.on('close', function () {
            logger.info("Main socket closed " + socket);

            // Remove sockets.
            cleanTopic(socket, aSockets);
            cleanTopic(socket, bSockets);
        });
    });
}

function configureChannelEvents(channel, arrays) {
    channel.on('connection', function (socket) {
        logger.info("Opened connection to " + socket.topic  + " " + socket.conn);
        arrays.push(socket);
    });
}

function notifyA(subTopic) {
    for (var i = 0 ; i < aSockets.length ; i++) {
        var socket = aSockets[i];
        if (socket.topic === "a." + subTopic) {
            var message = {
                paris: random.integer(1, 200),
                newYork: random.integer(1, 200),
                london: random.integer(1, 200),
                berlin: random.integer(1, 200)
            };

            socket.write(JSON.stringify(message));
            logger.info("Send a message on a." + subTopic + " channel to " + socket.conn);
        }
    }
}


function notifyB(subTopic) {
    for (var i = 0 ; i < bSockets.length ; i++) {
        var socket = bSockets[i];
        if (socket.topic === "b." + subTopic) {
            socket.write(JSON.stringify({ value: random.integer(1, 20) }));
            logger.info("Send a message on b." + subTopic + " channel to " + socket.conn);
        }
    }
}


logger.info('Init sample')
var sockJsServer = sockjs.createServer();
var sockJsMux = new multiplex_server.MultiplexServer(sockJsServer, {allowSubTopic: true});

configureMasterEvents(sockJsServer);
configureChannelEvents(makeChannel(sockJsMux, 'a'), aSockets);
configureChannelEvents(makeChannel(sockJsMux, 'b'), bSockets);

var app = express();
var httpServer = http.createServer(app);
sockJsServer.installHandlers(httpServer, {prefix:'/multiplex'});
httpServer.listen(9999, '0.0.0.0');

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});

app.get('/js/app.js', function (req, res) {
    res.sendfile(__dirname + '/js/app.js');
});

app.get('/js/Chart.min.js', function (req, res) {
    res.sendfile(__dirname + '/js/Chart.min.js');
});

app.get('/js/angular-chartjs.min.js', function (req, res) {
    res.sendfile(__dirname + '/js/angular-chartjs.min.js');
});

app.get('/js/random.min.js', function (req, res) {
    res.sendfile(__dirname + '/js/random.min.js');
});

setInterval(function () {
    var a = random.integer(1, 20);
    notifyA(a);

    var b = random.integer(1, 20);
    notifyB(b);
}, 500);