import { defineConfig } from "vitest/config";

// The converter is pure. It takes a string and returns a structure, and it
// touches no browser API. That is the whole reason this configuration needs no
// browser: the tests run in Node.
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
