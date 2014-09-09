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

    <script src="http://cdn.sockjs.org/websocket-multiplex-0.1.js"></script>

Alternatively, if you're using SSL:

    <script src="https://d1fxtkz8shb9d2.cloudfront.net/websocket-multiplex-0.1.js"></script>

Usage example:

```javascript
    var sockjs_url = '/multiplex';
    var sockjs = new SockJS(sockjs_url);

    var multiplexer = new WebSocketMultiplex(sockjs);
    var ann  = multiplexer.channel('ann');
    var bob  = multiplexer.channel('bob');
    var carl = multiplexer.channel('carl');
```

If the sub topic is activated on server configuration, you have the possibility to create one with dot separated syntax.

```javascript
    var sockjs_url = '/multiplex';
    var sockjs = new SockJS(sockjs_url);

    var multiplexer = new WebSocketMultiplex(sockjs);
    var ann  = multiplexer.channel('ann.spell');
    var bob  = multiplexer.channel('bob.age');
    var carl = multiplexer.channel('carl.23');
```

Usage from the node.js server
-----------------------------

On the node.js server side, you can use npm to get the code:

    npm install websocket-multiplex

And a simplistic example:

```javascript
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
```

To authorize sub topic, it is necessary to add the configuration of the option during creation of MultiplexServer.
This configuration is deactivated by default.

```javascript
   
    // Setup multiplexing with sub topic
    var opts = {allowSubTopic: true};
    var multiplexer = new multiplex_server.MultiplexServer(service, opts);

```

For a full-featured example see the
[/examples/sockjs](https://github.com/sockjs/websocket-multiplex/tree/master/examples/sockjs)
directory.

Protocol
--------

The underlying protocol is quite simple. Each message is a string consisting of
three comma separated parts: _type_, _topic_ and _payload_. There are
three valid message types:

 * `sub` - expresses a will to subscribe to a given _topic_.
 * `msg` - a message with _payload_ is being sent on a _topic_.
 * `uns` - a will to unsubscribe from a _topic_.

Invalid messages like wrong unsubscriptions or publishes to a _topic_
to which a client was not subscribed to are simply ignored.

This protocol assumes that both parties are generally willing to
cooperate and that no party makes errors. All invalid
messages should be ignored.

It's important to notice that the namespace is shared between both
parties. It is not a good idea to use the same topic names on the
client and on the server side because both parties may unsubscribe
the other from a topic.
