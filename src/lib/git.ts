import { simpleGit, SimpleGit } from "simple-git";

export interface GitOps {
  git: SimpleGit;
  repoPath: string;
}

export function createGit(repoPath: string): GitOps {
  const git = simpleGit(repoPath);
  return { git, repoPath };
}

export async function switchBranch(ops: GitOps, branch: string): Promise<void> {
  await ops.git.checkout(branch);
}

export async function hasRemoteBranch(
  ops: GitOps,
  branch: string
): Promise<boolean> {
  try {
    const remotes = await ops.git.listRemote(["--heads", "origin", branch]);
    return remotes.trim().length > 0;
  } catch {
    return false;
  }
}

export async function switchToOrphan(
  ops: GitOps,
  orphanBranch: string
): Promise<void> {
  const hasRemote = await hasRemoteBranch(ops, orphanBranch);

  if (hasRemote) {
    await ops.git.checkout(["-f", orphanBranch]);
    await ops.git.pull();
  } else {
    try {
      await ops.git.raw(["switch", "-f", "--orphan", orphanBranch]);
    } catch {
      await ops.git.checkout(["-f", orphanBranch]);
    }
  }
}

export async function clearIndex(ops: GitOps): Promise<void> {
  try {
    await ops.git.raw(["rm", "-r", "--cached", "--ignore-unmatch", "."]);
  } catch {
    // Ignore errors when nothing to remove
  }
}

export async function addAndCommit(
  ops: GitOps,
  paths: string[],
  message: string
): Promise<void> {
  await ops.git.add(paths.map((p) => `--force`).concat(paths));
  await ops.git.commit(message);
}

export async function pushBranch(
  ops: GitOps,
  branch: string
): Promise<void> {
  await ops.git.push(["-u", "origin", branch]);
}

export async function getCurrentBranch(ops: GitOps): Promise<string> {
  const result = await ops.git.revparse(["--abbrev-ref", "HEAD"]);
  return result.trim();
}
