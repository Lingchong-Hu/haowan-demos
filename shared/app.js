/* app.js — window.GG 共享外壳。所有 demo 共用。无构建，纯全局。
   API 速查：
     GG.el(tag, props, ...kids)          建 DOM；props.class/style/onClick/html/...
     GG.$(sel,root) / GG.$$(sel,root)    查询
     GG.meta(slug)                       取 registry 项
     GG.mountShell(slug,{sub})           渲染顶栏(返回画廊)+ 设置 accent + 返回 <main.wrap>
     GG.disclaimer(slug)                 涉医/法/财时返回免责声明节点，否则 null
     GG.toast(msg)
     GG.copyText(s) / GG.copyLink()      复制文本 / 复制可复现链接(带 hash 状态)
     GG.encodeState(obj) / GG.decodeState()  URL hash <-> 状态
     GG.thinking(parent, msgs, ms)       思考过场 → Promise，结束后清空 parent
     GG.shareCard(spec)                  Canvas 2D 合成分享图 → 返回 <canvas>
     GG.downloadCanvas(c,name)/copyCanvas(c)
     GG.shareBar(spec)                   结果卡底部「复制文/复制链接/存图」工具栏
     工具：GG.hash(s) GG.rng(seed) GG.shuffle(a,seed) GG.pick(a,seed) GG.clamp GG.fmt
*/
(function(){
const GG = {};
window.GG = GG;

/* ---------------- DOM ---------------- */
GG.el = function(tag, props, ...kids){
  const e = document.createElement(tag);
  if(props){
    for(const k in props){
      const v = props[k];
      if(v==null||v===false) continue;
      if(k==='class') e.className = v;
      else if(k==='style' && typeof v==='object') Object.assign(e.style, v);
      else if(k==='html') e.innerHTML = v;
      else if(k==='text') e.textContent = v;
      else if(k.startsWith('on') && typeof v==='function') e.addEventListener(k.slice(2).toLowerCase(), v);
      else if(k==='dataset') Object.assign(e.dataset, v);
      else e.setAttribute(k, v);
    }
  }
  for(let k of kids.flat()){
    if(k==null||k===false) continue;
    e.appendChild(k.nodeType ? k : document.createTextNode(String(k)));
  }
  return e;
};
GG.$  = (s,r)=> (r||document).querySelector(s);
GG.$$ = (s,r)=> Array.from((r||document).querySelectorAll(s));
GG.clear = n => { while(n.firstChild) n.removeChild(n.firstChild); return n; };

/* ---------------- registry ---------------- */
GG.meta = slug => (window.DEMOS||[]).find(d=>d.slug===slug) || {slug, title:slug, accent:'#e8543f', industry:'', emoji:'✨'};

const DISC_TEXT = '本演示仅作交互展示，结果由本地启发式即时生成，非医疗 / 法律 / 财务建议，请勿据此决策。';
GG.disclaimer = function(slug){
  const m = GG.meta(slug);
  if(!m.disclaimer) return null;
  return GG.el('div',{class:'disclaimer'}, '⚠︎ '+DISC_TEXT);
};

/* ---------------- shell ---------------- */
GG.mountShell = function(slug, opts={}){
  const m = GG.meta(slug);
  document.documentElement.style.setProperty('--accent', m.accent||'#e8543f');
  document.documentElement.style.setProperty('--accent-soft', GG._soft(m.accent||'#e8543f'));
  document.title = (m.title||slug)+' · 那一下';
  const app = GG.$('#app') || document.body;
  GG.clear(app);
  const bar = GG.el('div',{class:'topbar'},
    GG.el('div',{class:'row'},
      GG.el('a',{class:'back', href:'../../index.html'}, '← 好玩的东西'),
      GG.el('div',{class:'ttl'}, GG.el('span',{class:'em'}, m.emoji||'✨'), m.title||slug),
      GG.el('div',{class:'spacer'}),
      m.industry ? GG.el('span',{class:'badge-industry'}, m.industry) : null
    )
  );
  const main = GG.el('main',{class:'wrap'});
  app.appendChild(bar); app.appendChild(main);
  return main;
};
GG._soft = function(hex){ // 同色超浅背景
  const {r,g,b} = GG._rgb(hex);
  return `rgba(${r},${g},${b},.10)`;
};
GG._rgb = function(hex){
  hex = hex.replace('#','');
  if(hex.length===3) hex = hex.split('').map(c=>c+c).join('');
  return {r:parseInt(hex.slice(0,2),16), g:parseInt(hex.slice(2,4),16), b:parseInt(hex.slice(4,6),16)};
};

/* ---------------- toast ---------------- */
let toastEl, toastT;
GG.toast = function(msg){
  if(!toastEl){ toastEl = GG.el('div',{class:'toast'}); document.body.appendChild(toastEl); }
  toastEl.textContent = msg; toastEl.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(()=>toastEl.classList.remove('show'), 1900);
};

/* ---------------- clipboard ---------------- */
GG.copyText = async function(s){
  try{ await navigator.clipboard.writeText(s); GG.toast('已复制文字 ✓'); return true; }
  catch(e){
    try{ const ta=GG.el('textarea',{},s); ta.style.position='fixed'; ta.style.opacity='0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
      GG.toast('已复制文字 ✓'); return true; }
    catch(_){ GG.toast('复制失败，请手动选择'); return false; }
  }
};
GG.copyLink = async function(){
  try{ await navigator.clipboard.writeText(location.href); GG.toast('已复制可复现链接 ✓'); return true; }
  catch(e){ return GG.copyText(location.href); }
};

/* ---------------- URL state ---------------- */
GG.encodeState = function(obj){
  try{
    const json = JSON.stringify(obj);
    const b64 = btoa(unescape(encodeURIComponent(json)));
    location.hash = 's='+b64;
    return true;
  }catch(e){ return false; }
};
GG.decodeState = function(){
  try{
    const h = location.hash.replace(/^#/,'');
    const m = h.match(/s=([^&]+)/);
    if(!m) return null;
    return JSON.parse(decodeURIComponent(escape(atob(m[1]))));
  }catch(e){ return null; }
};

/* ---------------- thinking ---------------- */
GG.thinking = function(parent, msgs, ms){
  msgs = msgs && msgs.length ? msgs : ['分析中…'];
  ms = ms || 1100;
  GG.clear(parent);
  const msgEl = GG.el('div',{class:'msg'}, msgs[0]);
  parent.appendChild(GG.el('div',{class:'thinking'}, GG.el('div',{class:'spinner'}), msgEl));
  let i=0;
  return new Promise(res=>{
    const total = ms;
    const step = total / msgs.length;
    const t = setInterval(()=>{
      i++;
      if(i>=msgs.length){ clearInterval(t); setTimeout(res, 220); return; }
      msgEl.textContent = msgs[i];
    }, step);
  });
};

/* ---------------- 工具：hash / rng / shuffle ---------------- */
GG.hash = function(str){
  str = String(str); let h = 2166136261>>>0;
  for(let i=0;i<str.length;i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h>>>0;
};
GG.rng = function(seed){ // mulberry32，返回 ()=>[0,1)
  let a = (typeof seed==='string' ? GG.hash(seed) : seed)>>>0;
  return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a);
    t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
};
GG.shuffle = function(arr, seed){
  const a = arr.slice(); const rnd = GG.rng(seed==null?Math.random()*1e9:seed);
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
};
GG.pick = function(arr, seed){ return arr[Math.floor(GG.rng(seed)()*arr.length)]; };
GG.clamp = (n,lo,hi)=> Math.max(lo, Math.min(hi, n));
GG.fmt = n => (n||0).toLocaleString('zh-CN');

/* ---------------- Canvas 分享图 ----------------
 spec = {
   slug, accent, title, subtitle?,
   big?: {value, label},
   rows?: [{label,value}],
   bars?: [{label, pct(0-100), color?}],
   swatches?: [{hex, name?}],
   tags?: [string],
   note?: string,           // 一句话理由/总结
   footer?: string          // 不传则用默认品牌行；涉敏感会附免责
 }  返回 <canvas>（已按 2x 渲染，CSS 宽度 = W）
*/
GG.shareCard = function(spec){
  const m = GG.meta(spec.slug||'');
  const accent = spec.accent || m.accent || '#e8543f';
  const W = 720, PAD = 56, scale = 2;
  const measure = document.createElement('canvas').getContext('2d');
  const innerW = W - PAD*2;

  function wrap(ctx, text, font, maxW){
    ctx.font = font; const words = String(text).split(''); // CJK 按字断
    const lines = []; let cur='';
    for(const ch of words){
      if(ch==='\n'){ lines.push(cur); cur=''; continue; }
      const test = cur+ch;
      if(ctx.measureText(test).width > maxW && cur){ lines.push(cur); cur=ch; }
      else cur = test;
    }
    if(cur) lines.push(cur);
    return lines;
  }
  const F = (w,s)=>`${w} ${s}px "Microsoft YaHei","PingFang SC",system-ui,sans-serif`;

  // ---- 测高 ----
  let h = PAD;                          // top pad
  h += 30 + 22;                         // brand row
  const titleLines = wrap(measure, spec.title||'', F(720,34), innerW);
  h += titleLines.length*44 + 6;
  let subLines = [];
  if(spec.subtitle){ subLines = wrap(measure, spec.subtitle, F(400,18), innerW); h += subLines.length*28 + 8; }
  if(spec.big){ h += 110; }
  let noteLines = [];
  if(spec.note){ noteLines = wrap(measure, spec.note, F(400,17), innerW); h += 16 + noteLines.length*26 + 8; }
  if(spec.bars && spec.bars.length){ h += 8 + spec.bars.length*48; }
  let rowWraps = [];
  if(spec.rows && spec.rows.length){
    h += 10;
    for(const r of spec.rows){ const vl = wrap(measure, r.value, F(560,17), innerW-150); rowWraps.push(vl); h += Math.max(1,vl.length)*26 + 10; }
  }
  if(spec.swatches && spec.swatches.length){ h += 18 + 96; }
  if(spec.tags && spec.tags.length){ h += 16 + 38; }
  const footer = spec.footer || ('那一下 · '+(m.title||spec.slug||'AI 交互 Demo 画廊'));
  const footLines = wrap(measure, footer, F(400,14), innerW);
  h += 24 + footLines.length*20 + PAD;  // footer + bottom pad
  let discLines = [];
  if(m.disclaimer){ discLines = wrap(measure, DISC_TEXT, F(400,13), innerW); h += discLines.length*19 + 6; }

  const H = Math.round(h);
  // ---- 渲染 ----
  const cv = document.createElement('canvas');
  cv.width = W*scale; cv.height = H*scale;
  cv.style.width = W+'px'; cv.style.height = H+'px';
  const ctx = cv.getContext('2d'); ctx.scale(scale,scale);
  ctx.textBaseline='alphabetic';

  // bg
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,W,H);
  // accent top bar
  ctx.fillStyle = accent; ctx.fillRect(0,0,W,8);

  let y = PAD + 22;
  // brand row: emoji + 标题/产业
  ctx.font = F(400,26); ctx.fillText(m.emoji||'✨', PAD, y);
  ctx.font = F(680,15); ctx.fillStyle = accent;
  ctx.fillText('那一下 · '+(m.industry||'AI Demo'), PAD+40, y-3);
  y += 30;

  // title
  ctx.fillStyle = '#1d1d1f'; ctx.font = F(720,34);
  for(const ln of titleLines){ y += 40; ctx.fillText(ln, PAD, y); }
  y += 6;
  // subtitle
  if(subLines.length){ ctx.fillStyle='#55555c'; ctx.font=F(400,18);
    for(const ln of subLines){ y+=26; ctx.fillText(ln, PAD, y);} y+=10; }

  // big number
  if(spec.big){
    y += 78;
    ctx.fillStyle = accent; ctx.font = F(780,72);
    ctx.fillText(String(spec.big.value), PAD, y);
    const vw = ctx.measureText(String(spec.big.value)).width;
    ctx.fillStyle='#8a8a93'; ctx.font=F(560,18);
    ctx.fillText(spec.big.label||'', PAD+vw+14, y-6);
    y += 28;
  }
  // note
  if(noteLines.length){
    y += 16; ctx.fillStyle='#1d1d1f'; ctx.font=F(400,17);
    for(const ln of noteLines){ y+=26; ctx.fillText('“'+ln+(ln===noteLines[noteLines.length-1]?'”':''), PAD, y);}
    y += 8;
  }
  // bars
  if(spec.bars && spec.bars.length){
    y += 8;
    for(const b of spec.bars){
      const by = y + 14;
      ctx.fillStyle='#55555c'; ctx.font=F(560,15);
      ctx.fillText(b.label, PAD, by);
      const labW = 150, barX = PAD+labW, barW = innerW-labW-56;
      ctx.fillStyle='#f0f0ec'; GG._round(ctx, barX, by-12, barW, 12, 6); ctx.fill();
      ctx.fillStyle = b.color || accent;
      const w = Math.max(6, barW*GG.clamp(b.pct,0,100)/100);
      GG._round(ctx, barX, by-12, w, 12, 6); ctx.fill();
      ctx.fillStyle='#8a8a93'; ctx.font=F(560,14); ctx.textAlign='right';
      ctx.fillText(Math.round(b.pct)+'%', PAD+innerW, by); ctx.textAlign='left';
      y += 48;
    }
  }
  // rows
  if(spec.rows && spec.rows.length){
    y += 10;
    spec.rows.forEach((r,idx)=>{
      ctx.fillStyle='#8a8a93'; ctx.font=F(560,15);
      ctx.fillText(r.label, PAD, y+18);
      ctx.fillStyle='#1d1d1f'; ctx.font=F(560,17);
      const vl = rowWraps[idx];
      vl.forEach((ln,li)=> ctx.fillText(ln, PAD+150, y+18+li*26));
      y += Math.max(1,vl.length)*26 + 10;
    });
  }
  // swatches
  if(spec.swatches && spec.swatches.length){
    y += 18;
    const n = spec.swatches.length, gap=8, sw=(innerW-(n-1)*gap)/n, sh=72;
    spec.swatches.forEach((s,i)=>{
      const x = PAD + i*(sw+gap);
      ctx.fillStyle = s.hex; GG._round(ctx,x,y,sw,sh,10); ctx.fill();
      if(s.name){ ctx.fillStyle='rgba(255,255,255,.92)'; GG._round(ctx,x+6,y+sh-26,sw-12,20,6); ctx.fill();
        ctx.fillStyle='#333'; ctx.font=F(560,11); ctx.textAlign='center';
        ctx.fillText(s.name, x+sw/2, y+sh-11); ctx.textAlign='left'; }
    });
    y += sh + 24;
  }
  // tags
  if(spec.tags && spec.tags.length){
    y += 16; let tx = PAD;
    ctx.font=F(560,14);
    spec.tags.forEach(t=>{
      const tw = ctx.measureText(t).width + 24;
      if(tx+tw > PAD+innerW){ return; }
      ctx.fillStyle = GG._soft(accent).replace('.10','.16');
      GG._round(ctx,tx,y,tw,28,14); ctx.fill();
      ctx.fillStyle = accent; ctx.fillText(t, tx+12, y+19);
      tx += tw + 8;
    });
    y += 38;
  }
  // footer
  y += 24;
  ctx.strokeStyle='#f0f0ec'; ctx.beginPath(); ctx.moveTo(PAD,y-12); ctx.lineTo(PAD+innerW,y-12); ctx.stroke();
  ctx.fillStyle='#8a8a93'; ctx.font=F(400,14);
  for(const ln of footLines){ ctx.fillText(ln, PAD, y+4); y+=20; }
  if(discLines.length){ ctx.fillStyle='#b0b0b8'; ctx.font=F(400,13);
    for(const ln of discLines){ y+=19; ctx.fillText(ln, PAD, y);} }

  return cv;
};
GG._round = function(ctx,x,y,w,h,r){
  r = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
};

GG.downloadCanvas = function(cv, name){
  cv.toBlob(b=>{
    const url = URL.createObjectURL(b);
    const a = GG.el('a',{href:url, download:(name||'那一下-结果')+'.png'});
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 1500);
    GG.toast('已存图 ✓');
  }, 'image/png');
};
GG.copyCanvas = async function(cv){
  try{
    if(!window.ClipboardItem) throw new Error('no ClipboardItem');
    const blob = await new Promise(r=>cv.toBlob(r,'image/png'));
    await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);
    GG.toast('结果图已复制 ✓'); return true;
  }catch(e){ GG.downloadCanvas(cv); return false; }
};

