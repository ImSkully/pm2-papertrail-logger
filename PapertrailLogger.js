const winston = require("winston");
require("winston-papertrail").Papertrail;

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
		this.logger = new (winston.Logger)({
			transports: [
				new (winston.transports.Papertrail)({
					host: config.host,
					port: config.port,
					localhost: config.hostname, // System name to display in Papertrail.
					program: this.name, // Program/app name to display in Papertrail.
					colorize: true,
					level: "info"
				})
			]
		});
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
		this.logger[level](message);
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