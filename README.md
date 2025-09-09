# 🌿 LimeDOM.js v0.5.2.1 (Stable)
Updated: 2025-09-09

**LimeDOM.js** is a minimal-effort JavaScript framework for building neat, responsive HTML UIs.  
It comes with a tiny API for creating dashboards, config boards, and UI elements — all without external dependencies.

🌐 Repo: [github.com/adomm420/LimeDOM](https://github.com/adomm420/LimeDOM)

---

## ✨ Features

- 🖼 **Cards & Layouts**
  - Masonry (`columns`) and grid modes
  - Responsive design that adapts to screen size
- 📋 **Copy to Clipboard**
  - Copy buttons with hex swatch previews
  - Visual feedback with “Copied!” status
- 🌐 **Webpage Cards**
  - Auto-fetch title + description + favicon
  - Graceful fallback if metadata fails (uses branding + hostname)
- 📝 **Notes & Quotes**
  - Simple styled blocks for text or citations
- 🖼 **Images**
  - Single image → full-bleed card with fullscreen overlay
  - Multi-image gallery grid with ← / → navigation
  - Navigation restricted inside image bounds
  - Index-finger cursor only on sides where navigation is possible
- 📊 **Tables & Charts**
  - Render arrays, objects, or CSV into tables
  - Bar charts with values + labels
  - Pie charts with labels outside + values inside
  - Global or custom palettes
- ⏳ **Countdown Timers**
  - Simple countdown to a target `Date` or timestamp
  - Centered card layout with tiles (days/hours/mins/secs)
  - Progress bar indicator (when `start` is provided)
  - Optional pulse effect when under 10s
- 📂 **File Picker**
  - Drag & drop or click
  - Auto-detects CSV/TSV/JSON → charts
  - Detects Ping-Check logs → average ping chart
- ⚡ **Zero dependencies**
  - Pure JS + CSS, just include the script

---

## 📦 Installation

Copy **`LimeDOM.js`** and **`LimeDOM.css`** into your project and include them in your HTML:

```html
<link rel="stylesheet" href="LimeDOM.css">
<script src="LimeDOM.js"></script>
```

---

## 🚀 Quick Start

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Dashboard</title>
  <link rel="stylesheet" href="LimeDOM.css">
  <script src="LimeDOM.js"></script>
</head>
<body>
<script>
  LimeDOM.page.title = "My Dashboard";
  LimeDOM.add.title("My Dashboard");
  LimeDOM.add.subtitle("Accent Candidates");

  LimeDOM.begin("Colors");
    LimeDOM.add.copy("#00F593");
    LimeDOM.add.note("Original Twitch accent color");
  LimeDOM.end();

  LimeDOM.begin("Links");
    LimeDOM.add.webpage("https://htmlcolorcodes.com/");
  LimeDOM.end();
</script>
</body>
</html>
```

---

## 📚 API Reference

### Page & Layout
```js
LimeDOM.page.title = "My Dashboard";
LimeDOM.page.icon  = "favicon.png";   // set <link rel="icon">

LimeDOM.layout.mode = "columns";      // "columns" or "grid"
LimeDOM.layout.columns = 3;           // 1..6 columns

LimeDOM.begin("Section title");
  // ... content ...
LimeDOM.end();
```

### Content
```js
// Copy buttons
LimeDOM.add.copy(value);                 // copy button (swatch if hex)
LimeDOM.add.copy(label, value);          // with custom label

// Webpage preview cards
LimeDOM.add.webpage("urlLike");          // shows favicon + title + desc
                                         // fallback to branding + hostname

// Notes & Quotes
LimeDOM.add.note("Some text here...");   // styled note
LimeDOM.add.quote("Quote text","Author");// styled quote with optional author

// Images (single or list)
LimeDOM.add.images("a.png");             // single image → full-bleed overlay
LimeDOM.add.images([
  {src:"a.png",alt:"First"},
  "b.png",
  {src:"c.png",alt:"Third"}
]);                                      // gallery with ←/→ navigation

// Tables
LimeDOM.add.table(values);

// Charts
LimeDOM.add.chart(values, {title, height, max, showValues, palette});
LimeDOM.add.pie(values,   {title, height, showLabels, showValues, palette});

// Countdown
LimeDOM.add.countdown(Date.now() + 60000, {
  title: "One minute timer",
  endText: "Done",
  start: Date.now(),        // enables progress bar
  interval: 1000,
  hideZeroDays: true
});

// File picker
LimeDOM.add.filepicker({
  title: "Drop a file",
  hint:  "CSV/JSON/TSV or Ping log",
  accept: ".csv,.tsv,.json,.txt",
  limit: 40
});
```

---

## 📜 Changelog (Condensed)

### v0.5.2.1 — 2025-09-09 (Stable)
- First build-numbered stable release
- Adopted monotonic build numbering (never resets, acts as regression tracker)

### v0.5.2 — 2025-09-08 (Stable)
- Added `add.countdown()` (bar-only, stable)
- Simplified `add.images()` (single → full-bleed, multi → gallery)
- Removed `add.image()`
- Improved overlay with index-finger cursor

### v0.5.1 — 2025-09-07 (Stable)
- Added `add.pie()` charts
- Overlay cursor fixes
- Simplified webpage cards
- Restored filepicker style
- Unified global chart palette

### v0.5.0 — 2025-09-06 (Stable)
- Introduced table + chart support
- Added inline CSV/JSON parsing
- Added filepicker with auto-detect

### v0.4.8 — 2025-08-28 (Stable)
- Added `add.images()` gallery with fullscreen overlay
- Alt text defaults to filename
- Clamped navigation (no wrap-around)

### v0.4.7 — 2025-08-25 (Stable)
- Restored rich webpage cards
- Added single `add.image()` overlay with Esc/backdrop close

### v0.4.5 — 2025-08-20 (Stable)
- Renamed `tab.*` → `add.title` / `add.subtitle`
- Removed duplicate `clicktocopy`

### v0.4.3 — 2025-08-17 (Stable)
- Introduced `"columns"` masonry layout mode

