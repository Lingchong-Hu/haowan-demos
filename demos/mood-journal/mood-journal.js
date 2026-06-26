/* mood-journal — 心情日记。
   ① 干净的「欢迎/登录」首屏（详情页手机预览里不再一进来就堆一屏）。
   ② 写完立刻「被接住」：每记一条 → 即时共情回应 + 情绪天气（呼应 🌤️）。
   ③ 攒够 3 条 → 情绪曲线 + 心情天气 + 触发词云 + 情绪分布 + 收尾安慰。
   打分/曲线/词云永远本地；连了 key 才按需叠加 AI 走心洞察。非心理诊断。 */
(function(){
const SLUG = 'mood-journal';
const M = window.MOOD;
const MIN_ENTRIES = 3;
let main, entries = [];          // {text, score(0-100), manual(bool)}

/* ---------- 情绪 → 天气 / 即时共情 ---------- */
function weatherOf(score){ return M.weather.find(w=> score>=w.min) || M.weather[M.weather.length-1]; }
function empathyOf(score, seed){
  const k = score<22?'vlow':score<38?'low':score<60?'mid':score<78?'high':'vhigh';
  return GG.pick(M.empathy[k], seed||score);
}
function triggerIn(text){
  const t=String(text);
  for(const w of M.triggers){ if(t.indexOf(w)!==-1) return w; }
  return null;
}

/* ---------- 情感打分：关键词词典 + 否定/程度处理 → 0~100 ---------- */
function scoreText(text){
  const t = String(text);
  let raw = 0, hits = 0;
  const scan = (list, base)=>{
    for(const w of list){
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
  const freq = {}, isTrig = {};
  const known = M.triggers.concat(M.pos, M.neg);
  for(const w of known){
    if(w.length < 2 && M.triggers.indexOf(w)===-1) continue;
    let from=0, idx, c=0;
    while((idx = all.indexOf(w, from))!==-1){ c++; from = idx + w.length; }
    if(c){
      const boost = M.triggers.indexOf(w)!==-1 ? 1.6 : 1.2;
      freq[w] = (freq[w]||0) + c * boost;
      if(M.triggers.indexOf(w)!==-1) isTrig[w] = true;
    }
  }
  const clean = all.replace(/[^一-龥a-zA-Z]+/g,'');
  for(let i=0;i+2<=clean.length;i++){
    const bi = clean.slice(i,i+2);
    if(M.stop.indexOf(bi)!==-1) continue;
    if(M.stop.indexOf(bi[0])!==-1 || M.stop.indexOf(bi[1])!==-1) continue;
    if(freq[bi]!=null) { freq[bi]+=0.5; continue; }
    freq[bi] = (freq[bi]||0) + 0.5;
  }
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
  const lines = [ [100,'高昂'], [50,'平静'], [0,'低落'] ].map(([s,lab])=>{
    const yy = y(s).toFixed(1);
    return `<line x1="${padL}" y1="${yy}" x2="${W-padR}" y2="${yy}" stroke="var(--line-2)" stroke-width="1"/>`+
           `<text x="6" y="${(+yy+4).toFixed(1)}" font-size="11" fill="var(--ink-3)">${lab}</text>`;
  }).join('');
  const dots = pts.map((p,i)=>{
    const e = entries[i];
    const col = e.score>=60 ? '#3aa17e' : (e.score<=40 ? '#d2705a' : 'var(--accent)');
    return `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="5" fill="${col}" stroke="#fff" stroke-width="2">`+
           `<title>第 ${i+1} 条 · 情绪 ${e.score}</title></circle>`;
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
    }, title: it.trig? '触发词':'高频词'}, it.w));
  });
  return box;
}

