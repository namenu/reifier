import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { capture } from "../src/commands/capture.js";
import { diff } from "../src/commands/diff.js";

const TEST_TIMEOUT = 60000;

describe("Reifier E2E", () => {
  let testRepoPath: string;

  beforeAll(() => {
    // Create temp directory for test repo
    testRepoPath = fs.mkdtempSync(path.join(os.tmpdir(), "reifier-test-"));

    // Initialize git repo
    execSync("git init", { cwd: testRepoPath });
    execSync('git config user.email "test@test.com"', { cwd: testRepoPath });
    execSync('git config user.name "Test User"', { cwd: testRepoPath });

    // Create initial file structure (simulating a build output)
    const srcDir = path.join(testRepoPath, "src");
    fs.mkdirSync(srcDir, { recursive: true });

    // Create a "source" file that our fake build will compile
    fs.writeFileSync(
      path.join(srcDir, "app.ts"),
      'export const greeting = "Hello";'
    );

    // Create initial "build output"
    fs.writeFileSync(
      path.join(testRepoPath, "app.bs.js"),
      '// Generated\nvar greeting = "Hello";'
    );

    // Initial commit on main
    execSync("git add .", { cwd: testRepoPath });
    execSync('git commit -m "Initial commit"', { cwd: testRepoPath });

    // Create feature branch
    execSync("git checkout -b feature", { cwd: testRepoPath });

    // Make changes on feature branch
    fs.writeFileSync(
      path.join(srcDir, "app.ts"),
      'export const greeting = "Hello World";'
    );
    fs.writeFileSync(
      path.join(testRepoPath, "app.bs.js"),
      '// Generated\nvar greeting = "Hello World";\nvar newFeature = true;'
    );

    execSync("git add .", { cwd: testRepoPath });
    execSync('git commit -m "Add new feature"', { cwd: testRepoPath });

    // Go back to main
    execSync("git checkout main", { cwd: testRepoPath });

    console.log(`Test repo created at: ${testRepoPath}`);
  });

  afterAll(() => {
    // Cleanup
    if (testRepoPath && fs.existsSync(testRepoPath)) {
      fs.rmSync(testRepoPath, { recursive: true, force: true });
    }
  });

  it(
    "should capture artifacts from main branch",
    async () => {
      await capture({
        repo: testRepoPath,
        branch: "main",
        buildCommand: "echo 'Build skipped - using existing files'",
        pattern: ".*\\.bs\\.js",
        noPush: true,
      });

      // Check artifacts were captured
      const artifactsDir = path.join(testRepoPath, "_artifacts", "main");
      expect(fs.existsSync(artifactsDir)).toBe(true);

      const files = fs.readdirSync(artifactsDir);
      expect(files).toContain("app.bs.js");
    },
    TEST_TIMEOUT
  );

  it(
    "should capture artifacts from feature branch",
    async () => {
      await capture({
        repo: testRepoPath,
        branch: "feature",
        buildCommand: "echo 'Build skipped - using existing files'",
        pattern: ".*\\.bs\\.js",
        noPush: true,
      });

      // Check artifacts were captured
      const artifactsDir = path.join(testRepoPath, "_artifacts", "feature");
      expect(fs.existsSync(artifactsDir)).toBe(true);

      const featureContent = fs.readFileSync(
        path.join(artifactsDir, "app.bs.js"),
        "utf8"
      );
      expect(featureContent).toContain("Hello World");
      expect(featureContent).toContain("newFeature");
    },
    TEST_TIMEOUT
  );

  it(
    "should generate diff HTML showing changes",
    async () => {
      const outputFile = path.join(testRepoPath, "diff-output.html");

      await diff({
        repo: testRepoPath,
        base: "main",
        head: "feature",
        output: outputFile,
      });

      expect(fs.existsSync(outputFile)).toBe(true);

      const html = fs.readFileSync(outputFile, "utf8");

      // Check HTML structure
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("diff2html");

      // Check diff content is embedded
      expect(html).toContain("Hello");
      expect(html).toContain("Hello World");
    },
    TEST_TIMEOUT
  );

  it(
    "should show proper diff between branches",
    async () => {
      // Read the artifacts directly to verify diff content
      const mainContent = fs.readFileSync(
        path.join(testRepoPath, "_artifacts", "main", "app.bs.js"),
        "utf8"
      );
      const featureContent = fs.readFileSync(
        path.join(testRepoPath, "_artifacts", "feature", "app.bs.js"),
        "utf8"
      );

      expect(mainContent).toContain('"Hello"');
      expect(mainContent).not.toContain("newFeature");

      expect(featureContent).toContain('"Hello World"');
      expect(featureContent).toContain("newFeature");
    },
    TEST_TIMEOUT
  );
});
