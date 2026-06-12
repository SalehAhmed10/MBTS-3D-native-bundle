import { build } from "esbuild";
import { cp, mkdir, access } from "node:fs/promises";
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

// Copy built avatar-embed to android-local-assets/ (outside android/ so Gradle doesn't wipe it).
// Gradle's build.gradle hooks this directory into mergeDebugAssets / mergeReleaseAssets.
const androidLocalAssetsDir = path.join(rootDir, "android-local-assets", "avatar-web");

await mkdir(androidLocalAssetsDir, { recursive: true });
await mkdir(path.join(androidLocalAssetsDir, "avatars"), { recursive: true });
await mkdir(path.join(androidLocalAssetsDir, "backgrounds"), { recursive: true });

// Core page files
await cp(path.join(embedDir, "index.html"), path.join(androidLocalAssetsDir, "index.html"));
await cp(outputFile, path.join(androidLocalAssetsDir, "app.js"));
await cp(workletOutput, path.join(androidLocalAssetsDir, "playback-worklet.js"));

// Avatar manifest + GLB models
await cp(path.join(embedDir, "avatars", "manifest.json"), path.join(androidLocalAssetsDir, "avatars", "manifest.json"));
await cp(path.join(embedDir, "avatars", "prithi.glb"), path.join(androidLocalAssetsDir, "avatars", "prithi.glb"));
await cp(path.join(embedDir, "avatars", "Camilia.glb"), path.join(androidLocalAssetsDir, "avatars", "Camilia.glb"));

// Background images
for (const bg of ["bg1.jpg", "bg2.jpg", "bg3.jpg", "bg4.jpg", "bg5.jpg"]) {
  await cp(path.join(embedDir, "backgrounds", bg), path.join(androidLocalAssetsDir, "backgrounds", bg));
}

console.log("[build-avatar-embed] Copied to android-local-assets/avatar-web/");
