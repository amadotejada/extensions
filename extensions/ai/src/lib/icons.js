import { cls } from "@/lib/dom";

const ICONS = {
  sparkles:
    '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/>',
  // Lucide "pin" — rendered upright; the popover rotates it 45° to match the native glyph.
  pin: '<path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>',
  // Lucide "sliders-horizontal" — the settings affordance for choosing visible providers.
  sliders:
    '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
};

export function icon(name, size = 14, className = "", { strokeWidth = 2, fill = false } = {}) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("fill", fill ? "currentColor" : "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", String(strokeWidth));
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.className.baseVal = cls("shrink-0", className);
  svg.innerHTML = ICONS[name];
  return svg;
}

// Raw SVG markup for every provider glyph, bundled at build time. The source
// SVGs use fill="currentColor", so inlining them keeps the glyphs monochrome
// and theme-correct (they inherit the parent element's text color).
const providerSvgs = Object.fromEntries(
  Object.entries(import.meta.glob("../../public/assets/*.svg", { eager: true, query: "?raw", import: "default" })).map(
    ([path, raw]) => [path.split("/").pop().replace(/\.svg$/, ""), raw],
  ),
);

const VIEWBOX_PATTERN = /viewBox="([^"]+)"/i;
const INNER_PATTERN = /<svg[^>]*>([\s\S]*?)<\/svg>/i;

// A provider glyph rendered by inlining its own SVG paths (not a CSS mask).
export function providerIcon(iconName, size = 14, className = "") {
  const raw = providerSvgs[iconName] || "";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", raw.match(VIEWBOX_PATTERN)?.[1] || "0 0 64 64");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("aria-hidden", "true");
  svg.className.baseVal = cls("shrink-0", className);
  svg.innerHTML = raw.match(INNER_PATTERN)?.[1] || "";
  return svg;
}
