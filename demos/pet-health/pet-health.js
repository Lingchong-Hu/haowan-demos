/* pet-health — 宠物拍照自检。选部位→拍照/选本地样图→真实读像素得指标→健康分+观察项+就医建议。
   完全离线可跑：本地 canvas 现画样图（参数不同→外观不同→读出不同指标→不同结果）。上传作可选增强。 */
(function(){
const SLUG='pet-health';
const {PARTS, SAMPLES, OBS, TRIAGE} = window.PETHEALTH;
let main, curPart = 'eye';

/* ---------- 画样图（本地像素，可被真实取色分析） ---------- */
function drawEye(ctx, p, W, H){
  // 眼周皮毛底
  ctx.fillStyle='#d8c4a6'; ctx.fillRect(0,0,W,H);
  // 眼白（结膜）——按 redness 调成偏红
  const r = Math.round(235 - p.redness*70);
  const g = Math.round(232 - p.redness*150);
  const b = Math.round(228 - p.redness*150);
  ctx.fillStyle=`rgb(${r},${g},${b})`;
  ctx.beginPath(); ctx.ellipse(W/2,H/2,W*0.40,H*0.26,0,0,7); ctx.fill();
  // 红血丝
  if(p.redness>0.3){
    ctx.strokeStyle=`rgba(200,40,30,${0.25+p.redness*0.5})`; ctx.lineWidth=1.4;
    for(let i=0;i<Math.round(p.redness*16);i++){
      const a=Math.random()*Math.PI*2, len=W*0.18*Math.random();
      ctx.beginPath(); ctx.moveTo(W*0.5+Math.cos(a)*W*0.16, H*0.5+Math.sin(a)*H*0.10);
      ctx.lineTo(W*0.5+Math.cos(a)*(W*0.16+len), H*0.5+Math.sin(a)*(H*0.10+len*0.4)); ctx.stroke();
    }
  }
  // 虹膜 + 瞳孔
  ctx.fillStyle=p.iris; ctx.beginPath(); ctx.arc(W/2,H/2,W*0.17,0,7); ctx.fill();
  ctx.fillStyle='#16110a'; ctx.beginPath(); ctx.arc(W/2,H/2,W*0.085,0,7); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(W*0.45,H*0.44,W*0.03,0,7); ctx.fill();
  // 眼角分泌物（淡黄绿小点）
  for(let i=0;i<(p.discharge||0);i++){
    ctx.fillStyle='rgba(200,185,120,.9)';
    ctx.beginPath(); ctx.arc(W*0.16+i*7, H*0.5+(i%2?6:-6), 4+Math.random()*2,0,7); ctx.fill();
  }
}
function drawSkin(ctx, p, W, H){
  // 皮肤底色，按 redness 偏红
  const r = Math.round(232 - p.redness*30 + 20);
  const g = Math.round(205 - p.redness*90);
  const b = Math.round(190 - p.redness*100);
  ctx.fillStyle=`rgb(${r},${g},${b})`; ctx.fillRect(0,0,W,H);
  // 毛发纹理
  ctx.strokeStyle='rgba(150,120,90,.25)'; ctx.lineWidth=1;
  for(let i=0;i<60;i++){ const x=Math.random()*W, y=Math.random()*H;
    ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+6,y+12); ctx.stroke(); }
  // 红斑/丘疹
  for(let i=0;i<(p.spots||0);i++){
    const x=W*0.15+Math.random()*W*0.7, y=H*0.15+Math.random()*H*0.7, rad=5+Math.random()*8;
    const grd=ctx.createRadialGradient(x,y,0,x,y,rad);
    grd.addColorStop(0,'rgba(200,60,50,.85)'); grd.addColorStop(1,'rgba(200,60,50,0)');
    ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(x,y,rad,0,7); ctx.fill();
  }
  // 皮屑（白色小点）
  for(let i=0;i<Math.round((p.scale||0)*60);i++){
    ctx.fillStyle='rgba(245,245,238,.8)';
    ctx.beginPath(); ctx.arc(Math.random()*W, Math.random()*H, 1+Math.random()*1.6,0,7); ctx.fill();
  }
}
function drawSample(ctx, sample, W, H){
  if(sample.part==='eye') drawEye(ctx, sample.draw, W, H);
  else drawSkin(ctx, sample.draw, W, H);
}

/* ---------- 真实像素分析引擎 ---------- */
function analyzeEye(data, n){
  // 中心区域（结膜）红色占比：r 明显高于 g,b 的像素
  let redN=0, total=0, sumR=0,sumG=0,sumB=0, yellowN=0;
  for(let i=0;i<data.length;i+=4){
    const r=data[i],g=data[i+1],b=data[i+2]; total++;
    sumR+=r; sumG+=g; sumB+=b;
    if(r>120 && r-g>34 && r-b>34) redN++;            // 偏红像素
    if(r>150 && g>140 && b<140 && Math.abs(r-g)<40) yellowN++; // 黄绿分泌物
  }
  const redRatio = redN/total;             // 0~1
  const yellowRatio = yellowN/total;
  return { redRatio, yellowRatio,
           avg:[sumR/total,sumG/total,sumB/total] };
}
function analyzeSkin(data, n){
  let redN=0, brightN=0, total=0, sumR=0,sumG=0,sumB=0;
  for(let i=0;i<data.length;i+=4){
    const r=data[i],g=data[i+1],b=data[i+2]; total++;
    sumR+=r; sumG+=g; sumB+=b;
    if(r>140 && r-g>40 && r-b>45) redN++;            // 红斑像素
    if(r>235 && g>235 && b>225) brightN++;           // 皮屑（高亮白点）
  }
  return { redRatio:redN/total, scaleRatio:brightN/total,
           avg:[sumR/total,sumG/total,sumB/total] };
}
function analyze(canvas, part){
  const W=80, H=80;
  const c=document.createElement('canvas'); c.width=W; c.height=H;
  const ctx=c.getContext('2d'); ctx.drawImage(canvas,0,0,W,H);
  const data=ctx.getImageData(0,0,W,H).data;
  return part==='eye' ? analyzeEye(data, W*H) : analyzeSkin(data, W*H);
}

/* ---------- 由真实指标 → 健康分 + 观察项 + 就医档 ---------- */
function buildReport(metrics, part){
  const obs = OBS[part];
  let score = 100, items = [], findings = [];
  if(part==='eye'){
    const red = metrics.redRatio;        // 越大越红
    const yel = metrics.yellowRatio;
    score -= GG.clamp(red*180, 0, 55);
    score -= GG.clamp(yel*900, 0, 25);
    if(red < 0.06){ items.push(obs.rednessLow); }
    else if(red < 0.16){ items.push(obs.rednessMid); findings.push('结膜轻度发红'); }
    else { items.push(obs.rednessHigh); findings.push('结膜明显充血'); }
    if(yel < 0.004){ items.push(obs.dischargeNone); }
    else { items.push(obs.dischargeSome); findings.push('眼角分泌物'); }
    items.push('瞳孔对光区域清晰，未见明显浑浊');  // 固定正向项
  } else {
    const red = metrics.redRatio, scale = metrics.scaleRatio;
    score -= GG.clamp(red*220, 0, 50);
    score -= GG.clamp(scale*700, 0, 22);
    if(red < 0.04){ items.push(obs.rednessLow); items.push(obs.spotsLow); }
    else { items.push(obs.rednessHigh); items.push(obs.spotsHigh); findings.push('皮肤红斑'); }
    if(scale < 0.03){ items.push(obs.scaleLow); }
    else { items.push(obs.scaleHigh); findings.push('皮屑偏多'); }
  }
  score = Math.round(GG.clamp(score, 12, 99));
  const triage = TRIAGE.find(t=>score>=t.min) || TRIAGE[TRIAGE.length-1];
  return { score, items, findings, triage,
    metrics:{
      redPct: Math.round(metrics.redRatio*100),
      extraPct: Math.round((part==='eye'?metrics.yellowRatio:metrics.scaleRatio)*100),
    } };
}

/* ---------- AI 护理建议层（附加：像素分析永远本地，连了 key 才叠加个性化护理建议；非兽医诊断） ---------- */
const PETHEALTH_SYS = '你是有经验的宠物护理顾问（不是兽医、不做确诊）。下面是用户给宠物某部位拍照自检的结果（健康分、读到的指标、观察项、分级建议）。请给出针对性的家庭护理建议与观察要点。只输出严格 JSON：{"summary":"一句话点评目前状况","care":["3条具体的家庭护理/观察建议"],"vet":"一句话——出现什么情况必须尽快就医"}。你不是兽医、不做确诊，全部简体中文。';
function aiAdvice(rep, partLabel){
  const user = `检查部位：${partLabel}\n健康分：${rep.score}/100（${rep.triage.level}）\n读到的指标：发红${rep.metrics.redPct}%、异常迹象${rep.metrics.extraPct}%\n观察项：${rep.items.join('；')}\n发现：${rep.findings.join('、')||'未见明显异常'}\n系统建议：${rep.triage.advice}`;
  return GG.llm.json(PETHEALTH_SYS, user, {max_tokens:700});
}
function petBullets(arr){
  return GG.el('ul',{class:'small', style:{margin:'4px 0 0', paddingLeft:'20px', color:'var(--ink-2)', lineHeight:'1.7'}},
    arr.map(t=>GG.el('li', null, t)));
}
function mountAdvice(stage, rep, partLabel){
  if(!GG.llm.connected()) return;
  const body = GG.el('div', null, GG.el('p',{class:'small muted', style:{margin:'0'}}, 'AI 正在结合这份报告给护理建议…'));
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginBottom:'16px', borderLeft:'3px solid var(--accent)'}},
    GG.el('div',{class:'row', style:{justifyContent:'space-between', alignItems:'center'}},
      GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '✨ AI 护理建议'),
      GG.llm.badge(true)),
    body));
  aiAdvice(rep, partLabel).then(obj=>{
    GG.clear(body);
    if(obj.summary) body.appendChild(GG.el('p',{style:{margin:'0 0 10px', fontWeight:'600'}}, String(obj.summary)));
    const care = (Array.isArray(obj.care)?obj.care:[]).map(String).filter(Boolean);
    if(care.length){ body.appendChild(GG.el('div',{class:'section-t', style:{marginTop:'4px'}}, '家庭护理')); body.appendChild(petBullets(care)); }
    if(obj.vet) body.appendChild(GG.el('p',{class:'small muted', style:{margin:'10px 0 0'}}, '⚠︎ 需就医：'+String(obj.vet)));
    if(!care.length && !obj.summary) body.appendChild(GG.el('p',{class:'small muted', style:{margin:'0'}}, '这次没生成出建议，自检报告不受影响。'));
  }).catch(e=>{ GG.clear(body);
    body.appendChild(GG.el('p',{class:'small muted', style:{margin:'0'}}, 'AI 建议没拿到（'+(e&&e.code||'NET')+'），自检报告不受影响。')); });
}

