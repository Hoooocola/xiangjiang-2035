import { defineConfig } from "vitest/config";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", override: false, quiet: true });

export default defineConfig({
  resolve: {
    alias: {
      "@": import.meta.dirname,
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 15_000,
    hookTimeout: 30_000,
  },
});
