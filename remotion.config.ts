import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setChromiumOpenGlRenderer("swangle");
Config.setConcurrency(1);
Config.setBrowserExecutable("/usr/bin/google-chrome");
