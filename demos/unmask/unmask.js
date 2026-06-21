/* unmask — 不被看穿。你 vs 一个拼命给你建模的 AI。
   反讽式母题：这一次，被猜中是你输。你越想藏，越暴露自己的模式。
   ── 这里的「AI」是一个【真实的】自适应预测器（频率 / 一阶马尔可夫 / 二阶马尔可夫 /
      想扳回上一局 / 连续重复 的 meta 集成，按近期命中率自动切换最准的那个），
      没有用大模型——它真的在对你建模，实时进化。被它命中（它出的手克制你）= 被看穿。 */
(function(){
const SLUG = 'unmask';
const EMO   = ['✊','✋','✌️'];               // 0 石头 / 1 布 / 2 剪刀
const NAME  = ['石头','布','剪刀'];
const LABEL = { freq:'你的偏手习惯', m1:'上一手的惯性', m2:'两手连招',
                react:'急着扳回上一局', repeat:'连续重复同一手', cold:'还在摸你的底' };
const counter = m => (m+1)%3;                 // 击败 m 的那一手（石头0→布1）
const beats   = (a,b) => (a-b+3)%3 === 1;     // a 是否击败 b

let main, brain, state;

/* ════════════════════ 真实自适应预测器（meta 集成） ════════════════════ */
function makeBrain(){
  const freq=[0,0,0], m1={}, m2={};
  const my=[], ai=[], outs=[];
  const W = { freq:1, m1:1, m2:1, react:1, repeat:1 };   // 各预测器近期权重（指数衰减命中分）
  const DECAY = 0.88;
  const catchBy = {};                                     // 哪个预测器抓到你最多次
  let pending = null;

  function argmax(a){
    const m = Math.max(a[0],a[1],a[2]);
    const idx = [0,1,2].filter(i=>a[i]===m);
    return idx[Math.floor(Math.random()*idx.length)];     // 并列时随机，避免自身可被预测
  }
  function preds(){
    const last = my.length ? my[my.length-1] : null;
    const k2   = my.length>=2 ? (my[my.length-2]+','+last) : null;
    const aiLast = ai.length ? ai[ai.length-1] : null;
    return {
      freq:  (freq[0]+freq[1]+freq[2])>0 ? argmax(freq) : null,
      m1:    (last!=null && m1[last]) ? argmax(m1[last]) : null,
      m2:    (k2 && m2[k2]) ? argmax(m2[k2]) : null,
      react: aiLast!=null ? counter(aiLast) : null,        // 人常想「出克制 AI 上一手的手」扳回来
      repeat:last!=null ? last : null,
    };
  }

  return {
    /* 出手前：基于历史预测你这一手，出克制该预测的手 */
    play(){
      const p = preds();
      let best=null, bw=-1;
      for(const id in W){ if(p[id]==null) continue; if(W[id]>bw){ bw=W[id]; best=id; } }
      let predMove;
      if(best==null){ predMove = Math.floor(Math.random()*3); best='cold'; }
      else predMove = p[best];
      pending = { p, best, predMove };
      return { aiMove: counter(predMove), predMove, by:best };
    },
    /* 揭示后：给每个预测器按是否「预测中」打分（meta 学习）+ 更新统计表 */
    learn(myMove, aiMove, outcome){
      if(pending){
        for(const id in W){ const pm=pending.p[id]; if(pm==null) continue;
          W[id] = W[id]*DECAY + (pm===myMove ? 1 : 0); }
        if(outcome==='read') catchBy[pending.best] = (catchBy[pending.best]||0)+1;
      }
      const last = my.length ? my[my.length-1] : null;
      const k2   = my.length>=2 ? (my[my.length-2]+','+last) : null;
      if(last!=null) (m1[last]||(m1[last]=[0,0,0]))[myMove]++;
      if(k2) (m2[k2]||(m2[k2]=[0,0,0]))[myMove]++;
      freq[myMove]++;
      my.push(myMove); ai.push(aiMove); outs.push(outcome);
    },
    stats(){ return { freq, m1, m2, my, ai, outs, catchBy }; }
  };
}

/* ════════════════════ 流程 ════════════════════ */
function start(){
  main = GG.mountShell(SLUG);
  intro();
}

function intro(){
  GG.clear(main);
  main.appendChild(GG.el('div',{class:'hero'},
    GG.el('h1', null, '不被看穿'),
    GG.el('p',{class:'um-lede'},
      '你 vs 一个拼命想给你建模的 AI。每一手剪刀石头布，它都先押注你会出什么、再出克制你的手。'+
      '这一次——被猜中是你输。你的目标只有一个：保持不可预测，撑过它的预测。')
  ));
  main.appendChild(GG.el('div',{class:'um-how'},
    GG.el('div', null, '🎯 ', GG.el('b', null, '怎么玩'), '：连续出手，尽量别让它猜中。它出的手克制你 = ',
      GG.el('b', null, '被看穿'), '；你克制它 = 骗过它；同手 = 平。'),
    GG.el('div',{style:{marginTop:'6px'}}, '🔍 上方仪表是它对你的 ',
      GG.el('b', null, '可预测度'), '——越接近 33% 的「随机线」，说明它越摸不透你。'),
    GG.el('div',{style:{marginTop:'6px'}}, '🪞 它不靠运气：它在实时学习你的偏手、连招与下意识反应。终局会告诉你，它到底抓到了你哪条规律。')
  ));

  let rounds = 18;
  const lens = GG.el('div',{class:'um-lens'});
  [['短局',12],['标准',18],['硬核',26]].forEach(([t,n])=>{
    const c = GG.el('button',{class:'chip'+(n===18?' on':''), onClick:()=>{ rounds=n;
      GG.$$('button',lens).forEach(b=>b.classList.toggle('on', b===c)); }}, `${t} · ${n} 回合`);
    lens.appendChild(c);
  });
  main.appendChild(GG.el('div',{class:'section-t', style:{marginBottom:'4px'}}, '对局长度'));
  main.appendChild(lens);

  main.appendChild(GG.el('div',{class:'center', style:{marginTop:'24px'}},
    GG.el('button',{class:'btn primary lg', onClick:()=>play(rounds)}, '🎭 开始对局 →')));
}

function play(rounds){
  brain = makeBrain();
  state = { rounds, i:0, win:0, tie:0, read:0, hist:[], last:null };
  GG.clear(main);
  const stage = GG.el('div',{class:'um-stage'}); main.appendChild(stage);

  // HUD
  const roundEl = GG.el('span',{class:'um-round'});
  const tWin = GG.el('b',{style:{color:'var(--good)'}}, '0');
  const tTie = GG.el('b', null, '0');
  const tRead= GG.el('b',{style:{color:'var(--bad)'}}, '0');
  stage.appendChild(GG.el('div',{class:'um-hud'},
    roundEl,
    GG.el('div',{class:'um-tallies'},
      GG.el('span', null, '🏆 骗过 ', tWin),
      GG.el('span', null, '🤝 平 ', tTie),
      GG.el('span', null, '🔍 被看穿 ', tRead))
  ));

  // 仪表
  const pctEl = GG.el('span',{class:'pct'}, '—');
  const fill  = GG.el('div',{class:'um-fill'});
  stage.appendChild(GG.el('div',{class:'um-meterwrap'},
    GG.el('div',{class:'um-meterhead'},
      GG.el('span', null, '它对你的可预测度'), pctEl),
    GG.el('div',{class:'um-meter'},
      GG.el('div',{class:'um-track'}, fill),
      GG.el('div',{class:'um-base', style:{left:'33%'}}, GG.el('span', null, '随机线 33%')))
  ));

  // 揭示区
  const reveal = GG.el('div',{class:'um-reveal'},
    GG.el('div',{class:'um-wait'}, '出手吧 —— 它已经在押注你这一手了。'));
  // 三选
  const choices = GG.el('div',{class:'um-choices'});
  const btns = EMO.map((e,m)=> GG.el('button',{class:'um-choice', onClick:()=>pickMove(m)},
    GG.el('span',{class:'em'}, e), GG.el('span',{class:'nm'}, NAME[m])));
  btns.forEach(b=>choices.appendChild(b));
  // 历史条
  const hist = GG.el('div',{class:'um-hist'});

  stage.appendChild(reveal);
  stage.appendChild(choices);
  stage.appendChild(hist);

  function setRound(){ roundEl.textContent = `第 ${state.i+1} / ${state.rounds} 回合`; }
  setRound();

  function pickMove(myMove){
    const turn = brain.play();                 // AI 用此前历史预测当前手并出克制手
    const aiMove = turn.aiMove;
    let outcome;
    if(beats(aiMove, myMove)) outcome='read';   // 它克制了你 → 被看穿
    else if(aiMove===myMove)  outcome='tie';
    else                      outcome='win';     // 你克制了它 → 骗过它
    brain.learn(myMove, aiMove, outcome);

    state.i++;
    if(outcome==='win') state.win++; else if(outcome==='tie') state.tie++; else state.read++;
    state.hist.push({myMove, aiMove, outcome});

    // 更新揭示
    const oTxt = outcome==='read' ? '🔍 被看穿了' : (outcome==='tie' ? '🤝 平手' : '🏆 你骗过了它');
    const oCol = outcome==='read' ? 'var(--bad)' : (outcome==='tie' ? 'var(--ink-3)' : 'var(--good)');
    const hitWord = (turn.predMove===myMove)
      ? `<span class="hit">命中</span> —— 它押你出 ${EMO[turn.predMove]}，你真就出了`
      : `<span class="miss">落空</span> —— 它押你出 ${EMO[turn.predMove]}，你没上钩`;
    GG.clear(reveal);
    reveal.appendChild(GG.el('div',{class:'um-vs'},
      GG.el('div',{class:'side'}, GG.el('div',{class:'big'}, EMO[myMove]), GG.el('div',{class:'lab'}, '你')),
      GG.el('div',{class:'mid'}, 'VS'),
      GG.el('div',{class:'side'}, GG.el('div',{class:'big'}, EMO[aiMove]), GG.el('div',{class:'lab'}, 'AI'))
    ));
    reveal.appendChild(GG.el('div',{class:'um-outcome', style:{color:oCol}}, oTxt));
    reveal.appendChild(GG.el('div',{class:'um-guess', html:
      `它的读心：${hitWord}<br><span style="opacity:.8">手法：${LABEL[turn.by]||'综合判断'}</span>`}));

    // 仪表 = 被看穿率
    const pred = Math.round(state.read / state.i * 100);
    pctEl.textContent = pred + '%';
    fill.style.width = pred + '%';
    fill.style.background = pred<=40 ? 'var(--good)' : (pred<=58 ? 'var(--warn)' : 'var(--bad)');

    // 计分 + 历史条
    tWin.textContent = state.win; tTie.textContent = state.tie; tRead.textContent = state.read;
    const d = GG.el('div',{class:'um-dot '+outcome}, EMO[myMove]); hist.appendChild(d);

    if(state.i >= state.rounds){
      btns.forEach(b=>b.disabled=true);
      setTimeout(()=>endGame(), 850);
    } else {
      setRound();
    }
  }
}

function endGame(){
  const s = brain.stats();
  const total = state.i;
  const pred = Math.round(state.read/total*100);

  let face, title, blurb;
  if(pred <= 38){ face='🎭'; title='完美隐身'; blurb='它没能给你建模——你的出手接近真随机，它一路在瞎猜。极少有人能做到。'; }
  else if(pred <= 50){ face='🙂'; title='大致没被看穿'; blurb='它偶尔抓到你，但始终没能稳定预测你。你比大多数人更难懂。'; }
  else if(pred <= 62){ face='🔍'; title='它开始懂你了'; blurb='它已经摸到你的一些规律——人想「随机」时，反而会泄露模式。'; }
  else { face='🫣'; title='你被看穿了'; blurb='它把你拿捏得明明白白。别气馁：这恰恰说明「真随机」对人类有多难。'; }

  GG.clear(main);
  const stage = GG.el('div'); main.appendChild(stage);

  stage.appendChild(GG.el('div',{class:'um-verdict'},
    GG.el('div',{class:'face'}, face),
    GG.el('h2', null, title),
    GG.el('p', null, blurb)
  ));

  // 仪表（终局）
  stage.appendChild(GG.el('div',{class:'um-meterwrap', style:{marginTop:'18px'}},
    GG.el('div',{class:'um-meterhead'},
      GG.el('span', null, '它对你的可预测度（随机线 33%）'),
      GG.el('span',{class:'pct', style:{color: pred<=40?'var(--good)':(pred<=58?'var(--warn)':'var(--bad)')}}, pred+'%')),
    GG.el('div',{class:'um-meter'},
      GG.el('div',{class:'um-track'}, GG.el('div',{class:'um-fill', style:{width:pred+'%',
        background: pred<=40?'var(--good)':(pred<=58?'var(--warn)':'var(--bad)')}})),
      GG.el('div',{class:'um-base', style:{left:'33%'}}, GG.el('span', null, '随机线')))
  ));

  // 它抓到的规律
  const pats = analyzePatterns(s, total);
  stage.appendChild(GG.el('div',{class:'section-t'}, '它抓到的规律'));
  const patWrap = GG.el('div',{class:'um-patterns'});
  pats.forEach(p=> patWrap.appendChild(GG.el('div',{class:'um-pat'},
    GG.el('div',{class:'t'}, p.t), GG.el('div',{class:'v', html:p.v}))));
  stage.appendChild(patWrap);

  // 分享战报
  const winPct  = Math.round(state.win/total*100);
  const tiePct  = Math.round(state.tie/total*100);
  const shareSpec = {
    slug: SLUG,
    title: '不被看穿 · 战报',
    subtitle: `${total} 回合 · ${title}`,
    big: { value: pred+'%', label: '它对你的可预测度（随机线 33%）' },
    note: pats[0] ? pats[0].v.replace(/<[^>]+>/g,'') : blurb,
    bars: [
      { label:'被看穿', pct: pred, color:'#d8503f' },
      { label:'骗过它', pct: winPct, color:'#2e9e7b' },
      { label:'平手',  pct: tiePct },
    ],
    tags: ['不被看穿','剪刀石头布','反建模'],
  };
  stage.appendChild(GG.el('div',{style:{marginTop:'20px'}},
    GG.resultCard(SLUG, GG.el('div',{class:'center muted small'}, '把战报存图 / 分享 ↓'), shareSpec)));

  stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'18px'}},
    GG.el('button',{class:'btn primary', onClick:()=>play(state.rounds)}, '↻ 再来一局'),
    GG.el('button',{class:'btn ghost', style:{marginLeft:'10px'}, onClick:start}, '改长度')));
}

