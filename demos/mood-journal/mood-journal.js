/* mood-journal — 写多条心情记录 → 情绪曲线（折线）+ 触发词云。全离线启发式。 */
(function(){
const SLUG = 'mood-journal';
const M = window.MOOD;
const MIN_ENTRIES = 3;          // 累计 ≥3 条出汇总
let main, entries = [];          // entries: {text, score(0-100), manual(bool)}

/* ---------- AI 情绪洞察（附加：打分/曲线/词云永远本地；reactive demo 用按需按钮，避免每记一条都调 API；非心理诊断） ---------- */
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
  if(!GG.llm.connected()) return;
  const body = GG.el('div');
  const btn = GG.el('button',{class:'btn', onClick:()=>{
    btn.disabled = true; GG.clear(body);
    body.appendChild(GG.el('p',{class:'small muted', style:{margin:'8px 0 0'}}, 'AI 正在读你的这些记录…'));
    aiInsight().then(obj=>{ renderInsight(body, obj); btn.disabled=false; btn.textContent='↻ 重新解读'; })
      .catch(e=>{ GG.clear(body); body.appendChild(GG.el('p',{class:'small muted', style:{margin:'8px 0 0'}},
        'AI 洞察没拿到（'+(e&&e.code||'NET')+'），曲线与词云不受影响。')); btn.disabled=false; });
  }}, '✨ 让 AI 读读我的情绪');
  parent.appendChild(GG.el('div',{class:'section-t'}, 'AI 情绪洞察'));
  parent.appendChild(GG.el('div',{class:'card pad', style:{borderLeft:'3px solid var(--accent)'}},
    GG.el('div',{class:'row', style:{justifyContent:'space-between', alignItems:'center'}},
      GG.el('span',{class:'small muted'}, '让 AI 通读你写的每一条，给一段走心的小结'),
      GG.llm.badge(true)),
    GG.el('div',{style:{marginTop:'10px'}}, btn),
    body));
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
        // 前 2 字内有否定词 → 翻转；有程度词 → 放大
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
  // 映射到 0~100，50 为中性；命中越多越往两端
  const norm = hits ? GG.clamp(raw / hits, -2, 2) : 0;
  return Math.round(GG.clamp(50 + norm * 24, 4, 96));
}

/* ---------- 分词 + 词频（去停用词，触发/情感词加权放大）---------- */
function wordCloud(){
  const all = entries.map(e=>e.text).join(' ');
  const freq = {}, isTrig = {};
  // 1) 已知词典词（触发/正负）直接整词命中，权重更高
  const known = M.triggers.concat(M.pos, M.neg);
  for(const w of known){
    if(w.length < 2 && M.triggers.indexOf(w)===-1) continue;
    let from=0, idx, c=0;
    while((idx = all.indexOf(w, from))!==-1){ c++; from = idx + w.length; }
    if(c){
      const boost = M.triggers.indexOf(w)!==-1 ? 1.6 : 1.2; // 触发词最大
      freq[w] = (freq[w]||0) + c * boost;
      if(M.triggers.indexOf(w)!==-1) isTrig[w] = true;
    }
  }
  // 2) 兜底：相邻双字滑窗，去停用词与已计词，捕捉用户自创词
  const clean = all.replace(/[^一-龥a-zA-Z]+/g,'');
  for(let i=0;i+2<=clean.length;i++){
    const bi = clean.slice(i,i+2);
    if(M.stop.indexOf(bi)!==-1) continue;
    if(M.stop.indexOf(bi[0])!==-1 || M.stop.indexOf(bi[1])!==-1) continue;
    if(freq[bi]!=null) { freq[bi]+=0.5; continue; }
    freq[bi] = (freq[bi]||0) + 0.5;
  }
  let list = Object.entries(freq)
    .filter(([w,c])=> c >= 1)
    .sort((a,b)=> b[1]-a[1])
    .slice(0, 16)
    .map(([w,c])=>({w, c, trig: !!isTrig[w]}));
  return list;
}

/* ---------- 渲染：折线 SVG ---------- */
function curveSVG(){
  const W = 640, H = 220, padL = 38, padR = 18, padT = 18, padB = 30;
  const n = entries.length;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const x = i => padL + (n===1 ? innerW/2 : innerW * i/(n-1));
  const y = s => padT + innerH * (1 - s/100);
  const pts = entries.map((e,i)=> [x(i), y(e.score)]);
  const poly = pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
  // 区域填充路径
  const area = `M ${pts[0][0].toFixed(1)} ${(H-padB)} ` +
    pts.map(p=>`L ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') +
    ` L ${pts[n-1][0].toFixed(1)} ${(H-padB)} Z`;
  // 网格 + 标签（高/中/低）
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

/* ---------- 渲染：词云（定位 span，按频次定字号）---------- */
function cloudNode(list){
  const box = GG.el('div',{style:{display:'flex', flexWrap:'wrap', alignItems:'center',
    justifyContent:'center', gap:'6px 14px', padding:'14px 6px', lineHeight:'1.1'}});
  const max = list[0] ? list[0].c : 1, min = list.length ? list[list.length-1].c : 1;
  list.forEach((it,i)=>{
    const t = max===min ? 1 : (it.c - min)/(max - min);
    const size = Math.round(15 + t*30);                 // 15~45px
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

/* ---------- 主流程 ---------- */
function start(){
  main = GG.mountShell(SLUG);
  // 可复现链接：hash 里带 entries
  const st = GG.decodeState();
  if(st && Array.isArray(st.e)){
    entries = st.e.map(x=> ({text:x.t, score:x.s, manual:!!x.m}));
  }
  render();
}

function addEntry(text, manualScore){
  text = String(text||'').trim();
  if(!text) { GG.toast('先写一句此刻的心情～'); return false; }
  const manual = manualScore!=null;
  entries.push({ text, score: manual ? manualScore : scoreText(text), manual });
  syncHash();
  return true;
}
function syncHash(){
  GG.encodeState({ e: entries.map(e=>({t:e.text, s:e.score, m:e.manual})) });
}

function render(){
  GG.clear(main);

  main.appendChild(GG.el('div',{class:'hero', style:{paddingBottom:'4px'}},
    GG.el('h1', null, '写下此刻的心情'),
    GG.el('p', null, `一句话记一条，连写几条。攒满 ${MIN_ENTRIES} 条，我就把它们汇成你的情绪曲线和触发词云。连上 AI 还能多一段走心的情绪洞察。`)
  ));
  main.appendChild(GG.llm.bar());

  /* 输入区 */
  let pendingScore = null;
  const ta = GG.el('textarea',{class:'field', rows:'2',
    placeholder:'例如：加班到很晚，deadline 压着，有点焦虑…',
    style:{minHeight:'72px'}});
  // 可选手动情绪分（5 档）
  const moodOpts = [['😣','很差',12],['🙁','偏低',32],['😐','一般',50],['🙂','还行',70],['😄','很好',90]];
  const moodRow = GG.el('div',{class:'row', style:{gap:'8px', flexWrap:'wrap', margin:'10px 0'}});
  moodOpts.forEach(([emo,lab,val])=>{
    const c = GG.el('span',{class:'chip', onClick:()=>{
      if(pendingScore===val){ pendingScore=null; c.classList.remove('on'); return; }
      pendingScore=val; GG.$$('.chip', moodRow).forEach(x=>x.classList.remove('on')); c.classList.add('on');
    }}, `${emo} ${lab}`);
    moodRow.appendChild(c);
  });
  const submit = ()=>{
    if(addEntry(ta.value, pendingScore)){ ta.value=''; pendingScore=null; render(); ta.focus(); }
  };
  ta.addEventListener('keydown', e=>{ if((e.ctrlKey||e.metaKey)&&e.key==='Enter') submit(); });

  const inputCard = GG.el('div',{class:'card pad', style:{marginTop:'8px'}},
    GG.el('label',{class:'label'}, '此刻心情'),
    ta,
    GG.el('div',{class:'small muted', style:{margin:'10px 0 2px'}}, '想自己打个分？（可选，不选我按文字估）'),
    moodRow,
    GG.el('div',{class:'row', style:{gap:'10px', flexWrap:'wrap'}},
      GG.el('button',{class:'btn primary', onClick:submit}, '＋ 记一条'),
      entries.length < MIN_ENTRIES + 1
        ? GG.el('button',{class:'btn', onClick:()=>{
            M.samples.forEach(s=> addEntry(s, null));
            render();
          }}, '✨ 加几条示例')
        : null,
      entries.length
        ? GG.el('button',{class:'btn', onClick:()=>{ entries=[]; location.hash=''; render(); }}, '清空重写')
        : null
    )
  );
  main.appendChild(inputCard);

  /* 已记录列表 */
  if(entries.length){
    main.appendChild(GG.el('div',{class:'section-t'}, `已记录 ${entries.length} 条`));
    const list = GG.el('div',{class:'stack'});
    entries.forEach((e,i)=>{
      const col = e.score>=60 ? '#3aa17e' : (e.score<=40 ? '#d2705a' : 'var(--accent)');
      list.appendChild(GG.el('div',{class:'card pad', style:{display:'flex', gap:'12px', alignItems:'center'}},
        GG.el('div',{style:{width:'44px',height:'44px',flex:'none',borderRadius:'12px',
          background:'var(--accent-soft)', color:col, fontWeight:'760', fontSize:'17px',
          display:'flex',alignItems:'center',justifyContent:'center'}}, String(e.score)),
        GG.el('div',{style:{flex:'1', minWidth:'0'}},
          GG.el('div',{style:{fontSize:'15px', color:'var(--ink)'}}, e.text),
          GG.el('div',{class:'small muted', style:{marginTop:'3px'}},
            `#${i+1} · 情绪 ${e.score}` + (e.manual?'（你打的分）':'（按文字估）'))
        ),
        GG.el('button',{class:'btn', style:{padding:'6px 12px',fontSize:'13px'},
          onClick:()=>{ entries.splice(i,1); syncHash(); render(); }}, '删')
      ));
    });
    main.appendChild(list);
  }

  /* 汇总：≥MIN_ENTRIES 条 → 曲线 + 词云 */
  if(entries.length >= MIN_ENTRIES){
    renderSummary();
  } else if(entries.length){
    main.appendChild(GG.el('div',{class:'card pad center muted', style:{marginTop:'16px'}},
      `再写 ${MIN_ENTRIES - entries.length} 条，就能看到情绪曲线和触发词云 →`));
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

  // 一句小结
  const moodWord = avg>=62?'整体偏积极':(avg<=42?'近来偏低落':'起伏中带着平稳');
  const trendWord = trend>=12?'，并在往上走':(trend<=-12?'，且呈下行':'');
  const trigPhrase = (trigTop.length?trigTop:topWords).slice(0,2).join('、');
  const summary = `这 ${entries.length} 条记录${moodWord}（平均 ${avg}）${trendWord}。` +
    (trigPhrase? `高频触发词是「${trigPhrase}」，多和这些有关。` : '');

  main.appendChild(GG.el('div',{class:'section-t'}, '你的情绪小结'));

  // KPI 行
  const kpiCard = GG.el('div',{class:'card pad', style:{display:'flex', gap:'24px', flexWrap:'wrap', alignItems:'center'}},
    GG.el('div', null,
      GG.el('div',{class:'bignum', style:{color:'var(--accent)'}}, String(avg)),
      GG.el('div',{class:'small muted'}, '平均情绪 / 100')),
    GG.el('div', null,
      GG.el('div',{style:{fontSize:'28px',fontWeight:'760'}}, (trend>=0?'↗ +':'↘ ')+trend),
      GG.el('div',{class:'small muted'}, '首条→末条 趋势')),
    GG.el('div',{style:{flex:'1', minWidth:'220px'}},
      GG.el('p',{style:{margin:'0', color:'var(--ink-2)', lineHeight:'1.6'}}, summary))
  );
  main.appendChild(kpiCard);

  // 情绪曲线
  main.appendChild(GG.el('div',{class:'section-t'}, '情绪曲线'));
  main.appendChild(GG.el('div',{class:'card pad', html: curveSVG()}));

  // 情绪分布（5 档计数，纯本地）
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

  // ✨ 连了 key 才出现：按需让 AI 通读全部记录给情绪洞察（曲线/词云已在本地完成）
  mountInsight(main);

  // 结果卡（含免责 + 分享栏）
  const shareInner = GG.el('div',{class:'center muted small'}, '截图分享你的情绪小结 ↓');
  const shareSpec = {
    slug: SLUG,
    title: '我的情绪小结',
    subtitle: `${entries.length} 条记录 · 平均情绪 ${avg}`,
    big: { value: avg, label: '平均情绪 /100' },
    note: summary,
    rows: [
      { label:'趋势', value: (trend>=0?'上行 +':'下行 ')+trend+`（最近三条均值 ${recentAvg}）` },
      { label:'高频触发词', value: (cloud.slice(0,5).map(c=>c.w).join('、')) || '—' }
    ],
    tags: (trigTop.length?trigTop:topWords)
  };
  main.appendChild(GG.el('div',{class:'section-t'}, '分享'));
  main.appendChild(GG.resultCard(SLUG, shareInner, shareSpec));
}

start();
})();
