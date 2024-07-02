# PM2 Papertrail Logger <a href="https://pm2.keymetrics.io" target="_blank" alt="pm2"><img src="https://img.shields.io/badge/pm2-2B037A.svg?logo=pm2" /></a> <a href="https://papertrailapp.com" target="_blank" alt="Papertrail"><img src="https://img.shields.io/badge/Papertrail-04498f.svg?logo=data:image/svg%2bxml;base64,PHN2ZyBoZWlnaHQ9IjI4IiB2aWV3Qm94PSIwIDAgMzUgMjgiIHdpZHRoPSIzNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJtMTYuNjYyIDEzLjEzLjAwMy4wMTdjLTEuNTkuNDItMy4xOTguNzcyLTQuNzc1IDEuMjU5YTIwLjk4IDIwLjk4IDAgMCAwIC0xMS44MTUtNS4yOCAzOC40MDUgMzguNDA1IDAgMCAxIDIyLjI4My03LjIxN2wtMi43NDggMi41MThzMTEuNjQ0LS40MTcgMTQuNTgtNC40MjdhNS4zNzcgNS4zNzcgMCAwIDEgLS4zNzggMS4yMTUgMTMuMTIgMTMuMTIgMCAwIDEgLTQuMjM4IDUuOTg1IDI0LjI2NSAyNC4yNjUgMCAwIDEgLTYuMDQyIDMuNDQxIDU3Ljg3NCA1Ny44NzQgMCAwIDEgLTYuNTY2IDIuNDA0bC0uMzA0LjA4NHptMTguMjYzLS4zOTZjLTQuMjIuNTg4LTEyLjM1MiA0Ljc2Mi0xOC4yMTggOC4wMzFhMjEuMTA1IDIxLjEwNSAwIDAgMCAtMy42ODQtNS4yNTdjMTEuMTU3LTMuNjEzIDIxLjkwMi0yLjc3NCAyMS45MDItMi43NzR6bS0xNy40ODQgOS43MDYgMTEuNTU2LTQuOTYtMTAuMjI3IDEwLjUyYTIwLjkzOCAyMC45MzggMCAwIDAgLTEuMzMtNS41NnoiIGZpbGw9IiNmZmExMDAiIGRhdGEtZGFya3JlYWRlci1pbmxpbmUtZmlsbD0iIiBzdHlsZT0iLS1kYXJrcmVhZGVyLWlubGluZS1maWxsOiAjY2M4MTAwOyI+PC9wYXRoPjwvc3ZnPg==" /></a>

![Maintained](https://img.shields.io/maintenance/yes/2024.svg)
<a href="https://nodejs.org" target="_blank" alt="Node.js"><img src="https://img.shields.io/badge/Node.js-6DA55F?style=flat&logo=node.js&logoColor=white" /></a>
![License](https://img.shields.io/github/license/ImSkully/pm2-papertrail-logger)
<a href="./package-lock.json" target="_blank" alt="package-lock"><img src="https://img.shields.io/badge/package--lock-committed-brightgreen" /></a>
<a href="https://www.npmjs.com/package/pm2-papertrail-logger" target="_blank" alt="npmjs Package"><img src="https://img.shields.io/npm/v/pm2-papertrail-logger.svg" /></a>

A simple and efficient [PM2](https://pm2.keymetrics.io) module that forwards logs for all your PM2 processes to [Papertrail](https://papertrailapp.com):

* ⚡️ Fast and lightweight, unpacked size of 54kb!
* 🔒 Secure with all logs sent over TLS
* 🔧 Easy to install and configure, deployed with 3 easy commands within a matter of seconds!
* 📝 Adjustable hostname for your pm2 source
* 🚀 Supports all PM2 process modes, including cluster, fork, and standalone.
* 📦 Memory management and automatic cleanup for closed processes

# Prerequisites

### PM2
This module requires that you have [PM2](https://pm2.keymetrics.io) installed and running on your system. If you do not have PM2 installed, you can install it via NPM:
```bash
npm install pm2 -g
```

### Papertrail
In order to use this module and forward all your pm2 process logs, you must have a [Papertrail](https://papertrailapp.com) Standalone account, this will not work for Papertrail instances that are attached as an addon to a Heroku application. For information on setting up a Papertrail Standalone account, [click here](https://www.papertrail.com/help/heroku/).

Within your Papertrail account, you will need a [Log Destination](https://papertrailapp.com/account/destinations) that accepts connections via TCP/UDP Ports. Once this is setup, take note of your destination host *(\*.papertrailapp.com)* and port number.

# Installation & Setup
1. Install the module via `pm2`:
  ```bash
  pm2 install pm2-papertrail-logger
  ```
  > [!IMPORTANT]  
  > Use `pm2 install`, not `npm install`!

2. Configure the Papertrail log destination by providing your host and port number:
  ```bash
  pm2 set pm2-papertrail-logger:host <host>
  pm2 set pm2-papertrail-logger:port <port>
  ```

3. The module should restart and begin logging to Papertrail!

# Usage
Once the module is installed and configured, it will automatically begin logging all your PM2 processes to Papertrail. You can view the logs by clicking on the [`Events`](https://my.papertrailapp.com/events) tab within your Papertrail account.

### Change Hostname
By default, the host name sent to Papertrail will be the OS hostname, you can change this by setting the hostname configuration variable:
```bash
pm2 set pm2-papertrail-logger:hostname <hostname>
```

### Process as Systems
If you would like to have each PM2 process be created as its own system group within Papertrail, you can set the `process-as-systems` configuration to `true`:
```bash
pm2 set pm2-papertrail-logger:process-as-systems true
```

### Blacklist
To prevent certain PM2 processes from being logged to Papertrail, you can set a blacklist of process names in the `blacklist` configuration variable which is a comma-separated list of process names:
```bash
pm2 set pm2-papertrail-logger:blacklist "process1,process2"
```

### PM2 Metrics
This module also provides metrics that can be viewed within the PM2 dashboard.
| Metric | Description |
| --- | --- |
| `Attached Processes` | The number of processes that are currently transporting logs to Papertrail. |

# Uninstalling
To uninstall the module, simply run:
```bash
pm2 uninstall pm2-papertrail-logger
```

This will remove the module from your PM2 configuration and stop it from running, you may also want to remove the configuration variables that were set:
```bash
pm2 unset pm2-papertrail-logger:host
pm2 unset pm2-papertrail-logger:port
pm2 unset pm2-papertrail-logger:hostname
pm2 unset pm2-papertrail-logger:process-as-systems
pm2 unset pm2-papertrail-logger:blacklist
```