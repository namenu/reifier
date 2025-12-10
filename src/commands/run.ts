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
  include: string[];
  output?: string;
  clean?: boolean;
  noPush?: boolean;
  artifactRepo?: string;
  repoId?: string;
}

export async function run(options: RunOptions): Promise<string> {
  const {
    repo,
    base,
    head,
    buildCommand,
    include,
    output,
    clean,
    noPush,
    artifactRepo,
    repoId,
  } = options;

  const sourceRepoPath = path.resolve(repo);
  const sourceOps = createGit(sourceRepoPath);

  // Save current branch to restore later
  const originalBranch = await getCurrentBranch(sourceOps);

  try {
    // Capture base branch
    console.log(`\n=== Capturing base branch: ${base} ===\n`);
    await capture({
      repo,
      branch: base,
      buildCommand,
      include,
      clean,
      noPush,
      artifactRepo,
      repoId,
    });

    // Capture head branch
    console.log(`\n=== Capturing head branch: ${head} ===\n`);
    await capture({
      repo,
      branch: head,
      buildCommand,
      include,
      clean,
      noPush,
      artifactRepo,
      repoId,
    });

    // Switch to orphan branch to access artifacts
    console.log(`\n=== Generating diff ===\n`);
    if (artifactRepo) {
      const artifactOps = createGit(path.resolve(artifactRepo));
      await switchToOrphan(artifactOps, DEFAULT_ORPHAN_BRANCH);
    } else {
      await switchToOrphan(sourceOps, DEFAULT_ORPHAN_BRANCH);
    }

    const html = await diff({
      repo,
      base,
      head,
      output,
      artifactRepo,
      repoId,
    });

    return html;
  } finally {
    // Restore original branch
    console.log(`\nRestoring branch: ${originalBranch}`);
    try {
      await switchBranch(sourceOps, originalBranch);
    } catch {
      console.warn(`Could not restore to branch: ${originalBranch}`);
    }
  }
}
