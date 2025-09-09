/*  
📄  LimeDOM.js is a minimal-effort JS framework for building neat, responsive HTML UIs.
🔧  Version:    0.5.2.1 (Stable)
📅  Updated:    2025-09-09
👤  Author:     Mantas Adomavičius
🌐  Repo:       https://github.com/adomm420/LimeDOM
*/
/*
🧠  Summary
  Provides a tiny `LimeDOM.*` API for building dashboards and UI boards.
  Includes sections, copy buttons, webpage previews, notes, quotes,
  images with fullscreen gallery, responsive tables, bar & pie charts,
  countdown timers, and drag-&-drop file pickers — all dependency-free.
*/
/*
📚  API (highlights)
  • LimeDOM.page.title / .icon
  • LimeDOM.layout.mode = "columns" | "grid"; LimeDOM.layout.columns = 1..6
  • LimeDOM.begin("Title") ... LimeDOM.end()

  • LimeDOM.add.copy(value|[label,value]|(label,value))
  • LimeDOM.add.webpage(urlLike)
  • LimeDOM.add.note("Text"), LimeDOM.add.quote("Text","Author")
  • LimeDOM.add.image("src","alt?"), LimeDOM.add.images(list)

  • LimeDOM.add.table(values)
  • LimeDOM.add.chart(values, {title?, height?, max?, paddingTop?, showValues?, palette?})
  • LimeDOM.add.pie(values,   {title?, height?, valueFormat?, palette?, showLabels?, showValues?})
  • LimeDOM.add.chartfile(input, opts?)            // input: Blob|File|URL
  • LimeDOM.add.chartfilePingLog(input, opts?)     // input: Blob|File|URL
  • LimeDOM.add.filepicker(opts?)                  // drag & drop + click
*/

