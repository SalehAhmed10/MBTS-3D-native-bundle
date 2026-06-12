const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push("glb");

// Exclude Filament spike GLBs (~32MB) — not used in production WebView path.
// filament-preview.tsx + native-avatar-speech.tsx are dead code; keep files for spike reference.
const existingBlockList = config.resolver.blockList ? [].concat(config.resolver.blockList) : [];
config.resolver.blockList = [...existingBlockList, /assets[/\\]models[/\\].*/];

module.exports = config;
