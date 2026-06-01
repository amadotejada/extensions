import { defineConfig } from "vite";

// Build the extension into dist/. The installed extension directory IS this
// dist output, so every path referenced by the muxy block in package.json must
// resolve inside dist/ at the same relative path. The popover HTML is the build
// input and is emitted to dist/popovers/clock.html; the public/ dir (icon and
// screenshots) is copied verbatim into dist/assets/.
export default defineConfig({
  // Use relative asset URLs so the built HTML resolves its CSS/JS from within
  // the installed extension dir rather than from the server root.
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    minify: false,
    rollupOptions: {
      input: { clock: "popovers/clock.html" },
    },
  },
});
