/* baby-cry — 哭声翻译。录哭声/选样本 → 波形 → 五类原因概率条 + 安抚建议。
   关键：3 个样本走完全离线、无需麦克风的全链路；真实录音为可选增强。
   非诊断（registry disclaimer:true，resultCard 自动加免责声明）。 */
(function(){
const SLUG = 'baby-cry';
const { CAUSES, SAMPLES } = window.BABYCRY;
const WAVE_W = 480, WAVE_H = 140;   // 波形画布逻辑尺寸
let main;

/* ---------- 波形生成 ---------- */
// 样本：用种子 RNG 生成一段确定性「包络 + 噪声」振幅数组（不同 seed → 不同形状）
function sampleWave(seed, n){
  n = n || 220;
  const rnd = GG.rng(seed);
  const out = new Array(n);
  // 用种子决定整体节律：几个「哭浪」+ 衰减 + 毛刺强度
  const waves = 2 + Math.floor(rnd()*4);        // 2~5 个哭浪
  const decay = 0.25 + rnd()*0.7;               // 包络衰减
  const burst = 0.35 + rnd()*0.6;               // 毛刺/尖锐度
  const phase = rnd()*Math.PI*2;
  for(let i=0;i<n;i++){
    const t = i/n;
    // 多个正弦叠加构成「一波一波」的哭浪包络
    let env = Math.abs(Math.sin(phase + t*Math.PI*waves));
    env *= Math.exp(-t*decay);                  // 整体随时间略衰减
    // 高频噪声（毛刺），强度受 burst 控制
    const noise = (rnd()*2-1) * burst;
    let v = env*(0.55 + 0.45*Math.abs(noise)) + noise*0.18;
    out[i] = GG.clamp(Math.abs(v), 0, 1);
  }
  return out;
}

// 把振幅数组画进 canvas（镜像柱状波形）
function drawWave(canvas, amps, color){
  const ctx = canvas.getContext('2d');
  const scale = 2, W = WAVE_W, H = WAVE_H;
  canvas.width = W*scale; canvas.height = H*scale;
  canvas.style.width = '100%'; canvas.style.height = H+'px';
  ctx.scale(scale, scale);
  ctx.clearRect(0,0,W,H);
  // 中线
  ctx.strokeStyle = 'rgba(0,0,0,.06)';
  ctx.beginPath(); ctx.moveTo(0,H/2); ctx.lineTo(W,H/2); ctx.stroke();
  const n = amps.length;
  const gap = 1.5, bw = (W - (n-1)*gap)/n;
  for(let i=0;i<n;i++){
    const a = amps[i];
    const h = Math.max(2, a*(H*0.46));
    const x = i*(bw+gap);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.55 + a*0.45;
    GG._round(ctx, x, H/2-h, Math.max(0.8,bw), h*2, Math.min(2,bw/2));
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/* ---------- 概率引擎 ---------- */
// 样本：profile 归一化成百分比 + 一点种子抖动（保持确定性、可复现）
function probFromProfile(profile, seed){
  const rnd = GG.rng(seed+'-prob');
  const raw = CAUSES.map(c=>{
    const base = profile[c] || 0;
    const jit = base>0 ? (rnd()*8 - 4) : 0;       // ±4 抖动，主因仍稳居 Top1
    return Math.max(0, base + jit);
  });
  return normalize(raw);
}

// 真实录音：从振幅数组抽简单特征（平均振幅 / 过零率 / 峰值）映射到五类
function probFromFeatures(amps){
  let sum=0, peak=0, zc=0;
  for(let i=0;i<amps.length;i++){
    sum += amps[i]; if(amps[i]>peak) peak = amps[i];
    if(i>0 && ((amps[i]>0.18) !== (amps[i-1]>0.18))) zc++;  // 跨阈值次数 ≈ 过零率
  }
  const avg = sum/amps.length;
  const zcr = zc/amps.length;                    // 0~1，越高越「碎/尖」
  // 启发式映射：能量高+碎 → 胀气/不适；能量中+规律 → 饿；能量低 → 困；中等 → 求抱
  const raw = [
    GG.clamp(40 + (avg-0.25)*90 - zcr*40, 4, 90),                    // 饿了：中等能量、节律
    GG.clamp(46 - avg*70 + (0.2-zcr)*60, 4, 90),                     // 困了：低能量、不碎
    GG.clamp(20 + peak*40 + zcr*30, 4, 90),                          // 不适：峰值高
    GG.clamp(18 + (avg-0.3)*70 + zcr*70, 4, 90),                     // 胀气：高能量 + 碎
    GG.clamp(28 + Math.abs(avg-0.4)*-30 + 14, 4, 80)                 // 求抱：中等综合
  ];
  return normalize(raw);
}

function normalize(raw){
  const tot = raw.reduce((a,b)=>a+b,0) || 1;
  // 归一化成整数百分比，并修正使总和=100
  let pct = raw.map(v=>Math.round(v/tot*100));
  let diff = 100 - pct.reduce((a,b)=>a+b,0);
  // 把误差加到最大项上
  const maxI = pct.indexOf(Math.max(...pct));
  pct[maxI] += diff;
  return CAUSES.map((c,i)=>({ cause:c, pct: Math.max(0,pct[i]) }))
              .sort((a,b)=> b.pct - a.pct);
}

// 主因 → 对应安抚建议：样本直接用其 tips；录音按主因映射到最匹配样本的 tips
function tipsFor(topCause, sample){
  if(sample) return sample.tips;
  // 录音：用主因找一个语义最近的样本 tips
  const map = { '饿了':'hungry', '困了':'sleepy', '胀气':'gassy', '不适':'gassy', '求抱':'sleepy' };
  const s = SAMPLES.find(x=>x.key === map[topCause]) || SAMPLES[0];
  return s.tips;
}

/* ---------- AI 安抚顾问层（附加：波形/概率引擎永远本地，连了 key 才叠加个性化安抚；非医疗诊断） ---------- */
const BABYCRY_SYS = '你是温柔、有经验的育儿安抚顾问（不做医疗诊断）。下面是哭声翻译结果（最可能原因 + 五类概率 + 来源）。请给出针对主因的安抚步骤与观察要点。只输出严格 JSON：{"summary":"一句话共情+判断","steps":["3条按顺序可执行的安抚步骤"],"watch":"一句话——出现什么情况要就医"}。你不做医疗诊断，全部简体中文，语气温柔。';
function aiAdvice(probs, srcLabel){
  const dist = probs.map(p=>`${p.cause}${p.pct}%`).join('、');
  const user = `最可能原因：${probs[0].cause}（${probs[0].pct}%）\n五类分布：${dist}\n来源：${srcLabel}`;
  return GG.llm.json(BABYCRY_SYS, user, {max_tokens:700});
}
function cryBullets(arr, ordered){
  return GG.el(ordered?'ol':'ul',{class:'small', style:{margin:'4px 0 0', paddingLeft:'20px', color:'var(--ink-2)', lineHeight:'1.7'}},
    arr.map(t=>GG.el('li', null, t)));
}
function mountAdvice(stage, probs, srcLabel){
  if(!GG.llm.connected()) return;
  const body = GG.el('div', null, GG.el('p',{class:'small muted', style:{margin:'0'}}, 'AI 正在给更贴心的安抚建议…'));
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginBottom:'16px', borderLeft:'3px solid var(--accent)'}},
    GG.el('div',{class:'row', style:{justifyContent:'space-between', alignItems:'center'}},
      GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '✨ AI 安抚顾问'),
      GG.llm.badge(true)),
    body));
  aiAdvice(probs, srcLabel).then(obj=>{
    GG.clear(body);
    if(obj.summary) body.appendChild(GG.el('p',{style:{margin:'0 0 10px', fontWeight:'600'}}, String(obj.summary)));
    const steps = (Array.isArray(obj.steps)?obj.steps:[]).map(String).filter(Boolean);
    if(steps.length){ body.appendChild(GG.el('div',{class:'section-t', style:{marginTop:'4px'}}, '安抚步骤')); body.appendChild(cryBullets(steps, true)); }
    if(obj.watch) body.appendChild(GG.el('p',{class:'small muted', style:{margin:'10px 0 0'}}, '⚠︎ '+String(obj.watch)));
    if(!steps.length && !obj.summary) body.appendChild(GG.el('p',{class:'small muted', style:{margin:'0'}}, '这次没生成出建议，翻译结果不受影响。'));
  }).catch(e=>{ GG.clear(body);
    body.appendChild(GG.el('p',{class:'small muted', style:{margin:'0'}}, 'AI 建议没拿到（'+(e&&e.code||'NET')+'），翻译结果不受影响。')); });
}

