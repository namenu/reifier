#!/usr/bin/env node

import { Command } from "commander";
import { capture } from "./commands/capture.js";
import { diff } from "./commands/diff.js";
import { run } from "./commands/run.js";
import { deploy } from "./commands/deploy.js";
import { loadConfig } from "./lib/config.js";

const DEFAULT_BUILD_COMMAND = "yarn && yarn build";

const program = new Command();

program
  .name("babbage")
  .description("Git branch build artifact diff tool")
  .version("0.2.0");

function collect(value: string, previous: string[]): string[] {
  return previous.concat([value]);
}

program
  .command("capture")
  .description("Capture build artifacts from a branch")
  .argument("<repo>", "Repository path")
  .argument("<branch>", "Branch name to capture")
  .option("-b, --build <command>", "Build command")
  .option("-i, --include <pattern>", "Glob pattern to include (can be specified multiple times)", collect, [])
  .option("--clean", "Clean previous build artifacts before building")
  .option("--no-push", "Skip git push")
  .option("-a, --artifact-repo <path>", "Separate artifact repository path")
  .option("--repo-id <id>", "Source repository identifier (auto-detected from git remote)")
  .action(async (repo, branch, options) => {
    try {
      const config = loadConfig(repo);
      const include = options.include.length > 0 ? options.include : config.include;
      if (!include || include.length === 0) {
        console.error("Error: --include option or config.include is required");
        process.exit(1);
      }
      await capture({
        repo,
        branch,
        buildCommand: options.build ?? config.buildCommand ?? DEFAULT_BUILD_COMMAND,
        include,
        clean: options.clean,
        noPush: !options.push,
        artifactRepo: options.artifactRepo ?? config.artifactRepo,
        repoId: options.repoId ?? config.repoId,
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
  .option("-a, --artifact-repo <path>", "Artifact repository path (if separate from source)")
  .option("--repo-id <id>", "Source repository identifier")
  .action(async (repo, base, head, options) => {
    try {
      const config = loadConfig(repo);
      await diff({
        repo,
        base,
        head,
        output: options.output,
        artifactRepo: options.artifactRepo ?? config.artifactRepo,
        repoId: options.repoId ?? config.repoId,
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
  .option("-i, --include <pattern>", "Glob pattern to include (can be specified multiple times)", collect, [])
  .option("-o, --output <file>", "Output file (default: stdout)")
  .option("--clean", "Clean previous build artifacts before building")
  .option("--no-push", "Skip git push")
  .option("-a, --artifact-repo <path>", "Separate artifact repository path")
  .option("--repo-id <id>", "Source repository identifier (auto-detected from git remote)")
  .action(async (repo, options) => {
    try {
      const config = loadConfig(repo);
      const include = options.include.length > 0 ? options.include : config.include;
      if (!include || include.length === 0) {
        console.error("Error: --include option or config.include is required");
        process.exit(1);
      }
      await run({
        repo,
        base: options.base,
        head: options.head,
        buildCommand: options.build ?? config.buildCommand ?? DEFAULT_BUILD_COMMAND,
        include,
        output: options.output,
        clean: options.clean,
        noPush: !options.push,
        artifactRepo: options.artifactRepo ?? config.artifactRepo,
        repoId: options.repoId ?? config.repoId,
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
