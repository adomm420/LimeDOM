# 🌿 LimeDOM.js v0.5.1

**LimeDOM.js** is a tiny, zero-ceremony JavaScript UI helper.  
It builds neat, responsive dashboards or config boards with a **dark theme + lime accents**, without any external dependencies.

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
  - Single thumbnail → fullscreen overlay
  - Multi-image gallery with ← / → navigation
  - Navigation restricted inside image bounds, cursor shows direction
- 📊 **Tables & Charts**
  - Render arrays, objects, or CSV into tables
  - Bar charts with values + labels
  - Pie charts with labels outside + values inside
  - Global or custom palettes
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

  LimeDOM.begin("Gallery");
    LimeDOM.add.images(["image1.png","image2.png"]);
  LimeDOM.end();

  LimeDOM.begin("Chart Example");
    LimeDOM.add.chart({Q1:10, Q2:12, Q3:8, Q4:15}, {title:"Quarterly Data"});
  LimeDOM.end();

  LimeDOM.begin("File Upload");
    LimeDOM.add.filepicker();
  LimeDOM.end();
</script>
</body>
</html>
```

---

## 📚 API Reference

### Page
```js
LimeDOM.page.title = "Text";        // sets <title>
LimeDOM.page.icon  = "favicon.png"; // sets favicon
```

### Layout
```js
LimeDOM.layout.mode = "columns" | "grid"; // choose layout mode
LimeDOM.layout.columns = N;               // set number of columns (1–6)
```

### Header
```js
LimeDOM.add.title("Text");       // large header text
LimeDOM.add.subtitle("Text");    // smaller subtitle text
```

### Sections
```js
LimeDOM.begin("Title"); // start a section card
// ... add content here ...
LimeDOM.end();          // close the section
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

// Images
LimeDOM.add.image("src","alt?");         // single thumbnail → fullscreen overlay
                                         // alt defaults to filename if omitted
LimeDOM.add.images(["a.png","b.png"]);   // multi-thumb gallery → fullscreen

// Tables
LimeDOM.add.table([{Name:"Alice", Score:42},{Name:"Bob",Score:37}]);

// Charts
LimeDOM.add.chart({Q1:10,Q2:20,Q3:15,Q4:25}, {title:"Bar Chart"});
LimeDOM.add.pie({Apples:5, Bananas:3, Oranges:7}, {title:"Fruit Shares"});

// File Picker
LimeDOM.add.filepicker({
  title: "Drop CSV/JSON/TSV or Ping-Check .txt",
  hint: "Auto-detect & render",
  accept: ".csv,.tsv,.json,.txt",
  limit: 40
});
```

---

## 📜 Changelog (Condensed)

- **v0.5.1** — Added `add.pie()` charts (labels outside + values inside), overlay cursor fixes, simplified webpage cards, restored filepicker style, global palette.  
- **v0.5.0** — Introduced table + chart support, literals and variable-based data, CSV/JSON parsing.  
- **v0.4.9** — `webpage()` fallback: clean hostname when metadata fails.  
- **v0.4.8** — Added `add.images()` gallery; alt defaults from filename; gallery navigation (←/→, clamped).  
- **v0.4.7** — Restored rich webpage cards; added single `add.image()` overlay with Esc/backdrop close.  
- **v0.4.5** — Renamed `tab.*` → `add.title` / `add.subtitle`; removed duplicate `clicktocopy`.  
- **v0.4.4** — Added API reference section in banner.  
- **v0.4.3** — Introduced `"columns"` masonry layout mode.  

---

## 👤 Author

**Mantas Adomavičius**  
MIT License
