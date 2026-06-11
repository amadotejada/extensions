import assert from "node:assert/strict";
import test from "node:test";

import {
  composeSnapshots,
  computePace,
  defaultPreferences,
  fixtureFromSearch,
  parseFixture,
  providerCatalog,
  rowDisplay,
  selectPreview,
  statusBarPresentation,
  usageIsCritical,
  visibleRows,
} from "../src/usage/core.mjs";
import { parseCachedSnapshots, serializeSnapshots } from "../src/usage/cache.mjs";

test("happy path: fixture can be supplied through the popover URL search string for browser QA", () => {
  const raw = JSON.stringify({ providers: [{ id: "codex", state: "available", rows: [{ label: "5h", percent: 50 }] }] });

  assert.equal(fixtureFromSearch(`?fixture=${encodeURIComponent(raw)}`), raw);
  assert.equal(fixtureFromSearch("?fixture=%7B"), "{");
  assert.equal(fixtureFromSearch("?x=1"), "");
});

test("happy path: fixture snapshots compose into status bar text and available rows", () => {
  const fixture = parseFixture(JSON.stringify({
    providers: [
      {
        id: "codex",
        name: "Codex",
        icon: "codex",
        state: "available",
        fetchedAt: "2026-06-04T08:00:00.000Z",
        rows: [
          { label: "5h", percent: 42.4, resetAt: "2026-06-04T13:00:00.000Z", detail: "42.4/100", periodDuration: 18000 },
        ],
      },
      {
        id: "claude_code",
        name: "Claude Code",
        icon: "claude",
        state: "available",
        fetchedAt: "2026-06-04T08:00:00.000Z",
        rows: [
          { label: "Session", percent: 71.6, detail: "71.6% used" },
        ],
      },
    ],
  }));

  const snapshots = composeSnapshots({
    catalog: providerCatalog,
    fetchedSnapshots: fixture,
    preferences: defaultPreferences(),
  });

  const preview = selectPreview(snapshots, "");
  const status = statusBarPresentation(preview, "used");

  assert.equal(snapshots.length, providerCatalog.length);
  assert.equal(snapshots[0].id, "amp");
  assert.equal(preview.snapshot.id, "claude");
  assert.equal(status.text, "72%");
  assert.deepEqual(status.icon, { svg: "assets/claude.svg" });
});

test("regression: status bar hides text when no usage data exists", () => {
  assert.equal(statusBarPresentation(null, "used").text, null);
  assert.equal(statusBarPresentation({ snapshot: { icon: "codex", rows: [] }, row: null }, "used").text, null);
  assert.deepEqual(statusBarPresentation({ snapshot: { icon: "codex", rows: [] }, row: null }, "used").icon, { symbol: "sparkles" });
});

test("regression: cached snapshots hydrate dates for instant reload display", () => {
  const fetchedAt = new Date("2026-06-04T08:00:00.000Z");
  const resetAt = new Date("2026-06-04T13:00:00.000Z");
  const raw = serializeSnapshots([{
    id: "codex",
    name: "Codex",
    icon: "codex",
    fetchedAt,
    state: { kind: "available" },
    rows: [{ id: "5h", label: "5h", percent: 42, resetAt, detail: "42% used", periodDuration: 18000 }]
  }], fetchedAt);

  const cached = parseCachedSnapshots(raw);

  assert.equal(cached[0].fetchedAt.getTime(), fetchedAt.getTime());
  assert.equal(cached[0].rows[0].resetAt.getTime(), resetAt.getTime());
  assert.deepEqual(statusBarPresentation(selectPreview(cached, ""), "used"), { icon: { svg: "assets/codex.svg" }, text: "42%" });
});

test("edge case: malformed fixture and invalid rows degrade to no usage data", () => {
  assert.deepEqual(parseFixture("{"), []);

  const fixture = parseFixture(JSON.stringify({
    providers: [
      {
        id: "codex",
        state: "available",
        rows: [
          { label: "  ", percent: 200, detail: "" },
          { label: "Monthly", percent: -20, detail: "120/100 left" },
        ],
      },
    ],
  }));

  const snapshots = composeSnapshots({
    catalog: providerCatalog,
    fetchedSnapshots: fixture,
    preferences: { ...defaultPreferences(), trackedProviderIDs: new Set(["codex"]) },
  });

  assert.equal(snapshots.length, 1);
  assert.equal(snapshots[0].id, "codex");
  assert.equal(snapshots[0].state.kind, "unavailable");
  assert.equal(snapshots[0].state.message, "No usage data");
});

