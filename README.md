# 🌿 LimeDOM.js

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
  - Auto-fetch title, description, and favicon
  - Graceful fallback if metadata fails (uses hostname only)
- 📝 **Notes & Quotes**
  - Simple styled blocks for text or citations
- 🖼 **Images**
  - Single thumbnail → fullscreen overlay
  - Multi-image gallery with ← / → navigation
  - Alt text defaults to the file name when omitted
- ⚡ **Zero dependencies**
  - Pure JS + CSS, just include the script

---

## 📦 Installation

Copy **`LimeDOM.js`** into your project and include it in your HTML:

```html
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
  <script src="LimeDOM.js"></script>
</head>
<body>
<script>
  display.page.title = "My Dashboard";
  display.add.title("My Dashboard");
  display.add.subtitle("Accent Candidates");

  display.section("Colors");
    display.add.copy("#00F593");
    display.add.note("Original Twitch accent color");
  display.end();

  display.section("Links");
    display.add.webpage("https://htmlcolorcodes.com/");
  display.end();

  display.section("Gallery");
    display.add.images(["image1.png","image2.png"]);
  display.end();
</script>
</body>
</html>
```

---

## 📚 API Reference

### Page
```js
display.page.title = "Text";        // sets <title>
display.page.icon  = "favicon.png"; // sets favicon
```

### Layout
```js
display.layout.mode = "columns" | "grid"; // choose layout mode
display.layout.columns = N;               // set number of columns (1–6)
```

### Header
```js
display.add.title("Text");       // large header text
display.add.subtitle("Text");    // smaller subtitle text
```

### Sections
```js
display.section("Title"); // start a section card
// ... add content here ...
display.end();            // close the section
```

### Content
```js
// Copy buttons
display.add.copy(value);                 // copy button (swatch if hex)
display.add.copy(label, value);          // with custom label

// Webpage preview cards
display.add.webpage("urlLike");          // shows title/desc/favicon
                                         // fallback to clean hostname if meta fails

// Notes & Quotes
display.add.note("Some text here...");   // styled note
display.add.quote("Quote text","Author");// styled quote with optional author

// Images
display.add.image("src","alt?");         // single thumbnail → fullscreen overlay
                                         // alt defaults to filename if omitted
display.add.images(["a.png","b.png"]);   // multi-thumb gallery → fullscreen
```

---

## 📜 Changelog (Condensed)

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
