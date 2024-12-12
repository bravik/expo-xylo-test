// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('png');
config.resolver.assetExts.push('assetjs');
config.resolver.assetExts.push('mid');
module.exports = config;