/* ---------- 流程 ---------- */
function start(){
  main = GG.mountShell(SLUG);
  intro();
}

function intro(){
  main.appendChild(GG.el('div',{class:'hero'},
    GG.el('h1', null, '宝宝在说什么？'),
    GG.el('p', null, '录一段哭声，或直接试试样本。我会画出哭声波形，估出最可能的原因，并给你对应的安抚建议。连上 AI 还会多一份贴心的安抚顾问。')
  ));
  main.appendChild(GG.llm.bar());

  // 样本哭声（完全离线、无需麦克风的主路径）
  const sampleRow = GG.el('div',{class:'chips', style:{marginTop:'14px', justifyContent:'center'}},
    SAMPLES.map(s => GG.el('button',{class:'chip', style:{fontSize:'15px', padding:'10px 16px'},
      onClick:()=>useSample(s)}, s.emoji+' '+s.label)));

  // 真实录音（可选增强）
  const recBtn = GG.el('button',{class:'btn primary lg block', onClick:startRecording},
    '🎙️ 录一段宝宝的哭声（3 秒）');

  main.appendChild(GG.el('div',{class:'card pad', style:{marginTop:'18px', maxWidth:'460px', margin:'18px auto 0'}},
    recBtn,
    GG.el('div',{class:'center muted small', style:{margin:'14px 0 8px'}}, '— 或直接试试样本哭声（无需麦克风）—'),
    sampleRow,
    GG.el('p',{class:'center muted small', style:{margin:'12px 0 0'}},
      '点任意样本即可立即看到完整结果。')
  ));
  main.appendChild(GG.el('p',{class:'center muted small', style:{marginTop:'14px'}},
    '录音只在你的浏览器本地处理，不上传任何服务器。'));
}

