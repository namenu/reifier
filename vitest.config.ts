import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    testTimeout: 60000,
    hookTimeout: 60000,
  },
});
