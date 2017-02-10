'use strict';


const os = require('os'),
	Socket = require('net').Socket;


/**
 * Provides interface for pushing metric lines to Graphite service.
 */
class Graphite {


	/**
	 * Initializes Graphite service.
	 */
	constructor(host, port, config) {
		this.config = Object.assign({
			socket_timeout: 300000,
			socket_reconnect_delay: 1000,
			queue_size_limit: 10000000,
			chunk_size: 200,
			logger: (severity, message) => console[severity](message)
		}, config);

		this.port = port;
		this.host = host;

		this.queue = [];
		this._socket = null;
	}


	/**
	 * Returns initialized socket connected to Graphite service.
	 *
	 * @returns {Promise<Socket>}
	 */
	get socket() {
		if (this._socket) {
			return Promise.resolve(this._socket);
		}

		return new Promise((resolve, reject) => {
			const socket = new Socket({
				writable: true,
				allowHalfOpen: false
			});

			socket.setTimeout(this.config.socket_timeout);

			socket
				.on('connect', () => resolve(this._socket = socket))
				.on('error', (error) => this.config.logger('error', error.stack))
				.on('timeout', () => {
					this.config.logger('warn', 'Socket timeout out');
					socket.end();
				})
				.on('close', () => {
					this._socket = null;
					reject(new Error());
				});

			socket.connect(this.port, this.host);
		});
	}


	/**
	 * Sends metric lines to Graphite service.
	 *
	 * @param {string[]} lines Metric lines
	 * @returns {Promise}
	 */
	send(lines) {
		return this.socket.then((socket) => {
			return lines.reduce((p, line) =>
					p.then(() =>
						new Promise(resolve => socket.write(line, () => resolve()))
					),
				Promise.resolve()
			);
		});
	}


	/**
	 * Starts processing of the queued metric lines.
	 */
	run() {
		// give up if the queue is already processed
		if (this.running) {
			return;
		}

		// give up if there is nothing to process
		if (!this.queue.length) {
			return;
		}

		// process queue
		this.running = true;

		const messages = this.queue.slice(0, this.config.chunk_size);

		this.send(messages)
			.then(() => this.queue.splice(0, messages.length))
			.catch(error => {
				this.config.logger('error', error.stack);
				return new Promise(resolve => setTimeout(resolve, this.config.socket_reconnect_delay));
			})
			.then(() => {
				this.config.logger('log', `Sent ${messages.length} line(s), ${this.queue.length} still in queue`);
				this.running = false;
				this.run();
			});
	}

	/**
	 * Sends metric line to Graphite service.
	 *
	 * @param {string} name Metric name
	 * @param {number} value Metric value
	 * @param {number} ts Metric timestamp
	 */
	push(name, value, ts) {
		if (this.queue.length > this.config.queue_size_limit) {
			throw new Error('Too many metric lines in send queue, not accepting more');
		}

		ts = ts || Date.now();

		this.queue.push(`${name} ${value} ${Math.round(ts / 1000)}${os.EOL}`);

		// start processing in next event loop iteration
		// this will allow to gather more metric lines
		process.nextTick(() => this.run());
	}

}

module.exports = Graphite;
