/*******************************************************************************
 * @license
 * Copyright (C) 2011, 2012 VMware, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE. 
 *
 * Contributors:
 *     Marek Majkowski - initial API and implementation 
 *     Kris De Volder - add client-side connection identifier to protocol
 ******************************************************************************/
/*global exports require process escape*/
var events = require('events');
var stream = require('stream');

var MultiplexServer = function(service) {
    var that = this;
    this.registered_channels = {};
    this.service = service;
    this.service.on('connection', function(conn) {
        var channels = {};

        conn.on('data', function(message) {
			var sub;
            var t = message.split(',');
            var type = t.shift(), topic = t.shift(), id=t.shift(), payload = t.join();
            if (type==='sub') {
	            if (!(topic in that.registered_channels)) {
					return;
				}
				sub = channels[id] = new Channel(conn, topic, id, channels);
				that.registered_channels[topic].emit('connection', sub);
            } else if (id in channels) {
                sub = channels[id];
                switch(type) {
                case 'uns':
                    delete channels[id];
                    sub.emit('close');
                    break;
                case 'msg':
                    sub.emit('data', payload);
                    break;
                }
            }
        });
        conn.on('close', function() {
            for (var id in channels) {
				if (channels.hasOwnProperty(id)) {
	                channels[id].emit('close');
	            }
            }
            channels = {};
        });
    });
};

MultiplexServer.prototype.registerChannel = function(name) {
	var emitter = new events.EventEmitter();
    this.registered_channels[escape(name)] = emitter;
    return emitter;
};

var Channel = function(conn, topic, id, channels) {
    this.conn = conn;
    this.topic = topic;
    this.id = id;
    this.channels = channels;
    stream.Stream.call(this);
};
Channel.prototype = new stream.Stream();

Channel.prototype.write = function(data) {
    this.conn.write('msg,' + this.topic + ',' + this.id + ',' + data);
};
Channel.prototype.end = function(data) {
    var that = this;
    if (data) {
		this.write(data);
    }
    if (this.id in this.channels) {
        this.conn.write('uns,' + this.topic + ',' + this.id);
        delete this.channels[this.id];
        process.nextTick(function(){that.emit('close');});
    }
};
Channel.prototype.destroy = Channel.prototype.destroySoon =
    function() {
        this.removeAllListeners();
        this.end();
    };


exports.MultiplexServer = MultiplexServer;