import * as fs from "fs";
import * as path from "path";

export interface ReifierConfig {
  buildCommand?: string;
  pattern?: string;
  artifactsBranch?: string;
}

const CONFIG_FILES = [".reifierrc", ".reifierrc.json", "reifier.config.js"];

export function loadConfig(dir: string): ReifierConfig {
  const resolvedDir = path.resolve(dir);

  for (const filename of CONFIG_FILES) {
    const configPath = path.join(resolvedDir, filename);

    if (fs.existsSync(configPath)) {
      try {
        if (filename.endsWith(".js")) {
          // Dynamic import for JS config (not supported in current setup)
          // For now, only JSON configs are supported
          continue;
        }

        const content = fs.readFileSync(configPath, "utf8");
        const config = JSON.parse(content);
        console.log(`Loaded config from: ${configPath}`);
        return config;
      } catch (error) {
        console.warn(`Failed to load config from ${configPath}:`, error);
      }
    }
  }

  return {};
}

export function mergeConfig<T extends Record<string, unknown>>(
  cliOptions: T,
  fileConfig: ReifierConfig
): T {
  // CLI options take precedence over file config
  const merged = { ...fileConfig } as T;

  for (const [key, value] of Object.entries(cliOptions)) {
    if (value !== undefined) {
      (merged as Record<string, unknown>)[key] = value;
    }
  }

  return merged;
}
