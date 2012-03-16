
WebSocket-multiplex
===================

WebSocket-multiplex is a small library on top of SockJS that allows
you to do multiplexing over a single SockJS connection.

The rationale for that is explained in details in the following blog
post:

  * https://www.rabbitmq.com/blog/2012/02/23/how-to-compose-apps-using-websockets/


Usage from the browser
----------------------

On the client side (browser) load library like that:

    <script src="http://cdn.sockjs.org/websocket-multiplex-0.1.js">
      </script>

Alternatively, if you're using SSL:

    <script src="https://d1fxtkz8shb9d2.cloudfront.net/websocket-multiplex-0.1.js">
      </script>

Usage example:

        var sockjs_url = '/multiplex';
        var sockjs = new SockJS(sockjs_url);

        var multiplexer = new WebSocketMultiplex(sockjs);
        var ann  = multiplexer.channel('ann');
        var bob  = multiplexer.channel('bob');
        var carl = multiplexer.channel('carl');


Usage from the node.js server
-----------------------------

On the node.js server side, you can use npm to get the code:

    npm install websocket-multiplex

And a simplistic example:

    var multiplex_server = require('websocket-multiplex');

    // 1. Setup SockJS server
    var service = sockjs.createServer();

    // 2. Setup multiplexing
    var multiplexer = new multiplex_server.MultiplexServer(service);

    var ann = multiplexer.registerChannel('ann');
    ann.on('connection', function(conn) {
        conn.write('Ann says hi!');
        conn.on('data', function(data) {
            conn.write('Ann nods: ' + data);
        });
    });

    // 3. Setup http server
    var server = http.createServer();
    sockjs_echo.installHandlers(server, {prefix:'/multiplex'});
    var app = express.createServer();

For a full-featured example see the `/examples` directory.