/* ---------- ＋1：健康档案 / 复查趋势（单次打分 → 在好转还是在恶化） ----------
   对标 TTcare 这类宠物自检 App，核心从来不是"拍一次给个分"，而是"过几天再拍，看变好还是变差"。
   每次自检自动存进本地档案；复查时和上次并排对比（分数 / 指标 ↑↓ + 趋势判定），据趋势给出比单次更有意义的提醒。
   纯本地 localStorage；首检前预置一条"样例基线"，让对比第一次就看得见。全程非诊断。 */
const LOG_KEY = 'pethealth_log_v1';
function nowMs(){ return Date.now(); }
function seedLog(){
  const d = 4*24*3600*1000;
  const log = {
    eye:[  { score:61, redPct:14, extraPct:1, findings:['结膜轻度发红'], level:'建议预约', tone:'warn', srcLabel:'样例首检', t: nowMs()-d, seed:true } ],
    skin:[ { score:57, redPct:11, extraPct:9, findings:['皮屑偏多'],   level:'建议预约', tone:'warn', srcLabel:'样例首检', t: nowMs()-d, seed:true } ],
  };
  try{ localStorage.setItem(LOG_KEY, JSON.stringify(log)); }catch(e){}
  return log;
}
function loadLog(){
  try{ const o = JSON.parse(localStorage.getItem(LOG_KEY)||'null'); if(o && o.eye && o.skin) return o; }catch(e){}
  return seedLog();
}
function saveLog(log){ try{ localStorage.setItem(LOG_KEY, JSON.stringify(log)); }catch(e){} }
function clearLog(){ try{ localStorage.removeItem(LOG_KEY); }catch(e){} }
function lastOf(part){ const a = loadLog()[part]; return a && a.length ? a[a.length-1] : null; }
function pushRecord(part, rep, srcLabel){
  const log = loadLog();
  log[part] = (log[part]||[]).concat([{
    score:rep.score, redPct:rep.metrics.redPct, extraPct:rep.metrics.extraPct,
    findings:rep.findings.slice(), level:rep.triage.level, tone:rep.triage.tone,
    srcLabel:srcLabel||'本次自检', t: nowMs()
  }]);
  if(log[part].length > 12) log[part] = log[part].slice(-12);
  saveLog(log);
  return log[part];
}
function agoText(t){
  const ms = nowMs()-t, d=Math.floor(ms/86400000), h=Math.floor(ms/3600000), m=Math.floor(ms/60000);
  if(d>=1) return d+' 天前'; if(h>=1) return h+' 小时前'; return m>=1 ? m+' 分钟前' : '刚刚';
}
function trendCompare(prev, rep){
  const dScore = rep.score - prev.score;
  const dRed = rep.metrics.redPct - prev.redPct;
  const dExtra = rep.metrics.extraPct - prev.extraPct;
  let dir, verdict, tone;
  if(dScore >= 6){ dir='up'; tone='good';
    verdict = '较上次好转（健康分 '+prev.score+' → '+rep.score+'，+'+dScore+'）。当前的护理方向看起来有效，继续保持并定期复查。'; }
  else if(dScore <= -6){ dir='down'; tone='bad';
    verdict = '较上次变差（健康分 '+prev.score+' → '+rep.score+'，'+dScore+'）。自检数值在往坏的方向走——别再"再观察看看"了，建议尽快带去面诊。'; }
  else { dir='flat'; tone='warn';
    verdict = '较上次基本持平（健康分 '+prev.score+' → '+rep.score+'）。变化不明显，按原计划继续观察、过两天再复查一次。'; }
  return { dScore, dRed, dExtra, dir, tone, verdict, prev };
}
function sparkline(records, w, h){
  const pts = records.slice(-8);
  if(pts.length < 2) return null;
  w=w||120; h=h||34; const pad=4;
  const xs = pts.map((_,i)=> pad + i*(w-2*pad)/(pts.length-1));
  const ys = pts.map(r=> pad + (1 - GG.clamp(r.score,0,100)/100)*(h-2*pad));
  const dAttr = xs.map((x,i)=> (i?'L':'M')+x.toFixed(1)+' '+ys[i].toFixed(1)).join(' ');
  const last = pts[pts.length-1];
  const col = last.tone==='good'?'#2e9e7b':last.tone==='bad'?'#d8503f':'#d98a1f';
  const NS='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(NS,'svg'); svg.setAttribute('viewBox','0 0 '+w+' '+h); svg.setAttribute('width',String(w)); svg.setAttribute('height',String(h));
  const path=document.createElementNS(NS,'path'); path.setAttribute('d',dAttr); path.setAttribute('fill','none'); path.setAttribute('stroke',col); path.setAttribute('stroke-width','2'); path.setAttribute('stroke-linecap','round'); path.setAttribute('stroke-linejoin','round'); svg.appendChild(path);
  const dot=document.createElementNS(NS,'circle'); dot.setAttribute('cx',xs[xs.length-1].toFixed(1)); dot.setAttribute('cy',ys[ys.length-1].toFixed(1)); dot.setAttribute('r','2.6'); dot.setAttribute('fill',col); svg.appendChild(dot);
  return svg;
}
function archiveCard(){
  const log = loadLog();
  const parts = PARTS.filter(p=> (log[p.id]||[]).length);
  if(!parts.length) return null;
  const card = GG.el('div',{class:'card pad', style:{marginTop:'4px'}},
    GG.el('div',{class:'row', style:{justifyContent:'space-between', alignItems:'center'}},
      GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '🗂 健康档案'),
      GG.el('button',{class:'btn ghost small', style:{padding:'4px 10px'}, onClick:()=>{ clearLog(); intro(); }}, '清空')));
  parts.forEach(p=>{
    const recs = log[p.id], last = recs[recs.length-1], spark = sparkline(recs);
    card.appendChild(GG.el('div',{class:'row', style:{justifyContent:'space-between', alignItems:'center', gap:'12px', padding:'11px 0 2px', borderTop:'1px solid var(--line)'}},
      GG.el('div',{class:'row', style:{gap:'10px', alignItems:'center'}},
        GG.el('span',{style:{fontSize:'20px', flex:'none'}}, p.emoji),
        GG.el('div', null,
          GG.el('div',{style:{fontWeight:'650'}}, p.label),
          GG.el('div',{class:'small muted'}, '上次 '+last.score+' 分 · '+agoText(last.t)+(last.seed?' · 样例':'')))),
      GG.el('div',{class:'row', style:{gap:'12px', alignItems:'center'}},
        spark || GG.el('span',{class:'small muted'}, '复查后看趋势'),
        GG.el('button',{class:'btn small', style:{padding:'6px 12px', flex:'none'}, onClick:()=>{ curPart=p.id; intro(); }}, '🔁 复查'))));
  });
  return card;
}
function trendCard(tr, recs, part){
  const arrow = tr.dir==='up'?'▲':tr.dir==='down'?'▼':'▬';
  const col = toneColor(tr.tone);
  const spark = sparkline(recs, 160, 40);
  const metricName = part==='eye' ? '发红' : '红斑';
  const extraName  = part==='eye' ? '分泌物' : '皮屑';
  function deltaPill(label, d){               // 指标下降=异常变少=好（绿）；上升=红
    const good = d <= 0, sign = d>0?'+':'';
    return GG.el('span',{class:'pill', style:{background: d===0?'var(--surface)':(good?'#e8f6f0':'#fdecea'), color: d===0?'var(--ink-3)':(good?'#2e9e7b':'#d8503f')}}, label+' '+sign+d+'%');
  }
  return GG.el('div',{class:'card pad', style:{marginBottom:'16px', borderLeft:'4px solid '+col, background: tr.dir==='up'?'#f1faf6':tr.dir==='down'?'#fdf3f1':'#fff8ee'}},
    GG.el('div',{class:'row', style:{justifyContent:'space-between', alignItems:'center'}},
      GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '📈 较上次复查'),
      spark || GG.el('span')),
    GG.el('div',{class:'row', style:{alignItems:'baseline', gap:'10px', margin:'4px 0 8px'}},
      GG.el('span',{style:{fontWeight:'800', fontSize:'26px', color:col}}, arrow+' '+(tr.dScore>0?'+':'')+tr.dScore),
      GG.el('span',{class:'small muted'}, '健康分 '+tr.prev.score+' → '+(tr.prev.score+tr.dScore)+' · 距上次 '+agoText(tr.prev.t)+(tr.prev.seed?'（样例基线）':''))),
    GG.el('div',{class:'kpi', style:{marginBottom:'10px', gap:'8px', flexWrap:'wrap'}},
      deltaPill(metricName, tr.dRed), deltaPill(extraName, tr.dExtra)),
    GG.el('p',{style:{margin:'0', color:'var(--ink-2)', lineHeight:'1.6'}}, tr.verdict));
}

