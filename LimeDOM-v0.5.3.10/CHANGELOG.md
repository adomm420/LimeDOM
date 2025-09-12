<!--
🔗 https://LimeDOM.eu
🔗 https://github.com/adomm420/LimeDOM
-->
# 📜 Changelog

All notable changes to **LimeDOM.js** will be documented here. Visit https://LimeDOM.eu for a live DEMO.

---
## v0.5.3.10 — 2025-09-12 (Stable)
- Images: Album mode is now the default.
- Shows a single preview image.
  - Clicking opens the full overlay with ← / → navigation.
  - { grid: true } can be passed to force the classic thumbnail grid.
- Charts: Fully theme-aware.
  - Background, axis, and text colors now follow CSS variables (--chart-bg, --chart-axis, --chart-text).
  - Charts automatically blend into both light and dark themes.
- All files (LimeDOM.js, LimeDOM.css, demo.html) synced and confirmed stable.

## v0.5.3.9 — 2025-09-10 (Stable)
- Improved Light Scheme palette (softer backgrounds, better text contrast).
- Theme-aware charts (`drawBarChart`, `drawPieChart` use `--chart-*` CSS vars).
- Scheme toggle button fixed:
  - Uses `.btn-invert` with theme-appropriate base.
  - Hover states: Dark = accent pill, Light = soft lime tint.
- Navbar hover + theme switch visuals tuned.
- Marked v0.5.3.9 as new stable base.

## v0.5.3.8 — 2025-09-09 (Stable)
- Introduced **navbar function** (`LimeDOM.nav.begin`) with title, left/right groups, and scheme button.
- Added **theme toggle system** (Dark <-> Light).
- Extended Light Scheme palette (cards, borders, notes, tables).
- Charts partially updated but still dark background.

## v0.5.2.7 — 2025-09-08
- Introduced **theme-aware charts** (bar + pie use `chartColors()`).
- Charts now redraw on theme change events.
- Initial chart CSS variables (`--chart-bg`, `--chart-axis`, `--chart-text`) referenced.
- Bug: variables not yet present in CSS, fallback kept them dark.

## v0.5.2.6 — 2025-09-07
- Fixed Light Scheme palette (better contrast for `add.copy`, buttons, tables, notes).
- Explicit background/text colors for all components.
- Navbar section added in CSS (generic `.btn` styling).
- First time scheme button hover rules introduced.

## v0.5.2.5 — 2025-09-05 (Stable base at the time)
- Reset baseline: full working demo, charts, copy, notes, filepicker.
- First clean Light/Dark palette separation.
- Stable reference point after experimental builds.

## v0.5.2.1 — 2025-09-09 (Stable)
- First build-numbered stable release.
- Adopted monotonic build numbering (never resets, acts as regression tracker).

## v0.5.2 — 2025-09-08 (Stable)
- Added `LimeDOM.add.pie()` pie charts (labels outside + values inside).
- Overlay navigation restricted to image bounds, with smart cursor (`w-resize` / `e-resize`).
- Simplified webpage cards (favicon + title + description).
- Restored filepicker styling (dashed border, centered text, hover highlight).
- Removed duplicate chart titles (canvas handles titles only).
- Cleaned CSS (removed old nav rules).
- Unified global chart palette (`LimeDOM.palette`).

## v0.5.0 — 2025-09-06
- Added support for tables (`LimeDOM.add.table`).
- Added support for bar charts (`LimeDOM.add.chart`).
- Filepicker introduced with auto-detect for CSV/TSV/JSON and Ping-Check logs.
- Inline CSV/JSON supported via `add.chartfile`.

## v0.4.9 — 2025-09-01
- Improved `webpage()` fallback: clean hostname used if metadata fails.

## v0.4.8 — 2025-08-28
- Added `add.images()` gallery with fullscreen overlay + ←/→ navigation.
- Alt text defaults to filename if omitted.
- Navigation clamped (no wrap-around).

## v0.4.7 — 2025-08-25
- Restored rich webpage cards.
- Added `add.image()` single image overlay with Esc/backdrop close.

## v0.4.5 — 2025-08-20
- Renamed `tab.*` → `add.title` / `add.subtitle`.
- Removed duplicate `clicktocopy`.

## v0.4.4 — 2025-08-18
- Added API reference section in banner.

## v0.4.3 — 2025-08-17
- Introduced `"columns"` masonry layout mode.