(() => {
  // ---------- Tiny helpers ----------
  const q = (sel, root=document) => root.querySelector(sel);
  const h = (tag, props={}, ...kids) => {
    const n=document.createElement(tag);
    for (const [k,v] of Object.entries(props)) {
      if (k==='class') n.className=v;
      else if (k==='style' && v && typeof v==='object') Object.assign(n.style,v);
      else if (k.startsWith('on') && typeof v==='function') n.addEventListener(k.slice(2).toLowerCase(),v);
      else if (k==='text') n.textContent=v;
      else n.setAttribute(k,v);
    }
    for (const c of kids.flat()) if (c!=null && c!==false) n.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
    return n;
  };
  const isHex = s => typeof s==='string' && /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(s.trim());
  const copy = v => navigator.clipboard.writeText(String(v));
  const toHttpUrl = (u) => {
    try{
      if (/^(https?:)?\/\//i.test(u)) return new URL(u, location.href);
      if (/^[\w-]+(\.[\w.-]+)+(?=\/|$)/i.test(u)) return new URL('https://' + u);
      return null;
    }catch{ return null; }
  };
  const favicon = host => `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`;
  const stripWWW = host => String(host||'').replace(/^www\./i,'');
  const fileAlt = (src) => (String(src||'').split(/[?#]/).pop()||'').replace(/\.[^.]+$/,'')||'image';

  // Fetch minimal metadata (title/description/logo) using microlink (no screenshot)
  const fetchMeta = async url => {
    const r = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}&meta=true&screenshot=false`, {mode:'cors'});
    if (!r.ok) throw new Error('meta fetch failed');
    const d = (await r.json()).data || {};
    return {
      title: d.title || '',
      description: d.description || '',
      image: (d.logo && (d.logo.url||d.logo)) || ''
    };
  };

  // CSV/TSV parsing (quote-aware)
  const parseDelimited = (text, delim=',') => {
    const rows=[]; let row=[], field='', inQ=false;
    for (let i=0;i<text.length;i++){
      const ch=text[i], next=text[i+1];
      if (ch === '"'){ if (inQ && next === '"'){ field+='"'; i++; } else inQ=!inQ; }
      else if (ch === delim && !inQ){ row.push(field); field=''; }
      else if ((ch === '\n' || ch === '\r') && !inQ){
        if (field.length || row.length){ row.push(field); rows.push(row); row=[]; field=''; }
        if (ch === '\r' && next === '\n') i++;
      } else field += ch;
    }
    if (field.length || row.length){ row.push(field); rows.push(row); }
    return rows;
  };
  const looksLikeHeader = (arr=[]) =>
    arr.length && arr.every(x => typeof x === 'string'
      && /^[\w .\-\(\)#]+$/i.test(x) && !/^\d+(\.\d+)?$/.test(x));

  // ---------- Structure (wrap/header/stack) ----------
  const root  = h('div',{class:'ld-wrap'});
  const header= h('div',{class:'ld-header'}, h('h1',{text:''}), h('p',{text:''}));
  const stack = h('div',{class:'ld-stack','data-layout':'columns'});
  root.append(header,stack);
  document.addEventListener('DOMContentLoaded',()=>document.body.appendChild(root));

  // ---------- Header refs & favicon setter ----------
  const h1=q('h1',header), p=q('p',header);
  const setFavicon=href=>{
    if(!href) return;
    const types={svg:'image/svg+xml',png:'image/png',ico:'image/x-icon'};
    const ext=(href.split('.').pop()||'').toLowerCase();
    const type=types[ext]||'';
    let link=q('link[rel="icon"]',document.head)||q('link[rel*="icon"]',document.head);
    if(!link){link=document.createElement('link');link.rel='icon';document.head.appendChild(link);}
    link.href=href; if(type) link.type=type;
  };

  // ---------- Global chart palette ----------
  let GLOBAL_PALETTE = [
    "#1db954", "#17a2b8", "#6f42c1", "#fd7e14",
    "#0d6efd", "#dc3545", "#20c997", "#ffc107",
    "#6610f2", "#198754", "#e83e8c", "#6c757d"
  ];
  const getPalette = (opts) => {
    const p = opts && Array.isArray(opts.palette) && opts.palette.length ? opts.palette : GLOBAL_PALETTE;
    return p;
  };

  // ---------- Image overlay & gallery (image-bound navigation + smart cursor) ----------
  const overlay = h('div', { class: 'ld-overlay' },
    h('span', { class: 'ld-close', text: '×', onclick: () => overlay.classList.remove('show') }),
    h('img', { src: '', alt: '' })
  );

  let gallery = { items: [], index: 0 };

  const setOverlay = () => {
    const im = q('img', overlay);
    const it = gallery.items[gallery.index];
    if (!it) return;
    im.src = it.src;
    im.alt = it.alt || fileAlt(it.src);
  };

  const openOverlay = (items, start = 0) => {
    gallery.items = items.slice();
    gallery.index = Math.max(0, Math.min(start, items.length - 1));
    setOverlay();
    overlay.classList.add('show');
  };

  const nav = (dir) => {
    if (dir < 0 && gallery.index > 0) {
      gallery.index--; setOverlay();
    } else if (dir > 0 && gallery.index < gallery.items.length - 1) {
      gallery.index++; setOverlay();
    }
  };

  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(overlay));

  // backdrop click closes (only when clicking outside the <img>)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('show');
  });

  // keyboard nav
  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('show')) return;
    if (e.key === 'Escape') overlay.classList.remove('show');
    else if (e.key === 'ArrowLeft') nav(-1);
    else if (e.key === 'ArrowRight') nav(1);
  });

  // image click = left/right halves navigate, and cursor shows intent
  
document.addEventListener('DOMContentLoaded', () => {
  const im = q('img', overlay);
  im.addEventListener('click', (e) => {
    const rect = im.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right ||
        e.clientY < rect.top  || e.clientY > rect.bottom) return;
    const x = e.clientX - rect.left;
    const isLeft = x < rect.width / 2;
    const hasPrev = gallery.index > 0;
    const hasNext = gallery.index < gallery.items.length - 1;
    if (isLeft && hasPrev)      nav(-1);
    else if (!isLeft && hasNext) nav(1);
    e.stopPropagation();
  });
  im.addEventListener('mousemove', (e) => {
    const rect = im.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isLeft = x < rect.width / 2;
    const hasPrev = gallery.index > 0;
    const hasNext = gallery.index < gallery.items.length - 1;
    if (gallery.items.length <= 1) { im.style.cursor = 'default'; return; }
    im.style.cursor = isLeft ? (hasPrev ? 'pointer' : 'default') : (hasNext ? 'pointer' : 'default');
  });
  im.addEventListener('mouseleave', () => { im.style.cursor = 'default'; });
});


  // ---------- Sections ----------
  let currentContainer = stack;
  const beginSection = (title) => {
    const card = h('div',{class:'ld-card'});
    card.append(
      h('h3',{class:'ld-sechead',text:title||''}),
      h('div',{class:'ld-secbody'})
    );
    const body = q('.ld-secbody',card);
    stack.appendChild(card);
    currentContainer = body;
    return body;
  };
  const endSection = () => { currentContainer = stack; };

  // ---------- Table builder ----------
  const toRows = (values) => {
    if (values && typeof values === 'object' && !Array.isArray(values)) {
      const headers = ['Key','Value'];
      const rows = Object.entries(values).map(([k,v])=>[String(k), String(v)]);
      return {headers, rows};
    }
    if (Array.isArray(values) && values.length>0) {
      if (typeof values[0] === 'object' && !Array.isArray(values[0])) {
        const keys = Array.from(values.reduce((set,row)=>{Object.keys(row).forEach(k=>set.add(k));return set;}, new Set()));
        const headers = keys;
        const rows = values.map(o=>keys.map(k=>o[k]!==undefined?String(o[k]):'')); 
        return {headers, rows};
      }
      if (Array.isArray(values[0])) {
        const first = values[0];
        const headerish = first.every(x=>typeof x==='string');
        const headers = headerish ? first : first.map((_,i)=>`Col ${i+1}`);
        const data = headerish ? values.slice(1) : values;
        const rows = data.map(r=>r.map(x=>String(x)));
        return {headers, rows};
      }
      if (typeof values[0] === 'number' || typeof values[0] === 'string') {
        const headers = ['Value'];
        const rows = values.map(v=>[String(v)]);
        return {headers, rows};
      }
    }
    return {headers:[], rows:[]};
  };
  const renderTable = (values) => {
    const {headers, rows} = toRows(values);
    const t = h('table',{class:'ld-table'});
    if (headers.length){
      const tr = h('tr',{}, ...headers.map(th=>h('th',{text:String(th)})));
      t.appendChild(tr);
    }
    rows.forEach(r=>{
      const tr = h('tr',{}, ...r.map(cell=>h('td',{text:cell})));
      t.appendChild(tr);
    });
    return t;
  };

  // ---------- Chart helpers ----------
  const normalizeSeries = (values) => {
    if (!values) return {labels:[], data:[]};
    if (Array.isArray(values)) {
      if (values.length && typeof values[0] === 'object' && !Array.isArray(values[0])) {
        return {labels: values.map(x=>String(x.label ?? '')), data: values.map(x=>Number(x.value ?? 0))};
      }
      if (values.length && (typeof values[0] === 'number')) {
        return {labels: values.map((_,i)=>String(i+1)), data: values.map(Number)};
      }
      if (values.length && (typeof values[0] === 'string')) {
        const counts = values.reduce((m,s)=>{m[s]=(m[s]||0)+1;return m;}, {});
        return {labels:Object.keys(counts), data:Object.values(counts)};
      }
    }
    if (typeof values === 'object') {
      const labels = Object.keys(values).map(String);
      const data = Object.values(values).map(Number);
      return {labels, data};
    }
    return {labels:[], data:[]};
  };

  // ---------- Bar chart ----------
  const drawBarChart = (canvas, series, opts={}) => {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const styleH = Math.max(120, Number(opts.height||180));
    const width  = canvas.clientWidth || 300;
    const height = styleH;
    canvas.width  = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.height = `${styleH}px`;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr,0,0,dpr,0,0);

    const labels = series.labels;
    const data   = series.data;
    const maxVal = (opts.max!=null? Number(opts.max): Math.max(1, ...data));
    const pad = { t: opts.paddingTop ?? 36, r: 12, b: 28, l: 28 };
    const w = width - pad.l - pad.r;
    const h = height - pad.t - pad.b;
    const n = Math.max(1, data.length);
    const gap = 8;
    const barW = Math.max(4, (w - (n-1)*gap) / n);
    const pal = getPalette(opts);

    // bg
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0,0,width,height);

    // axis
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t + h);
    ctx.lineTo(pad.l + w, pad.t + h);
    ctx.stroke();

    // bars
    for (let i=0;i<n;i++){
      const x = pad.l + i*(barW+gap);
      const val = Math.max(0, data[i]||0);
      const bh = (val/maxVal)*h;
      const y = pad.t + h - bh;

      ctx.fillStyle = pal[i % pal.length];
      ctx.fillRect(x, y, barW, bh);

      if (opts.showValues !== false){
        ctx.fillStyle = '#fff';
        ctx.font = '12px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(String(val), x + barW/2, Math.max(12, y - 4));
      }

      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(String(labels[i] ?? ''), x + barW/2, pad.t + h + 14);
    }

    if (opts.title){
      ctx.fillStyle='rgba(255,255,255,0.9)';
      ctx.font='13px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(String(opts.title), 6, 14);
    }
  };

  // ---------- Pie chart (labels outside + values inside) ----------
  const drawPieChart = (canvas, series, opts = {}) => {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const styleH = Math.max(160, Number(opts.height || 220));
    const width  = canvas.clientWidth || 320;
    const height = styleH;
    canvas.width  = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.height = `${styleH}px`;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr,0,0,dpr,0,0);

    // bg
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0,0,width,height);

    const padT = opts.paddingTop ?? 30;
    const cx = width/2, cy = padT + (height - padT)/2;
    const r  = Math.max(40, Math.min(width, height - padT) * 0.35);

    const data   = series.data.map(v => Math.max(0, Number(v)||0));
    const labels = series.labels.map(s => String(s ?? ''));
    const total  = data.reduce((a,b)=>a+b,0) || 1;
    const pal    = getPalette(opts);

    // slices
    let start = -Math.PI/2;
    const arcs = [];
    for (let i=0;i<data.length;i++){
      const val = data[i];
      const angle = (val/total) * Math.PI * 2;
      const end = start + angle;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle = pal[i % pal.length];
      ctx.fill();

      arcs.push({i, val, angle, start, end});
      start = end;
    }

    // outside labels
    if (opts.showLabels !== false) {
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1;

      for (const a of arcs){
        if (a.angle <= 0.005) continue;
        const mid = (a.start + a.end) / 2;
        const elbowR     = r * 0.92;
        const endR       = r * 1.06;

        const ex = cx + Math.cos(mid) * elbowR;
        const ey = cy + Math.sin(mid) * elbowR;
        const isRight = Math.cos(mid) >= 0;
        const tx = cx + Math.cos(mid) * endR + (isRight ? 8 : -8);
        const ty = cy + Math.sin(mid) * endR;

        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(tx + (isRight ? -6 : 6), ty);
        ctx.stroke();

        const name = labels[a.i] ?? '';
        ctx.textAlign = isRight ? 'left' : 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(name, tx, ty);
      }
    }

    // values inside
    if (opts.showValues !== false) {
      for (const a of arcs){
        if (a.angle <= 0.02) continue;
        const mid = (a.start + a.end) / 2;
        const rx = cx + Math.cos(mid) * r * 0.62;
        const ry = cy + Math.sin(mid) * r * 0.62;
        const frac = a.val / total;
        const valText = (opts.valueFormat ? String(opts.valueFormat(a.val, frac)) : String(a.val));

        ctx.fillStyle = '#fff';
        ctx.font = '12px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(valText, rx, ry);
      }
    }

    // title inside canvas
    if (opts.title){
      ctx.fillStyle='rgba(255,255,255,0.9)';
      ctx.font='13px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(String(opts.title), 6, 14);
    }
  };

  // ---------- Public API ----------
  const api={
    version:'0.5.2.1',
    _version:'0.5.2.1',

    // Global palette (affects all charts unless overridden via opts.palette)
    get palette(){ return GLOBAL_PALETTE; },
    set palette(p){ if (Array.isArray(p) && p.length) GLOBAL_PALETTE = p.slice(); },

    page:{
      set title(v){h1.textContent=v??''; document.title=v??'';},
      get title(){return document.title;},
      set icon(href){setFavicon(href);},
      get icon(){const l=q('link[rel="icon"]',document.head)||q('link[rel*="icon"]',document.head);return l?l.href:'';}
    },
    begin(title){return beginSection(title);},
    end(){endSection();return true;},
    layout:{
      set columns(n){document.documentElement.style.setProperty('--cols',String(Math.max(1,Math.min(6,Number(n)||3))));},
      get columns(){const v=getComputedStyle(document.documentElement).getPropertyValue('--cols').trim();return Number(v||3);},
      set mode(m){stack.setAttribute('data-layout',(m==='grid'?'grid':'columns'));},
      get mode(){return stack.getAttribute('data-layout')||'columns';}
    },

    // ---------- add.* ----------
    add:{
      // page header texts
      title(v){h1.textContent=v??'';}, 
      subtitle(v){p.textContent=v??'';},

      // Copy button
      copy(a,b){
        const host=currentContainer||stack;
        const label=Array.isArray(a)?String(a[0]):(b===undefined?undefined:String(a));
        const value=Array.isArray(a)?String(a[1]):(b===undefined?String(a):String(b));
        const btn=h('button',{class:'ld-btn',ariaLabel:`Copy ${value} to clipboard`});
        if(isHex(value)) btn.appendChild(h('span',{class:'ld-swatch',style:{background:value}}));
        const mono=isHex(value)&&(!label||label===value);
        btn.append(h('span',{class:mono?'ld-label ld-mono':'ld-label',text:label||String(value)}));
        const status=h('span',{class:'ld-status',text:'Copied!'}); btn.appendChild(status);
        btn.addEventListener('click',async()=>{
          try{ await copy(value); status.classList.add('show'); btn.classList.add('ld-pulse');
               setTimeout(()=>{status.classList.remove('show'); btn.classList.remove('ld-pulse');},1100);}
          catch(e){ console.error(e); }
        });
        if(host===stack){const card=h('div',{class:'ld-card'});card.appendChild(btn);stack.appendChild(card);return card;}
        host.appendChild(btn);return btn;
      },

      // Webpage preview card (favicon + title/desc; no thumbnails)
      webpage(urlLike){
        const http = toHttpUrl(urlLike);
        const mountTo = (currentContainer===stack?stack:currentContainer);
        if (!http){
          const host = location.host || "local";
          const card=h('div',{class:'ld-card'});
          const a=h('a',{class:'ld-linkcard',href:'#',onclick:e=>e.preventDefault()});
          const img=h('img',{class:'ld-thumb',src:favicon(host),alt:''});
          const meta=h('div',{class:'ld-meta'},
            h('div',{class:'ld-title',text:String(urlLike)}),
            h('div',{class:'ld-desc',text:''}),
            h('div',{class:'ld-host',text:host})
          );
          a.append(img,meta); card.appendChild(a); mountTo.appendChild(card); return card;
        }
        const final = http.href; const hostName = http.host; const bare = stripWWW(hostName);
        const card=h('div',{class:'ld-card'});
        const a=h('a',{class:'ld-linkcard',href:final,target:'_blank',rel:'noopener noreferrer'});
        const img=h('img',{class:'ld-thumb',src:favicon(hostName),alt:''});
        const title=h('div',{class:'ld-title',text:bare});
        const desc=h('div',{class:'ld-desc',text:''});
        const meta=h('div',{class:'ld-meta'},title,desc,h('div',{class:'ld-host',text:hostName}));
        a.append(img,meta); card.appendChild(a); mountTo.appendChild(card);
        fetchMeta(final).then(m=>{
          const looksBad = s => typeof s==='string' && /attention required|just a moment|cloudflare|access denied|forbidden|blocked|error\b|security check|verify you are human/i.test(s);
          if(!looksBad(m.title) && m.title) title.textContent = m.title;
          if(!looksBad(m.description) && m.description) desc.textContent = m.description;
          // intentionally ignore m.image — favicon-only cards by design
        }).catch(()=>{});
        return card;
      },

      // Notes & quotes
      note(text){
        const el=h('p',{class:'ld-note',text:String(text??'')});
        if(currentContainer===stack){const card=h('div',{class:'ld-card'});card.appendChild(el);stack.appendChild(card);return card;}
        currentContainer.appendChild(el);return el;
      },
      quote(text,author){
        const wrap=h('div',{class:'ld-quote'},
          h('span',{text:String(text??'')}),
          author?h('small',{class:'ld-cite',text:`— ${author}`}):null
        );
        if(currentContainer===stack){const card=h('div',{class:'ld-card'});card.appendChild(wrap);stack.appendChild(card);return card;}
        currentContainer.appendChild(wrap);return wrap;
      },

      // Images & grid
      images(list){
        const arr = Array.isArray(list) ? list : (list ? [list] : []);
        const items = arr.map(it => typeof it === 'string'
          ? { src: it, alt: fileAlt(it) }
          : { src: String(it.src), alt: it.alt || fileAlt(it.src) })
          .filter(x => x && x.src);
        if(!items.length) return null;

        // single image → full-bleed figure
        if (items.length === 1) {
          const it = items[0];
          const fig = h('figure', { class: 'ld-singleimg' },
            h('img', {
              class: 'ld-singleimg-img',
              src: it.src,
              alt: it.alt,
              loading: 'lazy',
              decoding: 'async',
              onclick: () => openOverlay(items, 0)
            })
          );
          if(currentContainer===stack){const card=h('div',{class:'ld-card'});card.appendChild(fig);stack.appendChild(card);return card;}
          currentContainer.appendChild(fig);return fig;
        }

        // 2+ → grid
        const grid=h('div',{class:'ld-thumbgrid'});
        items.forEach((it,idx)=>grid.appendChild(h('img',{class:'ld-thumbimg',src:it.src,alt:it.alt,onclick:()=>openOverlay(items,idx)})));
        if(currentContainer===stack){const card=h('div',{class:'ld-card'});card.appendChild(grid);stack.appendChild(card);return card;}
        currentContainer.appendChild(grid);return grid;
      },

      // Countdown (bar-only, centered)
      countdown(target, opts = {}) {
        const host = currentContainer===stack
          ? (()=>{const card=h('div',{class:'ld-card'});stack.appendChild(card);return card;})()
          : currentContainer;

        const endDate = (target instanceof Date) ? target : new Date(target);
        if (!endDate || isNaN(endDate)) {
          const el = h('p',{class:'ld-note',text:'Invalid countdown target'});
          host.appendChild(el); return el;
        }

        const wrap = h('div',{class:'ld-countdown'});
        if (opts.title) wrap.appendChild(h('div',{class:'ld-sub',text:opts.title}));

        const countwrap = h('div',{class:'ld-countwrap'});
        const row       = h('div',{class:'ld-countrow'});

        const seg = (unit)=> h('div',{class:'ld-seg'},
                          h('div',{class:'ld-val',text:'00'}),
                          h('div',{class:'ld-unit',text:unit}));
        const dSeg = seg('days');
        const hSeg = seg('hours');
        const mSeg = seg('mins');
        const sSeg = seg('secs');
        const grid = h('div',{class:'ld-countgrid'}, dSeg, hSeg, mSeg, sSeg);

        row.append(grid);
        countwrap.append(row);
        wrap.append(countwrap);

        let startMs = null, bar = null;
        if (opts.start) {
          const s = (opts.start instanceof Date) ? +opts.start : +new Date(opts.start);
          if (Number.isFinite(s)) startMs = s;
        }
        if (startMs) {
          bar = h('div',{class:'ld-progress'}, h('span',{style:'--p:0'}));
          wrap.appendChild(bar);
        }

        host.appendChild(wrap);

        const endText = opts.endText || "Done";
        const interval = Math.max(200, opts.interval || 1000);
        const hideZeroDays = opts.hideZeroDays !== false;

        function tick() {
          const now = Date.now();
          let diff = endDate - now;
          if (diff <= 0) {
            [dSeg,hSeg,mSeg,sSeg].forEach(seg=>{
              seg.querySelector('.ld-val').textContent='00';
            });
            wrap.classList.add('ld-done');
            sSeg.querySelector('.ld-unit').textContent = endText;
            if (bar)  bar.firstElementChild.style.setProperty('--p','1');
            clearInterval(id);
            return;
          }
          const s = Math.floor(diff/1000) % 60;
          const m = Math.floor(diff/60000) % 60;
          const h = Math.floor(diff/3600000) % 24;
          const d = Math.floor(diff/86400000);

          dSeg.querySelector('.ld-val').textContent = String(d).padStart(2,'0');
          hSeg.querySelector('.ld-val').textContent = String(h).padStart(2,'0');
          mSeg.querySelector('.ld-val').textContent = String(m).padStart(2,'0');
          sSeg.querySelector('.ld-val').textContent = String(s).padStart(2,'0');

          dSeg.style.display = (hideZeroDays && d===0) ? 'none' : '';

          if (startMs) {
            const total = Math.max(1, endDate - startMs);
            const p = Math.min(1, Math.max(0, (now - startMs) / total));
            bar.firstElementChild.style.setProperty('--p', String(p));
          }

          if (diff < 10000) wrap.classList.add("ld-urgent");
          else wrap.classList.remove("ld-urgent");
        }
        tick();
        const id = setInterval(tick, interval);

        return wrap;
      },

      // Table
      table(values){
        const tbl = renderTable(values);
        if(currentContainer===stack){const card=h('div',{class:'ld-card'});card.appendChild(tbl);stack.appendChild(card);return card;}
        currentContainer.appendChild(tbl);return tbl;
      },

      // Bar Chart (title drawn inside canvas; no external title div)
      chart(values, opts){
        const series = normalizeSeries(values);
        const wrap = h('div',{}); // no ld-charttitle here
        const canvas = h('canvas',{class:'ld-canvas'});
        wrap.appendChild(canvas);

        const draw = () => {
          const w = canvas.clientWidth || 0;
          if (w < 10) { requestAnimationFrame(draw); return; }
          try { drawBarChart(canvas, series, opts||{}); } catch(e){ console.error(e); }
        };
        const ro = new ResizeObserver(()=>draw());
        const mount = () => { ro.observe(canvas); draw(); };

        let card;
        if(currentContainer===stack){card=h('div',{class:'ld-card'});card.appendChild(wrap);stack.appendChild(card);}
        else { currentContainer.appendChild(wrap); }
        requestAnimationFrame(mount);

        return card || wrap;
      },

      // Pie Chart (title drawn inside canvas; no external title div)
      pie(values, opts){
        const series = normalizeSeries(values);
        const wrap = h('div',{}); // no ld-charttitle here
        const canvas = h('canvas',{class:'ld-canvas'});
        wrap.appendChild(canvas);

        const draw = () => {
          const w = canvas.clientWidth || 0;
          if (w < 10) { requestAnimationFrame(draw); return; }
          try { drawPieChart(canvas, series, opts||{}); } catch(e){ console.error(e); }
        };
        const ro = new ResizeObserver(()=>draw());
        const mount = () => { ro.observe(canvas); draw(); };

        let card;
        if(currentContainer===stack){card=h('div',{class:'ld-card'});card.appendChild(wrap);stack.appendChild(card);}
        else { currentContainer.appendChild(wrap); }
        requestAnimationFrame(mount);

        return card || wrap;
      },

      // --- chartfile: Blob/File OR URL string ---
      async chartfile(input, opts){
        try{
          let ext="", txt="", data=null;

          if (input instanceof Blob) {
            const mime=(input.type||"").toLowerCase();
            ext = /json/.test(mime) ? "json" : (/tsv/.test(mime) ? "tsv" : "csv");
            if (ext==="json") data = JSON.parse(await input.text());
            else txt = await input.text();
          } else {
            const href = String(input);
            const res = await fetch(href, { cache:"no-store" });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const url = new URL(href, location.href);
            ext = (url.pathname.split(".").pop()||"").toLowerCase();
            if (ext==="json") data = await res.json(); else txt = await res.text();
          }

          let values;
          if (data!=null){
            values = Array.isArray(data) ? data
                   : (data && typeof data==="object" ? data : []);
          } else {
            const delim = ext==="tsv" ? "\t" : ",";
            const rows = parseDelimited(txt, delim).filter(r=>r.some(c=>String(c).trim()!==""));
            if (!rows.length) throw new Error("Empty file");

            let dataRows = rows, headers=null;
            if (looksLikeHeader(rows[0])) {
              headers = rows[0].map(s=>String(s).trim().toLowerCase());
              dataRows = rows.slice(1);
            }

            const li = headers ? headers.indexOf("label") : -1;
            const vi = headers ? headers.indexOf("value") : -1;

            values = (li!==-1 && vi!==-1)
              ? dataRows.map(r=>({label:String(r[li]??''), value:Number(r[vi]??0)}))
              : dataRows.map(r=>({label:String(r[0]??''),  value:Number(r[1]??0)}));
          }

          return this.chart(values, opts||{});
        }catch(err){
          console.error("[LimeDOM.add.chartfile] failed:", err);
          return this.note(`chartfile: ${String(err.message||err)}`);
        }
      },

      // --- chartfilePingLog: Blob/File OR URL string ---
      async chartfilePingLog(input, opts){
        try{
          const txt = input instanceof Blob
            ? await input.text()
            : await (await fetch(String(input), { cache:"no-store" })).text();

          const lines = txt.trim().split(/\r?\n/).filter(Boolean);
          if (!lines.length) throw new Error("empty log");

          const limit = opts?.limit ?? 20;
          const slice = lines.slice(-limit);

          const seriesByHost = {};
          slice.forEach(line=>{
            // expect "HH:MM:SS host:val host:val ..."
            const parts = line.split(/\s+/).slice(1);
            parts.forEach(p=>{
              const [host,val] = p.split(":");
              if (!host || !val) return;
              const n = Number(val);
              if (Number.isFinite(n)) (seriesByHost[host] ??= []).push(n);
            });
          });

          if (!Object.keys(seriesByHost).length) throw new Error("no host:value pairs found");

          const values = Object.entries(seriesByHost).map(([host,arr])=>({
            label: host,
            value: Math.round(arr.reduce((a,b)=>a+b,0)/arr.length)
          }));

          return this.chart(values, {
            title: opts?.title ?? "Ping Averages",
            height: opts?.height ?? 180,
            paddingTop: opts?.paddingTop ?? 36
          });
        }catch(err){
          console.error("[LimeDOM.add.chartfilePingLog] failed:", err);
          return this.note(`pinglog: ${String(err.message||err)}`);
        }
      },

      // Read local file text (used by filepicker)
      async _readFileText(file){
        return await new Promise((res,rej)=>{
          const r=new FileReader();
          r.onload=()=>res(String(r.result||'')); r.onerror=rej; r.readAsText(file);
        });
      },

      // Drag+Drop / Click picker that auto-routes to chartfile / pinglog
      filepicker(opts = {}){
        const host = currentContainer===stack
          ? (()=>{const card=h('div',{class:'ld-card'});stack.appendChild(card);return card;})()
          : currentContainer;

        const title = opts.title ?? 'Drop a file or click to browse';
        const hint  = opts.hint  ?? 'JSON/CSV/TSV → chart · Ping-Check .txt → ping averages';

        const box = h('div',{class:'ld-drop',tabindex:'0'},
          h('h4',{text:title}),
          h('small',{text:hint})
        );
        const input = h('input',{type:'file',style:'display:none;',accept:opts.accept || ''});

        const setDrag = on => box.classList[on?'add':'remove']('drag');

        const handleFile = async (file) => {
          try{
            if (typeof opts.onfile === 'function') {
              const url = URL.createObjectURL(file);
              return void opts.onfile(file, url);
            }
            const name = (file.name||'').toLowerCase();
            const mode = opts.mode;

            const chartIt = () => api.add.chartfile(file, {title: opts.title2 || opts.title || 'Chart'});
            const pingIt  = () => api.add.chartfilePingLog(file, {title: opts.title2 || opts.title || 'Ping averages', limit: opts.limit || 30});

            if (mode === 'chart')    return chartIt();
            if (mode === 'pinglog')  return pingIt();
            if (mode === 'raw') {
              const txt = await api.add._readFileText(file);
              return api.add.note(txt.split(/\r?\n/).slice(0,10).join('\n'));
            }
            if (mode === 'table') {
              const txt = await api.add._readFileText(file);
              const rows = txt.trim().split(/\r?\n/).map(l=>l.split(','));
              const headers = rows[0]||[];
              const data = rows.slice(1).map(r=>Object.fromEntries(headers.map((k,i)=>[k,r[i]])));
              return api.add.table(data);
            }

            if (name.endsWith('.json') || name.endsWith('.csv') || name.endsWith('.tsv')) {
              return chartIt();
            }
            if (name.endsWith('.txt')) {
              const txt = await api.add._readFileText(file);
              const looksPing = /\b\d{2}:\d{2}:\d{2}\s+\w+:\d+(?:\s+\w+:\d+)+/.test(txt);
              return looksPing ? pingIt() : api.add.note(txt.split(/\r?\n/).slice(0,10).join('\n'));
            }
            return chartIt(); // fallback
          }catch(e){
            console.error('[LimeDOM.add.filepicker] failed:', e);
            api.add.note('Could not load file. See console for details.');
          }
        };

        // drag & drop
        box.addEventListener('dragenter', e=>{e.preventDefault(); setDrag(true);});
        box.addEventListener('dragover',  e=>{e.preventDefault(); setDrag(true);});
        box.addEventListener('dragleave', ()=>setDrag(false));
        box.addEventListener('drop', async e=>{
          e.preventDefault(); setDrag(false);
          const f = e.dataTransfer?.files?.[0];
          if (f) await handleFile(f);
        });

        // click to open
        box.addEventListener('click', ()=> input.click());
        input.addEventListener('change', async e=>{
          const f = e.target.files?.[0];
          if (f) await handleFile(f);
          input.value = '';
        });

        host.append(box, input);
        return box;
      },
    }
  };

  Object.defineProperty(window,'LimeDOM',{value:api,writable:false,enumerable:true});
})();
