import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: process.env.SMOKE_BASE_URL || "http://localhost:8080",
    trace: "off",
    viewport: { width: 1280, height: 900 },
  },
  projects: [{ name: "chromium", use: { channel: undefined, browserName: "chromium" } }],
});
