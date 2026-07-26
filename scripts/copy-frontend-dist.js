const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const source = path.join(root, "Frontend", "dist");
const target = path.join(root, "backend", "dist");

if (!fs.existsSync(source)) {
  throw new Error("Frontend dist folder does not exist. Run the frontend build first.");
}

fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(source, target, { recursive: true });

console.log(`Copied ${source} to ${target}`);
