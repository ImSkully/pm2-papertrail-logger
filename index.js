const os = require("os");
const pm2 = require("pm2");
const pmx = require("pmx");
const io = require("@pm2/io");

const PapertrailLogger = require("./PapertrailLogger.js");

// pm2 module metrics.
const METRICS = {
	"processes": io.metric({ name: "Attached Processes", value: 0 }), // Number of processes with active transport pipelines.
}

const TRANSPORTS = {}; // Transport pipelines for each process.
let PM2_CONFIG = {}; // Module configuration.
let IGNORED_PROCESSES = ["pm2-papertrail", "pm2-auto-pull"]; // Processes to ignore when logging.

/**
 * routeLog(packet, [level = "info"])
 * Routes a log packet to the appropriate transport pipeline.
 * 
 * @param {Object} packet 	A packet of data from the pm2 bus.
 * @param {String} level 	The log level to use.					[default: "info"]
 */
function routeLog(packet, level = "info")
{
	const processName = packet.process.name.trim();
	if (IGNORED_PROCESSES.includes(processName)) return; // Discard ignored processes.

	if (!TRANSPORTS[processName]) // Create a new transport pipeline for this process.
	{
		log(`Created new logger for process: ${processName}`);
		TRANSPORTS[processName] = new PapertrailLogger(processName, PM2_CONFIG);
		METRICS.processes.set(Object.keys(TRANSPORTS).length);
	}

	return TRANSPORTS[processName].log(level, packet.data);
}

/**
 * log(message, level = "info")
 * Logs a message to the console as this module.
 * @param {String} 	message 	The message to log.
 * @param {String} 	level 		The log level to use.	[default: "info"]
 */
function log(message, level = "info")
{
	const output = `[${(PM2_CONFIG?.module_name || "papertrail-logger")}]: ${message}`;

	if (level === "error") console.error(output);
	else console.log(output);
	return true;
}

// pm2 module configuration output.
pmx.configureModule({
	human_info: [
		["Papertrail Host", PM2_CONFIG.host || "Not configured"],
		["Papertrail Port", PM2_CONFIG.port || "Not configured"],
		["Papertrail Hostname", PM2_CONFIG.hostname || os.hostname()]
	]
});

// Initialize the pm2 module.
pmx.initModule({
	widget: {
		logo: "https://github.com/ImSkully/pm2-papertrail-logger/blob/main/assets/Papertrail.svg?raw=true",
		theme: ["#6DA55F", "#ccc", "#3ff", "#3ff"],
		el: { probes: false, actions: false },
		block: { actions: true, issues: true, meta: true }
	}
}, (error, config) => {
	PM2_CONFIG = config;

	// Check if the required configuration values are present.
	if (!PM2_CONFIG.host || !PM2_CONFIG.port) {
		return log(
			"You are missing required configuration values!\n" +
			"Please run the following commands to setup your Papertrail source:\n" +
			"$ pm2 set " + PM2_CONFIG.module_name + ":host <host>\n" +
			"$ pm2 set " + PM2_CONFIG.module_name + ":port <port>\n\n" +
			"Optionally, you can also set the hostname to use for this source:\n" +
			"$ pm2 set " + PM2_CONFIG.module_name + ":hostname <hostname>",
		"error");
	}

	// Prepare the hostname for this source.
	PM2_CONFIG.hostname = (PM2_CONFIG.hostname) ? PM2_CONFIG.hostname.trim() : os.hostname();

	// Connect to the running pm2 service.
	pm2.connect(() => {
		log(`Started and forwarding log outputs to ${PM2_CONFIG.host}:${PM2_CONFIG.port} as '${PM2_CONFIG.hostname}'!`);

		// Initialize a new pm2 bus to listen for log events.
		pm2.launchBus(function(error, bus) {
			//bus.on("log:PM2", function(packet) { log("info", "PM2", packet.data, packet); });

			bus.on("log:out", (packet) => routeLog(packet, "info"));
			bus.on("log:err", (packet) => routeLog(packet, "error"));

			// Cleanup log transport pipelines when a process exits.
			bus.on("process:event", (packet) => {
				if (packet.event === "exit" && TRANSPORTS[packet.process.name]) {

					// Close the transport pipeline for this process and delete it.
					TRANSPORTS[packet.process.name].close();
					delete TRANSPORTS[packet.process.name];
					METRICS.processes.set(Object.keys(TRANSPORTS).length);

					log(`Closed transport pipeline for exitting process '${packet.process.name}'.`);
				}
			});
		});
	});
});