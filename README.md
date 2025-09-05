📄  LimeDOM.js — Zero-ceremony UI + Clipboard + Link Cards

🔧  Version:  0.4.8 (images(): multi-source gallery + smarter alts)

📅  Updated:  2025-09-06

👤  Author:   Mantas Adomavičius


🧠  Description

    Minimal dark UI with lime accent and a tiny `display.*` API.
    Masonry/grid layout, copy buttons, webpage previews, notes,
    quotes — and images with fullscreen viewer & gallery.

📚  API REFERENCE (public)

  • display.page.title = "Text"           → sets document <title>.
  
  • display.page.icon  = "favicon.png"    → sets <link rel="icon">.

  • display.layout.mode = "columns" | "grid"
  
  • display.layout.columns = N            → 1–6

  • display.add.title("Text")             → header title text.
  
  • display.add.subtitle("Text")          → header subtitle text.

  • display.section("Title")              → starts a section card
  
  • display.end()                         → ends the section

  • display.add.copy(value)               → copy button (hex swatch if #hex)
  
  • display.add.copy(label, value)        → custom label
  
  • display.add.webpage(urlLike)          → rich metadata card (http/https)
  
  • display.add.note("Text")              → paragraph note
  
  • display.add.quote("Text","Author?")   → quote block

  • display.add.image("src","alt?")       → thumbnail → fullscreen overlay
      (alt defaults to the file name when omitted)

  • display.add.images(list)              → multi-thumb gallery + fullscreen
  
      list can be:
        ["a.jpg","b.png", ...] OR
        [{src:"a.jpg",alt:"..."} , ...]
      Overlay navigation: click left/right halves or use ← / →.
      No wrap-around (clamped at ends). Esc/backdrop closes.

📜  CHANGELOG (condensed)

  • v0.4.8 — add.images() gallery; default alt from file name; gallery nav (no wrap).
  
  • v0.4.7 — restore rich webpage cards; add single image overlay; Esc closes.
  
  • v0.4.5 — tab.* → add.title/add.subtitle; removed duplicate clicktocopy.
  
  • v0.4.4 — Banner includes API reference section.
  
  • v0.4.3 — New layout mode: "columns" masonry.
  
