/**
 * Kill whatever process is listening on the API port, then exit.
 * Usage:  npm run freeport   (uses PORT from .env, default 5000)
 * Cross-platform (Windows / macOS / Linux).
 */
require("dotenv").config();
const { execSync } = require("child_process");

const PORT = process.env.PORT || 5000;
const isWin = process.platform === "win32";

function pids() {
  try {
    if (isWin) {
      const out = execSync(`netstat -ano -p tcp`, { encoding: "utf8" });
      return [
        ...new Set(
          out
            .split(/\r?\n/)
            .filter((l) => l.includes(`:${PORT} `) && /LISTENING/i.test(l))
            .map((l) => l.trim().split(/\s+/).pop())
            .filter((p) => p && p !== "0")
        ),
      ];
    }
    const out = execSync(`lsof -ti tcp:${PORT} -s TCP:LISTEN`, { encoding: "utf8" });
    return out.split(/\s+/).filter(Boolean);
  } catch {
    return [];
  }
}

const found = pids();
if (!found.length) {
  console.log(`✔ Port ${PORT} is already free.`);
  process.exit(0);
}

for (const pid of found) {
  try {
    execSync(isWin ? `taskkill /F /PID ${pid}` : `kill -9 ${pid}`, { stdio: "ignore" });
    console.log(`✔ Killed process ${pid} on port ${PORT}.`);
  } catch (e) {
    console.error(`✖ Could not kill ${pid}: ${e.message}`);
  }
}
console.log(`\nPort ${PORT} is now free — run "npm start".`);
