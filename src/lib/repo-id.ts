import * as path from "path";
import { createGit } from "./git.js";

/**
 * Get source repository identifier.
 * Priority: explicit ID > git remote URL > folder name
 */
export async function getSourceRepoId(
  repoPath: string,
  explicitId?: string
): Promise<string> {
  if (explicitId) {
    return explicitId;
  }

  const resolvedPath = path.resolve(repoPath);

  // Try git remote origin URL
  try {
    const ops = createGit(resolvedPath);
    const remotes = await ops.git.getRemotes(true);
    const origin = remotes.find((r) => r.name === "origin");

    if (origin?.refs?.fetch) {
      const id = parseRepoIdFromUrl(origin.refs.fetch);
      if (id) return id;
    }
  } catch {
    // Fall through to folder name
  }

  // Fallback: folder name
  return path.basename(resolvedPath);
}

/**
 * Parse repo ID from git remote URL.
 * Examples:
 *   https://github.com/user/repo.git -> user-repo
 *   git@github.com:user/repo.git -> user-repo
 *   https://gitlab.com/group/subgroup/repo -> group-subgroup-repo
 */
export function parseRepoIdFromUrl(url: string): string | null {
  // Remove .git suffix
  const cleanUrl = url.replace(/\.git$/, "");

  // HTTPS format: https://github.com/user/repo
  const httpsMatch = cleanUrl.match(/https?:\/\/[^/]+\/(.+)/);
  if (httpsMatch) {
    return httpsMatch[1].replace(/\//g, "-");
  }

  // SSH format: git@github.com:user/repo
  const sshMatch = cleanUrl.match(/git@[^:]+:(.+)/);
  if (sshMatch) {
    return sshMatch[1].replace(/\//g, "-");
  }

  return null;
}
