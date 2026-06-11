import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const usageDir = new URL("../src/usage/", import.meta.url);

async function readUsageSources() {
  const entries = await readdir(usageDir);
  const sources = await Promise.all(
    entries
      .filter((name) => name.endsWith(".mjs"))
      .map(async (name) => readFile(new URL(name, usageDir), "utf8")),
  );
  return sources;
}

test("security: collector exec commands use absolute binaries and never a shell", async () => {
  const sources = [
    ...(await readUsageSources()),
    await readFile(new URL("../src/usage/popover-app.js", import.meta.url), "utf8").catch(() => ""),
  ];

  for (const content of sources) {
    assert.doesNotMatch(content, /printenv/);
    assert.doesNotMatch(content, /\/bin\/sh/);
    assert.doesNotMatch(content, /"-c"/);
    // No exec with a relative (non-absolute) binary path.
    assert.doesNotMatch(content, /exec\(\["[^/]/);
  }
});

test("regression: manifest declares least-privilege permissions and the popover wiring", async () => {
  const manifest = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

  assert.deepEqual(manifest.muxy.permissions, ["commands:exec", "panels:write"]);
  assert.equal(manifest.muxy.background, undefined, "no background script");
  assert.equal(manifest.muxy.popovers[0].id, "usage");
  assert.equal(manifest.muxy.popovers[0].entry, "popover/index.html");
  assert.equal(manifest.muxy.commands[0].action.kind, "openPopover");
  assert.equal(manifest.muxy.commands[0].action.popover, "usage");
  assert.equal(manifest.muxy.statusBarItems[0].id, "ai-usage");
  assert.equal(manifest.muxy.statusBarItems[0].command, "open-usage");
});

test("regression: popover resizes to the configured width and updates the status bar", async () => {
  const source = await readFile(new URL("../src/usage/popover-app.js", import.meta.url), "utf8");

  // Default width is the compact 280px option; the popover resizes to the chosen
  // width and a measured content height (no fixed/min height).
  assert.match(source, /id: "default", label: "M", width: 280/);
  assert.match(source, /const width = widthOption\(\)\.width/);
  assert.match(source, /getBoundingClientRect\(\)\.height/);
  assert.match(source, /resize\(width, height\)/);
  assert.match(source, /muxy\?\.popover\?\.resize/);
  assert.match(source, /muxy\?\.statusbar\?\.set/);
  // No display-mode / refresh-interval controls carried over from the old popover.
  assert.doesNotMatch(source, /displayMode.*select/i);
  assert.doesNotMatch(source, /autoRefresh.*select/i);
});

test("regression: popover body stays transparent over native popover material", async () => {
  const css = await readFile(new URL("../src/styles/global.css", import.meta.url), "utf8");
  assert.match(css, /body\s*\{[^}]*background:\s*transparent/s);
  assert.doesNotMatch(css, /body\s*\{[^}]*background:\s*var\(--muxy-background\)/s);
});

test("regression: html/body do not pin a height so the popover fits its content", async () => {
  const css = await readFile(new URL("../src/styles/global.css", import.meta.url), "utf8");
  // A min-height: 100vh would stop the host from shrinking to content.
  assert.doesNotMatch(css, /min-height:\s*100vh/);
  assert.doesNotMatch(css, /height:\s*100vh/);
});

test("regression: chrome uses theme variables, never hardcoded colors", async () => {
  const css = await readFile(new URL("../src/styles/global.css", import.meta.url), "utf8");
  // The theme map references muxy vars; no raw hex fallbacks on muxy vars.
  assert.match(css, /--color-foreground:\s*var\(--muxy-foreground\)/);
  assert.match(css, /--color-muted-foreground:\s*var\(--muxy-foreground-muted\)/);
  assert.doesNotMatch(css, /var\(--muxy-[^)]+,\s*#[0-9a-fA-F]{3,8}/);
});
