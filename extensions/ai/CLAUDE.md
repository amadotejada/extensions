# ai

AI Usage extension for Muxy — a status bar item plus a popover that shows
live quota/usage for common AI coding providers. This is an npm + Vite project.

## Layout

- `package.json` — npm manifest. Identity (`name`, `version`) is at the
  top level; all Muxy fields live under the `muxy` key (a `popovers` entry,
  the `open-usage` command, and the `ai-usage` status bar item). A `build`
  script (Vite) is required.
- `vite.config.js` — builds to `dist/`, the directory Muxy installs.
- `popover/index.html` — the popover entry, mounted by `src/main.js`.
- `src/usage/` — framework-free logic layer: the live collector stack
  (`live*.mjs`, credential discovery + curl-through-`muxy.exec`), per-provider
  parsers, the pace calculator, used/remaining formatting, the snapshot cache,
  and `fixture` support for testing without credentials.
- `src/usage/popover-app.js` — the native popover UI, rendered with the
  `h()` DOM helper and Tailwind classes mapped to the Muxy theme.
- `public/assets/` — monochrome provider icons (`fill="currentColor"`).

Add a `"background"` script (e.g. `background.js`) under the `muxy` key
only if the extension needs to receive pushed workspace events or run
shell commands in the background. Muxy runs it as a long-lived process
that subscribes to events with `muxy.events.subscribe` and runs commands
with `muxy.exec`. Command, topbar, status bar, tab, and runScript
extensions need no background script.

## Building & editing

Install deps with `npm install`, then `npm run build` to produce
`dist/`. After rebuilding, click "Reload" in the Muxy Extensions modal to
pick up the changes. (`npm run dev` runs Vite's dev server for fast
iteration.)

## Skill

Coding agents in this directory should consult the `muxy-extension`
skill in `.claude/skills/` or `.agents/skills/` before generating
manifest or runtime changes.