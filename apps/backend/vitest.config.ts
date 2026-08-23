import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.{test,spec}.ts"],
    exclude: ["dist/**"],
    environment: "edge-runtime",
    server: { deps: { inline: ["convex-test"] } },
  },
});
