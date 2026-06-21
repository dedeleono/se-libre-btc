import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["lib/**/*.test.ts"],
    environment: "node", // Node 18+ exposes Web Crypto globally, enough for mnemonicToSeed
  },
});
