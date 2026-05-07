// Phusion Passenger entry point — delegates to Next.js standalone server
const path = require("path");
const standaloneDir = path.join(__dirname, ".next/standalone");

// Change working directory so standalone server resolves its own paths correctly
process.chdir(standaloneDir);
require(path.join(standaloneDir, "server.js"));
