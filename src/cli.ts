#!/usr/bin/env node

import { Command } from "commander";
import { capture } from "./commands/capture.js";
import { diff } from "./commands/diff.js";
import { run } from "./commands/run.js";

const DEFAULT_BUILD_COMMAND = "yarn && yarn build";
const DEFAULT_PATTERN = ".*\\.bs\\.js";

const program = new Command();

program
  .name("reifier")
  .description("Git branch build artifact diff tool")
  .version("0.1.0");

program
  .command("capture")
  .description("Capture build artifacts from a branch")
  .argument("<repo>", "Repository path")
  .argument("<branch>", "Branch name to capture")
  .option("-b, --build <command>", "Build command", DEFAULT_BUILD_COMMAND)
  .option("-p, --pattern <regex>", "File pattern to capture", DEFAULT_PATTERN)
  .option("--no-push", "Skip git push")
  .action(async (repo, branch, options) => {
    try {
      await capture({
        repo,
        branch,
        buildCommand: options.build,
        pattern: options.pattern,
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
  .option("-b, --build <command>", "Build command", DEFAULT_BUILD_COMMAND)
  .option("-p, --pattern <regex>", "File pattern to capture", DEFAULT_PATTERN)
  .option("-o, --output <file>", "Output file (default: stdout)")
  .option("--no-push", "Skip git push")
  .action(async (repo, options) => {
    try {
      await run({
        repo,
        base: options.base,
        head: options.head,
        buildCommand: options.build,
        pattern: options.pattern,
        output: options.output,
        noPush: !options.push,
      });
    } catch (error) {
      console.error("Run failed:", error);
      process.exit(1);
    }
  });

program.parse();
