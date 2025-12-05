import * as path from "path";
import * as fs from "fs";
import { generateDiffHtml } from "../lib/renderer.js";

export interface DiffOptions {
  repo: string;
  base: string;
  head: string;
  output?: string;
}

const ARTIFACTS_DIR = "_artifacts";

export async function diff(options: DiffOptions): Promise<string> {
  const { repo, base, head, output } = options;

  const repoPath = path.resolve(repo);
  const artifactsDir = path.join(repoPath, ARTIFACTS_DIR);
  const baseDir = path.join(artifactsDir, base);
  const headDir = path.join(artifactsDir, head);

  // Validate directories exist
  if (!fs.existsSync(baseDir)) {
    throw new Error(`Base artifacts not found: ${baseDir}`);
  }
  if (!fs.existsSync(headDir)) {
    throw new Error(`Head artifacts not found: ${headDir}`);
  }

  console.log(`Generating diff: ${base} -> ${head}`);
  const html = generateDiffHtml(base, head, artifactsDir);

  if (output) {
    fs.writeFileSync(output, html);
    console.log(`Diff written to: ${output}`);
  } else {
    console.log(html);
  }

  return html;
}
