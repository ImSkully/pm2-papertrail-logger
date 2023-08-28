const os = require("os");
const winston = require("winston");
require("winston-syslog");

// Create a new syslog transport with the configured Papertrial log destination.
const PAPERTRAIL_SYSTEM_TRANSPORT = new winston.transports.Syslog({
	host: process.env.host,
	port: process.env.port,
	localhost: process.env.hostname || os.hostname(),
	app_name: process.env.module_name || "pm2-papertrail-logger",
	protocol: "tls4",
	eol: "\n"
});

// The winson logger to use for forwarding logs.
const PAPERTRAIL_LOGGER = winston.createLogger({
	format: winston.format.printf(({message}) => { return message }),
	levels: winston.config.syslog.levels, // Use all syslog procotol levels.
	transports: [ PAPERTRAIL_SYSTEM_TRANSPORT ],
});

const PROCESS_AS_SYSTEM = (process.env?.["process-as-systems"]?.toLowerCase() === "true");

class PapertrailLogger
{
	/**
	 * PapertrailLogger(systemName, programName)
	 * Creates a new Papertrail logger instance for a process.
	 * 
	* @param 	{String} systemName 	The name of the system to log as.
	 * @param 	{String} programName	The program name to log as.
	 */
	constructor(systemName, programName)
	{
		this.name = systemName;
		this.appName = programName;
		this.process = (PROCESS_AS_SYSTEM) ? systemName : programName; // The name of the process for internal logging.
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
			if (!PAPERTRAIL_SYSTEM_TRANSPORT || !PAPERTRAIL_LOGGER)
				return console.error(`Discarding log from '${this.process}' as Papertrail transport is not ready.`);

			// Update the transport to use details of this process.
			PAPERTRAIL_SYSTEM_TRANSPORT.localhost = this.name;
			PAPERTRAIL_SYSTEM_TRANSPORT.appName = this.appName;
			PAPERTRAIL_LOGGER[level](message);
		} catch (error) {
			console.error(`[ERROR] Failed to log message to Papertrail for process '${this.process}' with level ${level}:`);
			console.error(error);
		}
	}
}

module.exports = PapertrailLogger;