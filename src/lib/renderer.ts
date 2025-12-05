import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import Mustache from "mustache";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function generateDiff(srcDir: string, dstDir: string): string {
  try {
    execSync(`diff -ruN "${srcDir}" "${dstDir}"`);
    return "";
  } catch (error: unknown) {
    const execError = error as { stdout?: Buffer };
    if (execError.stdout) {
      return execError.stdout.toString();
    }
    return "";
  }
}

export function renderHtml(diffString: string): string {
  // Try multiple template locations
  const templatePaths = [
    path.join(__dirname, "templates", "diff.mustache"), // dist/templates (bundled)
    path.join(__dirname, "..", "templates", "diff.mustache"),
    path.join(__dirname, "..", "..", "templates", "diff.mustache"),
    path.join(__dirname, "..", "..", "src", "templates", "diff.mustache"),
  ];

  let template: string | null = null;
  for (const templatePath of templatePaths) {
    if (fs.existsSync(templatePath)) {
      template = fs.readFileSync(templatePath, "utf8");
      break;
    }
  }

  if (!template) {
    throw new Error(
      `Template not found. Searched: ${templatePaths.join(", ")}`
    );
  }

  // JSON.stringify escapes backticks, quotes, newlines, etc.
  // Also escape </script> to prevent XSS and early script termination
  const escaped = JSON.stringify(diffString).replace(/<\/script>/gi, '<\\/script>');
  return Mustache.render(template, { diffString: escaped });
}

export function generateDiffHtml(srcDir: string, dstDir: string): string {
  const diffString = generateDiff(srcDir, dstDir);
  return renderHtml(diffString);
}