/* 从统计里挖出 1~4 条最能说明「你被建模」的规律 */
function analyzePatterns(s, total){
  const out = [];
  const sum = a => a[0]+a[1]+a[2];

  // 1) 偏手分布（永远展示）
  const f = s.freq, fsum = sum(f) || 1;
  const fb = [0,1,2].map(i=>({i, pct: Math.round(f[i]/fsum*100)})).sort((a,b)=>b.pct-a.pct);
  out.push({ t:'你的偏手', v:`${EMO[fb[0].i]} ${NAME[fb[0].i]} <b>${fb[0].pct}%</b>　·　`+
    `${EMO[fb[1].i]} ${NAME[fb[1].i]} ${fb[1].pct}%　·　${EMO[fb[2].i]} ${NAME[fb[2].i]} ${fb[2].pct}%`+
    (fb[0].pct>=45 ? '　← 明显偏心，最好猜' : (fb[0].pct<=38 ? '　← 相当均匀' : '')) });

  // 2) 最强的「上一手→下一手」连招
  let bestT=null;
  for(const a in s.m1){ const row=s.m1[a], rs=sum(row); if(rs<3) continue;
    for(let b=0;b<3;b++){ const pct=row[b]/rs; if(!bestT || pct>bestT.pct) bestT={a:+a,b,pct,rs}; } }
  if(bestT && bestT.pct>=0.5){
    out.push({ t:'下意识连招', v:`你出 ${EMO[bestT.a]} 之后，有 <b>${Math.round(bestT.pct*100)}%</b> 会接着出 ${EMO[bestT.b]}。` });
  }

  // 3) 被看穿后的反应（win-stay / lose-shift）
  let after=0, switched=0;
  for(let t=1;t<s.my.length;t++){ if(s.outs[t-1]==='read'){ after++; if(s.my[t]!==s.my[t-1]) switched++; } }
  if(after>=3){
    const sp = Math.round(switched/after*100);
    out.push({ t:'被看穿后的反应', v: sp>=60
      ? `一旦被看穿，你有 <b>${sp}%</b> 会立刻换手——这种「输了就变」本身就是规律。`
      : `被看穿后你有 <b>${100-sp}%</b> 仍坚持原手——这种「输了不改」也会被它利用。` });
  }

  // 4) 它主要靠哪招抓你
  let topBy=null, topN=0;
  for(const id in s.catchBy){ if(s.catchBy[id]>topN){ topN=s.catchBy[id]; topBy=id; } }
  if(topBy && topN>=2){
    out.push({ t:'它主要怎么抓你', v:`${topN} 次被看穿里，它最常靠「<b>${LABEL[topBy]||topBy}</b>」这条线识破你。` });
  }
  return out;
}

start();
})();
