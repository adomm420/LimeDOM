<!--  
📄  LimeDOM.js Changelog
🌐  Repo: https://github.com/adomm420/LimeDOM
-->
# 📜 Changelog

All notable changes to **LimeDOM.js** will be documented here.

---

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