/* ---------------- shareBar ----------------
   spec 同 shareCard，外加 spec.copyText（复制的文字摘要，缺省自动拼） */
GG.shareBar = function(spec){
  const textSummary = spec.copyText || GG._autoText(spec);
  let cardCache = null;
  const getCard = ()=> (cardCache || (cardCache = GG.shareCard(spec)));
  const bar = GG.el('div',{class:'sharebar'},
    GG.el('button',{class:'btn primary', onClick:()=>GG.copyCanvas(getCard())}, '📷 复制结果图'),
    GG.el('button',{class:'btn', onClick:()=>GG.downloadCanvas(getCard(), (spec.slug||'结果'))}, '⬇️ 存图'),
    GG.el('button',{class:'btn', onClick:()=>GG.copyText(textSummary)}, '📝 复制文字'),
    GG.el('button',{class:'btn', onClick:()=>GG.copyLink()}, '🔗 复制链接')
  );
  return bar;
};
GG._autoText = function(spec){
  const lines = [];
  if(spec.title) lines.push(spec.title);
  if(spec.subtitle) lines.push(spec.subtitle);
  if(spec.big) lines.push(`${spec.big.label||''} ${spec.big.value}`);
  if(spec.note) lines.push('“'+spec.note+'”');
  if(spec.bars) spec.bars.forEach(b=>lines.push(`· ${b.label}：${Math.round(b.pct)}%`));
  if(spec.rows) spec.rows.forEach(r=>lines.push(`· ${r.label}：${r.value}`));
  if(spec.tags && spec.tags.length) lines.push(spec.tags.map(t=>'#'+t).join(' '));
  lines.push(''); lines.push('—— 那一下 · AI 交互 Demo 画廊  '+location.href);
  return lines.join('\n');
};

