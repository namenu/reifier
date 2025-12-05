import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import {
  createGit,
  switchBranch,
  switchToOrphan,
  clearIndex,
  pushBranch,
  GitOps,
} from "../lib/git.js";
import { runBuild } from "../lib/build.js";

export interface CaptureOptions {
  repo: string;
  branch: string;
  buildCommand: string;
  pattern: string;
  orphanBranch?: string;
  noPush?: boolean;
}

const DEFAULT_ORPHAN_BRANCH = "reified";
const ARTIFACTS_DIR = "_artifacts";

export async function capture(options: CaptureOptions): Promise<string> {
  const {
    repo,
    branch,
    buildCommand,
    pattern,
    orphanBranch = DEFAULT_ORPHAN_BRANCH,
    noPush = false,
  } = options;

  const repoPath = path.resolve(repo);
  const ops = createGit(repoPath);

  console.log(`Switching to ${branch}`);
  await switchBranch(ops, branch);

  console.log("Running build...");
  runBuild({ cwd: repoPath, command: buildCommand });

  // Collect files BEFORE switching to orphan branch
  // (orphan branch switch may clear tracked files from working directory)
  console.log(`Collecting artifacts matching: ${pattern}`);
  const collectedFiles = collectArtifacts(repoPath, pattern);

  if (collectedFiles.length === 0) {
    console.log("No files matched the pattern");
  } else {
    console.log(`Found ${collectedFiles.length} files to capture`);
  }

  console.log(`Switching to orphan branch: ${orphanBranch}`);
  await switchToOrphan(ops, orphanBranch);

  // Clear git index
  await clearIndex(ops);

  const dstDir = path.join(repoPath, ARTIFACTS_DIR, branch);

  // Clear and create destination directory
  fs.rmSync(dstDir, { recursive: true, force: true });
  fs.mkdirSync(dstDir, { recursive: true });

  // Write collected files to destination
  for (const { relativePath, content } of collectedFiles) {
    const dstPath = path.join(dstDir, relativePath);
    fs.mkdirSync(path.dirname(dstPath), { recursive: true });
    fs.writeFileSync(dstPath, content);
  }

  if (collectedFiles.length > 0) {
    console.log(`Copied ${collectedFiles.length} files`);
  }

  // Commit
  console.log("Committing artifacts...");
  await commitArtifacts(ops, branch);

  // Push
  if (!noPush) {
    console.log("Pushing to remote...");
    await pushBranch(ops, orphanBranch);
  }

  console.log(`Capture complete: ${branch}`);
  return dstDir;
}

interface CollectedFile {
  relativePath: string;
  content: Buffer;
}

function collectArtifacts(srcRoot: string, pattern: string): CollectedFile[] {
  const findCmd = `find . -regex "${pattern}" ! -path "./${ARTIFACTS_DIR}/*" ! -path "./node_modules/*" ! -path "./.git/*"`;

  try {
    const output = execSync(findCmd, { cwd: srcRoot, encoding: "utf8" }).trim();
    if (!output) {
      return [];
    }

    const files = output.split("\n").filter(Boolean);
    const collected: CollectedFile[] = [];

    for (const file of files) {
      const srcPath = path.join(srcRoot, file);
      const relativePath = file.startsWith("./") ? file.slice(2) : file;

      // Read file content into memory before branch switch
      const content = fs.readFileSync(srcPath);
      collected.push({ relativePath, content });
    }

    return collected;
  } catch {
    return [];
  }
}

async function commitArtifacts(ops: GitOps, branch: string): Promise<void> {
  const artifactsPath = ARTIFACTS_DIR;

  await ops.git.add(["-f", artifactsPath]);

  try {
    await ops.git.commit(`Update ${branch}`);
  } catch (error: unknown) {
    const gitError = error as { message?: string };
    // Ignore "nothing to commit" error
    if (!gitError.message?.includes("nothing to commit")) {
      throw error;
    }
    console.log("No changes to commit");
  }
}
