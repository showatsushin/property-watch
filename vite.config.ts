import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/property-watch/",
  plugins: [react()],
  // OneDrive配下でも既存の生成物ロックに影響されず再buildできるようにする。
  build: { emptyOutDir: false },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: true,
  },
});
