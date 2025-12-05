#!/usr/bin/env node

import { Command } from "commander";
import { capture } from "./commands/capture.js";
import { diff } from "./commands/diff.js";
import { run } from "./commands/run.js";
import { deploy } from "./commands/deploy.js";
import { loadConfig } from "./lib/config.js";

const DEFAULT_BUILD_COMMAND = "yarn && yarn build";
const DEFAULT_PATTERN = ".*\\.bs\\.js";

const program = new Command();

program
  .name("reifier")
  .description("Git branch build artifact diff tool")
  .version("0.2.0");

program
  .command("capture")
  .description("Capture build artifacts from a branch")
  .argument("<repo>", "Repository path")
  .argument("<branch>", "Branch name to capture")
  .option("-b, --build <command>", "Build command")
  .option("-p, --pattern <regex>", "File pattern to capture")
  .option("--clean", "Clean previous build artifacts before building")
  .option("--no-push", "Skip git push")
  .action(async (repo, branch, options) => {
    try {
      const config = loadConfig(repo);
      await capture({
        repo,
        branch,
        buildCommand: options.build ?? config.buildCommand ?? DEFAULT_BUILD_COMMAND,
        pattern: options.pattern ?? config.pattern ?? DEFAULT_PATTERN,
        clean: options.clean,
        noPush: !options.push,
      });
    } catch (error) {
      console.error("Capture failed:", error);
      process.exit(1);
    }
  });

program
  .command("diff")
  .description("Generate diff HTML between two branches")
  .argument("<repo>", "Repository path")
  .argument("<base>", "Base branch")
  .argument("<head>", "Head branch")
  .option("-o, --output <file>", "Output file (default: stdout)")
  .action(async (repo, base, head, options) => {
    try {
      await diff({
        repo,
        base,
        head,
        output: options.output,
      });
    } catch (error) {
      console.error("Diff failed:", error);
      process.exit(1);
    }
  });

program
  .command("run")
  .description("Run full pipeline: capture both branches and generate diff")
  .argument("<repo>", "Repository path")
  .requiredOption("--base <branch>", "Base branch")
  .requiredOption("--head <branch>", "Head branch")
  .option("-b, --build <command>", "Build command")
  .option("-p, --pattern <regex>", "File pattern to capture")
  .option("-o, --output <file>", "Output file (default: stdout)")
  .option("--clean", "Clean previous build artifacts before building")
  .option("--no-push", "Skip git push")
  .action(async (repo, options) => {
    try {
      const config = loadConfig(repo);
      await run({
        repo,
        base: options.base,
        head: options.head,
        buildCommand: options.build ?? config.buildCommand ?? DEFAULT_BUILD_COMMAND,
        pattern: options.pattern ?? config.pattern ?? DEFAULT_PATTERN,
        output: options.output,
        clean: options.clean,
        noPush: !options.push,
      });
    } catch (error) {
      console.error("Run failed:", error);
      process.exit(1);
    }
  });

program
  .command("deploy")
  .description("Deploy diff HTML to surge.sh")
  .argument("<html-file>", "HTML file to deploy")
  .option("-d, --domain <domain>", "Custom surge.sh domain (e.g., my-diff.surge.sh)")
  .action(async (htmlFile, options) => {
    try {
      await deploy({
        htmlFile,
        domain: options.domain,
      });
    } catch (error) {
      console.error("Deploy failed:", error);
      process.exit(1);
    }
  });

program.parse();
