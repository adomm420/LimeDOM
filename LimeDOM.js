/*
────────────────────────────────────────────────────────────
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
    display.end()                         → ends the section

  • display.add.copy(value)               → copy button (hex swatch if #hex)
    display.add.copy(label, value)        → custom label
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
────────────────────────────────────────────────────────────
*/

(() => {
  // ---------- CSS ----------
  const CSS = `
  :root{
    --bg:#121212; --text:#fff; --card:#1e1e1e; --card2:#282828; --accent:#1db954;
    --radius:12px; --gap:12px; --font:Inter,system-ui,Segoe UI,Roboto,Arial,sans-serif;
    --card-minh:96px; --cols:3;
  }
  *{box-sizing:border-box} html,body{height:100%}
  body{margin:0;background:var(--bg);color:var(--text);font-family:var(--font);
       -webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
  .ld-wrap{max-width:1200px;margin:0 auto;padding:20px}
  .ld-header{background:var(--accent);color:#000;border-radius:var(--radius);padding:24px 20px;margin:20px 0}
  .ld-header h1{margin:0 0 6px 0;font-size:clamp(22px,4vw,40px);line-height:1.1}
  .ld-header p{margin:0;opacity:.8}

  /* GRID (row-first) */
  .ld-stack[data-layout="grid"]{display:grid;grid-template-columns:repeat(var(--cols),1fr);gap:var(--gap);align-items:start}
  .ld-stack[data-layout="grid"] .ld-toprow{grid-column:1/-1}

  /* COLUMNS (masonry) */
  .ld-stack[data-layout="columns"]{column-count:var(--cols);column-gap:var(--gap)}
  .ld-stack[data-layout="columns"]>.ld-card,
  .ld-stack[data-layout="columns"]>.ld-toprow{break-inside:avoid;-webkit-column-break-inside:avoid;margin:0 0 var(--gap) 0;display:block;width:100%}
  .ld-stack[data-layout="columns"] .ld-toprow{column-span:all;-webkit-column-span:all}

  @media (max-width:980px){:root{--cols:2}}
  @media (max-width:640px){:root{--cols:1}}

  .ld-card{background:var(--card);border-radius:var(--radius);padding:14px 16px;min-height:var(--card-minh)}
  .ld-sechead{margin:0 0 8px 0;font-size:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .ld-secbody{display:grid;gap:10px}

  /* Copy button */
  .ld-btn{position:relative;display:inline-flex;align-items:center;gap:10px;border:0;cursor:pointer;font-size:16px;
          padding:12px 14px;border-radius:10px;background:var(--card2);color:#fff;transition:background .2s,transform .05s;max-width:100%}
  .ld-btn:hover{background:#303030}.ld-btn:active{transform:scale(.996)}
  .ld-swatch{width:18px;height:18px;border-radius:4px;box-shadow:0 0 0 1px rgba(255,255,255,.15) inset;flex:0 0 18px}
  .ld-mono{font-family:ui-monospace,Menlo,Consolas,monospace}
  .ld-label{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:calc(100% - 64px)}
  .ld-pulse{animation:ldPulse .9s ease}@keyframes ldPulse{0%{transform:scale(1)}50%{transform:scale(1.03)}100%{transform:scale(1)}}
  .ld-status{position:absolute;right:10px;top:50%;transform:translateY(-50%);padding:2px 8px;border-radius:999px;background:var(--accent);color:#000;font-size:12px;line-height:1.2;opacity:0;pointer-events:none;transition:opacity .2s}
  .ld-status.show{opacity:.95}

  /* Webpage card */
  .ld-linkcard{display:flex;gap:12px;align-items:center;text-decoration:none;color:inherit;min-width:0;height:100%}
  .ld-thumb{width:56px;height:56px;border-radius:10px;flex:0 0 56px;object-fit:cover;background:#0f0f0f;box-shadow:0 0 0 1px rgba(255,255,255,.08) inset}
  .ld-meta{display:grid;gap:4px;min-width:0}
  .ld-title{font-weight:700;font-size:15px;line-height:1.2;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden}
  .ld-desc{opacity:.75;font-size:13px;line-height:1.2;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden}
  @media (max-width:520px){.ld-desc{display:none}}
  .ld-host{opacity:.6;font-size:12px}

  /* Note & Quote */
  .ld-note{font-size:14px;line-height:1.45;opacity:.92}
  .ld-quote{font-size:15px;line-height:1.45;font-style:italic;border-left:3px solid var(--accent);padding-left:12px}
  .ld-cite{display:block;margin-top:6px;opacity:.7;font-size:12px}

  /* Image thumbnails */
  .ld-thumbimg{width:100%;max-height:200px;object-fit:cover;border-radius:8px;cursor:pointer;transition:transform .2s}
  .ld-thumbimg:hover{transform:scale(1.02)}
  .ld-thumbgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
  @media (max-width:560px){ .ld-thumbgrid{grid-template-columns:1fr} }

  /* Fullscreen overlay & gallery */
  .ld-overlay{position:fixed;inset:0;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;z-index:9999;opacity:0;pointer-events:none;transition:opacity .2s}
  .ld-overlay.show{opacity:1;pointer-events:auto}
  .ld-overlay img{max-width:92vw;max-height:92vh;border-radius:12px;box-shadow:0 0 20px rgba(0,0,0,.6)}
  .ld-close{position:absolute;top:18px;right:26px;font-size:32px;color:#fff;cursor:pointer;font-weight:bold;line-height:1}
  .ld-nav{position:absolute;top:0;bottom:0;width:42%;cursor:pointer}
  .ld-left{left:0}
  .ld-right{right:0}
  .ld-arrow{position:absolute;top:50%;transform:translateY(-50%);font-size:36px;color:#fff;opacity:.9;user-select:none}
  .ld-left .ld-arrow{left:18px}
  .ld-right .ld-arrow{right:18px}
  .ld-disabled{opacity:.35;pointer-events:none}
  `;
  const addCSS = s => { const t=document.createElement('style'); t.textContent=s; document.head.appendChild(t); };
  addCSS(CSS);

  // ---------- Helpers ----------
  const q = (sel, root=document) => root.querySelector(sel);
  const h = (tag, props={}, ...kids) => {
    const n=document.createElement(tag);
    for(const [k,v] of Object.entries(props)){
      if(k==='class') n.className=v;
      else if(k==='style'&&v&&typeof v==='object') Object.assign(n.style,v);
      else if(k.startsWith('on')&&typeof v==='function') n.addEventListener(k.slice(2).toLowerCase(),v);
      else if(k==='text') n.textContent=v;
      else n.setAttribute(k,v);
    }
    for(const c of kids.flat()) if(c!=null&&c!==false) n.appendChild(c instanceof Node?c:document.createTextNode(String(c)));
    return n;
  };
  const isHex = s => typeof s==='string' && /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(s.trim());
  const copy = v => navigator.clipboard.writeText(String(v));

  // URL helpers for webpage cards
  const toHttpUrl = (u) => {
    try{
      if (/^(https?:)?\/\//i.test(u)) return new URL(u, location.href);
      if (/^[\w-]+(\.[\w.-]+)+(?=\/|$)/i.test(u)) return new URL('https://' + u);
      return null;
    }catch{ return null; }
  };
  const favicon = host => `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`;
  const stripWWW = host => String(host||'').replace(/^www\./i,'');
  const fetchMeta = async url => {
    const r = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}&meta=true&screenshot=false`, {mode:'cors'});
    if (!r.ok) throw new Error('meta fetch failed');
    const d = (await r.json()).data || {};
    return {
      title: d.title || '',
      description: d.description || '',
      image: (d.image && (d.image.url||d.image)) || (d.logo && (d.logo.url||d.logo)) || ''
    };
  };

  // Default alt from filename
  const fileAlt = (src) => {
    const s = String(src||'').split(/[?#]/)[0];            // drop query/hash
    const base = s.substring(s.lastIndexOf('/')+1);        // file.ext
    const name = base.replace(/\.[^.]+$/,'');              // file
    return name || 'image';
  };

  // ---------- Structure ----------
  const root = h('div',{class:'ld-wrap'});
  const header = h('div',{class:'ld-header'}, h('h1',{text:''}), h('p',{text:''}));
  const stack = h('div',{class:'ld-stack','data-layout':'columns'});
  root.append(header, stack);
  document.addEventListener('DOMContentLoaded',()=>document.body.appendChild(root));

  // ---------- Copy button ----------
  const mkCopyBtn = (label, value) => {
    const btn = h('button',{class:'ld-btn', ariaLabel:`Copy ${value} to clipboard`});
    if (isHex(value)) btn.appendChild(h('span',{class:'ld-swatch', style:{background:value}}));
    const mono = isHex(value) && (!label || label === value);
    btn.append(h('span',{class: mono?'ld-label ld-mono':'ld-label', text: label || String(value)}));
    const status = h('span',{class:'ld-status', text:'Copied!'}); btn.appendChild(status);
    btn.addEventListener('click', async () => {
      try{ await copy(value); status.classList.add('show'); btn.classList.add('ld-pulse');
           setTimeout(()=>{status.classList.remove('show'); btn.classList.remove('ld-pulse');},1100); }
      catch(e){ console.error(e); }
    });
    return btn;
  };

  // ---------- Webpage card ----------
  const mkWebCard = (url, fallback) => {
    const card = h('div',{class:'ld-card'});
    const a = h('a',{class:'ld-linkcard', href:url, target:'_blank', rel:'noopener noreferrer'});
    const host = new URL(url).host;
    const img = h('img',{class:'ld-thumb', src:fallback.thumb || favicon(host), alt:''});
    const title = h('div',{class:'ld-title', text:fallback.title || host});
    const desc  = h('div',{class:'ld-desc', text:fallback.description || ''});
    const meta  = h('div',{class:'ld-meta'}, title, desc, h('div',{class:'ld-host', text:host}));
    a.append(img, meta); card.appendChild(a);
    return {card,img,title,desc};
  };

  // ---------- Image overlay & gallery ----------
  const overlay = h('div',{class:'ld-overlay'},
    h('span',{class:'ld-close', text:'×', onclick:()=>overlay.classList.remove('show')}),
    h('div',{class:'ld-nav ld-left',  onclick:()=>nav(-1)}, h('span',{class:'ld-arrow', text:'‹'})),
    h('div',{class:'ld-nav ld-right', onclick:()=>nav(1)},  h('span',{class:'ld-arrow', text:'›'})),
    h('img',{src:'',alt:''})
  );
  let gallery = { items: [], index: 0 }; // items: [{src,alt}]
  const setOverlay = () => {
    const im = q('img',overlay);
    const item = gallery.items[gallery.index];
    if (!item) return;
    im.src = item.src; im.alt = item.alt || fileAlt(item.src);
    // clamp state UI
    const L = q('.ld-left',overlay), R = q('.ld-right',overlay);
    (gallery.index<=0 ? L.classList.add('ld-disabled') : L.classList.remove('ld-disabled'));
    (gallery.index>=gallery.items.length-1 ? R.classList.add('ld-disabled') : R.classList.remove('ld-disabled'));
  };
  const openOverlay = (items, startIndex=0) => {
    gallery.items = items.slice();
    gallery.index = Math.max(0, Math.min(startIndex, gallery.items.length-1));
    setOverlay();
    overlay.classList.add('show');
  };
  const nav = (dir) => {
    if (dir<0 && gallery.index>0) { gallery.index--; setOverlay(); }
    else if (dir>0 && gallery.index<gallery.items.length-1) { gallery.index++; setOverlay(); }
  };
  document.addEventListener('DOMContentLoaded',()=>document.body.appendChild(overlay));
  document.addEventListener('keydown', (e)=>{ if(!overlay.classList.contains('show')) return;
    if (e.key==='Escape') overlay.classList.remove('show');
    else if (e.key==='ArrowLeft') nav(-1);
    else if (e.key==='ArrowRight') nav(1);
  });
  overlay.addEventListener('click', (e)=>{ if(e.target===overlay) overlay.classList.remove('show'); });

  // ---------- Sections / layout ----------
  let currentContainer = stack;
  const startSection = title => {
    const card = h('div',{class:'ld-card'});
    card.append(h('h3',{class:'ld-sechead', text:title||''}), h('div',{class:'ld-secbody'}));
    const body = q('.ld-secbody', card);
    stack.appendChild(card);
    currentContainer = body;
    return body;
  };
  const endSection = () => { currentContainer = stack; };

  // ---------- Header refs ----------
  const h1 = q('h1', header), p = q('p', header);

  // ---------- Favicon helper ----------
  const setFavicon = href => {
    if (!href) return;
    const types = { svg:'image/svg+xml', png:'image/png', ico:'image/x-icon' };
    const ext = (href.split('.').pop()||'').toLowerCase();
    const type = types[ext] || '';
    let link = q('link[rel="icon"]',document.head) || q('link[rel*="icon"]',document.head);
    if (!link){ link=document.createElement('link'); link.rel='icon'; document.head.appendChild(link); }
    link.href = href; if (type) link.type = type;
  };

  // ---------- Public API ----------
  const api = {
    _version:'0.4.8',
    page:{
      set title(v){ document.title = v ?? ''; }, get title(){ return document.title; },
      set icon(href){ setFavicon(href); }, get icon(){ const l=q('link[rel="icon"]',document.head)||q('link[rel*="icon"]',document.head); return l?l.href:''; }
    },
    section(title){ return startSection(title); },
    end(){ endSection(); return true; },
    layout:{
      set columns(n){ document.documentElement.style.setProperty('--cols', String(Math.max(1, Math.min(6, Number(n)||3)))); },
      get columns(){ const v=getComputedStyle(document.documentElement).getPropertyValue('--cols').trim(); return Number(v||3); },
      set mode(m){ stack.setAttribute('data-layout', (m==='grid'?'grid':'columns')); },
      get mode(){ return stack.getAttribute('data-layout') || 'columns'; }
    },
    add:{
      title(v){ h1.textContent = v ?? ''; }, subtitle(v){ p.textContent = v ?? ''; },
      copy(labelOrValue, valueOptional){
        const host = currentContainer || stack;
        const label = Array.isArray(labelOrValue) ? String(labelOrValue[0])
                     : (valueOptional===undefined ? undefined : String(labelOrValue));
        const value = Array.isArray(labelOrValue) ? String(labelOrValue[1])
                     : (valueOptional===undefined ? String(labelOrValue) : String(valueOptional));
        if (host === stack){ const card=h('div',{class:'ld-card'}); card.appendChild(mkCopyBtn(label, value)); stack.appendChild(card); return card; }
        const btn = mkCopyBtn(label, value); host.appendChild(btn); return btn;
      },
      webpage(urlLike){
        const http = toHttpUrl(urlLike);
        if (!http){
          // local/relative path → simple link card using current host favicon
          const card = h('div',{class:'ld-card'}, h('a',{class:'ld-linkcard', href:urlLike, target:'_blank', rel:'noopener noreferrer'},
            h('img',{class:'ld-thumb', src:favicon(location.host), alt:''}),
            h('div',{class:'ld-meta'},
              h('div',{class:'ld-title', text:urlLike}),
              h('div',{class:'ld-desc', text:''}),
              h('div',{class:'ld-host', text:location.host})
            )));
          const host = currentContainer || stack; (host===stack?stack:host).appendChild(card); return card;
        }
        const final = http.href; const hostName = http.host;
        const bare = stripWWW(hostName);
        const fb = { title: bare, description:'', thumb: favicon(hostName) };
        const {card, img, title, desc} = mkWebCard(final, fb);
        const looksError = (s) => typeof s==='string' && /(?:attention required|just a moment|cloudflare|access denied|forbidden|blocked|error\b|security check|verify you are human)/i.test(s);
        fetchMeta(final).then(m=>{
          if(m.image) img.src=m.image;
          const errorish = looksError(m.title) || looksError(m.description);
          title.textContent = (!errorish && m.title) ? m.title : bare;
          desc.textContent  = (!errorish && m.description) ? m.description : '';
        }).catch(()=>{ title.textContent = bare; desc.textContent=''; });
        const host = currentContainer || stack; (host===stack?stack:host).appendChild(card); return card;
      },
      note(text){
        const el = h('p',{class:'ld-note', text:String(text??'')});
        const host = currentContainer || stack;
        if (host===stack){ const card=h('div',{class:'ld-card'}); card.appendChild(el); stack.appendChild(card); return card; }
        host.appendChild(el); return el;
      },
      quote(text, author){
        const wrap = h('div',{class:'ld-quote'}, h('span',{text:String(text??'')}), author?h('small',{class:'ld-cite', text:`— ${author}`}):null);
        const host = currentContainer || stack;
        if (host===stack){ const card=h('div',{class:'ld-card'}); card.appendChild(wrap); stack.appendChild(card); return card; }
        host.appendChild(wrap); return wrap;
      },
      image(src, alt){
        const _alt = alt || fileAlt(src);
        const thumb = h('img',{class:'ld-thumbimg', src:String(src), alt:_alt, onclick:()=>openOverlay([{src:String(src),alt:_alt}], 0)});
        const host = currentContainer || stack;
        if (host===stack){ const card=h('div',{class:'ld-card'}); card.appendChild(thumb); stack.appendChild(card); return card; }
        host.appendChild(thumb); return thumb;
      },
      images(list){
        // Normalize to [{src,alt}]
        const items = (Array.isArray(list)?list:[]).map(it=>{
          if (typeof it === 'string') return {src:it, alt:fileAlt(it)};
          return {src:String(it.src), alt: it.alt || fileAlt(it.src)};
        }).filter(x=>x && x.src);

        if (!items.length) return null;

        const grid = h('div',{class:'ld-thumbgrid'});
        items.forEach((it, idx)=>{
          const im = h('img',{class:'ld-thumbimg', src:it.src, alt:it.alt, onclick:()=>openOverlay(items, idx)});
          grid.appendChild(im);
        });

        const host = currentContainer || stack;
        if (host===stack){ const card=h('div',{class:'ld-card'}); card.appendChild(grid); stack.appendChild(card); return card; }
        host.appendChild(grid); return grid;
      }
    }
  };

  Object.defineProperty(window,'display',{value:api,writable:false,enumerable:true});
})();
