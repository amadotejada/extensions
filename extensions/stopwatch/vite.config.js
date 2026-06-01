import { defineConfig } from "vite";

// Build the extension into dist/. The installed extension dir IS this dist
// output, so every path referenced from package.json's "muxy" block must exist
// at the same relative location under dist/. The popover HTML is declared as a
// Rollup input so it is emitted at dist/popovers/stopwatch.html with its CSS/JS
// bundled and references rewritten. Listing assets live in public/ and are
// copied verbatim to dist/assets/.
export default defineConfig({
  // Use relative asset URLs so the built HTML resolves its CSS/JS from within
  // the installed extension dir rather than from the server root.
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    minify: false,
    rollupOptions: {
      input: {
        stopwatch: "popovers/stopwatch.html",
      },
    },
  },
});
