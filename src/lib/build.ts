import { execSync } from "child_process";

export interface BuildOptions {
  cwd: string;
  command: string;
}

export function runBuild(options: BuildOptions): void {
  const { cwd, command } = options;

  console.log(`Running build: ${command}`);

  execSync(command, {
    cwd,
    stdio: "inherit",
    shell: "/bin/sh",
  });
}
