/*  
📄  LimeDOM.js is a minimal-effort JS framework for building neat, responsive HTML UIs.
🔧  Version:    0.5.3.10 (Stable)
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
  New in 0.5.2.2: Theme system + Navbar with theme toggle.
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

  • LimeDOM.theme.setTo("dark"|"light"), .toggle(), .current, .onChange(fn)
  • LimeDOM.nav.begin(opts) / .end()
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

  // ---------- Image overlay & gallery ----------
  const overlay = h('div', { class: 'ld-overlay' },
    h('span', { class: 'ld-close', text: '×', onclick: () => overlay.classList.remove('show') }),
    h('img', { src: '', alt: '' })
  );
  let gallery = { items: [], index: 0 };
  const setOverlay = () => { const im=q('img',overlay); const it=gallery.items[gallery.index]; if(!it) return; im.src=it.src; im.alt=it.alt||fileAlt(it.src); };
  const openOverlay = (items,start=0)=>{ gallery.items=items.slice(); gallery.index=Math.max(0,Math.min(start,items.length-1)); setOverlay(); overlay.classList.add('show'); };
  const nav = dir => { if (dir<0 && gallery.index>0){gallery.index--;setOverlay();} else if (dir>0 && gallery.index<gallery.items.length-1){gallery.index++;setOverlay();} };
  document.addEventListener('DOMContentLoaded',()=>document.body.appendChild(overlay));
  overlay.addEventListener('click',e=>{ if(e.target===overlay) overlay.classList.remove('show'); });
  document.addEventListener('keydown',e=>{ if(!overlay.classList.contains('show')) return; if(e.key==='Escape') overlay.classList.remove('show'); else if(e.key==='ArrowLeft') nav(-1); else if(e.key==='ArrowRight') nav(1); });
  document.addEventListener('DOMContentLoaded',()=>{
    const im=q('img',overlay);
    im.addEventListener('click',e=>{
      const rect=im.getBoundingClientRect();
      if (e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom) return;
      const x=e.clientX-rect.left, isLeft=x<rect.width/2;
      const hasPrev=gallery.index>0, hasNext=gallery.index<gallery.items.length-1;
      if(isLeft && hasPrev) nav(-1); else if(!isLeft && hasNext) nav(1);
      e.stopPropagation();
    });
    im.addEventListener('mousemove',e=>{
      const rect=im.getBoundingClientRect(); const x=e.clientX-rect.left; const isLeft=x<rect.width/2;
      const hasPrev=gallery.index>0, hasNext=gallery.index<gallery.items.length-1;
      if (gallery.items.length<=1) { im.style.cursor='default'; return; }
      im.style.cursor = isLeft ? (hasPrev?'pointer':'default') : (hasNext?'pointer':'default');
    });
    im.addEventListener('mouseleave',()=>{ im.style.cursor='default'; });
  });

  // ---------- Sections ----------
  let currentContainer = stack;
  const beginSection = (title) => {
    const card = h('div',{class:'ld-card'});
    card.append(h('h3',{class:'ld-sechead',text:title||''}), h('div',{class:'ld-secbody'}));
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
    const t=h('table',{class:'ld-table'});
    if (headers.length){ const tr=h('tr',{}, ...headers.map(th=>h('th',{text:String(th)}))); t.appendChild(tr); }
    rows.forEach(r=>{ const tr=h('tr',{}, ...r.map(cell=>h('td',{text:cell}))); t.appendChild(tr); });
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

// Read CSS variables so charts follow the current theme
const chartColors = () => {
  const s = getComputedStyle(document.documentElement);
  return {
    bg:   (s.getPropertyValue('--chart-bg')   || '#1a1a1a').trim(),
    axis: (s.getPropertyValue('--chart-axis') || 'rgba(255,255,255,.12)').trim(),
    text: (s.getPropertyValue('--chart-text') || '#ffffff').trim()
  };
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
    ctx.fillStyle = chartColors().bg; ctx.fillRect(0,0,width,height);
    ctx.strokeStyle = chartColors().axis; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pad.l, pad.t + h); ctx.lineTo(pad.l + w, pad.t + h); ctx.stroke();
    for (let i=0;i<n;i++){
      const x = pad.l + i*(barW+gap);
      const val = Math.max(0, data[i]||0);
      const bh = (val/maxVal)*h;
      const y = pad.t + h - bh;
      ctx.fillStyle = pal[i % pal.length]; ctx.fillRect(x, y, barW, bh);
      if (opts.showValues !== false){
        ctx.fillStyle = chartColors().text; ctx.font = '12px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText(String(val), x + barW/2, Math.max(12, y - 4));
      }
      ctx.fillStyle = chartColors().text; ctx.font = '12px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(String(labels[i] ?? ''), x + barW/2, pad.t + h + 14);
    }
    if (opts.title){ ctx.fillStyle=chartColors().text; ctx.font='13px system-ui, sans-serif'; ctx.textAlign='left'; ctx.textBaseline='alphabetic'; ctx.fillText(String(opts.title), 6, 14); }
  };

  // ---------- Pie chart ----------
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
    ctx.fillStyle = chartColors().bg; ctx.fillRect(0,0,width,height);
    const padT = opts.paddingTop ?? 30;
    const cx = width/2, cy = padT + (height - padT)/2;
    const r  = Math.max(40, Math.min(width, height - padT) * 0.35);
    const data   = series.data.map(v => Math.max(0, Number(v)||0));
    const labels = series.labels.map(s => String(s ?? ''));
    const total  = data.reduce((a,b)=>a+b,0) || 1;
    const pal    = getPalette(opts);
    let start = -Math.PI/2; const arcs=[];
    for (let i=0;i<data.length;i++){
      const val=data[i]; const angle=(val/total)*Math.PI*2; const end=start+angle;
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,start,end); ctx.closePath(); ctx.fillStyle=pal[i%pal.length]; ctx.fill();
      arcs.push({i,val,angle,start,end}); start=end;
    }
    if (opts.showLabels !== false) {
      ctx.font='12px system-ui, sans-serif'; ctx.fillStyle=chartColors().text; ctx.strokeStyle=chartColors().axis; ctx.lineWidth=1;
      for (const a of arcs){
        if (a.angle <= 0.005) continue;
        const mid=(a.start+a.end)/2;
        const elbowR=r*.92, endR=r*1.06;
        const ex=cx+Math.cos(mid)*elbowR, ey=cy+Math.sin(mid)*elbowR;
        const isRight=Math.cos(mid)>=0;
        const tx=cx+Math.cos(mid)*endR + (isRight?8:-8), ty=cy+Math.sin(mid)*endR;
        ctx.beginPath(); ctx.moveTo(ex,ey); ctx.lineTo(tx+(isRight?-6:6),ty); ctx.stroke();
        const name=labels[a.i]??''; ctx.textAlign=isRight?'left':'right'; ctx.textBaseline='middle'; ctx.fillText(name, tx, ty);
      }
    }
    if (opts.showValues !== false) {
      for (const a of arcs){
        if (a.angle <= 0.02) continue;
        const mid=(a.start+a.end)/2; const rx=cx+Math.cos(mid)*r*.62; const ry=cy+Math.sin(mid)*r*.62;
        const frac=a.val/total; const valText= (opts.valueFormat ? String(opts.valueFormat(a.val, frac)) : String(a.val));
        ctx.fillStyle=chartColors().text; ctx.font='12px system-ui, sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(valText, rx, ry);
      }
    }
    if (opts.title){ ctx.fillStyle=chartColors().text; ctx.font='13px system-ui, sans-serif'; ctx.textAlign='left'; ctx.textBaseline='alphabetic'; ctx.fillText(String(opts.title), 6, 14); }
  };

  // ---------- Public API ----------
  const api={
    version:'0.5.3.10',
    _version:'0.5.3.10',
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
    add:{
      title(v){h1.textContent=v??'';}, 
      subtitle(v){p.textContent=v??'';},
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
        }).catch(()=>{});
        return card;
      },
      note(text){ const el=h('p',{class:'ld-note',text:String(text??'')}); if(currentContainer===stack){const card=h('div',{class:'ld-card'});card.appendChild(el);stack.appendChild(card);return card;} currentContainer.appendChild(el);return el; },
      quote(text,author){
        const wrap=h('div',{class:'ld-quote'}, h('span',{text:String(text??'')}), author?h('small',{class:'ld-cite',text:`— ${author}`}):null );
        if(currentContainer===stack){const card=h('div',{class:'ld-card'});card.appendChild(wrap);stack.appendChild(card);return card;}
        currentContainer.appendChild(wrap);return wrap;
      },
		images(list, opts){
		const arr = Array.isArray(list) ? list : (list ? [list] : []);
		const items = arr.map(it => typeof it === 'string' ? { src: it, alt: fileAlt(it) } : { src: String(it.src), alt: it.alt || fileAlt(it.src) }).filter(x => x && x.src);
		if(!items.length) return null;

		const wantGrid = !!(opts && opts.grid === true);

		// Default: album-style (single preview). Also covers single-image case.
		if (!wantGrid || items.length === 1) {
			const first = items[0];
			const fig = h('figure', { class: 'ld-singleimg' },
			h('img', { class: 'ld-singleimg-img', src: first.src, alt: first.alt, loading:'lazy', decoding:'async', onclick: () => openOverlay(items, 0) })
			);
			if(currentContainer===stack){const card=h('div',{class:'ld-card'});card.appendChild(fig);stack.appendChild(card);return card;}
			currentContainer.appendChild(fig);return fig;
		}

		// Grid mode (explicit)
		const grid=h('div',{class:'ld-thumbgrid'});
		items.forEach((it,idx)=>grid.appendChild(h('img',{class:'ld-thumbimg',src:it.src,alt: it.alt, onclick:()=>openOverlay(items,idx)})));
		if(currentContainer===stack){const card=h('div',{class:'ld-card'});card.appendChild(grid);stack.appendChild(card);return card;}
		currentContainer.appendChild(grid);return grid;
		},


      countdown(target, opts = {}) {
        const host = currentContainer===stack ? (()=>{const card=h('div',{class:'ld-card'});stack.appendChild(card);return card;})() : currentContainer;
        const endDate = (target instanceof Date) ? target : new Date(target);
        if (!endDate || isNaN(endDate)) { const el = h('p',{class:'ld-note',text:'Invalid countdown target'}); host.appendChild(el); return el; }
        const wrap = h('div',{class:'ld-countdown'}); if (opts.title) wrap.appendChild(h('div',{class:'ld-sub',text:opts.title}));
        const countwrap = h('div',{class:'ld-countwrap'}); const row = h('div',{class:'ld-countrow'});
        const seg = (unit)=> h('div',{class:'ld-seg'}, h('div',{class:'ld-val',text:'00'}), h('div',{class:'ld-unit',text:unit}));
        const dSeg=seg('days'), hSeg=seg('hours'), mSeg=seg('mins'), sSeg=seg('secs'); const grid=h('div',{class:'ld-countgrid'}, dSeg,hSeg,mSeg,sSeg);
        row.append(grid); countwrap.append(row); wrap.append(countwrap);
        let startMs=null, bar=null; if (opts.start){ const s=(opts.start instanceof Date)?+opts.start:+new Date(opts.start); if (Number.isFinite(s)) startMs=s; }
        if (startMs){ bar=h('div',{class:'ld-progress'}, h('span',{style:'--p:0'})); wrap.appendChild(bar); }
        host.appendChild(wrap);
        const endText=opts.endText||"Done"; const interval=Math.max(200, opts.interval||1000); const hideZeroDays=opts.hideZeroDays !== false;
        function tick(){
          const now=Date.now(); let diff=endDate-now;
          if (diff<=0){ [dSeg,hSeg,mSeg,sSeg].forEach(seg=>{seg.querySelector('.ld-val').textContent='00';}); wrap.classList.add('ld-done'); sSeg.querySelector('.ld-unit').textContent=endText; if(bar) bar.firstElementChild.style.setProperty('--p','1'); clearInterval(id); return; }
          const s=Math.floor(diff/1000)%60, m=Math.floor(diff/60000)%60, h=Math.floor(diff/3600000)%24, d=Math.floor(diff/86400000);
          dSeg.querySelector('.ld-val').textContent=String(d).padStart(2,'0');
          hSeg.querySelector('.ld-val').textContent=String(h).padStart(2,'0');
          mSeg.querySelector('.ld-val').textContent=String(m).padStart(2,'0');
          sSeg.querySelector('.ld-val').textContent=String(s).padStart(2,'0');
          dSeg.style.display=(hideZeroDays && d===0)?'none':'';
          if (startMs){ const total=Math.max(1, endDate-startMs); const p=Math.min(1, Math.max(0, (now-startMs)/total)); bar.firstElementChild.style.setProperty('--p', String(p)); }
          if (diff<10000) wrap.classList.add("ld-urgent"); else wrap.classList.remove("ld-urgent");
        }
        tick(); const id=setInterval(tick, interval); return wrap;
      },
      table(values){
        const tbl = renderTable(values);
        if(currentContainer===stack){const card=h('div',{class:'ld-card'});card.appendChild(tbl);stack.appendChild(card);return card;}
        currentContainer.appendChild(tbl);return tbl;
      },
      chart(values, opts){
        const series = normalizeSeries(values);
        const wrap = h('div',{}), canvas = h('canvas',{class:'ld-canvas'}); wrap.appendChild(canvas);
        const draw = () => { const w=canvas.clientWidth||0; if (w<10){ requestAnimationFrame(draw); return; } try { drawBarChart(canvas, series, opts||{}); } catch(e){ console.error(e); } };
        const ro = new ResizeObserver(()=>draw()); const mount = () => { ro.observe(canvas); draw(); };
		if (api.theme && typeof api.theme.onChange === 'function') api.theme.onChange(() => draw());

        let card; if(currentContainer===stack){card=h('div',{class:'ld-card'});card.appendChild(wrap);stack.appendChild(card);} else { currentContainer.appendChild(wrap); }
        requestAnimationFrame(mount); return card || wrap;
      },
      pie(values, opts){
        const series = normalizeSeries(values);
        const wrap = h('div',{}), canvas = h('canvas',{class:'ld-canvas'}); wrap.appendChild(canvas);
        const draw = () => { const w=canvas.clientWidth||0; if (w<10){ requestAnimationFrame(draw); return; } try { drawPieChart(canvas, series, opts||{}); } catch(e){ console.error(e); } };
        const ro = new ResizeObserver(()=>draw()); const mount = () => { ro.observe(canvas); draw(); };
		if (api.theme && typeof api.theme.onChange === 'function') api.theme.onChange(() => draw());

        let card; if(currentContainer===stack){card=h('div',{class:'ld-card'});card.appendChild(wrap);stack.appendChild(card);} else { currentContainer.appendChild(wrap); }
        requestAnimationFrame(mount); return card || wrap;
      },
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
            values = Array.isArray(data) ? data : (data && typeof data==="object" ? data : []);
          } else {
            const delim = ext==="tsv" ? "\t" : ",";
            const rows = parseDelimited(txt, delim).filter(r=>r.some(c=>String(c).trim()!==""));
            if (!rows.length) throw new Error("Empty file");
            let dataRows = rows, headers=null;
            if (looksLikeHeader(rows[0])) { headers = rows[0].map(s=>String(s).trim().toLowerCase()); dataRows = rows.slice(1); }
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
      async chartfilePingLog(input, opts){
        try{
          const txt = input instanceof Blob ? await input.text() : await (await fetch(String(input), { cache:"no-store" })).text();
          const lines = txt.trim().split(/\r?\n/).filter(Boolean);
          if (!lines.length) throw new Error("empty log");
          const limit = opts?.limit ?? 20; const slice = lines.slice(-limit);
          const seriesByHost = {};
          slice.forEach(line=>{
            const parts = line.split(/\s+/).slice(1);
            parts.forEach(p=>{
              const [host,val] = p.split(":"); if (!host || !val) return;
              const n = Number(val); if (Number.isFinite(n)) (seriesByHost[host] ??= []).push(n);
            });
          });
          if (!Object.keys(seriesByHost).length) throw new Error("no host:value pairs found");
          const values = Object.entries(seriesByHost).map(([host,arr])=>({ label: host, value: Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) }));
          return this.chart(values, { title: opts?.title ?? "Ping Averages", height: opts?.height ?? 180, paddingTop: opts?.paddingTop ?? 36 });
        }catch(err){
          console.error("[LimeDOM.add.chartfilePingLog] failed:", err);
          return this.note(`pinglog: ${String(err.message||err)}`);
        }
      },
      async _readFileText(file){ return await new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(String(r.result||'')); r.onerror=rej; r.readAsText(file); }); },
      filepicker(opts = {}){
        const host = currentContainer===stack ? (()=>{const card=h('div',{class:'ld-card'});stack.appendChild(card);return card;})() : currentContainer;
        const title = opts.title ?? 'Drop a file or click to browse'; const hint  = opts.hint  ?? 'JSON/CSV/TSV → chart · Ping-Check .txt → ping averages';
        const box = h('div',{class:'ld-drop',tabindex:'0'}, h('h4',{text:title}), h('small',{text:hint}) );
        const input = h('input',{type:'file',style:'display:none;',accept:opts.accept || ''});
        const setDrag = on => box.classList[on?'add':'remove']('drag');
        const handleFile = async (file) => {
          try{
            if (typeof opts.onfile === 'function') { const url = URL.createObjectURL(file); return void opts.onfile(file, url); }
            const name = (file.name||'').toLowerCase(); const mode = opts.mode;
            const chartIt = () => api.add.chartfile(file, {title: opts.title2 || opts.title || 'Chart'});
            const pingIt  = () => api.add.chartfilePingLog(file, {title: opts.title2 || opts.title || 'Ping averages', limit: opts.limit || 30});
            if (mode === 'chart')    return chartIt();
            if (mode === 'pinglog')  return pingIt();
            if (mode === 'raw') { const txt = await api.add._readFileText(file); return api.add.note(txt.split(/\r?\n/).slice(0,10).join('\n')); }
            if (mode === 'table') { const txt = await api.add._readFileText(file); const rows = txt.trim().split(/\r?\n/).map(l=>l.split(',')); const headers = rows[0]||[]; const data = rows.slice(1).map(r=>Object.fromEntries(headers.map((k,i)=>[k,r[i]]))); return api.add.table(data); }
            if (name.endsWith('.json') || name.endsWith('.csv') || name.endsWith('.tsv')) return chartIt();
            if (name.endsWith('.txt')) { const txt = await api.add._readFileText(file); const looksPing = /\b\d{2}:\d{2}:\d{2}\s+\w+:\d+(?:\s+\w+:\d+)+/.test(txt); return looksPing ? pingIt() : api.add.note(txt.split(/\r?\n/).slice(0,10).join('\n')); }
            return chartIt();
          }catch(e){ console.error('[LimeDOM.add.filepicker] failed:', e); api.add.note('Could not load file. See console for details.'); }
        };
        box.addEventListener('dragenter', e=>{e.preventDefault(); setDrag(true);});
        box.addEventListener('dragover',  e=>{e.preventDefault(); setDrag(true);});
        box.addEventListener('dragleave', ()=>setDrag(false));
        box.addEventListener('drop', async e=>{ e.preventDefault(); setDrag(false); const f=e.dataTransfer?.files?.[0]; if (f) await handleFile(f); });
        box.addEventListener('click', ()=> input.click());
        input.addEventListener('change', async e=>{ const f = e.target.files?.[0]; if (f) await handleFile(f); input.value=''; });
        host.append(box, input); return box;
      },
    }
  };
  Object.defineProperty(window,'LimeDOM',{value:api,writable:false,enumerable:true});

  // ===== THEME system =====
  (function(){
    const KEY='LimeDOM.theme'; const root=document.documentElement;
    function detectInitial(){ const saved=localStorage.getItem(KEY); if(saved==='light'||saved==='dark') return saved;
      return (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark'; }
    function apply(theme){ root.setAttribute('data-theme', theme); state.current=theme; try{localStorage.setItem(KEY,theme);}catch{} window.dispatchEvent(new CustomEvent('ld:themechange',{detail:{theme}})); }
    const state={ current: detectInitial() }; apply(state.current);
    const Theme={ get current(){return state.current;}, setTo(t){ if(t==='light'||t==='dark') apply(t); }, toggle(){ apply(state.current==='dark'?'light':'dark'); }, onChange(fn){ window.addEventListener('ld:themechange', e=>fn(e.detail.theme)); } };
    api.theme = Theme;
  })();

  // ===== NAVBAR =====
  (function(){
    function svgSun(){ return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"></path></svg>`; }
    function svgMoon(){ return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M21 12.5A8.5 8.5 0 1 1 11.5 3a7 7 0 0 0 9.5 9.5z"></path></svg>`; }
	function makeBtn(spec, invert = false) {
		const btn = document.createElement('button');
		btn.className = 'btn' + (invert ? ' btn-invert' : '');

		if (spec.title) btn.title = spec.title;
		if (spec.aria)  btn.setAttribute('aria-label', spec.aria);

		// Only set content if provided; otherwise leave empty
		if (spec.html != null) {
			btn.innerHTML = spec.html;
		} else if (spec.label != null) {
			btn.textContent = spec.label;
		}

		if (spec.onClick) btn.addEventListener('click', spec.onClick);
		return btn;
	}

	function themeToggleBtn() {
		const invert = true; // opposite colour of current theme
		const btn = makeBtn({}, invert);
		btn.setAttribute('aria-label', 'Toggle theme');

		// clear fallback content
		btn.textContent = '';

		const icon = document.createElement('span');
		icon.className = 'icon';
		icon.innerHTML = (api.theme.current === 'dark')
			? svgSun()
			: svgMoon();

		const txt1 = document.createElement('span');
		const txt2 = document.createElement('span');

		// Initial text parts
		if (api.theme.current === 'dark') {
			txt1.textContent = ''; //'Light';
			txt2.textContent = ''; //'Scheme';
		} else {
			txt1.textContent = ''; //'Dark';
			txt2.textContent = ''; //'Scheme';
		}

		// Order: first word + icon + second word
		btn.append(txt1, icon, txt2);

		btn.addEventListener('click', () => api.theme.toggle());

		api.theme.onChange(t => {
			icon.innerHTML = (t === 'dark') ? svgSun() : svgMoon();
			if (t === 'dark') {
				txt1.textContent = ''; //'Light';
				txt2.textContent = ''; // 'Scheme';
			} else {
				txt1.textContent = ''; // 'Dark';
				txt2.textContent = ''; // 'Scheme';
			}
		});

		return btn;
	}

    const Nav={
      begin(opts={}){
        const bar=document.createElement('nav'); bar.className='ld-navbar';
        const left=document.createElement('div'); left.className='ld-nav-left';
        const right=document.createElement('div'); right.className='ld-nav-right';
        const spacer=document.createElement('div'); spacer.className='ld-nav-spacer';
        if (opts.title){ const t=document.createElement('div'); t.className='ld-nav-title'; t.textContent=opts.title; left.appendChild(t); }
        (opts.left||[]).forEach(spec=>left.appendChild(makeBtn(spec, !!spec.invert)));
        (opts.right||[]).forEach(spec=>right.appendChild(makeBtn(spec, !!spec.invert)));
        if (opts.showTheme !== false) right.appendChild(themeToggleBtn());
        bar.append(left,spacer,right);
        document.body.insertBefore(bar, document.body.firstChild || null);
        return { el:bar, left, right };
      },
      end(){ /* reserved */ }
    };
    api.nav = Nav;
  })();
})();