/* ---------- 流程 ---------- */
function start(){
  main = GG.mountShell(SLUG);
  intro();
}
function intro(){
  GG.clear(main);
  curPart = curPart || 'eye';
  main.appendChild(GG.el('div',{class:'hero'},
    GG.el('h1', null, '给宠物拍张照，做个健康自检'),
    GG.el('p', null, '选一个检查部位，拍照或直接点本地样图，我会真实读取图像像素，给出健康分、观察项和就医建议。每次自检都会自动存进健康档案——复查时直接告诉你：比上次是好转还是恶化。连上 AI 再加一份个性化护理建议。')
  ));
  main.appendChild(GG.llm.bar());
  const arch = archiveCard(); if(arch) main.appendChild(arch);   // ＋1：健康档案（复查趋势入口）

  // 部位选择
  const partRow = GG.el('div',{class:'chips', style:{marginTop:'4px'}});
  function paintParts(){
    GG.clear(partRow);
    PARTS.forEach(p=> partRow.appendChild(
      GG.el('button',{class:'chip'+(p.id===curPart?' on':''), onClick:()=>{ curPart=p.id; paintParts(); paintBody(); }},
        p.emoji+' '+p.label)));
  }

  const body = GG.el('div',{style:{marginTop:'16px'}});
  function paintBody(){
    GG.clear(body);
    const part = PARTS.find(p=>p.id===curPart);
    body.appendChild(GG.el('p',{class:'small muted', style:{margin:'0 0 12px'}}, part.hint));

    // 本地样图（离线主路径）
    body.appendChild(GG.el('div',{class:'section-t', style:{marginTop:'4px'}}, '点一张本地样图，立即分析'));
    const grid = GG.el('div',{style:{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:'12px'}});
    SAMPLES[curPart].forEach(s=>{
      const c=document.createElement('canvas'); c.width=150; c.height=120;
      drawSample(c.getContext('2d'), s, 150, 120);
      c.style.width='100%'; c.style.height='auto'; c.style.borderRadius='12px'; c.style.boxShadow='var(--sh-1)';
      const tile = GG.el('div',{class:'opt', style:{flexDirection:'column', alignItems:'stretch', padding:'10px', gap:'8px'},
        onClick:()=>useSample(s)},
        c, GG.el('div',{class:'small', style:{textAlign:'center', color:'var(--ink-2)'}}, s.label));
      grid.appendChild(tile);
    });
    body.appendChild(grid);

    // 上传（可选增强）
    const fileInput=GG.el('input',{type:'file', accept:'image/*', style:{display:'none'},
      onChange:e=>{ const f=e.target.files[0]; if(f) loadFile(f, curPart); }});
    body.appendChild(GG.el('div',{class:'center', style:{marginTop:'16px'}},
      fileInput,
      GG.el('button',{class:'btn', onClick:()=>fileInput.click()}, '📷 用自己的照片（可选）'),
      GG.el('p',{class:'small muted', style:{marginTop:'10px'}}, '照片只在你的浏览器本地处理，不上传任何服务器。')
    ));
  }

  paintParts(); paintBody();
  main.appendChild(GG.el('div',{class:'card pad', style:{marginTop:'10px'}}, partRow, body));
}

