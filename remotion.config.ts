import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setConcurrency(2);
// Enable hardware WebGL via ANGLE for shader-based scenes (Three.js).
// Without this, headless Chromium falls back to swiftshader and shaders
// run extremely slowly.
Config.setChromiumOpenGlRenderer("angle");