test("security: fixture provider icons are constrained to catalog assets", () => {
  const fixture = parseFixture(JSON.stringify({
    providers: [
      {
        id: "codex",
        icon: "../popover/index",
        state: "available",
        rows: [{ label: "5h", percent: 42 }],
      },
    ],
  }));

  const snapshots = composeSnapshots({
    catalog: providerCatalog,
    fetchedSnapshots: fixture,
    preferences: { ...defaultPreferences(), trackedProviderIDs: new Set(["codex"]) },
  });

  const status = statusBarPresentation(selectPreview(snapshots, ""), "used");

  assert.deepEqual(status.icon, { svg: "assets/codex.svg" });
});

test("regression: secondary limits, remaining display, pinning, and pace status match the native app behavior", () => {
  const resetAt = new Date("2026-06-04T13:00:00.000Z");
  const now = new Date("2026-06-04T12:00:00.000Z");
  const rows = [
    { id: "session", label: "Session", percent: 64, resetAt, detail: "64/100", periodDuration: 18000 },
    { id: "monthly", label: "Monthly", percent: 75, resetAt: null, detail: "75% used", periodDuration: null },
  ];

  assert.deepEqual(visibleRows(rows, false).map((row) => row.label), ["Session"]);
  assert.deepEqual(visibleRows(rows, true).map((row) => row.label), ["Session", "Monthly"]);
  assert.equal(rowDisplay(rows[0], "remaining").percentText, "36%");
  assert.equal(rowDisplay(rows[1], "remaining").detail, "25.0% left");

  const pace = computePace({ usedPercent: 64, resetAt, periodDuration: 18000, now });
  assert.equal(pace.status, "ahead");
  assert.equal(pace.detail, "80% used at reset");

  const snapshots = [
    { id: "codex", name: "Codex", icon: "codex", fetchedAt: now, state: { kind: "available" }, rows },
  ];
  const preview = selectPreview(snapshots, "codex::Monthly");
  assert.equal(preview.row.label, "Monthly");
  assert.deepEqual(statusBarPresentation(preview, "remaining"), { icon: { svg: "assets/codex.svg" }, text: "25%" });
});

test("regression: critical usage color follows the selected display mode", () => {
  const nearlyFull = { label: "Session", percent: 90, resetAt: null, detail: "90% used", periodDuration: null };
  const mostlyFree = { label: "Session", percent: 10, resetAt: null, detail: "10% used", periodDuration: null };

  assert.equal(usageIsCritical(nearlyFull, "used"), true);
  assert.equal(usageIsCritical(mostlyFree, "used"), false);
  assert.equal(usageIsCritical(nearlyFull, "remaining"), true);
  assert.equal(usageIsCritical(mostlyFree, "remaining"), false);
});

test("regression: only tracked providers are composed for the popover", () => {
  const fixture = parseFixture(JSON.stringify({
    providers: [
      { id: "claude_code", name: "Claude Code", state: "available", rows: [{ label: "5h", percent: 50, detail: "50% used" }] },
      { id: "codex", name: "Codex", state: "available", rows: [{ label: "5h", percent: 30, detail: "30% used" }] },
    ],
  }));

  const onlyCodex = composeSnapshots({
    catalog: providerCatalog,
    fetchedSnapshots: fixture,
    preferences: { ...defaultPreferences(), trackedProviderIDs: new Set(["codex"]) },
  });
  assert.deepEqual(onlyCodex.map((snapshot) => snapshot.id), ["codex"]);

  const none = composeSnapshots({
    catalog: providerCatalog,
    fetchedSnapshots: fixture,
    preferences: { ...defaultPreferences(), trackedProviderIDs: new Set() },
  });
  assert.equal(none.length, 0);
});

test("regression: Cursor is listed in the catalog but ships without a live fetcher", () => {
  const cursor = providerCatalog.find((provider) => provider.id === "cursor");
  assert.ok(cursor, "cursor should be present in the catalog");

  // With no fetched snapshot, Cursor composes to an unavailable "No usage data" placeholder.
  const snapshots = composeSnapshots({
    catalog: providerCatalog,
    fetchedSnapshots: [],
    preferences: { ...defaultPreferences(), trackedProviderIDs: new Set(["cursor"]) },
  });
  assert.equal(snapshots.length, 1);
  assert.equal(snapshots[0].id, "cursor");
  assert.equal(snapshots[0].state.kind, "unavailable");
  assert.equal(snapshots[0].state.message, "No usage data");
});