/* ---------- AI 情绪洞察（连了 key 才出现完整段落；未连给连接入口） ---------- */
const MOOD_SYS = '你是温柔、专业的情绪陪伴者（不做心理诊断）。下面是用户最近写的多条心情记录及其情绪分（0-100）。请读完后给出走心的小结与温柔的建议。只输出严格 JSON：{"summary":"一句话共情式总结","insights":["2到3条你观察到的模式，引用其记录内容"],"suggestions":["2到3条温柔可执行的建议"]}。不做诊断、不贴标签，全部简体中文。';
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
  if(ins.length){ body.appendChild(GG.el('div',{class:'section-t', style:{marginTop:'4px'}}, '我读到的')); body.appendChild(moodBullets(ins)); }
  if(sug.length){ body.appendChild(GG.el('div',{class:'section-t'}, '温柔的建议')); body.appendChild(moodBullets(sug)); }
  if(!ins.length && !sug.length && !obj.summary) body.appendChild(GG.el('p',{class:'small muted', style:{margin:'0'}}, '这次没生成出洞察，曲线与词云不受影响。'));
}
function mountInsight(parent){
  parent.appendChild(GG.el('div',{class:'section-t'}, '✨ AI 情绪洞察'));
  const body = GG.el('div');
  const card = GG.el('div',{class:'card pad', style:{borderLeft:'3px solid var(--accent)'}});
  parent.appendChild(card);
  if(!GG.llm.connected()){
    card.appendChild(GG.el('p',{class:'small muted', style:{margin:'0 0 6px'}},
      '上面的曲线、天气、词云都是本机即时算出来的。连上 AI 后，可以让它通读你写的每一条，回一段「真的读进去了」的走心小结。'));
    card.appendChild(GG.llm.bar());
    return;
  }
  const btn = GG.el('button',{class:'btn', onClick:()=>{
    btn.disabled = true; GG.clear(body);
    body.appendChild(GG.el('p',{class:'small muted', style:{margin:'8px 0 0'}}, 'AI 正在读你的这些记录…'));
    aiInsight().then(obj=>{ renderInsight(body, obj); btn.disabled=false; btn.textContent='↻ 重新解读'; })
      .catch(e=>{ GG.clear(body); body.appendChild(GG.el('p',{class:'small muted', style:{margin:'8px 0 0'}},
        'AI 洞察没拿到（'+(e&&e.code||'NET')+'），曲线与词云不受影响。')); btn.disabled=false; });
  }}, '✨ 让 AI 读读我的情绪');
  card.appendChild(GG.el('div',{class:'row', style:{justifyContent:'space-between', alignItems:'center'}},
    GG.el('span',{class:'small muted'}, '让 AI 通读你写的每一条，给一段走心的小结'),
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
    GG.el('div',{class:'mj-brand'}, '心情日记'),
    GG.el('div',{class:'mj-tag'}, '每天一句，看见自己的情绪'));

  const feat = (ic, t)=>GG.el('div',{class:'mj-feat'}, GG.el('span',{class:'ic'}, ic), t);
  const dotCols = ['#d2705a','#e0a050','#7a8fd4','#6cb98f','#3aa17e'];

  const body = GG.el('div',{class:'mj-body'},
    GG.el('div',{class:'mj-hook', html:'把心里的话写下来，<b>慢慢就看清自己</b>'}),
    GG.el('div',{class:'mj-feats'},
      feat('✍️', '一句话记一条，攒几条就有情绪曲线'),
      feat('🌦️', '把心情变成天气，一眼看懂今天'),
      feat('🫶', '写完立刻被「接住」，连 AI 给走心洞察')),
    GG.el('div',{class:'mj-proof'},
      GG.el('div',{class:'dots'}, ...dotCols.map(c=>GG.el('i',{style:{background:c}}))),
      GG.el('span', null, '已有 12,000+ 人在这里写下了今天')),
    GG.el('button',{class:'mj-go', onClick:()=>render()}, '✍️ 写下此刻的心情'),
    GG.el('button',{class:'mj-wx', onClick:()=>{ GG.toast('微信登录成功（演示）'); render(); }},
      GG.el('span',{class:'g'}, '❖'), '微信一键登录'),
    GG.el('button',{class:'mj-link', onClick:()=>{ M.samples.forEach(s=> addEntry(s, null)); render(); }},
      '或先看一份示例日记 →'));

  main.appendChild(GG.el('div',{class:'mj-gate'},
    GG.el('div',{class:'mj-card'}, head, body),
    GG.el('div',{class:'mj-priv'},
      GG.el('span', null, '🔒'),
      GG.el('span', null, '日记只存在你的浏览器本机，不上传服务器；演示用，非心理诊断。'))));
}

function addEntry(text, manualScore){
  text = String(text||'').trim();
  if(!text) { GG.toast('先写一句此刻的心情～'); return false; }
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
    GG.el('h1', null, '写下此刻的心情'),
    GG.el('p', null, `一句话记一条。攒满 ${MIN_ENTRIES} 条，我就把它们汇成情绪曲线、心情天气和触发词云。`)
  ));

  /* 输入区 */
  let pendingScore = null;
  const ta = GG.el('textarea',{class:'field', rows:'2',
    placeholder:'例如：加班到很晚，deadline 压着，有点焦虑…', style:{minHeight:'72px'}});
  const moodOpts = [['😣','很差',12],['🙁','偏低',32],['😐','一般',50],['🙂','还行',70],['😄','很好',90]];
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
    GG.el('label',{class:'label'}, '此刻心情'),
    ta,
    GG.el('div',{class:'small muted', style:{margin:'10px 0 2px'}}, '想自己打个分？（可选，不选我按文字估）'),
    moodRow,
    GG.el('div',{class:'row', style:{gap:'10px', flexWrap:'wrap'}},
      GG.el('button',{class:'btn primary', onClick:submit}, '＋ 记一条'),
      entries.length < MIN_ENTRIES + 1
        ? GG.el('button',{class:'btn', onClick:()=>{ M.samples.forEach(s=> addEntry(s, null)); render(); }}, '✨ 加几条示例')
        : null,
      entries.length
        ? GG.el('button',{class:'btn', onClick:()=>{ entries=[]; location.hash=''; welcome(); }}, '清空重写')
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
          `情绪 ${last.score} · 心情天气「${wt.word}」` + (trig?` · 记到了「${trig}」`:'')))));
  }

  /* 已记录列表（带天气徽标） */
  if(entries.length){
    main.appendChild(GG.el('div',{class:'section-t'}, `已记录 ${entries.length} 条`));
    const list = GG.el('div',{class:'stack'});
    entries.forEach((e,i)=>{
      const wt = weatherOf(e.score);
      list.appendChild(GG.el('div',{class:'card pad', style:{display:'flex', gap:'12px', alignItems:'center'}},
        GG.el('div',{class:'mj-badge'}, GG.el('span',{class:'w'}, wt.icon), GG.el('span',{class:'s'}, String(e.score))),
        GG.el('div',{style:{flex:'1', minWidth:'0'}},
          GG.el('div',{style:{fontSize:'15px', color:'var(--ink)'}}, e.text),
          GG.el('div',{class:'small muted', style:{marginTop:'3px'}},
            `#${i+1} · ${wt.word}` + (e.manual?'（你打的分）':'（按文字估）'))),
        GG.el('button',{class:'btn', style:{padding:'6px 12px',fontSize:'13px'},
          onClick:()=>{ entries.splice(i,1); syncHash(); entries.length?render():welcome(); }}, '删')
      ));
    });
    main.appendChild(list);
  }

  if(entries.length >= MIN_ENTRIES){ renderSummary(); }
  else if(entries.length){
    main.appendChild(GG.el('div',{class:'card pad center muted', style:{marginTop:'16px'}},
      `再写 ${MIN_ENTRIES - entries.length} 条，就能看到情绪曲线、心情天气和触发词云 →`));
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

  const moodWord = avg>=62?'整体偏积极':(avg<=42?'近来偏低落':'起伏中带着平稳');
  const trendWord = trend>=12?'，并在往上走':(trend<=-12?'，且呈下行':'');
  const trigPhrase = (trigTop.length?trigTop:topWords).slice(0,2).join('、');
  const summary = `这 ${entries.length} 条记录${moodWord}（平均 ${avg}）${trendWord}。` +
    (trigPhrase? `高频触发词是「${trigPhrase}」，多和这些有关。` : '');

  main.appendChild(GG.el('div',{class:'section-t'}, '你的情绪小结'));
  main.appendChild(GG.el('div',{class:'card pad', style:{display:'flex', gap:'24px', flexWrap:'wrap', alignItems:'center'}},
    GG.el('div', null,
      GG.el('div',{class:'bignum', style:{color:'var(--accent)'}}, String(avg)),
      GG.el('div',{class:'small muted'}, '平均情绪 / 100')),
    GG.el('div', null,
      GG.el('div',{style:{fontSize:'28px',fontWeight:'760'}}, (trend>=0?'↗ +':'↘ ')+trend),
      GG.el('div',{class:'small muted'}, '首条→末条 趋势')),
    GG.el('div',{style:{flex:'1', minWidth:'220px'}},
      GG.el('p',{style:{margin:'0', color:'var(--ink-2)', lineHeight:'1.6'}}, summary))
  ));

  // 心情天气（呼应 🌤️）
  main.appendChild(GG.el('div',{class:'section-t'}, '心情天气'));
  main.appendChild(GG.el('div',{class:'card pad'},
    GG.el('div',{class:'mj-weather'},
      GG.el('div',{class:'mj-wnow'},
        GG.el('span',{class:'big'}, overall.icon),
        GG.el('div',{class:'txt'},
          GG.el('div',{class:'w1'}, '整体「'+overall.word+'」'),
          GG.el('div',{class:'w2'}, '由平均情绪 '+avg+' 换算'))),
      GG.el('div',{style:{flex:'1'}}),
      GG.el('div',{class:'mj-wseq'}, ...entries.map(e=>GG.el('span',{title:'情绪 '+e.score}, weatherOf(e.score).icon)))),
    GG.el('p',{class:'small muted', style:{margin:'10px 0 0'}}, '每条记录一格天气，从左到右就是你这段时间的「天气预报」。')));

  // 情绪曲线
  main.appendChild(GG.el('div',{class:'section-t'}, '情绪曲线'));
  main.appendChild(GG.el('div',{class:'card pad', html: curveSVG()}));

  // 情绪分布
  const bins = [
    {lab:'😄 很好', min:75, c:0, col:'#3aa17e'},
    {lab:'🙂 还行', min:59, c:0, col:'#6cb98f'},
    {lab:'😐 一般', min:44, c:0, col:'var(--accent)'},
    {lab:'🙁 偏低', min:28, c:0, col:'#e0a050'},
    {lab:'😣 很差', min:0,  c:0, col:'#d2705a'},
  ];
  entries.forEach(e=>{ (bins.find(b=> e.score>=b.min)).c++; });
  const maxC = Math.max(1, ...bins.map(b=>b.c));
  const distRows = bins.map(b=> GG.el('div',{style:{display:'grid', gridTemplateColumns:'72px 1fr 26px', gap:'10px', alignItems:'center', margin:'7px 0'}},
    GG.el('span',{class:'small'}, b.lab),
    GG.el('div',{style:{height:'14px', borderRadius:'7px', background:'var(--accent-soft)', overflow:'hidden'}},
      GG.el('i',{style:{display:'block', height:'100%', width:(b.c/maxC*100)+'%', background:b.col, borderRadius:'7px', transition:'width .45s'}})),
    GG.el('span',{class:'small muted', style:{textAlign:'right'}}, String(b.c))));
  main.appendChild(GG.el('div',{class:'section-t'}, '情绪分布'));
  main.appendChild(GG.el('div',{class:'card pad'},
    distRows[0], distRows[1], distRows[2], distRows[3], distRows[4],
    GG.el('p',{class:'small muted', style:{margin:'8px 0 0'}}, '每条记录按情绪分落入对应档位的次数。')));

  // 触发词云
  main.appendChild(GG.el('div',{class:'section-t'}, '触发词云'));
  const cloudCard = GG.el('div',{class:'card pad'});
  cloudCard.appendChild(cloudNode(cloud));
  cloudCard.appendChild(GG.el('div',{class:'small muted center', style:{marginTop:'4px'}},
    '字号 = 出现频次　·　彩色 = 触发场景词'));
  main.appendChild(cloudCard);

  // AI 情绪洞察
  mountInsight(main);

  // 收尾安慰
  const ck = avg<=42?'low':(avg>=62?'high':'mid');
  main.appendChild(GG.el('div',{class:'section-t'}, '给你的一句话'));
  main.appendChild(GG.el('div',{class:'card pad mj-closing'}, GG.el('p', null, M.closing[ck])));

  // 分享
  const shareSpec = {
    slug: SLUG, title: '我的情绪小结', subtitle: `${entries.length} 条记录 · 平均情绪 ${avg}`,
    big: { value: avg, label: '平均情绪 /100' }, note: summary,
    rows: [
      { label:'心情天气', value: overall.icon+' 整体「'+overall.word+'」' },
      { label:'趋势', value: (trend>=0?'上行 +':'下行 ')+trend+`（最近三条均值 ${recentAvg}）` },
      { label:'高频触发词', value: (cloud.slice(0,5).map(c=>c.w).join('、')) || '—' }
    ],
    tags: (trigTop.length?trigTop:topWords)
  };
  main.appendChild(GG.el('div',{class:'section-t'}, '分享'));
  main.appendChild(GG.resultCard(SLUG, GG.el('div',{class:'center muted small'}, '截图分享你的情绪小结 ↓'), shareSpec));
}

start();
})();
