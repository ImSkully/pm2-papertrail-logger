const os = require("os");
const io = require("@pm2/io");
const pm2 = require("pm2");

const PapertrailLogger = require("./PapertrailLogger.js");

// pm2 module metrics.
const METRICS = {
	"processes": io.metric({ name: "Attached Processes", value: 0 }), // Number of processes with active transport pipelines.
}

const TRANSPORTS = {}; // Transport pipelines for each process.
let PM2_CONFIG = {}; // Module configuration.
let IGNORED_PROCESSES = []; // Processes to ignore when logging.

/**
 * routeLog(packet, [level = "info"])
 * Routes a log packet to the appropriate transport pipeline.
 * 
 * @param {Object} packet 	A packet of data from the pm2 bus.
 * @param {String} level 	The log level to use.					[default: "info"]
 */
async function routeLog(packet, level = "info")
{
	const processName = packet.process.name.trim();
	if (IGNORED_PROCESSES.includes(processName)) return; // Discard ignored processes.

	if (!TRANSPORTS[processName]) // Create a new transport pipeline for this process.
	{
		let appName = processName; // If we are using process as systems, then we need to use the namespace as the app name.
		if (PM2_CONFIG["process-as-systems"]) appName = await getProcessNamespace(packet.process.pm_id) || "default";

		TRANSPORTS[processName] = new PapertrailLogger(processName, {
			app_name: appName,
			...PM2_CONFIG
		});

		METRICS.processes.set(Object.keys(TRANSPORTS).length);
		log(`Created new logger for process: ${processName}`);
	}

	return TRANSPORTS[processName].log(level, packet.data);
}

/**
 * log(message, level = "info")
 * Logs a message to the console as this module.
 * 
 * @param {String} 	message 	The message to log.
 * @param {String} 	level 		The log level to use.	[default: "info"]
 */
function log(message, level = "info")
{
	const output = `[${(PM2_CONFIG?.module_name || "pm2-papertrail-logger")}]: ${message}`;

	if (level === "error") console.error(output);
	else console.log(output);
	return true;
}

/**
 * getProcessNamespace(processIdentifier)
 * Gets the namespace for a pm2 process.
 * 
 * @param 	{string|int} 	processIdentifier 	The pm2 process identifier.
 * @returns	{Promise<string|false>}				A promise that resolves to the namespace or false if it could not be resolved.
 */
async function getProcessNamespace(processIdentifier)
{
	return new Promise((resolve, reject) => {
		pm2.describe(processIdentifier, (error, process) => {
			if (error) return reject(false);
			return resolve(process[0]?.pm2_env?.namespace);
		});
	});
}

// pm2 module configuration and initialization.
io.init({
	human_info: [
		["Papertrail Host", process.env.host || "Not configured"],
		["Papertrail Port", process.env.port || "Not configured"],
		["Papertrail Hostname", process.env.hostname || os.hostname()],
		["Process as Systems", (process.env["process-as-systems"] == "true") ? "Enabled" : "Disabled"],
		["Blacklisted Processes", (process.env["blacklist"]) ? process.env["blacklist"].split(",").map((processName) => processName.trim()).join(", ") : "None"],
	]
}).initModule(false, (error) => {
	PM2_CONFIG = io.getConfig();

	// Check if the required configuration values are present.
	if (!PM2_CONFIG.host || !PM2_CONFIG.port) {
		return log(
			`You are missing required configuration values!\n` +
			`Please run the following commands to setup your Papertrail source:\n` +
			`$ pm2 set ${PM2_CONFIG.module_name}:host <host>\n` +
			`$ pm2 set ${PM2_CONFIG.module_name}:port <port>\n\n` +
			`Optionally, you can also set the hostname to use for this source:\n` +
			`$ pm2 set ${PM2_CONFIG.module_name}:hostname <hostname>`,
		"error");
	}

	// Prepare the hostname for this source.
	PM2_CONFIG.hostname = (PM2_CONFIG.hostname) ? PM2_CONFIG.hostname.trim() : os.hostname();

	// Add any blacklisted processes to the ignore list.
	PM2_CONFIG.blacklist = (PM2_CONFIG.blacklist) ? PM2_CONFIG.blacklist.trim() : false;
	if (PM2_CONFIG.blacklist)
		IGNORED_PROCESSES = IGNORED_PROCESSES.concat(PM2_CONFIG.blacklist.split(",").map((processName) => processName.trim()));

	// Connect to the running pm2 service.
	pm2.connect(() => {
		log(`Started and forwarding log outputs to ${PM2_CONFIG.host}:${PM2_CONFIG.port} as ${(PM2_CONFIG["process-as-systems"]) ? "unique systems per process" : `system name '${PM2_CONFIG.hostname}'`}.`);
		if (IGNORED_PROCESSES.length > 0) log(`Ignoring a total of ${IGNORED_PROCESSES.length} processes.`);

		// Initialize a new pm2 bus to listen for log events.
		pm2.launchBus(function(error, bus) {
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

// Expose pm2 action to list attached processes.
io.action("show attached processes", async (callback) => {
	const total = Object.keys(TRANSPORTS).length;
	if (total === 0) {
		console.log("[Attached Processes] Found no attached processes, a process will be attached when it logs for the first time.");
		return callback({ success: true });
	}

	console.log(`[Attached Processes] Showing ${total} attached processes:`);
	for (const processName in TRANSPORTS) {
		console.log(`\t- ${processName}`);
	}

	return callback({ success: true });
});