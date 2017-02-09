# reliable-graphite

Graphite client which buffers metrics when e.g. remote server is down.

## Installation

```sh
$ npm install --save reliable-graphite
```

## Simple usage

```javascript
const Graphite = require('reliable-graphite'),
	graphite = new Graphite(<host>, <port>);

graphite.push('metric1', 100);
```
	
## API

### Creating Graphite client

```javascript
const graphite = new Graphite(host, port, {
	socket_timeout: 300000,
	socket_reconnect_delay: 1000,
	queue_size_limit: 10000000,
	chunk_size: 200,
	logger: (severity, message) => console[severity](message)
});
```

Where config is an object with following optional properties:

* socket_timeout - *number (default 300000)* - Graphite socket inactivity time (in milliseconds) after which it will be disconnected

* socket_reconnect_delay - *number (default 1000)* - Time (in milliseconds) to wait before reconnecting socket. This prevents falling into reconnect loop at high speed when e.g. graphite server is down.

* queue_size_limit - *number (default 10000000)* - When Graphite server is down the metric lines will be buffered up to this count. *graphite.push()* will throw exception once this limit is exceeded.

* chunk_size - *number (default 200)* - Indicates how many metric lines will be pushed to Graphite server at once

* logger - *function(string, string)* - Logs are written to the console by default. You can override this behaviour by providing custom logger.


### Pushing metric line to remote server

```javascript
graphite.push(name, value, ts);
```
	
Arguments:

* name - *string* - Metric name

* value - *number* - Metric value

* ts - *number (default Date.now())* - Metric timestamp (in milliseconds)


## Author

Karol Maciaszek <karol@maciaszek.pl>

## License

(The MIT License)

Copyright (c) 2016 Karol Maciaszek <karol@maciaszek.pl>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