function useSample(s){
  const c=document.createElement('canvas'); c.width=260; c.height=200;
  drawSample(c.getContext('2d'), s, 260, 200);
  run(c, c.toDataURL('image/png'), s.part, s.label);
}
function loadFile(f, part){
  const reader=new FileReader();
  reader.onload=()=>{ const img=new Image(); img.onload=()=>{
    const c=document.createElement('canvas'); const W=260,H=200; c.width=W; c.height=H;
    const ar=img.width/img.height, tar=W/H; let sw,sh,sx,sy;
    if(ar>tar){ sh=img.height; sw=sh*tar; sx=(img.width-sw)/2; sy=0; }
    else { sw=img.width; sh=sw/tar; sx=0; sy=(img.height-sh)/2; }
    c.getContext('2d').drawImage(img,sx,sy,sw,sh,0,0,W,H);
    run(c, c.toDataURL('image/png'), part, '你的照片');
  }; img.src=reader.result; };
  reader.readAsDataURL(f);
}

async function run(canvas, dataURL, part, srcLabel){
  GG.clear(main);
  const stage=GG.el('div'); main.appendChild(stage);
  await GG.thinking(stage, ['读取图像像素…','检测发红/异常区域…','量化关键指标…','生成健康报告…'], 1500);
  const metrics = analyze(canvas, part);
  const report = buildReport(metrics, part);
  GG.clear(stage);
  renderResult(stage, report, dataURL, part, srcLabel);
}

