# AI Usage

A status bar item and popover that show live quota/usage for common AI coding
providers, rebuilt as a native-feeling Muxy extension (plain JavaScript +
[Tailwind CSS](https://tailwindcss.com) + Vite). The status bar item shows the
pinned (or busiest) provider's icon and percentage; clicking it (or pressing
`cmd+shift+l`) opens a popover with a per-provider breakdown — progress bars, pace
indicators, reset times, and a pin button to choose what the status bar previews.
The popover header's settings button opens a checklist to choose which providers
appear; hidden providers aren't fetched.

```bash
npm install
npm run build
```

After rebuilding, click **Reload** in the Muxy Extensions modal to pick up
changes (`npm run dev` runs Vite's dev server for fast iteration).

## Providers

Live collectors ship for **Claude Code, Codex, Amp, Copilot, Factory, Kimi,
MiniMax, and Z.ai**. **Cursor** is listed but shows `No usage data` — it has no
usage fetcher yet. The extension reads whatever local credentials each provider's
CLI already wrote to disk; nothing is collected for providers you aren't signed
in to.

## Permissions

- `commands:exec` — reads local provider credentials (config files, the macOS
  keychain) and sends read-only usage requests through `/usr/bin/curl --config -`.
  Every command uses an absolute binary path and no shell.
- `panels:write` — updates the `ai-usage` status bar item (icon + percentage) and
  resizes the popover to fit its content.

## Network access

Refreshes call each provider's usage/quota endpoint (Anthropic, ChatGPT/Codex,
GitHub Copilot, Factory, Kimi, MiniMax, Z.ai, Amp). Requests carry only the
credential already present on the machine plus the provider-required request body.
The latest snapshot is cached in `localStorage` so the popover renders instantly
on open while a fresh refresh runs (every 60s while open).

## Fixture (QA without credentials)

Open the popover with `?fixture=<encoded JSON>`, or set the `localStorage` key
`ai-usage.fixture` to JSON with a `providers` array. Each provider accepts
`id`, `name`, `state`, `fetchedAt`, and `rows` (each row: `label`, `percent`,
`resetAt`, `detail`, `periodDuration`).

## Layout

- `popover/index.html` — popover entry, builds to `dist/`.
- `src/main.js` — mounts the popover onto `#root`.
- `src/usage/popover-app.js` — the popover UI, rendered with the `h()` DOM helper
  and Tailwind classes mapped to the Muxy theme.
- `src/usage/*.mjs` — the framework-free logic layer: live collectors
  (credential discovery + curl through `muxy.exec`), per-provider parsers, the
  pace calculator, used/remaining formatting, the snapshot cache, and fixtures.
- `src/lib/` — tiny `dom` and `icon` helpers.
- `src/styles/global.css` — Tailwind, with `--color-*` mapped to the app's
  `--muxy-*` theme tokens so utilities like `bg-primary` and
  `text-muted-foreground` follow the active theme.
- `public/assets/` — monochrome provider icons (`fill="currentColor"`).

## Tests

```bash
npm test
```

Covers the collectors (per-provider credential reads + parsing), snapshot
composition / status-bar selection, and the extension's security/theming
invariants.

See the [extension docs](https://github.com/muxy-app/muxy/tree/main/docs/extensions).