/* 给结果卡套一层标准容器（含分享栏 + 免责） */
GG.resultCard = function(slug, inner, shareSpec){
  const card = GG.el('div',{class:'card pad result'});
  (Array.isArray(inner)?inner:[inner]).forEach(n=> n && card.appendChild(n));
  const disc = GG.disclaimer(slug); if(disc) card.appendChild(disc);
  if(shareSpec) card.appendChild(GG.shareBar(shareSpec));
  return card;
};

/* ════════════════════════════════════════════════════════════════════════
   GG.llm — 全站共享 LLM 连接器（连一次 key 全站通用）
   ────────────────────────────────────────────────────────────────────────
   本站纯静态托管、无后端，两条通路按优先级：
     ① 后端代理 GG.llm.PROXY：服务端持 key + 限流 + 每日上限 → 公开链接可防滥用（安全做法）。
     ② 浏览器直连（BYOK）：访问者自带 key，仅存其本机 localStorage。没 key 时各 demo 退回本地引擎。
   ⚠️ TODO（公开上线前）：部署 serverless 代理，把 GG.llm.PROXY 指过去，移除浏览器直连分支
       （前端持有的 key 会暴露、可被盗刷）。模型用便宜的小模型即可。
   demo 用法：
     main.appendChild(GG.llm.bar());                          // 放一个「连接 AI」状态条
     if(GG.llm.connected()){ obj = await GG.llm.json(SYS, userText, {max_tokens:2000}); }
     else { ...本地兜底... }
     resultCard.prepend(GG.llm.badge(fromAI));                // 标注用了哪个引擎
   json()/text() 失败时 throw（err.code ∈ NEED_SETUP|BAD_KEY|NET|PARSE_FAIL）。
   ════════════════════════════════════════════════════════════════════════ */
