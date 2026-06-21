/* dinner — 今天吃什么 / What's for Dinner
   一段美食社媒帖子 → LLM 现场抽取菜品意图 → 结构化菜谱 JSON → 前端图文渲染。
   卖点：任意非结构化输入 → 可靠、边界不崩的结构化成品。
   ── 核心引擎是 live LLM（见下方 callEngine）；外围榜单/计数为 data.js 里的 mock。 */
(function(){
const SLUG = 'dinner';

/* ════════════════════════════════════════════════════════════════════════
   LLM 通路
   ────────────────────────────────────────────────────────────────────────
   本网站为纯静态托管（GitHub Pages），没有后端。两条通路按优先级：
     ① 后端代理 PROXY_URL：服务端持 key + 限流 + 每日花费上限 → 公开链接可防滥用。
        ★ 这是把公开链接安全暴露给陌生人的唯一正确做法。
     ② 浏览器直连 Anthropic API（BYOK）：访问者自带 key，仅存其本机 localStorage，
        适合「同源 / artifact 环境」或「自带 key 的本地测试」。
   ⚠️ TODO（公开上线前）：部署一个 serverless 代理（如 /api/dinner），把 PROXY_URL 指过去，
       届时可移除浏览器直连分支——否则任何前端持有的 key 都会暴露、可被盗刷。
   用便宜的小模型即可（输出是短结构化 JSON）。
   ════════════════════════════════════════════════════════════════════════ */
const PROXY_URL = '';                              // 部署后端代理后填它的 URL；留空则走 BYOK 直连
const MODEL     = 'claude-haiku-4-5-20251001';     // 便宜小模型，足够产短 JSON
const KEY_LS    = 'dinner_anthropic_key';

const SYS = [
  '你是「今天吃什么」引擎：把一段美食类社交媒体帖子，转成一份今晚就能照着做的结构化菜谱。',
  '只输出严格 JSON（单个对象），不要 markdown 代码块、不要任何前言或解释文字。',
  'JSON 字段：',
  '{',
  '  "is_food": boolean,        // 这段输入是否真的在讲某道吃的 / 某个做菜内容',
  '  "dish_name": string,       // 菜名，要贴合帖子里那道菜',
  '  "one_line": string,        // 一句话馋人描述，不超过 30 字',
  '  "servings": number,        // 份数（整数）',
  '  "time_minutes": number,    // 预计总耗时分钟（整数）',
  '  "difficulty": "easy"|"medium"|"hard",',
  '  "ingredients": [ {"name": string, "amount": string, "emoji": string} ],  // 4-10 项，emoji 选最贴切的食材 emoji',
  '  "steps": [ {"title": string, "detail": string, "minutes": number|null, "icon": string} ],  // 3-7 步',
  '  "source_snippet": string   // 从原帖截取的、触发这道菜的一小段原文（不超过 40 字）',
  '}',
  '硬规则：',
  '1) 内容必须真实源自给定帖子——dish_name / ingredients / steps 要贴合帖子里提到的菜、食材和做法，绝不套用与帖子无关的通用模板。',
  '2) 不同的帖子必须产出明显不同的菜谱。',
  '3) 若输入根本不是讲吃的 / 做菜（如风景、心情、广告、随便一段话），把 is_food 设为 false，其余字段可留空字符串 / 空数组 / 0；绝不硬编一道菜。',
  '4) step.icon 只能从这 8 个里选最贴切的一个：knife(切配) pan(煎炒) pot(炖煮) oven(烘烤) mix(拌/腌) timer(等待计时) plate(摆盘装盘) flame(大火收汁)。',
  '5) 全部用简体中文。'
].join('\n');

function getKey(){ try{ return localStorage.getItem(KEY_LS) || ''; }catch(e){ return ''; } }
function setKey(v){ try{ v ? localStorage.setItem(KEY_LS, v) : localStorage.removeItem(KEY_LS); }catch(e){} }
function connected(){ return !!PROXY_URL || !!getKey(); }

/* 调用引擎 → 返回契约 JSON 对象（未规整）。失败时 throw（err.code 标记类型）。 */
async function callEngine(post){
  // ① 后端代理：约定直接返回契约 JSON 对象
  if(PROXY_URL){
    const r = await fetch(PROXY_URL, {
      method:'POST', headers:{'content-type':'application/json'},
      body: JSON.stringify({ post })
    });
    if(!r.ok) throw new Error('后端代理出错（'+r.status+'）');
    return await r.json();
  }
  // ② 浏览器直连（BYOK）
  const key = getKey();
  if(!key){ const e = new Error('NEED_SETUP'); e.code='NEED_SETUP'; throw e; }
  let r;
  try{
    r = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',   // 允许浏览器直连
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL, max_tokens: 1200, system: SYS,
        messages: [
          { role:'user', content: post },
          { role:'assistant', content: '{' }   // 预填 '{' 强制模型直接吐 JSON
        ]
      })
    });
  }catch(netErr){ const e = new Error('NET'); e.code='NET'; throw e; }
  if(r.status===401){ const e = new Error('BAD_KEY'); e.code='BAD_KEY'; throw e; }
  if(!r.ok){
    let m=''; try{ const j=await r.json(); m=(j.error&&j.error.message)||''; }catch(_){}
    throw new Error('调用失败（'+r.status+'）'+(m?'：'+m:''));
  }
  const data = await r.json();
  const text = (data.content && data.content[0] && data.content[0].text) || '';
  const obj  = safeParse('{' + text);             // 补回预填的 '{'
  if(!obj){ const e = new Error('PARSE_FAIL'); e.code='PARSE_FAIL'; throw e; }
  return obj;
}