/* ---- 样本路径（确定性、离线） ---- */
function useSample(s){
  const amps = sampleWave(s.waveSeed);
  const probs = probFromProfile(s.profile, s.waveSeed);
  run({ amps, probs, srcLabel: s.emoji+' '+s.label, sample: s });
}

/* ---- 真实录音路径（可选增强） ---- */
async function startRecording(){
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.AudioContext && !window.webkitAudioContext){
    GG.toast('此环境不支持录音，请用下方样本哭声');
    return;
  }
  let stream;
  try{
    stream = await navigator.mediaDevices.getUserMedia({ audio:true });
  }catch(e){
    GG.toast('未获得麦克风权限，请改用样本哭声');
    return;
  }
  // 录音 UI
  GG.clear(main);
  const stage = GG.el('div');
  main.appendChild(stage);
  stage.appendChild(GG.el('div',{class:'hero', style:{paddingTop:'8px'}},
    GG.el('h1',{style:{fontSize:'24px'}}, '🎙️ 正在录音…')));
  const dot = GG.el('div',{style:{width:'70px', height:'70px', borderRadius:'50%',
    background:'var(--accent)', margin:'8px auto', animation:'spin 1s linear infinite', opacity:'.85'}});
  const tip = GG.el('p',{class:'center muted small'}, '采集约 3 秒哭声，请让宝宝靠近麦克风…');
  stage.appendChild(GG.el('div',{class:'center'}, dot));
  stage.appendChild(tip);

  const AC = window.AudioContext || window.webkitAudioContext;
  const ctx = new AC();
  const src = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  src.connect(analyser);
  const buf = new Uint8Array(analyser.fftSize);
  const N = 220;
  const amps = new Array(N).fill(0);
  let frame = 0;
  const samplesPerBucket = 4;   // 多帧聚一格
  const total = N * samplesPerBucket;

  const timer = setInterval(()=>{
    analyser.getByteTimeDomainData(buf);
    // 该帧的振幅（偏离 128 的均方根）
    let s=0; for(let i=0;i<buf.length;i++){ const d=(buf[i]-128)/128; s += d*d; }
    const rms = Math.sqrt(s/buf.length);
    const idx = Math.floor(frame/samplesPerBucket);
    if(idx < N) amps[idx] = Math.max(amps[idx], GG.clamp(rms*2.4, 0, 1));
    frame++;
    if(frame >= total){
      clearInterval(timer);
      try{ stream.getTracks().forEach(t=>t.stop()); ctx.close(); }catch(_){}
      // 若几乎没采到声音，提示用样本
      const energy = amps.reduce((a,b)=>a+b,0)/N;
      if(energy < 0.02){
        GG.toast('没采集到明显哭声，已为你用样本演示');
        useSample(SAMPLES[0]);
        return;
      }
      const probs = probFromFeatures(amps);
      run({ amps, probs, srcLabel:'你的录音', sample:null });
    }
  }, 16);
}

