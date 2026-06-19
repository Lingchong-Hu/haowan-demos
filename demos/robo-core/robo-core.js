/* robo-core — 智能投顾。风险问卷 → 风险得分 → 资产配置饼图 + N 年增长曲线。
   关键签名点：改动问卷任一项即实时重绘饼图 + 增长曲线（不需点提交）。 */
(function(){
const SLUG = 'robo-core';
const { QUESTIONS, ASSETS, LEVELS } = window.ROBO;
const YEARS = 10;        // 增长曲线投影年数
const PRINCIPAL = 100000; // 初始本金（元），仅用于演示曲线刻度
let main;

/* ---------- 引擎 ---------- */
// 总分 = 各题选项分值按权重加权平均（0~100）
function riskScore(answers){
  let sum = 0, wsum = 0;
  QUESTIONS.forEach(q=>{
    const opt = q.options[answers[q.id]];
    sum += opt.score * q.weight; wsum += q.weight;
  });
  return GG.clamp(sum / wsum, 0, 100);
}
function levelFor(score){
  let lv = LEVELS[0];
  for(const l of LEVELS) if(score >= l.min) lv = l;
  return lv;
}
// 分数 → 四类权重。分数越高股票/另类越多、债券现金越少。
function allocation(score){
  const t = score/100;                       // 0~1
  let stock = 8 + t*72;                       // 8%~80%
  let alt   = 4 + t*16;                       // 4%~20%
  let bond  = 70 - t*60;                      // 70%~10%
  let cash  = 18 - t*16;                      // 18%~2%
  const raw = { stock, alt, bond, cash };
  const total = stock+alt+bond+cash;
  const out = {};
  ASSETS.forEach(a=> out[a.key] = raw[a.key]/total*100);  // 归一到 100%
  return out;
}
// 组合预期年化 = 各类权重 × 预期收益
function blendedReturn(alloc){
  let r = 0;
  ASSETS.forEach(a=> r += alloc[a.key]/100 * a.r);
  return r;
}
function blendedVol(alloc){
  let v = 0;                                  // 简化：加权波动（不算相关性，仅演示带宽）
  ASSETS.forEach(a=> v += alloc[a.key]/100 * a.vol);
  return v;
}

/* ---------- SVG 饼图 ---------- */
function donut(alloc){
  const W=220, R=92, IR=52, cx=W/2, cy=W/2;
  let a0 = -Math.PI/2;                         // 从 12 点开始
  const seg = [];
  ASSETS.forEach(asset=>{
    const frac = alloc[asset.key]/100;
    if(frac <= 0.0001) return;
    const a1 = a0 + frac*Math.PI*2;
    const large = (a1-a0) > Math.PI ? 1 : 0;
    const x0 = cx+R*Math.cos(a0), y0 = cy+R*Math.sin(a0);
    const x1 = cx+R*Math.cos(a1), y1 = cy+R*Math.sin(a1);
    const xi1 = cx+IR*Math.cos(a1), yi1 = cy+IR*Math.sin(a1);
    const xi0 = cx+IR*Math.cos(a0), yi0 = cy+IR*Math.sin(a0);
    const d = `M ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} `+
              `L ${xi1} ${yi1} A ${IR} ${IR} 0 ${large} 0 ${xi0} ${yi0} Z`;
    seg.push(`<path d="${d}" fill="${asset.color}"><title>${asset.label} ${alloc[asset.key].toFixed(1)}%</title></path>`);
    a0 = a1;
  });
  return `<svg viewBox="0 0 ${W} ${W}" width="100%" style="display:block;max-width:240px;margin:0 auto">
    ${seg.join('')}
    <text x="${cx}" y="${cy-4}" text-anchor="middle" font-size="13" fill="#8a8a93">权益占比</text>
    <text x="${cx}" y="${cy+18}" text-anchor="middle" font-size="22" font-weight="800" fill="#1d1d1f">${Math.round(alloc.stock+alloc.alt)}%</text>
  </svg>`;
}

/* ---------- SVG 增长曲线（乐观/中性/保守三条） ---------- */
function growthCurve(r, vol){
  const W=420, H=210, padL=46, padB=26, padT=14, padR=14;
  const plotW = W-padL-padR, plotH = H-padT-padB;
  const series = {
    opt: r + vol*0.7,    // 乐观
    mid: r,              // 中性
    con: Math.max(0.005, r - vol*0.7), // 保守
  };
  // y 轴上界用乐观终值
  const yMax = PRINCIPAL * Math.pow(1+series.opt, YEARS);
  const X = i => padL + plotW * (i/YEARS);
  const Y = v => padT + plotH * (1 - v/yMax);
  const pts = rate => {
    let s = '';
    for(let i=0;i<=YEARS;i++){ const v = PRINCIPAL*Math.pow(1+rate,i); s += `${X(i)},${Y(v)} `; }
    return s.trim();
  };
  // 乐观↔保守之间的面积带
  let band = '';
  for(let i=0;i<=YEARS;i++){ band += `${X(i)},${Y(PRINCIPAL*Math.pow(1+series.opt,i))} `; }
  for(let i=YEARS;i>=0;i--){ band += `${X(i)},${Y(PRINCIPAL*Math.pow(1+series.con,i))} `; }
  // 网格 + Y 刻度
  let grid='';
  for(let g=0; g<=4; g++){
    const v = yMax*g/4, y = Y(v);
    grid += `<line x1="${padL}" y1="${y}" x2="${W-padR}" y2="${y}" stroke="#eee" stroke-width="1"/>`;
    grid += `<text x="${padL-6}" y="${y+4}" text-anchor="end" font-size="10" fill="#a0a0a8">${(v/10000).toFixed(0)}万</text>`;
  }
  let xlab='';
  [0,2,4,6,8,10].forEach(i=> xlab += `<text x="${X(i)}" y="${H-8}" text-anchor="middle" font-size="10" fill="#a0a0a8">${i}年</text>`);
  const acc = '#1f9e8f';
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block">
    ${grid}
    <polygon points="${band}" fill="${acc}" opacity="0.12"/>
    <polyline points="${pts(series.con)}" fill="none" stroke="${acc}" stroke-width="1.4" stroke-dasharray="4 3" opacity="0.7"/>
    <polyline points="${pts(series.opt)}" fill="none" stroke="${acc}" stroke-width="1.4" stroke-dasharray="4 3" opacity="0.7"/>
    <polyline points="${pts(series.mid)}" fill="none" stroke="${acc}" stroke-width="2.6"/>
    ${xlab}
  </svg>`;
}

/* ---------- 渲染 ---------- */
let answers = {};          // {qid: optionIndex}
let pieBox, curveBox, summaryBox, resultBox;

function compute(){
  const score = riskScore(answers);
  const lv = levelFor(score);
  const alloc = allocation(score);
  const r = blendedReturn(alloc);
  const vol = blendedVol(alloc);
  const fv = PRINCIPAL * Math.pow(1+r, YEARS);
  return { score, lv, alloc, r, vol, fv };
}

function redraw(){
  const { score, lv, alloc, r, vol, fv } = compute();

  pieBox.innerHTML = donut(alloc);
  curveBox.innerHTML = growthCurve(r, vol);

  // 配置图例 + 摘要
  GG.clear(summaryBox);
  summaryBox.appendChild(GG.el('div',{class:'row', style:{justifyContent:'space-between', alignItems:'baseline', flexWrap:'wrap', gap:'8px'}},
    GG.el('div',null,
      GG.el('span',{style:{fontSize:'22px', fontWeight:'800'}}, lv.name),
      GG.el('span',{class:'pill', style:{marginLeft:'8px', background:'var(--accent)', color:'#fff', padding:'3px 10px', borderRadius:'999px', fontSize:'12px', fontWeight:'700'}}, lv.tag)
    ),
    GG.el('div',{class:'small muted'}, '风险得分 '+Math.round(score)+' / 100')
  ));
  summaryBox.appendChild(GG.el('p',{class:'small muted', style:{margin:'6px 0 12px'}}, lv.desc));
  const legend = GG.el('div',{class:'stack', style:{gap:'6px'}});
  ASSETS.forEach(a=>{
    legend.appendChild(GG.el('div',{class:'row', style:{justifyContent:'space-between', alignItems:'center'}},
      GG.el('div',{class:'row', style:{gap:'8px', alignItems:'center'}},
        GG.el('span',{style:{width:'12px', height:'12px', borderRadius:'3px', background:a.color, display:'inline-block', flex:'none'}}),
        GG.el('span',{class:'small'}, a.label)),
      GG.el('span',{class:'small', style:{fontWeight:'700'}}, alloc[a.key].toFixed(1)+'%')
    ));
  });
  summaryBox.appendChild(legend);
  summaryBox.appendChild(GG.el('div',{class:'row', style:{justifyContent:'space-between', marginTop:'12px', paddingTop:'10px', borderTop:'1px solid #eee'}},
    GG.el('span',{class:'small muted'}, '组合预期年化'),
    GG.el('span',{class:'small', style:{fontWeight:'700', color:'var(--accent)'}}, (r*100).toFixed(1)+'%')
  ));
  summaryBox.appendChild(GG.el('div',{class:'row', style:{justifyContent:'space-between', marginTop:'4px'}},
    GG.el('span',{class:'small muted'}, '10 万本金 · '+YEARS+' 年后（中性）'),
    GG.el('span',{class:'small', style:{fontWeight:'700'}}, '约 '+GG.fmt(Math.round(fv))+' 元')
  ));

  // 结果卡（含分享栏 + 免责声明）
  GG.clear(resultBox);
  const shareSpec = {
    slug: SLUG,
    title: '我的资产配置',
    subtitle: '风险等级：'+lv.name+'（'+lv.tag+'）· 得分 '+Math.round(score),
    rows: ASSETS.map(a=>({ label: a.label, value: alloc[a.key].toFixed(1)+'%' })),
    note: '组合预期年化约 '+(r*100).toFixed(1)+'%，'+YEARS+' 年复利投影；越激进股票占比越高。',
    tags: [lv.name, '预期'+(r*100).toFixed(1)+'%'],
  };
  resultBox.appendChild(GG.resultCard(SLUG,
    GG.el('div',{class:'center small muted'}, '改任意一题，饼图与曲线即时变化 · 截图分享你的配置 ↓'),
    shareSpec));
}

function buildQuestion(q){
  const wrap = GG.el('div',{class:'card pad', style:{marginBottom:'12px'}});
  wrap.appendChild(GG.el('div',{class:'section-t', style:{marginTop:'0', marginBottom:'8px'}}, q.label));
  const opts = GG.el('div',{class:'chips'});
  q.options.forEach((o, i)=>{
    const chip = GG.el('button',{
      class:'chip', type:'button',
      style:{ cursor:'pointer' },
      onClick:()=>{
        answers[q.id] = i;
        GG.$$('.chip', opts).forEach(c=> c.classList.remove('on'));
        chip.classList.add('on');
        redraw();              // 改即变，无需提交
      }
    }, o.label);
    if(answers[q.id] === i) chip.classList.add('on');
    opts.appendChild(chip);
  });
  wrap.appendChild(opts);
  return wrap;
}

function start(){
  main = GG.mountShell(SLUG);

  // 默认答案：从 URL 还原，否则取中间项
  const st = GG.decodeState();
  QUESTIONS.forEach(q=>{
    answers[q.id] = (st && st.a && st.a[q.id]!=null) ? st.a[q.id] : Math.floor(q.options.length/2);
  });

  main.appendChild(GG.el('div',{class:'hero', style:{paddingBottom:'4px'}},
    GG.el('h1', null, '60 秒，给你一套资产配置'),
    GG.el('p', null, '答 5 道风险题，实时生成你的资产配置饼图与 '+YEARS+' 年增长曲线 —— 改任意一题，图表立刻跟着变。')
  ));

  // 两栏：左问卷，右图表（窄屏自动堆叠，靠 flex-wrap）
  const grid = GG.el('div',{class:'row', style:{alignItems:'flex-start', gap:'18px', flexWrap:'wrap', marginTop:'10px'}});

  const left = GG.el('div',{style:{flex:'1 1 320px', minWidth:'300px'}});
  QUESTIONS.forEach(q=> left.appendChild(buildQuestion(q)));

  const right = GG.el('div',{style:{flex:'1 1 360px', minWidth:'300px', position:'sticky', top:'12px'}});
  const chartCard = GG.el('div',{class:'card pad', style:{marginBottom:'12px'}});
  chartCard.appendChild(GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '资产配置'));
  pieBox = GG.el('div',{style:{margin:'4px 0 8px'}});
  chartCard.appendChild(pieBox);
  summaryBox = GG.el('div');
  chartCard.appendChild(summaryBox);
  right.appendChild(chartCard);

  const curveCard = GG.el('div',{class:'card pad', style:{marginBottom:'12px'}});
  curveCard.appendChild(GG.el('div',{class:'section-t', style:{marginTop:'0'}}, YEARS+' 年增长曲线'));
  curveCard.appendChild(GG.el('p',{class:'small muted', style:{margin:'0 0 8px'}}, '实线为中性预期，阴影带为乐观↔保守区间（10 万本金复利投影）。'));
  curveBox = GG.el('div');
  curveCard.appendChild(curveBox);
  right.appendChild(curveCard);

  resultBox = GG.el('div');
  right.appendChild(resultBox);

  grid.appendChild(left);
  grid.appendChild(right);
  main.appendChild(grid);

  // 把当前答案写进 URL（可复现分享），并首绘
  GG.encodeState({ a: answers });
  redraw();

  // 答案变化时同步更新 URL（轻量：每次重绘后写）
  const _redraw = redraw;
  redraw = function(){ _redraw(); GG.encodeState({ a: answers }); };
}

start();
})();
