# 🌿 LimeDOM.js v0.5.3.10 (Stable)

Updated: 2025-09-12

**LimeDOM.js** is a minimal-effort JavaScript framework for building neat, responsive HTML UIs.  
It comes with a tiny API for creating dashboards, config boards, and UI elements — all without external dependencies.

Visit https://LimeDOM.eu for a live DEMO.

🔗 https://github.com/adomm420/LimeDOM

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
  - Multi-image sets default to **album mode**: one preview, overlay navigation with ← / →
  - `{ grid: true }` option forces thumbnail grid layout
  - Navigation restricted inside image bounds
  - Cursor changes only on sides where navigation is possible

- 📊 **Tables & Charts**
  - Render arrays, objects, or CSV into tables
  - Bar charts with values + labels
  - Pie charts with labels outside + values inside
  - **Theme-aware charts** (Dark/Light colors via CSS vars)
  - Global or custom palettes

- ⏳ **Countdown Timers**
  - Countdown to a target `Date` or timestamp
  - Centered card layout with tiles (days/hours/mins/secs)
  - Progress bar indicator (when `start` is provided)
  - Optional pulse effect when under 10s

- 📂 **File Picker**
  - Drag & drop or click
  - Auto-detects CSV/TSV/JSON → charts
  - Detects Ping-Check logs → average ping chart

- 🎛️ **Navbar**
  - `LimeDOM.nav.begin({ title, left, right, showTheme })`
  - Sticky top bar with custom buttons
  - Built-in Dark/Light scheme toggle

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

  // Navbar with theme toggle
  LimeDOM.nav.begin({
    title: "Demo",
    left: [{ label: "Home", onClick: () => location.reload() }],
    right: [{ label: "GitHub", onClick: () => open("https://github.com/adomm420/LimeDOM") }],
    showTheme: true
  });

  LimeDOM.begin("Colors");
    LimeDOM.add.copy("#00F593");
    LimeDOM.add.note("Original Twitch accent color");
  LimeDOM.end();

  LimeDOM.begin("Links");
    LimeDOM.add.webpage("https://htmlcolorcodes.com/");
  LimeDOM.end();

  LimeDOM.begin("Charts");
    LimeDOM.add.chart({ Apples: 5, Oranges: 3 }, { title: "Fruit" });
    LimeDOM.add.pie({ Cats: 4, Dogs: 6 }, { title: "Pets" });
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
LimeDOM.add.copy(value);
LimeDOM.add.copy(label, value);

// Webpage preview cards
LimeDOM.add.webpage("urlLike");

// Notes & Quotes
LimeDOM.add.note("Some text here...");
LimeDOM.add.quote("Quote text","Author");

// Images
LimeDOM.add.images("a.png");                       // single image → overlay
LimeDOM.add.images(["a.png","b.png","c.png"]);     // album default → single preview, overlay nav
LimeDOM.add.images(["a.png","b.png"], { grid:true }); // force thumbnail grid

// Tables
LimeDOM.add.table(values);

// Charts (theme-aware)
LimeDOM.add.chart(values, { title, height, max, showValues, palette });
LimeDOM.add.pie(values,   { title, height, showLabels, showValues, palette });

// Countdown
LimeDOM.add.countdown(Date.now() + 60000, { title: "One minute timer" });

// File picker
LimeDOM.add.filepicker({ title: "Drop a file", hint: "CSV/JSON/TSV or Ping log" });
```

### Navbar
```js
LimeDOM.nav.begin({
  title: "Demo",
  left: [{ label: "Reload", onClick: () => location.reload() }],
  right: [{ label: "GitHub", onClick: () => open("https://github.com/adomm420/LimeDOM") }],
  showTheme: true // adds Dark/Light toggle
});
```

---

## 📜 Changelog (Condensed)

## v0.5.3.10 — 2025-09-12 (Stable)
- Images: Album mode default (single preview → overlay). Use `{ grid: true }` for thumbnails.
- Charts: Theme-aware via CSS vars (`--chart-bg`, `--chart-axis`, `--chart-text`), auto blend dark/light.
- Synced files: LimeDOM.js, LimeDOM.css, demo.html.

### v0.5.3.9 — 2025-09-10 (Stable)
- Improved Light Scheme palette (softer backgrounds, better text contrast).
- Theme-aware charts (`drawBarChart`, `drawPieChart` use `--chart-*` CSS vars).
- Scheme toggle button fixed with `.btn-invert` theme-appropriate base and soft hover states.
- Navbar hover + theme switch visuals tuned.

### v0.5.3.8 — 2025-09-09 (Stable)
- Introduced `LimeDOM.nav.begin()` navbar.
- Added Dark/Light scheme toggle.
- Extended Light Scheme palette.
- Charts partially updated but background remained dark.

### v0.5.2.7 — 2025-09-08
- Added theme-aware chart rendering via `chartColors()`.
- Charts redraw on theme toggle.
- Bug: CSS vars missing, charts still dark.

### v0.5.2.6 — 2025-09-07
- Fixed Light Scheme palette (copy buttons, notes, tables readable).
- Explicit background/text for all components.
- Added navbar CSS section, `.btn` styling.
- First scheme toggle hover rules.

### v0.5.2.5 — 2025-09-05 (Stable)
- Reset baseline with Light/Dark palettes and working demo.

### v0.5.2.1 — 2025-09-09 (Stable)
- Build numbering introduced as regression tracker.

---

## 👤 Author

Mantas Adomavičius a.k.a adomm420
