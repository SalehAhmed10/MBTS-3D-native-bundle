import { build } from "esbuild";
import { cp } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const embedDir = path.join(rootDir, "avatar-embed");
const sourceFile = path.join(embedDir, "src", "main.js");
const outputFile = path.join(embedDir, "app.js");
const workletSource = path.join(embedDir, "modules", "playback-worklet.js");
const workletOutput = path.join(embedDir, "playback-worklet.js");

// Build JS bundle
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

// avatar-embed/ IS the Vercel deployment root.
// Files are served at https://mbts-3-d-native-bundle.vercel.app/<file>
// The mobile app downloads them on first launch via avatarBundleManager.
// No native asset bundling needed — no android-local-assets/, no Xcode build phase.
console.log("[build-avatar-embed] Built avatar-embed/ — deploy to Vercel to publish.");
console.log("[build-avatar-embed] Avatars available:", [
  "avatars/Camilia.glb",
  "avatars/prithi.glb",
  "avatars/Benji.glb",
  "avatars/john.glb",
].join(", "));
