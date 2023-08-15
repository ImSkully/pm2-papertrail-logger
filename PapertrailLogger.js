const winston = require("winston");
require("winston-syslog");

let PAPERTRAIL_TRANSPORT;

/**
 * getLoggerTransport(config, name)
 * Creates a new logger transport for the given process name and configuration.
 * 
 * @param 	{String} 			name 	The name of the process to create a logger for.
 * @param 	{Object} 			config 	The pm2 module configuration containing Papertrail log destination settings.
 * 
 * @returns {winston.Logger} 			The logger transport instance to use.
 */
function getLoggerTransport(config, name)
{
	// If the configuration is set to use one shared system transport.
	if (!config["process-as-systems"])
	{
		if (!PAPERTRAIL_TRANSPORT) {
			PAPERTRAIL_TRANSPORT = new winston.transports.Syslog({
				host: config.host,
				port: config.port,
				localhost: config.hostname,
				app_name: name,
				protocol: "tls4",
				eol: "\n",
				format: winston.format.combine( // Enable log message coloring.
					winston.format.colorize(),
					winston.format.simple()
				)
			});
		}

		return winston.createLogger({
			format: winston.format.simple(),
			levels: winston.config.syslog.levels,
			transports: [ PAPERTRAIL_TRANSPORT ],
		});
	}

	// Use a new transport for this process.
	return winston.createLogger({
		format: winston.format.simple(),
		levels: winston.config.syslog.levels,
		transports: [
			new winston.transports.Syslog({
				host: config.host,
				port: config.port,
				localhost: name,
				app_name: "app",
				protocol: "tls4",
				eol: "\n",
				format: winston.format.combine(
					winston.format.colorize(),
					winston.format.simple()
				)
			})
		]
	});
}

class PapertrailLogger
{
	/**
	 * PapertrailLogger(name, config)
	 * Creates a new PapertrailLogger instance.
	 * 
	 * @param {String} name 	The name of the process to create a logger for.
	 * @param {Object} config 	The pm2 module configuration containing Papertrail log destination settings.
	 */
	constructor(name, config)
	{
		this.name = name;
		this.logger = getLoggerTransport(config, name);
	}

	/**
	 * log(level, message)
	 * Dispatches a log via transport pipeline to Papertrail.
	 * 
	 * @param {String} level 	The log level to use.
	 * @param {String} message 	The message to log.
	 */
	log(level, message)
	{
		try {
			this.logger[level](message);
		} catch (error) {
			console.error(`[ERROR] Failed to log message to Papertrail for process '${this.name}' with level ${level}:`);
			console.error(error);
		}
	}

	/**
	 * close()
	 * Closes the logger and all log transports.
	 */
	close()
	{
		this.logger.close();
	}
}

module.exports = PapertrailLogger;