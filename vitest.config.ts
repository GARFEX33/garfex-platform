import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "apps/**/*.{test,spec}.{ts,mts}",
      "packages/**/*.{test,spec}.{ts,mts}",
      "tooling/tests/**/*.{test,spec}.{ts,mts}",
    ],
    exclude: ["apps/**/dist/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
});
