# Clock

A clock for the Muxy status bar. Adds a clock icon to the right side of the
footer status bar; click it to open a small popover showing a live, ticking
clock and the current date. Click outside to dismiss.

![Clock popover open over the Muxy status bar](public/assets/screenshot-1.png)

## Permissions

- **`panels:write`** — lets the popover size itself to its content
  (`muxy.popover.resize`). No network, no shell, no workspace access.

## How it works

- A `statusBarItem` (right side, clock icon) runs the `open-clock` command.
- That command's `openPopover` action opens the `clock` popover.
- `popovers/clock.html` renders the time in the local timezone, updating once a
  second on the wall-clock boundary. It uses the injected `--muxy-*` theme
  variables (with light/dark fallbacks) and a transparent background so the
  native popover material shows through.

## Building

This extension is an npm + Vite project; `package.json` (with a top-level
`name`/`version` and a `muxy` block) replaces the old `manifest.json`.

```sh
npm install
npm run build   # or `npm run dev`
```

`npm run build` emits the installable extension into `dist/` (the popover at
`dist/popovers/clock.html` and the listing assets, copied from `public/`, at
`dist/assets/`). All paths in the `muxy` block are resolved relative to `dist/`.

## License

MIT
