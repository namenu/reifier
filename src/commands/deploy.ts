import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export interface DeployOptions {
  htmlFile: string;
  domain?: string;
}

function generateRandomDomain(): string {
  const adjectives = ["swift", "bright", "calm", "bold", "cool", "fast", "keen", "neat"];
  const nouns = ["diff", "view", "code", "delta", "change", "compare", "merge", "patch"];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${adj}-${noun}-${num}.surge.sh`;
}

export async function deploy(options: DeployOptions): Promise<string> {
  const { htmlFile, domain = generateRandomDomain() } = options;

  const htmlPath = path.resolve(htmlFile);

  if (!fs.existsSync(htmlPath)) {
    throw new Error(`HTML file not found: ${htmlPath}`);
  }

  // Create temp directory with index.html
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "reifier-deploy-"));
  const indexPath = path.join(tempDir, "index.html");

  fs.copyFileSync(htmlPath, indexPath);

  console.log(`Deploying to ${domain}...`);

  try {
    execSync(`npx surge "${tempDir}" ${domain}`, {
      stdio: "inherit",
    });

    const url = `https://${domain}`;
    console.log(`\nDeployed successfully!`);
    console.log(`URL: ${url}`);

    return url;
  } finally {
    // Cleanup temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}
