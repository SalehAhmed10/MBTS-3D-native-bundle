import { build } from "esbuild";
import { cp, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const embedDir = path.join(rootDir, "avatar-embed");
const sourceFile = path.join(embedDir, "src", "main.js");
const outputFile = path.join(embedDir, "app.js");
const workletSource = path.join(embedDir, "modules", "playback-worklet.js");
const workletOutput = path.join(embedDir, "playback-worklet.js");

await mkdir(path.dirname(outputFile), { recursive: true });

await build({
  entryPoints: [sourceFile],
  outfile: outputFile,
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["chrome109", "safari16"],
  logLevel: "info",
  sourcemap: false,
});

await cp(workletSource, workletOutput);
