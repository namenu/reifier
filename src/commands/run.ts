import { capture, CaptureOptions } from "./capture.js";
import { diff, DiffOptions } from "./diff.js";
import { createGit, switchBranch, getCurrentBranch, switchToOrphan } from "../lib/git.js";
import * as path from "path";

const DEFAULT_ORPHAN_BRANCH = "reified";

export interface RunOptions {
  repo: string;
  base: string;
  head: string;
  buildCommand: string;
  pattern: string;
  output?: string;
  clean?: boolean;
  noPush?: boolean;
}

export async function run(options: RunOptions): Promise<string> {
  const { repo, base, head, buildCommand, pattern, output, clean, noPush } = options;

  const repoPath = path.resolve(repo);
  const ops = createGit(repoPath);

  // Save current branch to restore later
  const originalBranch = await getCurrentBranch(ops);

  try {
    // Capture base branch
    console.log(`\n=== Capturing base branch: ${base} ===\n`);
    await capture({
      repo,
      branch: base,
      buildCommand,
      pattern,
      clean,
      noPush,
    });

    // Capture head branch
    console.log(`\n=== Capturing head branch: ${head} ===\n`);
    await capture({
      repo,
      branch: head,
      buildCommand,
      pattern,
      clean,
      noPush,
    });

    // Switch to orphan branch to access artifacts
    console.log(`\n=== Generating diff ===\n`);
    await switchToOrphan(ops, DEFAULT_ORPHAN_BRANCH);

    const html = await diff({
      repo,
      base,
      head,
      output,
    });

    return html;
  } finally {
    // Restore original branch
    console.log(`\nRestoring branch: ${originalBranch}`);
    try {
      await switchBranch(ops, originalBranch);
    } catch {
      console.warn(`Could not restore to branch: ${originalBranch}`);
    }
  }
}
