// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");
const { dirname } = require("path");

const config = getDefaultConfig(dirname);
config.resolver.sourceExts.push("cjs");

module.exports = config;
