/* mood-journal — 心情日记。
   ① 干净的「欢迎/登录」首屏（详情页手机预览里不再一进来就堆一屏）。
   ② 写完立刻「被接住」：每记一条 → 即时共情回应 + 情绪天气（呼应 🌤️）。
   ③ 攒够 3 条 → 情绪曲线 + 心情天气 + 触发词云 + 情绪分布 + 收尾安慰。
   打分/曲线/词云永远本地；连了 key 才按需叠加 AI 走心洞察。非心理诊断。
   i18n：文案走 GG.T；英文关键词按词边界匹配（asciiHits），中文匹配逻辑保持原样。 */
(function(){
const SLUG = 'mood-journal';
const M = window.MOOD;
const MIN_ENTRIES = 3;
let main, entries = [];          // {text, score(0-100), manual(bool)}

/* ---------- 英文关键词匹配（词边界 + 忽略大小写；容忍 ≤2 字母的词尾变化） ---------- */
function isAsciiWord(w){ return !/[一-鿿]/.test(w); }
function asciiHits(hay, w){      // hay 需为小写文本；返回整词命中的位置数组
  const out=[]; let from=0, idx;
  while((idx = hay.indexOf(w, from)) !== -1){
    from = idx + w.length;
    const a = hay[idx-1];
    if(a && /[a-z']/.test(a)) continue;            // 前边界：不能接在字母后
    let j = idx + w.length, tail = 0;
    while(hay[j] && /[a-z]/.test(hay[j])){ tail++; j++; }
    if(tail > 2) continue;                          // 后边界：最多容忍 s/ed 等短词尾
    out.push(idx);
  }
  return out;
}

/* ---------- 情绪 → 天气 / 即时共情 ---------- */
function weatherOf(score){ return M.weather.find(w=> score>=w.min) || M.weather[M.weather.length-1]; }
function empathyOf(score, seed){
  const k = score<22?'vlow':score<38?'low':score<60?'mid':score<78?'high':'vhigh';
  return GG.pick(M.empathy[k], seed||score);
}
function triggerIn(text){
  const t=String(text), tl=t.toLowerCase();
  for(const w of M.triggers){
    if(isAsciiWord(w)){ if(asciiHits(tl, w).length) return w; }
    else if(t.indexOf(w)!==-1) return w;
  }
  return null;
}

/* ---------- 情感打分：关键词词典 + 否定/程度处理 → 0~100 ---------- */
function scoreText(text){
  const t = String(text), tl = t.toLowerCase();
  let raw = 0, hits = 0;
  const scan = (list, base)=>{
    for(const w of list){
      if(isAsciiWord(w)){
        // 英文关键词：整词匹配 + 英文否定/程度词上下文
        for(const idx of asciiHits(tl, w)){
          let val = base;
          const pre = tl.slice(Math.max(0, idx-12), idx);
          if(M.negatorsEn.some(n=>pre.indexOf(n)!==-1)) val = -val * 0.9;
          else if(M.intensEn.some(n=>pre.indexOf(n)!==-1)) val = val * 1.5;
          raw += val; hits++;
        }
        continue;
      }
      let from = 0, idx;
      while((idx = t.indexOf(w, from)) !== -1){
        let val = base;
        const pre = t.slice(Math.max(0, idx-2), idx);
        if(M.negators.some(n=>pre.indexOf(n)!==-1)) val = -val * 0.9;
        else if(M.intens.some(n=>pre.indexOf(n)!==-1)) val = val * 1.5;
        raw += val; hits++;
        from = idx + w.length;
      }
    }
  };
  scan(M.posStrong, 2); scan(M.negStrong, -2);
  scan(M.pos, 1); scan(M.neg, -1);
  const norm = hits ? GG.clamp(raw / hits, -2, 2) : 0;
  return Math.round(GG.clamp(50 + norm * 24, 4, 96));
}

/* ---------- 分词 + 词频 ---------- */
function wordCloud(){
  const all = entries.map(e=>e.text).join(' ');
  const allL = all.toLowerCase();
  const freq = {}, isTrig = {};
  const known = M.triggers.concat(M.pos, M.neg);
  for(const w of known){
    if(w.length < 2 && M.triggers.indexOf(w)===-1) continue;
    let c = 0;
    if(isAsciiWord(w)){ c = asciiHits(allL, w).length; }
    else { let from=0, idx; while((idx = all.indexOf(w, from))!==-1){ c++; from = idx + w.length; } }
    if(c){
      const boost = M.triggers.indexOf(w)!==-1 ? 1.6 : 1.2;
      freq[w] = (freq[w]||0) + c * boost;
      if(M.triggers.indexOf(w)!==-1) isTrig[w] = true;
    }
  }
  const clean = all.replace(/[^一-龥a-zA-Z]+/g,'');
  for(let i=0;i+2<=clean.length;i++){
    const bi = clean.slice(i,i+2);
    if(/[a-zA-Z]/.test(bi)) continue;   // 字母对不进词云（英文走下面的整词分词）
    if(M.stop.indexOf(bi)!==-1) continue;
    if(M.stop.indexOf(bi[0])!==-1 || M.stop.indexOf(bi[1])!==-1) continue;
    if(freq[bi]!=null) { freq[bi]+=0.5; continue; }
    freq[bi] = (freq[bi]||0) + 0.5;
  }
  // 英文整词分词（保证 EN 输入也能进词云；已被词典计过的词不重复计）
  const tokens = allL.match(/[a-z][a-z']{2,}/g) || [];
  const enF = {};
  for(const wd of tokens){
    if(M.stopEn.indexOf(wd)!==-1) continue;
    if(freq[wd]!=null) continue;
    enF[wd] = (enF[wd]||0) + 0.5;
  }
  for(const k in enF) freq[k] = enF[k];
  return Object.entries(freq).filter(([w,c])=> c >= 1).sort((a,b)=> b[1]-a[1]).slice(0, 16)
    .map(([w,c])=>({w, c, trig: !!isTrig[w]}));
}

/* ---------- 折线 SVG ---------- */
function curveSVG(){
  const W = 640, H = 220, padL = 38, padR = 18, padT = 18, padB = 30;
  const n = entries.length;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const x = i => padL + (n===1 ? innerW/2 : innerW * i/(n-1));
  const y = s => padT + innerH * (1 - s/100);
  const pts = entries.map((e,i)=> [x(i), y(e.score)]);
  const poly = pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
  const area = `M ${pts[0][0].toFixed(1)} ${(H-padB)} ` +
    pts.map(p=>`L ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') +
    ` L ${pts[n-1][0].toFixed(1)} ${(H-padB)} Z`;
  const lines = [ [100,GG.T('高昂','High')], [50,GG.T('平静','Calm')], [0,GG.T('低落','Low')] ].map(([s,lab])=>{
    const yy = y(s).toFixed(1);
    return `<line x1="${padL}" y1="${yy}" x2="${W-padR}" y2="${yy}" stroke="var(--line-2)" stroke-width="1"/>`+
           `<text x="6" y="${(+yy+4).toFixed(1)}" font-size="11" fill="var(--ink-3)">${lab}</text>`;
  }).join('');
  const dots = pts.map((p,i)=>{
    const e = entries[i];
    const col = e.score>=60 ? '#3aa17e' : (e.score<=40 ? '#d2705a' : 'var(--accent)');
    return `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="5" fill="${col}" stroke="#fff" stroke-width="2">`+
           `<title>${GG.T(`第 ${i+1} 条 · 情绪 ${e.score}`, `Entry #${i+1} · Mood ${e.score}`)}</title></circle>`;
  }).join('');
  const xlabs = entries.map((e,i)=>
    `<text x="${x(i).toFixed(1)}" y="${H-8}" font-size="10" fill="var(--ink-3)" text-anchor="middle">#${i+1}</text>`
  ).join('');
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;overflow:visible">
    <defs><linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="var(--accent)" stop-opacity=".22"/>
      <stop offset="1" stop-color="var(--accent)" stop-opacity="0"/>
    </linearGradient></defs>
    ${lines}
    <path d="${area}" fill="url(#mg)"/>
    <polyline points="${poly}" fill="none" stroke="var(--accent)" stroke-width="2.5"
      stroke-linejoin="round" stroke-linecap="round"/>
    ${dots}${xlabs}
  </svg>`;
}

/* ---------- 词云 ---------- */
function cloudNode(list){
  const box = GG.el('div',{style:{display:'flex', flexWrap:'wrap', alignItems:'center',
    justifyContent:'center', gap:'6px 14px', padding:'14px 6px', lineHeight:'1.1'}});
  const max = list[0] ? list[0].c : 1, min = list.length ? list[list.length-1].c : 1;
  list.forEach((it,i)=>{
    const t = max===min ? 1 : (it.c - min)/(max - min);
    const size = Math.round(15 + t*30);
    const op = 0.55 + t*0.45;
    const col = it.trig ? 'var(--accent)' : 'var(--ink-2)';
    box.appendChild(GG.el('span',{style:{
      fontSize:size+'px', fontWeight: (size>28?'760':'560'), color:col, opacity:String(op),
      letterSpacing:'.5px', cursor:'default', transform:`rotate(${(i%5-2)*1.5}deg)`,
      display:'inline-block'
    }, title: it.trig? GG.T('触发词','Trigger word'):GG.T('高频词','Frequent word')}, it.w));
  });
  return box;
}

/* ---------- AI 情绪洞察（连了 key 才出现完整段落；未连给连接入口） ---------- */
const MOOD_SYS = '你是温柔、专业的情绪陪伴者（不做心理诊断）。下面是用户最近写的多条心情记录及其情绪分（0-100）。请读完后给出走心的小结与温柔的建议。只输出严格 JSON：{"summary":"一句话共情式总结","insights":["2到3条你观察到的模式，引用其记录内容"],"suggestions":["2到3条温柔可执行的建议"]}。不做诊断、不贴标签，'
  + GG.T('全部简体中文。',
         '输出语言要求：summary、insights、suggestions 中的所有文字一律用英文（write all output text in warm, gentle English）。');
function aiInsight(){
  const lines = entries.map((e,i)=>`#${i+1}(${e.score}) ${e.text}`).join('\n');
  return GG.llm.json(MOOD_SYS, '我的心情记录：\n'+lines, {max_tokens:800});
}
function moodBullets(arr){
  return GG.el('ul',{class:'small', style:{margin:'4px 0 0', paddingLeft:'20px', color:'var(--ink-2)', lineHeight:'1.7'}},
    arr.map(t=>GG.el('li', null, t)));
}
function renderInsight(body, obj){
  GG.clear(body);
  if(obj.summary) body.appendChild(GG.el('p',{style:{margin:'0 0 10px', fontWeight:'600'}}, String(obj.summary)));
  const ins = (Array.isArray(obj.insights)?obj.insights:[]).map(String).filter(Boolean);
  const sug = (Array.isArray(obj.suggestions)?obj.suggestions:[]).map(String).filter(Boolean);
  if(ins.length){ body.appendChild(GG.el('div',{class:'section-t', style:{marginTop:'4px'}}, GG.T('我读到的','What I noticed'))); body.appendChild(moodBullets(ins)); }
  if(sug.length){ body.appendChild(GG.el('div',{class:'section-t'}, GG.T('温柔的建议','Gentle suggestions'))); body.appendChild(moodBullets(sug)); }
  if(!ins.length && !sug.length && !obj.summary) body.appendChild(GG.el('p',{class:'small muted', style:{margin:'0'}},
    GG.T('这次没生成出洞察，曲线与词云不受影响。','No insight came through this time — your curve and word cloud are unaffected.')));
}
function mountInsight(parent){
  parent.appendChild(GG.el('div',{class:'section-t'}, GG.T('✨ AI 情绪洞察','✨ AI Mood Insight')));
  const body = GG.el('div');
  const card = GG.el('div',{class:'card pad', style:{borderLeft:'3px solid var(--accent)'}});
  parent.appendChild(card);
  if(!GG.llm.connected()){
    card.appendChild(GG.el('p',{class:'small muted', style:{margin:'0 0 6px'}},
      GG.T('上面的曲线、天气、词云都是本机即时算出来的。连上 AI 后，可以让它通读你写的每一条，回一段「真的读进去了」的走心小结。',
           'The curve, weather, and word cloud above are all computed right on your device. Connect AI, and it can read through every entry you wrote and reply with a summary that truly takes it in.')));
    card.appendChild(GG.llm.bar());
    return;
  }
  const btn = GG.el('button',{class:'btn', onClick:()=>{
    btn.disabled = true; GG.clear(body);
    body.appendChild(GG.el('p',{class:'small muted', style:{margin:'8px 0 0'}}, GG.T('AI 正在读你的这些记录…','AI is reading through your entries…')));
    aiInsight().then(obj=>{ renderInsight(body, obj); btn.disabled=false; btn.textContent=GG.T('↻ 重新解读','↻ Read them again'); })
      .catch(e=>{ GG.clear(body); body.appendChild(GG.el('p',{class:'small muted', style:{margin:'8px 0 0'}},
        GG.T('AI 洞察没拿到（'+(e&&e.code||'NET')+'），曲线与词云不受影响。',
             'Could not fetch the AI insight ('+(e&&e.code||'NET')+') — your curve and word cloud are unaffected.'))); btn.disabled=false; });
  }}, GG.T('✨ 让 AI 读读我的情绪','✨ Let AI read my mood'));
  card.appendChild(GG.el('div',{class:'row', style:{justifyContent:'space-between', alignItems:'center'}},
    GG.el('span',{class:'small muted'}, GG.T('让 AI 通读你写的每一条，给一段走心的小结','AI reads every entry you wrote and writes a heartfelt summary')),
    GG.llm.badge(true)));
  card.appendChild(GG.el('div',{style:{marginTop:'10px'}}, btn));
  card.appendChild(body);
}

/* ---------- demo 专属样式（一次） ---------- */
function injectCSS(){
  if(document.getElementById('mj-style')) return;
  const css = `
  .mj-gate{min-height:calc(100vh - 130px); display:flex; flex-direction:column; align-items:center; justify-content:center; padding:24px 18px 36px}
  .mj-card{width:100%; max-width:392px; background:var(--surface); border:1px solid var(--line); border-radius:var(--r-l);
    box-shadow:var(--sh-2); overflow:hidden; animation:gl-rise .5s cubic-bezier(.2,.7,.2,1) both}
  .mj-top{position:relative; color:#fff; padding:30px 24px 26px; overflow:hidden;
    background:linear-gradient(135deg,#9fb0e8,#7a8fd4 56%,#5d6fb8)}
  .mj-blob{position:absolute; border-radius:50%; filter:blur(3px); opacity:.5; animation:mj-float 8s ease-in-out infinite}
  .mj-glyph{width:46px; height:46px; border-radius:14px; background:rgba(255,255,255,.22); display:grid; place-items:center;
    font-size:24px; position:relative; z-index:1}
  .mj-brand{font-size:23px; font-weight:760; letter-spacing:-.4px; margin-top:13px; position:relative; z-index:1}
  .mj-tag{font-size:13px; opacity:.92; margin-top:3px; position:relative; z-index:1}
  .mj-body{padding:22px 24px 24px}
  .mj-hook{font-size:18px; font-weight:720; letter-spacing:-.3px; line-height:1.4}
  .mj-hook b{color:var(--accent)}
  .mj-feats{display:flex; flex-direction:column; gap:9px; margin:15px 0 4px}
  .mj-feat{display:flex; gap:9px; align-items:flex-start; font-size:13.5px; color:var(--ink-2); line-height:1.4}
  .mj-feat .ic{flex:none; width:22px; height:22px; border-radius:7px; background:var(--accent-soft); color:var(--accent);
    display:grid; place-items:center; font-size:13px; margin-top:1px}
  .mj-proof{display:flex; align-items:center; gap:7px; margin:16px 0 4px; font-size:12px; color:var(--ink-3)}
  .mj-proof .dots{display:flex; gap:3px}
  .mj-proof .dots i{width:9px; height:9px; border-radius:50%; display:block}
  .mj-go{width:100%; appearance:none; border:none; border-radius:13px; cursor:pointer; font-family:inherit;
    background:var(--accent); color:#fff; font-size:15.5px; font-weight:640; padding:14px; margin-top:14px; transition:.15s;
    display:flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 6px 18px -8px var(--accent)}
  .mj-go:hover{filter:brightness(.97)} .mj-go:active{transform:translateY(1px)}
  .mj-wx{width:100%; appearance:none; border:1px solid var(--line); border-radius:13px; cursor:pointer; font-family:inherit;
    background:var(--surface); color:var(--ink-2); font-size:14px; font-weight:560; padding:11px; margin-top:9px; transition:.15s;
    display:flex; align-items:center; justify-content:center; gap:8px}
  .mj-wx:hover{border-color:var(--accent); color:var(--ink)} .mj-wx .g{color:#07c160; font-size:15px}
  .mj-link{display:block; width:100%; text-align:center; margin-top:13px; background:none; border:none; cursor:pointer;
    font-family:inherit; color:var(--accent); font-size:13px; font-weight:560}
  .mj-priv{display:flex; align-items:flex-start; gap:6px; width:100%; max-width:392px; margin:14px auto 0; padding:0 6px;
    font-size:11.5px; color:var(--ink-3); line-height:1.5}
  .mj-priv > span:first-child{flex:none}

  /* 写完即时「被接住」 */
  .mj-reflect{display:flex; gap:13px; align-items:flex-start; padding:15px 17px; margin-top:14px;
    border-left:3px solid var(--accent); background:linear-gradient(120deg,var(--accent-soft),#fff 70%);
    animation:mj-rise .45s cubic-bezier(.2,.7,.2,1) both}
  @keyframes mj-rise{from{opacity:0; transform:translateY(8px)}to{opacity:1; transform:none}}
  .mj-wicon{font-size:30px; line-height:1; flex:none; margin-top:1px}
  .mj-emp{font-size:15px; font-weight:600; color:var(--ink); line-height:1.5}
  .mj-emeta{font-size:12px; color:var(--ink-3); margin-top:5px}

  /* 记录行的天气徽标 */
  .mj-badge{width:46px; height:46px; flex:none; border-radius:13px; background:var(--accent-soft);
    display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px; line-height:1}
  .mj-badge .w{font-size:20px} .mj-badge .s{font-size:11px; font-weight:700; color:var(--ink-2)}

  /* 心情天气条 */
  .mj-weather{display:flex; align-items:center; gap:10px; flex-wrap:wrap}
  .mj-wseq{display:flex; gap:4px; font-size:24px; flex-wrap:wrap}
  .mj-wnow{display:flex; align-items:center; gap:10px}
  .mj-wnow .big{font-size:40px; line-height:1}
  .mj-wnow .txt{line-height:1.3}
  .mj-wnow .txt .w1{font-size:18px; font-weight:740}
  .mj-wnow .txt .w2{font-size:12.5px; color:var(--ink-3)}

  /* 收尾安慰 */
  .mj-closing{padding:18px 20px; background:linear-gradient(135deg,var(--accent-soft),#fff 75%); border:none}
  .mj-closing p{margin:0; font-size:15px; font-weight:560; color:var(--ink); line-height:1.6}

  @keyframes mj-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-13px)}}
  @media (max-width:520px){ .mj-gate{min-height:calc(100vh - 110px); padding:18px 14px 28px} }
  `;
  document.head.appendChild(GG.el('style',{id:'mj-style', html:css}));
}

/* ---------- 主流程 ---------- */
function start(){
  main = GG.mountShell(SLUG);
  injectCSS();
  const st = GG.decodeState();
  if(st && Array.isArray(st.e) && st.e.length){
    entries = st.e.map(x=> ({text:x.t, score:x.s, manual:!!x.m}));
    render();                 // 带分享链接进来 → 直接进日记
  }else{
    entries = [];
    welcome();                // 默认 → 干净的欢迎门面
  }
}

/* ===== 首屏：欢迎 / 登录 ===== */
function welcome(){
  const blobs = [
    {bg:'#fff3c4', w:58, t:-16, l:'-6%', d:'0s'},
    {bg:'#cdd8f5', w:48, t:44, l:'80%', d:'1.6s'},
    {bg:'#b9c6ef', w:36, t:'64%', l:'16%', d:'3s'},
  ].map(b=>GG.el('span',{class:'mj-blob', style:{background:b.bg, width:b.w+'px', height:b.w+'px',
    top:(typeof b.t==='number'?b.t+'px':b.t), left:b.l, animationDelay:b.d}}));

  const head = GG.el('div',{class:'mj-top'}, ...blobs,
    GG.el('div',{class:'mj-glyph'}, '🌤️'),
    GG.el('div',{class:'mj-brand'}, GG.T('心情日记','Mood Journal')),
    GG.el('div',{class:'mj-tag'}, GG.T('每天一句，看见自己的情绪','One line a day, to see your own feelings')));

  const feat = (ic, t)=>GG.el('div',{class:'mj-feat'}, GG.el('span',{class:'ic'}, ic), t);
  const dotCols = ['#d2705a','#e0a050','#7a8fd4','#6cb98f','#3aa17e'];

  const body = GG.el('div',{class:'mj-body'},
    GG.el('div',{class:'mj-hook', html:GG.T('把心里的话写下来，<b>慢慢就看清自己</b>',
      'Write down what is on your mind — <b>and slowly see yourself clearly</b>')}),
    GG.el('div',{class:'mj-feats'},
      feat('✍️', GG.T('一句话记一条，攒几条就有情绪曲线','One line per entry — a few entries become a mood curve')),
      feat('🌦️', GG.T('把心情变成天气，一眼看懂今天','Your mood becomes weather, so today reads at a glance')),
      feat('🫶', GG.T('写完立刻被「接住」，连 AI 给走心洞察','Every entry is gently received — connect AI for heartfelt insights'))),
    GG.el('div',{class:'mj-proof'},
      GG.el('div',{class:'dots'}, ...dotCols.map(c=>GG.el('i',{style:{background:c}}))),
      GG.el('span', null, GG.T('已有 12,000+ 人在这里写下了今天','12,000+ people have written about their day here'))),
    GG.el('button',{class:'mj-go', onClick:()=>render()}, GG.T('✍️ 写下此刻的心情','✍️ Write how you feel right now')),
    GG.el('button',{class:'mj-wx', onClick:()=>{ GG.toast(GG.T('微信登录成功（演示）','Signed in with WeChat (demo)')); render(); }},
      GG.el('span',{class:'g'}, '❖'), GG.T('微信一键登录','One-tap WeChat sign-in')),
    GG.el('button',{class:'mj-link', onClick:()=>{ M.samples.forEach(s=> addEntry(s, null)); render(); }},
      GG.T('或先看一份示例日记 →','Or peek at a sample journal first →')));

  main.appendChild(GG.el('div',{class:'mj-gate'},
    GG.el('div',{class:'mj-card'}, head, body),
    GG.el('div',{class:'mj-priv'},
      GG.el('span', null, '🔒'),
      GG.el('span', null, GG.T('日记只存在你的浏览器本机，不上传服务器；演示用，非心理诊断。',
        'Your journal stays in this browser only and is never uploaded. Demo only — not a mental-health diagnosis.')))));
}

function addEntry(text, manualScore){
  text = String(text||'').trim();
  if(!text) { GG.toast(GG.T('先写一句此刻的心情～','Write a little something about how you feel first ~')); return false; }
  const manual = manualScore!=null;
  entries.push({ text, score: manual ? manualScore : scoreText(text), manual });
  syncHash();
  return true;
}
function syncHash(){ GG.encodeState({ e: entries.map(e=>({t:e.text, s:e.score, m:e.manual})) }); }

/* ===== 日记主界面 ===== */
function render(){
  GG.clear(main);

  main.appendChild(GG.el('div',{class:'hero', style:{paddingBottom:'2px'}},
    GG.el('h1', null, GG.T('写下此刻的心情','Write how you feel right now')),
    GG.el('p', null, GG.T(`一句话记一条。攒满 ${MIN_ENTRIES} 条，我就把它们汇成情绪曲线、心情天气和触发词云。`,
      `One line per entry. Once you have ${MIN_ENTRIES}, I will turn them into a mood curve, mood weather, and a trigger word cloud.`))
  ));

  /* 输入区 */
  let pendingScore = null;
  const ta = GG.el('textarea',{class:'field', rows:'2',
    placeholder:GG.T('例如：加班到很晚，deadline 压着，有点焦虑…',
      'e.g. Worked late again, deadline looming, feeling a bit anxious…'), style:{minHeight:'72px'}});
  const moodOpts = [['😣',GG.T('很差','Rough'),12],['🙁',GG.T('偏低','Low'),32],['😐',GG.T('一般','Okay'),50],['🙂',GG.T('还行','Good'),70],['😄',GG.T('很好','Great'),90]];
  const moodRow = GG.el('div',{class:'row', style:{gap:'8px', flexWrap:'wrap', margin:'10px 0'}});
  moodOpts.forEach(([emo,lab,val])=>{
    const c = GG.el('span',{class:'chip', onClick:()=>{
      if(pendingScore===val){ pendingScore=null; c.classList.remove('on'); return; }
      pendingScore=val; GG.$$('.chip', moodRow).forEach(x=>x.classList.remove('on')); c.classList.add('on');
    }}, `${emo} ${lab}`);
    moodRow.appendChild(c);
  });
  const submit = ()=>{ if(addEntry(ta.value, pendingScore)){ ta.value=''; pendingScore=null; render(); } };
  ta.addEventListener('keydown', e=>{ if((e.ctrlKey||e.metaKey)&&e.key==='Enter') submit(); });

  main.appendChild(GG.el('div',{class:'card pad', style:{marginTop:'8px'}},
    GG.el('label',{class:'label'}, GG.T('此刻心情','How you feel now')),
    ta,
    GG.el('div',{class:'small muted', style:{margin:'10px 0 2px'}},
      GG.T('想自己打个分？（可选，不选我按文字估）','Want to rate it yourself? (Optional — otherwise I estimate from your words)')),
    moodRow,
    GG.el('div',{class:'row', style:{gap:'10px', flexWrap:'wrap'}},
      GG.el('button',{class:'btn primary', onClick:submit}, GG.T('＋ 记一条','＋ Add entry')),
      entries.length < MIN_ENTRIES + 1
        ? GG.el('button',{class:'btn', onClick:()=>{ M.samples.forEach(s=> addEntry(s, null)); render(); }}, GG.T('✨ 加几条示例','✨ Add sample entries'))
        : null,
      entries.length
        ? GG.el('button',{class:'btn', onClick:()=>{ entries=[]; location.hash=''; welcome(); }}, GG.T('清空重写','Start over'))
        : null
    )
  ));

  /* 写完立刻「被接住」：最新一条的即时共情 + 天气 */
  if(entries.length){
    const last = entries[entries.length-1];
    const wt = weatherOf(last.score), trig = triggerIn(last.text);
    main.appendChild(GG.el('div',{class:'card mj-reflect'},
      GG.el('div',{class:'mj-wicon'}, wt.icon),
      GG.el('div', null,
        GG.el('div',{class:'mj-emp'}, empathyOf(last.score, last.text)),
        GG.el('div',{class:'mj-emeta'},
          GG.T(`情绪 ${last.score} · 心情天气「${wt.word}」`, `Mood ${last.score} · Mood weather “${wt.word}”`) +
          (trig?GG.T(` · 记到了「${trig}」`, ` · Noticed “${trig}”`):'')))));
  }

  /* 已记录列表（带天气徽标） */
  if(entries.length){
    main.appendChild(GG.el('div',{class:'section-t'},
      GG.T(`已记录 ${entries.length} 条`, `${entries.length} ${entries.length>1?'entries':'entry'} so far`)));
    const list = GG.el('div',{class:'stack'});
    entries.forEach((e,i)=>{
      const wt = weatherOf(e.score);
      list.appendChild(GG.el('div',{class:'card pad', style:{display:'flex', gap:'12px', alignItems:'center'}},
        GG.el('div',{class:'mj-badge'}, GG.el('span',{class:'w'}, wt.icon), GG.el('span',{class:'s'}, String(e.score))),
        GG.el('div',{style:{flex:'1', minWidth:'0'}},
          GG.el('div',{style:{fontSize:'15px', color:'var(--ink)'}}, e.text),
          GG.el('div',{class:'small muted', style:{marginTop:'3px'}},
            `#${i+1} · ${wt.word}` + (e.manual?GG.T('（你打的分）',' (your rating)'):GG.T('（按文字估）',' (estimated from words)')))),
        GG.el('button',{class:'btn', style:{padding:'6px 12px',fontSize:'13px'},
          onClick:()=>{ entries.splice(i,1); syncHash(); entries.length?render():welcome(); }}, GG.T('删','Del'))
      ));
    });
    main.appendChild(list);
  }

  if(entries.length >= MIN_ENTRIES){ renderSummary(); }
  else if(entries.length){
    main.appendChild(GG.el('div',{class:'card pad center muted', style:{marginTop:'16px'}},
      GG.T(`再写 ${MIN_ENTRIES - entries.length} 条，就能看到情绪曲线、心情天气和触发词云 →`,
        `Write ${MIN_ENTRIES - entries.length} more to see your mood curve, mood weather, and trigger word cloud →`)));
  }
}

function renderSummary(){
  const scores = entries.map(e=>e.score);
  const avg = Math.round(scores.reduce((a,b)=>a+b,0)/scores.length);
  const recent = scores.slice(-3);
  const recentAvg = Math.round(recent.reduce((a,b)=>a+b,0)/recent.length);
  const trend = scores[scores.length-1] - scores[0];
  const cloud = wordCloud();
  const trigTop = cloud.filter(c=>c.trig).slice(0,3).map(c=>c.w);
  const topWords = cloud.slice(0,3).map(c=>c.w);
  const overall = weatherOf(avg);

  const moodWord = avg>=62?GG.T('整体偏积极','lean positive overall'):(avg<=42?GG.T('近来偏低落','have been a bit low lately'):GG.T('起伏中带着平稳','have ups and downs with a steady core'));
  const trendWord = trend>=12?GG.T('，并在往上走',', and they are trending up'):(trend<=-12?GG.T('，且呈下行',', and they are drifting down'):'');
  const trigPhrase = (trigTop.length?trigTop:topWords).slice(0,2).join(GG.T('、',', '));
  const summary = GG.T(`这 ${entries.length} 条记录${moodWord}（平均 ${avg}）${trendWord}。`,
      `Your ${entries.length} entries ${moodWord} (average ${avg})${trendWord}.`) +
    (trigPhrase? GG.T(`高频触发词是「${trigPhrase}」，多和这些有关。`,
      ` Frequent triggers: “${trigPhrase}” — much of it seems tied to these.`) : '');

  main.appendChild(GG.el('div',{class:'section-t'}, GG.T('你的情绪小结','Your mood summary')));
  main.appendChild(GG.el('div',{class:'card pad', style:{display:'flex', gap:'24px', flexWrap:'wrap', alignItems:'center'}},
    GG.el('div', null,
      GG.el('div',{class:'bignum', style:{color:'var(--accent)'}}, String(avg)),
      GG.el('div',{class:'small muted'}, GG.T('平均情绪 / 100','Average mood / 100'))),
    GG.el('div', null,
      GG.el('div',{style:{fontSize:'28px',fontWeight:'760'}}, (trend>=0?'↗ +':'↘ ')+trend),
      GG.el('div',{class:'small muted'}, GG.T('首条→末条 趋势','First → last trend'))),
    GG.el('div',{style:{flex:'1', minWidth:'220px'}},
      GG.el('p',{style:{margin:'0', color:'var(--ink-2)', lineHeight:'1.6'}}, summary))
  ));

  // 心情天气（呼应 🌤️）
  main.appendChild(GG.el('div',{class:'section-t'}, GG.T('心情天气','Mood weather')));
  main.appendChild(GG.el('div',{class:'card pad'},
    GG.el('div',{class:'mj-weather'},
      GG.el('div',{class:'mj-wnow'},
        GG.el('span',{class:'big'}, overall.icon),
        GG.el('div',{class:'txt'},
          GG.el('div',{class:'w1'}, GG.T('整体「'+overall.word+'」','Overall “'+overall.word+'”')),
          GG.el('div',{class:'w2'}, GG.T('由平均情绪 '+avg+' 换算','Converted from average mood '+avg)))),
      GG.el('div',{style:{flex:'1'}}),
      GG.el('div',{class:'mj-wseq'}, ...entries.map(e=>GG.el('span',{title:GG.T('情绪 '+e.score,'Mood '+e.score)}, weatherOf(e.score).icon)))),
    GG.el('p',{class:'small muted', style:{margin:'10px 0 0'}},
      GG.T('每条记录一格天气，从左到右就是你这段时间的「天气预报」。',
        'One weather cell per entry — read left to right, it is your “forecast” for this stretch.'))));

  // 情绪曲线
  main.appendChild(GG.el('div',{class:'section-t'}, GG.T('情绪曲线','Mood curve')));
  main.appendChild(GG.el('div',{class:'card pad', html: curveSVG()}));

  // 情绪分布
  const bins = [
    {lab:GG.T('😄 很好','😄 Great'), min:75, c:0, col:'#3aa17e'},
    {lab:GG.T('🙂 还行','🙂 Good'), min:59, c:0, col:'#6cb98f'},
    {lab:GG.T('😐 一般','😐 Okay'), min:44, c:0, col:'var(--accent)'},
    {lab:GG.T('🙁 偏低','🙁 Low'), min:28, c:0, col:'#e0a050'},
    {lab:GG.T('😣 很差','😣 Rough'), min:0,  c:0, col:'#d2705a'},
  ];
  entries.forEach(e=>{ (bins.find(b=> e.score>=b.min)).c++; });
  const maxC = Math.max(1, ...bins.map(b=>b.c));
  const distRows = bins.map(b=> GG.el('div',{style:{display:'grid', gridTemplateColumns:'72px 1fr 26px', gap:'10px', alignItems:'center', margin:'7px 0'}},
    GG.el('span',{class:'small'}, b.lab),
    GG.el('div',{style:{height:'14px', borderRadius:'7px', background:'var(--accent-soft)', overflow:'hidden'}},
      GG.el('i',{style:{display:'block', height:'100%', width:(b.c/maxC*100)+'%', background:b.col, borderRadius:'7px', transition:'width .45s'}})),
    GG.el('span',{class:'small muted', style:{textAlign:'right'}}, String(b.c))));
  main.appendChild(GG.el('div',{class:'section-t'}, GG.T('情绪分布','Mood distribution')));
  main.appendChild(GG.el('div',{class:'card pad'},
    distRows[0], distRows[1], distRows[2], distRows[3], distRows[4],
    GG.el('p',{class:'small muted', style:{margin:'8px 0 0'}},
      GG.T('每条记录按情绪分落入对应档位的次数。','How many entries fall into each band by mood score.'))));

  // 触发词云
  main.appendChild(GG.el('div',{class:'section-t'}, GG.T('触发词云','Trigger word cloud')));
  const cloudCard = GG.el('div',{class:'card pad'});
  cloudCard.appendChild(cloudNode(cloud));
  cloudCard.appendChild(GG.el('div',{class:'small muted center', style:{marginTop:'4px'}},
    GG.T('字号 = 出现频次　·　彩色 = 触发场景词','Size = frequency · Color = trigger words')));
  main.appendChild(cloudCard);

  // AI 情绪洞察
  mountInsight(main);

  // 收尾安慰
  const ck = avg<=42?'low':(avg>=62?'high':'mid');
  main.appendChild(GG.el('div',{class:'section-t'}, GG.T('给你的一句话','A line for you')));
  main.appendChild(GG.el('div',{class:'card pad mj-closing'}, GG.el('p', null, M.closing[ck])));

  // 分享
  const shareSpec = {
    slug: SLUG, title: GG.T('我的情绪小结','My Mood Summary'),
    subtitle: GG.T(`${entries.length} 条记录 · 平均情绪 ${avg}`, `${entries.length} entries · average mood ${avg}`),
    big: { value: avg, label: GG.T('平均情绪 /100','Average mood /100') }, note: summary,
    rows: [
      { label:GG.T('心情天气','Mood weather'), value: overall.icon+GG.T(' 整体「'+overall.word+'」',' Overall “'+overall.word+'”') },
      { label:GG.T('趋势','Trend'), value: (trend>=0?GG.T('上行 +','Up +'):GG.T('下行 ','Down '))+trend+GG.T(`（最近三条均值 ${recentAvg}）`,` (last-3 average ${recentAvg})`) },
      { label:GG.T('高频触发词','Top triggers'), value: (cloud.slice(0,5).map(c=>c.w).join(GG.T('、',', '))) || '—' }
    ],
    tags: (trigTop.length?trigTop:topWords)
  };
  main.appendChild(GG.el('div',{class:'section-t'}, GG.T('分享','Share')));
  main.appendChild(GG.resultCard(SLUG, GG.el('div',{class:'center muted small'},
    GG.T('截图分享你的情绪小结 ↓','Screenshot to share your mood summary ↓')), shareSpec));
}

start();
})();