/* ---- 统一出结果 ---- */
async function run(payload){
  GG.clear(main);
  const stage = GG.el('div'); main.appendChild(stage);
  await GG.thinking(stage, ['读取哭声波形…','提取节律与能量特征…','比对五类哭声模式…','生成安抚建议…'], 1400);
  GG.clear(stage);
  renderResult(stage, payload);
}

function renderResult(stage, { amps, probs, srcLabel, sample }){
  const m = GG.meta(SLUG);
  const accent = m.accent;
  const top = probs[0];
  const tips = tipsFor(top.cause, sample);

  stage.appendChild(GG.el('div',{class:'hero', style:{paddingTop:'8px'}},
    GG.el('h1',{style:{fontSize:'24px'}}, '👶 哭声翻译结果')));

  // 头部：主因 + 来源
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginBottom:'16px',
      background:'linear-gradient(160deg,var(--accent-soft),#fff 62%)'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '最可能的原因'),
    GG.el('div',{style:{fontSize:'30px', fontWeight:'760'}}, top.cause),
    GG.el('div',{class:'kpi', style:{marginTop:'8px'}},
      GG.el('span',{class:'pill'}, '置信约 '+top.pct+'%'),
      GG.el('span',{class:'pill'}, '来源：'+srcLabel),
      sample ? GG.el('span',{class:'pill'}, sample.desc) : GG.el('span',{class:'pill'}, '实时录音特征分析'))
  ));

  // 波形图
  const canvas = GG.el('canvas',{style:{display:'block', width:'100%', borderRadius:'10px',
    background:'#fbfbf9', border:'1px solid var(--line-2)'}});
  drawWave(canvas, amps, accent);
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginBottom:'16px'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '哭声波形'),
    canvas,
    GG.el('p',{class:'small muted', style:{margin:'10px 0 0'}},
      sample ? '波形由该样本的节律种子确定性生成，不同样本呈现不同形状。'
             : '波形取自你录音的真实振幅包络。')
  ));

  // 五类概率条（用 theme 的 .bar-row）
  const bars = GG.el('div',{class:'card pad', style:{marginBottom:'16px'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '五类原因概率'));
  probs.forEach((p,i)=>{
    const row = GG.el('div',{class:'bar-row'},
      GG.el('div',{class:'nm'}, p.cause),
      GG.el('div',{class:'bar'}, GG.el('i',{style:{width:'0%',
        background: i===0 ? accent : 'var(--ink-3)'}})),
      GG.el('div',{class:'pct'}, p.pct+'%'));
    bars.appendChild(row);
    // 入场动画：下一帧设置宽度
    const fill = GG.$('i', row);
    requestAnimationFrame(()=> setTimeout(()=>{ fill.style.width = p.pct+'%'; }, 60+i*60));
  });
  stage.appendChild(bars);

  // 安抚建议（主因对应清单）
  const tipList = GG.el('div',{class:'stack', style:{gap:'10px'}},
    tips.map((t,i)=> GG.el('div',{class:'opt', style:{cursor:'default'}},
      GG.el('span',{style:{fontWeight:'700', color:accent, flex:'none', width:'22px'}}, String(i+1)),
      GG.el('span',{class:'small', style:{color:'var(--ink-2)'}}, t))));
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginBottom:'16px'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '针对「'+top.cause+'」的安抚建议'),
    tipList));

  // ✨ 连了 key 才追加的 AI 安抚顾问（异步加载，翻译结果已在本地完成）
  mountAdvice(stage, probs, srcLabel);

  // 分享 spec
  const shareSpec = {
    slug: SLUG,
    title: '哭声翻译结果',
    subtitle: '最可能：'+top.cause+'（约 '+top.pct+'%）',
    bars: probs.map((p,i)=>({ label:p.cause, pct:p.pct, color: i===0?accent:undefined })),
    note: tips[0],
    tags: [top.cause]
  };

  // resultCard：disclaimer:true 会自动追加「非诊断」免责声明
  stage.appendChild(GG.resultCard(SLUG,
    GG.el('div',{class:'center muted small'}, '存图分享哭声翻译结果 ↓'),
    shareSpec));

  stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'18px'}},
    GG.el('button',{class:'btn', onClick:()=>{ start(); }}, '↻ 再翻译一段')));
}

start();
})();
