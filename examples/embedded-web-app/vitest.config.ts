import { defineConfig } from "vitest/config";

// Logic-only tests (server handlers + frontend API client) run in a Node env with the SDK and fetch
// mocked. We deliberately don't load the React/Tailwind Vite plugins here — nothing under test needs
// them, and keeping them out makes the tests fast and hermetic.
export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", "dist/**"],
  },
});