/* ---------- 报告 ---------- */
function toneColor(tone){ return tone==='good'?'var(--good)':tone==='warn'?'var(--warn)':'var(--bad)'; }

function renderResult(stage, rep, dataURL, part, srcLabel){
  const partLabel = PARTS.find(p=>p.id===part).label;
  stage.appendChild(GG.el('div',{class:'hero', style:{paddingTop:'8px'}},
    GG.el('h1',{style:{fontSize:'24px'}}, '🐾 '+partLabel+'自检报告')));

  // 头部：预览 + 健康分
  stage.appendChild(GG.el('div',{class:'card pad', style:{display:'flex', gap:'18px', alignItems:'center', flexWrap:'wrap', marginBottom:'16px',
      background:'linear-gradient(160deg,var(--accent-soft),#fff 60%)'}},
    GG.el('img',{src:dataURL, alt:srcLabel, style:{width:'108px', height:'84px', borderRadius:'14px', objectFit:'cover', boxShadow:'var(--sh-1)'}}),
    GG.el('div',{style:{flex:'1', minWidth:'180px'}},
      GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '健康分'),
      GG.el('div',{class:'score-ring'},
        GG.el('div',{class:'bignum', style:{color:toneColor(rep.triage.tone)}}, String(rep.score)),
        GG.el('div',{class:'small muted'}, '/ 100')),
      GG.el('div',{class:'kpi', style:{marginTop:'8px'}},
        GG.el('span',{class:'pill', style:{background:'var(--accent-soft)', color:toneColor(rep.triage.tone)}}, rep.triage.level),
        GG.el('span',{class:'pill'}, srcLabel))
    )
  ));

  // ＋1：复查对比（趋势）——先取"本次之前"的最后一条，再把本次入档
  const prevRec = lastOf(part);
  const recs = pushRecord(part, rep, srcLabel);
  if(prevRec){
    stage.appendChild(trendCard(trendCompare(prevRec, rep), recs, part));
  }

  // 量化指标条
  const m1Label = part==='eye' ? '发红区域占比' : '红斑区域占比';
  const m2Label = part==='eye' ? '分泌物迹象' : '皮屑迹象';
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginBottom:'16px'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '从图像里读到的指标'),
    bar(m1Label, rep.metrics.redPct),
    bar(m2Label, rep.metrics.extraPct),
    GG.el('p',{class:'small muted', style:{margin:'10px 0 0'}}, '以上数值来自对图像像素的真实统计（发红像素 / 异常高亮点的占比）。')
  ));

  // 观察项清单
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginBottom:'16px'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '观察项清单'),
    GG.el('div',{class:'stack', style:{gap:'10px'}},
      rep.items.map(it=> GG.el('div',{class:'row', style:{alignItems:'flex-start', gap:'10px'}},
        GG.el('span',{style:{color:'var(--accent)', flex:'none', marginTop:'2px'}}, '•'),
        GG.el('span', null, it))))
  ));

  // 就医建议
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginBottom:'16px', borderLeft:'4px solid '+toneColor(rep.triage.tone)}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '就医建议'),
    GG.el('div',{style:{fontWeight:'680', fontSize:'18px', color:toneColor(rep.triage.tone), marginBottom:'4px'}}, rep.triage.level),
    GG.el('p',{style:{margin:'0', color:'var(--ink-2)'}}, rep.triage.advice)
  ));

  // ✨ 连了 key 才追加的 AI 护理建议（异步加载，自检报告已在本地完成）
  mountAdvice(stage, rep, partLabel);

  // 结果卡（含「非诊断」免责 + 分享栏）
  const subtitle = partLabel + ' · ' + (rep.findings.length ? '发现：'+rep.findings.join('、') : '未见明显异常');
  const shareSpec = {
    slug: SLUG, title:'宠物健康自检',
    big:{ value:rep.score, label:'健康分' },
    subtitle,
    rows: rep.items.map((it,i)=>({ label:'观察项'+(i+1), value:it })),
    note: rep.triage.advice,
    tags:[partLabel, rep.triage.level],
  };
  stage.appendChild(GG.resultCard(SLUG, GG.el('div',{class:'center muted small'}, '存图分享这份自检报告 ↓'), shareSpec));

  stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'18px'}},
    GG.el('button',{class:'btn', onClick:()=>{ start(); }}, '↻ 再检查一处')));
}

function bar(label, pct){
  return GG.el('div',{class:'bar-row'},
    GG.el('div',{class:'nm'}, label),
    GG.el('div',{class:'bar'}, GG.el('i',{style:{width:GG.clamp(pct,2,100)+'%',
      background: pct>30?'var(--bad)':pct>12?'var(--warn)':'var(--good)'}})),
    GG.el('div',{class:'pct'}, pct+'%'));
}

start();
})();