/* 安全解析：容忍 markdown 包裹 / 前后噪声 */
function safeParse(raw){
  if(!raw) return null;
  let s = String(raw).trim();
  s = s.replace(/^```json\s*/i,'').replace(/^```\s*/,'').replace(/```\s*$/,'').trim();
  try{ return JSON.parse(s); }catch(e){}
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if(a>=0 && b>a){ try{ return JSON.parse(s.slice(a, b+1)); }catch(e){} }
  return null;
}

/* 规整 + 兜底：保证后续渲染拿到的字段类型可靠 */
const ICONSET = ['knife','pan','pot','oven','mix','timer','plate','flame'];
const DIFF = { easy:'简单', medium:'中等', hard:'有点挑战' };
function normalize(d){
  d = d || {};
  return {
    is_food: !!d.is_food,
    dish_name: (d.dish_name && String(d.dish_name)) || '未命名料理',
    one_line: d.one_line ? String(d.one_line) : '',
    servings: parseInt(d.servings,10) || null,
    time_minutes: parseInt(d.time_minutes,10) || null,
    difficulty: DIFF[d.difficulty] ? d.difficulty : null,
    ingredients: Array.isArray(d.ingredients) ? d.ingredients.filter(x=>x&&x.name).map(x=>({
      name:String(x.name), amount:x.amount?String(x.amount):'', emoji:(x.emoji&&String(x.emoji))||'🍽️'
    })) : [],
    steps: Array.isArray(d.steps) ? d.steps.filter(x=>x&&(x.title||x.detail)).map(x=>({
      title:String(x.title||''), detail:String(x.detail||''),
      minutes:(x.minutes==null||x.minutes==='')?null:(parseInt(x.minutes,10)||null),
      icon: ICONSET.includes(x.icon) ? x.icon : 'pan'
    })) : [],
    source_snippet: d.source_snippet ? String(d.source_snippet) : ''
  };
}

/* ════════════════════════════════════════════════════════════════════════
   视觉：步骤图标（统一线条风）/ 插画式主视觉（构图化盘子 + 主料色块）
   ════════════════════════════════════════════════════════════════════════ */
const ICONS = {
  knife:'<path d="M4 20 17 7"/><path d="M14.5 3.8c2.4-1 4.8.6 4.8 3.4 0 2.6-2.4 4-4.8 3"/><path d="M4 20l-1.4 1.4"/>',
  pan:'<path d="M3 12.5h13a0 0 0 0 1 0 0 6.5 6.5 0 0 1-13 0z"/><path d="M16 12.5h5.5"/><path d="M7 6l1.4 1.4M11 5l1.4 1.4"/>',
  pot:'<path d="M5.5 10.5h13v5.5a3 3 0 0 1-3 3h-7a3 3 0 0 1-3-3z"/><path d="M3.5 10.5h17"/><path d="M9.5 6.5c0-1.2.6-1.8 0-3M14.5 6.5c0-1.2.6-1.8 0-3"/>',
  oven:'<rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M4 9.2h16"/><circle cx="7.5" cy="6.6" r=".7"/><circle cx="10.5" cy="6.6" r=".7"/><path d="M8.5 13.5h7"/>',
  mix:'<path d="M5 11a7 4.2 0 0 0 14 0z"/><path d="M5 11h14"/><path d="M15.5 11 18 3.5"/>',
  timer:'<circle cx="12" cy="13.5" r="7.2"/><path d="M12 13.5V9.3"/><path d="M9.4 3.2h5.2"/><path d="M18.5 7 20 5.5"/>',
  plate:'<circle cx="12" cy="12" r="8.2"/><circle cx="12" cy="12" r="4.2"/>',
  flame:'<path d="M12 3.2c1.2 4.2 5 5.2 5 9.3a5 5 0 0 1-10 0c0-2 1-3.2 2.1-4.2.4 2 2 2.2 3 1.1-1.1-2.1.1-4.3-.1-6.2z"/>'
};
function icon(name){
  const p = ICONS[name] || ICONS.pan;
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" '+
         'stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>';
}

const PAL = ['#e9a23b','#d9542e','#7fae3a','#c0392b','#e07b39','#b5651d','#8fbf5a','#e8c34a','#cf6f3a','#6aa84f'];
function plateColors(seed){ return GG.shuffle(PAL, GG.hash('p'+seed)).slice(0,4); }

let _pid = 0;
function plateSVG(name, ings){
  const id = 'dnp'+(++_pid);
  const cols = plateColors(name||'x');
  const rnd = GG.rng(GG.hash('b'+(name||'')));
  let blobs = '';
  for(let i=0;i<4;i++){
    const ang = (i/4)*Math.PI*2 + rnd()*1.4;
    const dist = 12 + rnd()*22;
    const cx = 74 + Math.cos(ang)*dist, cy = 74 + Math.sin(ang)*dist;
    const rx = 18 + rnd()*16, ry = 14 + rnd()*13, rot = Math.floor(rnd()*180);
    blobs += '<ellipse cx="'+cx.toFixed(1)+'" cy="'+cy.toFixed(1)+'" rx="'+rx.toFixed(1)+'" ry="'+ry.toFixed(1)+
             '" fill="'+cols[i]+'" opacity=".9" transform="rotate('+rot+' '+cx.toFixed(1)+' '+cy.toFixed(1)+')"/>';
  }
  const em  = (ings && ings[0] && ings[0].emoji) || '🍽️';
  const em2 = (ings && ings[2] && ings[2].emoji) || '';
  return '<svg class="dn-plate" viewBox="0 0 148 148" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="'+(name||'料理')+' 示意图">'+
    '<defs><clipPath id="'+id+'"><circle cx="74" cy="74" r="50"/></clipPath></defs>'+
    '<circle cx="74" cy="74" r="63" fill="#fff" stroke="var(--line)" stroke-width="2"/>'+
    '<circle cx="74" cy="74" r="52" fill="#faf6f0" stroke="var(--line-2)" stroke-width="1"/>'+
    '<g clip-path="url(#'+id+')">'+blobs+'</g>'+
    '<circle cx="74" cy="74" r="52" fill="none" stroke="rgba(0,0,0,.04)" stroke-width="1"/>'+
    '<text x="60" y="90" font-size="34" text-anchor="middle">'+em+'</text>'+
    (em2 ? '<text x="98" y="64" font-size="24" text-anchor="middle" opacity=".95">'+em2+'</text>' : '')+
    '</svg>';
}

/* ════════════════════════════════════════════════════════════════════════
   分享卡（Canvas）—— 插画主视觉 + 菜名 + 徽章 + 来源片段 + 第一步 + 水印/CTA
   TODO（文案占位，留给用户后填）：水印 + CTA，保持克制各一行。
   ════════════════════════════════════════════════════════════════════════ */
const WATERMARK = '今天吃什么 · 好玩的东西';
const CTA       = '贴一段帖子，生成你的那一份 →';

function drawPlate(ctx, cx, cy, r, d){
  ctx.save();
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(cx,cy,r,0,7); ctx.fill();
  ctx.lineWidth=2; ctx.strokeStyle='#e7e7e3'; ctx.stroke();
  const inner = r-9;
  ctx.fillStyle='#faf6f0'; ctx.beginPath(); ctx.arc(cx,cy,inner,0,7); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(cx,cy,inner,0,7); ctx.clip();
  const cols = plateColors(d.dish_name||'x');
  const rnd  = GG.rng(GG.hash('b'+(d.dish_name||'')));
  for(let i=0;i<4;i++){
    const ang = (i/4)*Math.PI*2 + rnd()*1.4;
    const dist = inner*(0.12 + rnd()*0.34);
    const x = cx + Math.cos(ang)*dist, yy = cy + Math.sin(ang)*dist;
    const rx = inner*(0.30 + rnd()*0.22), ry = inner*(0.24 + rnd()*0.18);
    ctx.save(); ctx.translate(x,yy); ctx.rotate(rnd()*Math.PI);
    ctx.fillStyle=cols[i]; ctx.globalAlpha=.9;
    ctx.beginPath(); ctx.ellipse(0,0,rx,ry,0,0,7); ctx.fill(); ctx.restore();
  }
  ctx.restore();
  const em = (d.ingredients && d.ingredients[0] && d.ingredients[0].emoji) || '🍽️';
  ctx.font = Math.round(r*0.6)+'px "Segoe UI Emoji","Apple Color Emoji",system-ui';
  ctx.textAlign='center'; ctx.globalAlpha=1; ctx.fillText(em, cx-r*0.1, cy+r*0.22); ctx.textAlign='left';
  ctx.restore();
}

function buildShareCanvas(d){
  const accent = GG.meta(SLUG).accent || '#e0651f';
  const SOFT = GG._soft(accent).replace('.10','.16');
  const W=720, PAD=48, scale=2, innerW=W-PAD*2;
  const plateD=150, gap=22, rightX=PAD+plateD+gap, rightW=innerW-plateD-gap;
  const F = (w,s)=> w+' '+s+'px "PingFang SC","Microsoft YaHei",system-ui,sans-serif';
  const meas = document.createElement('canvas').getContext('2d');
  function wrap(text, font, maxW){
    meas.font=font; const out=[]; let cur='';
    for(const ch of String(text)){
      if(ch==='\n'){ out.push(cur); cur=''; continue; }
      if(meas.measureText(cur+ch).width>maxW && cur){ out.push(cur); cur=ch; } else cur+=ch;
    }
    if(cur) out.push(cur); return out;
  }

  const titleLines = wrap(d.dish_name, F(750,30), rightW);
  const oneLines   = d.one_line ? wrap(d.one_line, F(400,15), rightW) : [];
  const srcLines   = d.source_snippet ? wrap('“'+d.source_snippet+'”', F(400,15), innerW) : [];
  const s0 = d.steps[0] || null;
  const stepLines  = s0 ? wrap(s0.detail||'', F(400,15), innerW).slice(0,2) : [];
  const badgeTexts = [];
  if(d.servings) badgeTexts.push(d.servings+' 人份');
  if(d.time_minutes) badgeTexts.push(d.time_minutes+' 分钟');
  if(d.difficulty) badgeTexts.push(DIFF[d.difficulty]);

  const headH = Math.max(plateD, 8 + titleLines.length*36 + (oneLines.length?8+oneLines.length*22:0) + 24 + 24);
  let H = PAD + 22 + 10 + headH + 8;
  if(srcLines.length) H += srcLines.length*24 + 14;
  H += 25;                                                   // divider
  if(s0) H += 20 + 24 + stepLines.length*22 + 12;
  H += 10 + 24 + PAD + 6;                                    // footer + bottom pad
  H = Math.round(H);

  const cv = document.createElement('canvas');
  cv.width=W*scale; cv.height=H*scale; cv.style.width=W+'px'; cv.style.height=H+'px';
  const ctx = cv.getContext('2d'); ctx.scale(scale,scale); ctx.textBaseline='alphabetic';
  ctx.fillStyle='#fff'; ctx.fillRect(0,0,W,H);
  ctx.fillStyle=accent; ctx.fillRect(0,0,W,8);

  let y = PAD;
  // brand
  const brand='🍲 今天吃什么';
  ctx.font=F(700,15); ctx.fillStyle=accent; ctx.fillText(brand, PAD, y+16);
  const bw=ctx.measureText(brand).width;
  ctx.font=F(400,13); ctx.fillStyle='#8a8a93'; ctx.fillText('AI 把一段帖子变成一道菜', PAD+bw+12, y+16);
  y += 32;

  // head: plate + title/one_line/badges
  const headTop=y;
  drawPlate(ctx, PAD+plateD/2, headTop+plateD/2, plateD/2-4, d);
  let ty=headTop;
  ctx.fillStyle='#1d1d1f'; ctx.font=F(750,30);
  for(const ln of titleLines){ ty+=36; ctx.fillText(ln, rightX, ty); }
  if(oneLines.length){ ty+=8; ctx.fillStyle='#55555c'; ctx.font=F(400,15);
    for(const ln of oneLines){ ty+=22; ctx.fillText(ln, rightX, ty); } }
  ty+=26;
  { let bx=rightX; ctx.font=F(600,13);
    for(const b of badgeTexts){ const w=ctx.measureText(b).width+22;
      ctx.fillStyle=SOFT; GG._round(ctx,bx,ty-15,w,24,12); ctx.fill();
      ctx.fillStyle=accent; ctx.fillText(b,bx+11,ty+1); bx+=w+8; } }
  y = headTop + headH + 8;

  // source
  if(srcLines.length){
    const blockH=srcLines.length*24;
    ctx.fillStyle=accent; ctx.fillRect(PAD, y, 3, blockH);
    ctx.fillStyle='#55555c'; ctx.font=F(400,15);
    let sy=y+17; for(const ln of srcLines){ ctx.fillText(ln, PAD+13, sy); sy+=24; }
    y += blockH + 14;
  }
  // divider
  ctx.strokeStyle='#f0f0ec'; ctx.beginPath(); ctx.moveTo(PAD,y); ctx.lineTo(PAD+innerW,y); ctx.stroke();
  y += 25;
  // first step
  if(s0){
    ctx.fillStyle=accent; ctx.font=F(700,13); ctx.fillText('第一步', PAD, y); y+=20;
    ctx.fillStyle='#1d1d1f'; ctx.font=F(650,16); ctx.fillText('① '+(s0.title||''), PAD, y); y+=24;
    ctx.fillStyle='#55555c'; ctx.font=F(400,15);
    for(const ln of stepLines){ ctx.fillText(ln, PAD, y); y+=22; }
    y+=12;
  }
  // footer: watermark（极小）+ CTA（克制一行）
  ctx.strokeStyle='#f0f0ec'; ctx.beginPath(); ctx.moveTo(PAD,y); ctx.lineTo(PAD+innerW,y); ctx.stroke();
  y += 22;
  ctx.fillStyle='#b0b0b8'; ctx.font=F(400,12); ctx.fillText(WATERMARK, PAD, y);
  ctx.fillStyle=accent; ctx.font=F(600,13); ctx.textAlign='right'; ctx.fillText(CTA, PAD+innerW, y); ctx.textAlign='left';

  return cv;
}

function shareText(d){
  const L=[];
  L.push('🍲 '+d.dish_name + (d.one_line?'　'+d.one_line:''));
  const tag=[]; if(d.servings)tag.push(d.servings+'人份'); if(d.time_minutes)tag.push(d.time_minutes+'分钟'); if(d.difficulty)tag.push(DIFF[d.difficulty]);
  if(tag.length) L.push(tag.join(' · '));
  if(d.source_snippet) L.push('来自这段帖子：“'+d.source_snippet+'”');
  if(d.ingredients.length) L.push('\n要买：'+d.ingredients.map(x=>x.emoji+x.name+(x.amount?' '+x.amount:'')).join('、'));
  if(d.steps.length){ L.push('\n做法：'); d.steps.forEach((s,i)=>L.push((i+1)+'. '+s.title+(s.detail?'——'+s.detail:''))); }
  L.push('\n—— 今天吃什么 · 好玩的东西  '+location.href);
  return L.join('\n');
}

/* ════════════════════════════════════════════════════════════════════════
   UI
   ════════════════════════════════════════════════════════════════════════ */
let main, taEl, resultMount, statusEl, connectPanel;

function intro(){
  main = GG.mountShell(SLUG);
  connectPanel = null;

  main.appendChild(GG.el('div',{class:'hero'},
    GG.el('h1', null, '把一段帖子，变成今晚的菜'),
    GG.el('p',{class:'dn-lede'},
      '粘贴一段美食帖（探店、brunch、家常菜、深夜放毒都行），AI 现场从这段文字里抽出做法，'+
      '生成一份图文菜谱。换一段内容，菜就跟着变。')
  ));

  // 连接状态
  statusEl = renderStatus();
  main.appendChild(statusEl);

  // 输入框（先建，示例 chip 要引用它）
  taEl = GG.el('textarea',{class:'field',
    placeholder:'把一段美食帖粘到这里…（也可以贴一段根本不是吃的，看它怎么礼貌拒绝）'});

  // 示例 chip
  main.appendChild(GG.el('div',{class:'dn-eg-label'}, '懒得想？点一个例子直接跑 ↓'));
  const egs = GG.el('div',{class:'dn-egs'});
  (window.DINNER.EXAMPLES||[]).forEach(e=>{
    egs.appendChild(GG.el('button',{class:'dn-eg', onClick:()=>{ taEl.value=e.text; run(e.text); }},
      GG.el('span',{class:'em'}, e.em), e.label));
  });
  main.appendChild(egs);

  main.appendChild(GG.el('div',{class:'dn-inwrap'}, taEl));
  main.appendChild(GG.el('button',{class:'btn primary lg block dn-go', onClick:()=>run(taEl.value)}, '🍳 生成菜谱'));

  resultMount = GG.el('div'); main.appendChild(resultMount);
  main.appendChild(renderChrome());
}

function renderStatus(){
  const wrap = GG.el('div',{class:'dn-status'});
  wrap.appendChild(GG.el('span',{class:'dn-dot'+(connected()?' on':'')}));
  wrap.appendChild(GG.el('span', null,
    PROXY_URL ? '已接后端代理 · 引擎在线'
    : (getKey() ? '已连接 AI（本机 Key）· 引擎在线' : '引擎未连接 —— 连接后即可生成真实菜谱')));
  if(!PROXY_URL){
    wrap.appendChild(GG.el('button',{class:'dn-textbtn', onClick:toggleConnect}, getKey()?'管理':'连接 AI'));
  }
  return wrap;
}
function refreshStatus(){ if(statusEl){ const n=renderStatus(); statusEl.replaceWith(n); statusEl=n; } }

function toggleConnect(){
  if(connectPanel){ connectPanel.remove(); connectPanel=null; return; }
  const input = GG.el('input',{class:'field', type:'password', autocomplete:'off',
    placeholder:'粘贴 Anthropic API Key（sk-ant-…）', value:getKey()});
  const save = GG.el('button',{class:'btn primary', onClick:()=>{
    setKey(input.value.trim()); GG.toast(input.value.trim()?'已连接 ✓':'已清除');
    connectPanel.remove(); connectPanel=null; refreshStatus();
  }}, '保存并连接');
  const clear = getKey() ? GG.el('button',{class:'btn ghost', onClick:()=>{
    setKey(''); GG.toast('已清除'); connectPanel.remove(); connectPanel=null; refreshStatus();
  }}, '清除') : null;
  connectPanel = GG.el('div',{class:'dn-connect'},
    GG.el('h4', null, '连接 AI 引擎'),
    GG.el('p',{html:
      '这是个纯静态站点（GitHub Pages），没有后端。要跑真实引擎，先给一个 Anthropic API Key——'+
      '它<b>只存在你这台浏览器的 localStorage</b>，不会上传到任何服务器。用的是便宜的小模型（Haiku），'+
      '一次生成花费极低。<br>⚠️ 要把链接公开分享给别人用，应改成<b>后端代理</b>（见 dinner.js 顶部 TODO），'+
      '否则前端的 Key 会暴露、可被盗刷。'}),
    GG.el('div',{class:'row', style:{flexWrap:'wrap'}}, input, save, clear)
  );
  statusEl.after(connectPanel);
  input.focus();
}

async function run(post){
  post = (post||'').trim();
  if(!post){ GG.toast('先粘一段帖子，或点上面的例子'); return; }
  if(!connected()){ GG.toast('先连接 AI 才能生成真实菜谱'); if(!connectPanel) toggleConnect(); return; }

  GG.clear(resultMount);
  const stage = GG.el('div'); resultMount.appendChild(stage);
  stage.scrollIntoView({behavior:'smooth', block:'center'});

  const t = GG.thinking(stage, ['读懂这段帖子…','抽取菜品意图…','拆解食材与火候…','摆盘出图…'], 1800);
  let data;
  try{
    const [obj] = await Promise.all([callEngine(post), t]);
    data = normalize(obj);
  }catch(err){
    GG.clear(stage); stage.appendChild(renderError(err)); return;
  }
  GG.clear(stage);
  stage.appendChild(data.is_food ? renderResult(data) : renderNotFood());
  stage.scrollIntoView({behavior:'smooth', block:'start'});
}

function renderError(err){
  const code = err && err.code;
  let title='出了点状况', msg='再试一次，或换一段内容。', cta='连接 / 重试';
  if(code==='NEED_SETUP'){ title='还没连接 AI'; msg='这是纯静态站点、没有后端。给一个 Anthropic API Key（只存你本机）就能跑真实引擎。'; }
  else if(code==='BAD_KEY'){ title='Key 看起来不对'; msg='这个 Anthropic API Key 没通过校验，检查一下重新粘贴。'; }
  else if(code==='NET'){ title='连不上模型'; msg='可能是网络或浏览器直连被拦。换个网络再试，或部署后端代理。'; }
  else if(code==='PARSE_FAIL'){ title='这次没解析成功'; msg='模型偶尔会返回不规整的内容，点重试通常就好。'; cta='重试'; }
  else if(err && err.message){ msg = err.message; }
  const card = GG.el('div',{class:'card pad'});
  card.appendChild(GG.el('div',{class:'dn-oops'},
    GG.el('div',{class:'big'}, code==='PARSE_FAIL'?'🔁':'🔌'),
    GG.el('h3', null, title),
    GG.el('p', null, msg)
  ));
  card.appendChild(GG.el('div',{class:'center', style:{marginTop:'12px'}},
    GG.el('button',{class:'btn primary', onClick:()=>{
      if(code==='NEED_SETUP'||code==='BAD_KEY'){ if(!connectPanel) toggleConnect(); }
      else run(taEl.value);
    }}, cta)
  ));
  return card;
}

function renderNotFood(){
  const card = GG.el('div',{class:'card pad'});
  card.appendChild(GG.el('div',{class:'dn-oops'},
    GG.el('div',{class:'big'}, '🤔'),
    GG.el('h3', null, '这条看起来不是吃的'),
    GG.el('p', null, '我没从这段里读到能下锅的东西，就不硬编一道菜糊弄你了。要不要试试这些 ↓')
  ));
  const egs = GG.el('div',{class:'dn-egs', style:{marginTop:'14px', justifyContent:'center'}});
  (window.DINNER.EXAMPLES||[]).forEach(e=>{
    egs.appendChild(GG.el('button',{class:'dn-eg', onClick:()=>{ taEl.value=e.text; run(e.text); }},
      GG.el('span',{class:'em'}, e.em), e.label));
  });
  card.appendChild(egs);
  return card;
}

function badge(txt){ return GG.el('span',{class:'dn-badge'}, txt); }

function renderResult(d){
  const card = GG.el('div',{class:'card pad result'});

  // ── 成品层：插画主视觉 + 菜名 + 一句话 + 徽章
  const pw = document.createElement('div'); pw.innerHTML = plateSVG(d.dish_name, d.ingredients);
  const info = GG.el('div',{class:'dn-heroinfo'},
    GG.el('div',{class:'dn-dish'}, d.dish_name),
    d.one_line ? GG.el('div',{class:'dn-oneline'}, d.one_line) : null,
    GG.el('div',{class:'dn-badges'},
      d.servings ? badge('👥 '+d.servings+' 人份') : null,
      d.time_minutes ? badge('⏱ '+d.time_minutes+' 分钟') : null,
      d.difficulty ? badge('🔥 '+DIFF[d.difficulty]) : null
    )
  );
  card.appendChild(GG.el('div',{class:'dn-herocard'}, pw.firstElementChild, info));

  // ── 来源片段（用户的输入痕迹）
  if(d.source_snippet){
    card.appendChild(GG.el('div',{class:'dn-source'},
      GG.el('b', null, '来自你贴的这段'), '“'+d.source_snippet+'”'));
  }

  // ── 食材层
  card.appendChild(GG.el('div',{class:'dn-h'}, '要买什么 · '+d.ingredients.length+' 样'));
  const ig = GG.el('div',{class:'dn-ings'});
  d.ingredients.forEach(x=> ig.appendChild(GG.el('div',{class:'dn-ing'},
    GG.el('span',{class:'em'}, x.emoji),
    GG.el('span',{class:'nm'}, x.name),
    x.amount ? GG.el('span',{class:'amt'}, x.amount) : null
  )));
  card.appendChild(ig);

  // ── 步骤层（图文承重点）
  card.appendChild(GG.el('div',{class:'dn-h'}, '怎么做 · '+d.steps.length+' 步'));
  const sd = GG.el('div',{class:'dn-steps'});
  d.steps.forEach((s,i)=>{
    const ic = document.createElement('div'); ic.className='dn-stepicon'; ic.innerHTML = icon(s.icon);
    sd.appendChild(GG.el('div',{class:'dn-step'}, ic,
      GG.el('div',{class:'body'},
        GG.el('div',{class:'t'},
          GG.el('span',{class:'dn-stepno'}, '第'+(i+1)+'步'),
          s.title,
          (s.minutes!=null) ? GG.el('span',{class:'dn-min'}, '约 '+s.minutes+' 分钟') : null),
        s.detail ? GG.el('div',{class:'d'}, s.detail) : null
      )));
  });
  card.appendChild(sd);

  // ── 分享卡
  let cache=null; const getCard=()=> cache || (cache = buildShareCanvas(d));
  card.appendChild(GG.el('div',{class:'dn-sharebar'},
    GG.el('button',{class:'btn primary', onClick:()=>GG.copyCanvas(getCard())}, '📷 复制分享卡'),
    GG.el('button',{class:'btn', onClick:()=>GG.downloadCanvas(getCard(), '今天吃什么-'+d.dish_name)}, '⬇️ 存图'),
    GG.el('button',{class:'btn', onClick:()=>GG.copyText(shareText(d))}, '📝 复制文字')
  ));
  if(GG.disclaimer(SLUG)) card.appendChild(GG.disclaimer(SLUG));

  // 换一段
  const redo = GG.el('div',{class:'center', style:{marginTop:'18px'}},
    GG.el('button',{class:'btn', onClick:()=>{ GG.clear(resultMount); taEl.focus(); taEl.scrollIntoView({behavior:'smooth',block:'center'}); }},
      '↻ 换一段帖子再来'));
  const box = GG.el('div'); box.appendChild(card); box.appendChild(redo);
  return box;
}

/* ── 外围 chrome（mock：今日推荐 / 本月排行 / 社交计数） ── */
function renderChrome(){
  const D = window.DINNER || {};
  const box = GG.el('div',{class:'dn-chrome'});

  // 今日推荐
  box.appendChild(GG.el('div',{class:'dn-chrome-h'},
    GG.el('span',{class:'t'}, '今日推荐'), GG.el('span',{class:'dn-mocktag'}, '示例数据')));
  const car = GG.el('div',{class:'dn-carousel'});
  (D.RECOS||[]).forEach(r=>{
    car.appendChild(GG.el('div',{class:'dn-reco'},
      GG.el('div',{class:'top', style:{background:'linear-gradient(135deg,'+r.c1+','+r.c2+')'}},
        GG.el('span',{style:{fontSize:'34px'}}, r.em)),
      GG.el('div',{class:'meta'},
        GG.el('div',{class:'nm'}, r.name),
        GG.el('div',{class:'sub'}, r.sub))
    ));
  });
  box.appendChild(car);

  // 本月排行
  box.appendChild(GG.el('div',{class:'dn-chrome-h'},
    GG.el('span',{class:'t'}, '本月排行'), GG.el('span',{class:'dn-mocktag'}, '示例数据')));
  const rank = GG.el('div',{class:'dn-rank'});
  (D.LEADERBOARD||[]).forEach((r,i)=>{
    rank.appendChild(GG.el('div',{class:'dn-rankrow'},
      GG.el('span',{class:'dn-rankno'}, '#'+(i+1)),
      GG.el('span',{class:'dn-rankem'}, r.em),
      GG.el('span',{class:'dn-ranknm'}, r.name),
      GG.el('span',{class:'dn-count'}, r.cooked+' 人做过')
    ));
  });
  box.appendChild(rank);

  return box;
}

/* ── 开发自检钩子（不在主流程，仅供本地/无头浏览器验证渲染层；不伪造主链路） ── */
const SAMPLE = {
  is_food:true, dish_name:'干香辣子鸡丁', one_line:'外酥里嫩、越嚼越香的下饭神器', servings:2, time_minutes:25, difficulty:'medium',
  ingredients:[
    {name:'鸡腿肉',amount:'300g',emoji:'🍗'},{name:'干辣椒',amount:'一大把',emoji:'🌶️'},
    {name:'花椒',amount:'1 小勺',emoji:'🪴'},{name:'白芝麻',amount:'适量',emoji:'⚪'},
    {name:'葱段',amount:'2 根',emoji:'🧅'},{name:'料酒生抽',amount:'各 1 勺',emoji:'🫙'}
  ],
  steps:[
    {title:'腌鸡丁',detail:'鸡腿肉切丁，加料酒、生抽抓匀腌 10 分钟。',minutes:10,icon:'mix'},
    {title:'炸至金黄',detail:'下油锅中火炸到外壳金黄酥脆，捞出控油。',minutes:6,icon:'pan'},
    {title:'爆香',detail:'留底油，下干辣椒、花椒小火爆出香味。',minutes:2,icon:'flame'},
    {title:'回锅颠炒',detail:'鸡丁回锅猛火颠炒两下，让香味裹匀。',minutes:2,icon:'pan'},
    {title:'装盘',detail:'撒白芝麻和葱段，出锅装盘。',minutes:null,icon:'plate'}
  ],
  source_snippet:'巷子深处这家苍蝇馆子的辣子鸡丁真的绝'
};
window.DINNER_DEV = {
  render: (d)=>{ GG.clear(resultMount); resultMount.appendChild(renderResult(normalize(d||SAMPLE))); },
  notfood: ()=>{ GG.clear(resultMount); resultMount.appendChild(renderNotFood()); },
  card: (d)=> buildShareCanvas(normalize(d||SAMPLE)),
  sample: SAMPLE, normalize: normalize
};

intro();
})();