GG.llm = (function(){
  const KEY_LS = 'haowan_anthropic_key';
  const api = { PROXY:'', MODEL:'claude-haiku-4-5-20251001' };

  api.getKey = ()=>{ try{ return localStorage.getItem(KEY_LS)||''; }catch(e){ return ''; } };
  api.setKey = v =>{ try{ v?localStorage.setItem(KEY_LS,v):localStorage.removeItem(KEY_LS); }catch(e){} };
  api.connected = ()=> !!api.PROXY || !!api.getKey();

  api.safeParse = function(raw){
    if(!raw) return null;
    let s = String(raw).trim();
    s = s.replace(/^```json\s*/i,'').replace(/^```\s*/,'').replace(/```\s*$/,'').trim();
    try{ return JSON.parse(s); }catch(e){}
    const a=s.indexOf('{'), b=s.lastIndexOf('}');
    if(a>=0&&b>a){ try{ return JSON.parse(s.slice(a,b+1)); }catch(e){} }
    const c=s.indexOf('['), d=s.lastIndexOf(']');
    if(c>=0&&d>c){ try{ return JSON.parse(s.slice(c,d+1)); }catch(e){} }
    return null;
  };

  async function rawCall(system, user, opts, prefill){
    opts = opts||{};
    if(api.PROXY){
      const r = await fetch(api.PROXY, { method:'POST', headers:{'content-type':'application/json'},
        body: JSON.stringify({ system, user, max_tokens:opts.max_tokens||1200 }) });
      if(!r.ok) throw new Error('后端代理出错（'+r.status+'）');
      const j = await r.json();
      return j && j.text!==undefined ? j.text : (typeof j==='string'? j : JSON.stringify(j));
    }
    const key = api.getKey();
    if(!key){ const e=new Error('NEED_SETUP'); e.code='NEED_SETUP'; throw e; }
    const messages = [{ role:'user', content:user }];
    if(prefill) messages.push({ role:'assistant', content:prefill });
    let r;
    try{
      r = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{ 'x-api-key':key, 'anthropic-version':'2023-06-01',
          'anthropic-dangerous-direct-browser-access':'true', 'content-type':'application/json' },
        body: JSON.stringify({ model:opts.model||api.MODEL, max_tokens:opts.max_tokens||1200, system, messages })
      });
    }catch(e){ const err=new Error('NET'); err.code='NET'; throw err; }
    if(r.status===401){ const e=new Error('BAD_KEY'); e.code='BAD_KEY'; throw e; }
    if(!r.ok){ let m=''; try{ const j=await r.json(); m=(j.error&&j.error.message)||''; }catch(_){}
      throw new Error('调用失败（'+r.status+'）'+(m?'：'+m:'')); }
    const data = await r.json();
    return (data.content && data.content[0] && data.content[0].text) || '';
  }

  /* 返回解析后的 JSON 对象/数组（默认预填 '{' 强制 JSON；要数组传 opts.prefill='[' 或 ''） */
  api.json = async function(system, user, opts){
    opts = opts||{};
    const prefill = opts.prefill!==undefined ? opts.prefill : '{';
    const raw = await rawCall(system, user, opts, prefill);
    const obj = api.safeParse((prefill||'') + raw);
    if(!obj){ const e=new Error('PARSE_FAIL'); e.code='PARSE_FAIL'; throw e; }
    return obj;
  };
  api.text = function(system, user, opts){ return rawCall(system, user, opts, ''); };

  /* 状态条 + 内联连接面板（自包含，返回一个 DOM 节点；连接/清除后调 onChange(connected)） */
  api.bar = function(onChange){
    const root = GG.el('div',{class:'llmbar'});
    let panel=null;
    function paint(){
      GG.clear(root); panel=null;
      const on = api.connected();
      root.appendChild(GG.el('span',{class:'llmdot'+(on?' on':'')}));
      root.appendChild(GG.el('span',{class:'llmtxt'},
        on ? '已连接 AI · 用真实模型生成' : '未连接 · 现用本地示例引擎（连接后升级为真实 AI）'));
      root.appendChild(GG.el('button',{class:'llmlink', onClick:toggle}, on?'管理':'连接 AI 升级'));
    }
    function toggle(){
      if(panel){ panel.remove(); panel=null; return; }
      const input = GG.el('input',{class:'field', type:'password', autocomplete:'off',
        placeholder:'粘贴 Anthropic API Key（sk-ant-…）', value:api.getKey()});
      const save = GG.el('button',{class:'btn primary', onClick:()=>{
        api.setKey(input.value.trim()); GG.toast(input.value.trim()?'已连接 ✓':'已清除');
        paint(); onChange && onChange(api.connected());
      }}, '保存');
      const clr = api.getKey() ? GG.el('button',{class:'btn ghost', onClick:()=>{
        api.setKey(''); GG.toast('已清除'); paint(); onChange && onChange(false);
      }}, '清除') : null;
      panel = GG.el('div',{class:'llmpanel'},
        GG.el('p',{html:'纯静态站点没有后端。给一个 Anthropic API Key 即可用<b>真实模型</b>生成——'+
          'key <b>只存你本机浏览器</b>、不上传服务器；用便宜的 Haiku，花费极低。没有 key 也能玩（走本地示例引擎）。<br>'+
          '⚠️ 要公开分享给别人用，应改后端代理（见 app.js 里 GG.llm 顶部 TODO）。'}),
        GG.el('div',{class:'row', style:{flexWrap:'wrap'}}, input, save, clr));
      root.appendChild(panel); input.focus();
    }
    paint();
    return root;
  };

  api.badge = function(ai){ return GG.el('span',{class:'llm-badge'+(ai?' ai':'')},
    ai ? '✨ 真实 AI 生成' : '本地示例引擎'); };

  /* 统一的错误兜底文案（demo 可用） */
  api.errMsg = function(err){
    const c = err && err.code;
    if(c==='NEED_SETUP') return '还没连接 AI，已用本地引擎';
    if(c==='BAD_KEY') return 'API Key 无效，已用本地引擎';
    if(c==='NET') return '连不上模型，已用本地引擎';
    if(c==='PARSE_FAIL') return 'AI 返回异常，已用本地引擎';
    return 'AI 生成失败，已用本地引擎';
  };

  return api;
})();

})();
