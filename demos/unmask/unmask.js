/* unmask — 不被看穿。你 vs 一个拼命给你建模的 AI。
   反讽式母题：这一次，被猜中是你输。你越想藏，越暴露自己的模式。
   ── 这里的「AI」是一个【真实的】自适应预测器（频率 / 一阶马尔可夫 / 二阶马尔可夫 /
      想扳回上一局 / 连续重复 的 meta 集成，按近期命中率自动切换最准的那个），
      没有用大模型——它真的在对你建模，实时进化。被它命中（它出的手克制你）= 被看穿。
   ── 精修：出手【前】就把「它眼中的你」实时画像摆出来 + 🔒 封盘下注；出手【后】揭示
      它赌你出什么的概率分布 + 命中/落空 + 用了哪条线。连击/破防高光。终局可连 key
      让「AI 读心师」把这些规律写成一段瘆人的个性侧写（没 key 走本地侧写兜底）。 */
(function(){
const SLUG = 'unmask';
const EMO   = ['✊','✋','✌️'];               // 0 石头 / 1 布 / 2 剪刀
const NAME  = ['石头','布','剪刀'];
const LABEL = { freq:'你的偏手习惯', m1:'上一手的惯性', m2:'两手连招',
                react:'急着扳回上一局', repeat:'连续重复同一手', cold:'还在摸你的底' };
const counter = m => (m+1)%3;                 // 击败 m 的那一手（石头0→布1）
const beats   = (a,b) => (a-b+3)%3 === 1;     // a 是否击败 b

let main, brain, state, turn;

/* ---------- 注入精修新增样式（旧 um- 样式仍在 index.html） ---------- */
function injectStyles(){
  if(GG.$('#um-style2')) return;
  const s = GG.el('style',{id:'um-style2'});
  s.textContent = `
  .um-read{border:1px solid var(--line);border-radius:16px;padding:13px 15px;margin:14px 0 4px;
    background:linear-gradient(180deg,rgba(100,87,232,.05),var(--surface))}
  .um-read-h{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:9px}
  .um-read-h .t{font-weight:800;font-size:14px}
  .um-read-h .s{font-size:11.5px;color:var(--ink-3)}
  .um-tells{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:9px}
  .um-tell{font-size:11.5px;border-radius:999px;padding:3px 9px;border:1px solid var(--line);
    color:var(--ink-3);background:var(--surface);transition:.2s}
  .um-tell.on{border-color:var(--accent);color:#fff;background:var(--accent);font-weight:700;
    box-shadow:0 2px 8px rgba(100,87,232,.3)}
  .um-trust{font-size:12.5px;color:var(--ink-2);margin-bottom:9px}
  .um-trust b{color:var(--accent)}
  .um-bet{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:var(--ink-2);
    background:rgba(100,87,232,.08);border:1px dashed var(--accent);border-radius:10px;padding:9px 12px}
  .um-bet .lk{font-size:16px}

  .um-streak{margin-left:8px;font-weight:800;color:#e0651f;font-size:13px}
  .um-drama{text-align:center;font-size:13.5px;font-weight:750;margin-top:9px;padding:7px 10px;border-radius:10px}
  .um-drama.win{color:#1f7a5c;background:rgba(46,158,123,.12)}
  .um-drama.read{color:#b23b2c;background:rgba(216,80,63,.1)}

  .um-dist{margin-top:12px;border-top:1px dashed var(--line);padding-top:11px}
  .um-dist .dh{font-size:12px;color:var(--ink-3);margin-bottom:8px;text-align:center}
  .um-distrow{display:flex;align-items:center;gap:9px;margin:5px 0}
  .um-distrow .e{font-size:18px;width:22px;text-align:center}
  .um-distrow .bar{flex:1;height:9px;border-radius:6px;background:var(--line-2);overflow:hidden}
  .um-distrow .bar i{display:block;height:100%;border-radius:6px;background:var(--ink-3)}
  .um-distrow.bet .bar i{background:var(--accent)}
  .um-distrow .pc{font-size:11.5px;color:var(--ink-3);width:54px;text-align:right;font-variant-numeric:tabular-nums}
  .um-distrow.bet .pc{color:var(--accent);font-weight:800}
  .um-distrow .mk{font-size:10px;color:var(--good);font-weight:800}

  .um-seer{border:1px solid var(--accent);border-radius:16px;padding:16px;margin-top:8px;
    background:linear-gradient(180deg,rgba(100,87,232,.06),var(--surface))}
  .um-seer .p{font-size:14.5px;line-height:1.75;color:var(--ink-1);white-space:pre-wrap}
  .um-seer .tells{display:flex;flex-direction:column;gap:6px;margin-top:11px}
  .um-seer .tells .it{font-size:13px;color:var(--ink-2);padding-left:18px;position:relative;line-height:1.5}
  .um-seer .tells .it::before{content:'›';position:absolute;left:4px;color:var(--accent);font-weight:800}
  .um-seer-by{font-size:11px;color:var(--ink-3);margin-top:10px;text-align:right}
  `;
  document.head.appendChild(s);
}

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
  function topPred(p){                                     // 当前权重最高、且有预测的那条线
    let best=null, bw=-1;
    for(const id in W){ if(p[id]==null) continue; if(W[id]>bw){ bw=W[id]; best=id; } }
    return best;
  }

  return {
    /* 出手前：基于历史预测你这一手，出克制该预测的手；同时算出「赌你出 X」的概率分布 */
    play(){
      const p = preds();
      const best = topPred(p);
      let predMove;
      if(best==null){ predMove = Math.floor(Math.random()*3); }
      else predMove = p[best];
      // 加权融合各预测器为一个概率分布（含均匀先验，避免过度自信）
      const dist=[0,0,0]; let any=false;
      for(const id in W){ const pm=p[id]; if(pm==null) continue; dist[pm]+=W[id]; any=true; }
      for(let i=0;i<3;i++) dist[i]+= any?0.18:1;            // 冷启动时纯均匀
      const z = dist[0]+dist[1]+dist[2];
      for(let i=0;i<3;i++) dist[i]/=z;
      pending = { p, best: best||'cold', predMove };
      return { aiMove: counter(predMove), predMove, by: best||'cold', dist, conf: dist[predMove] };
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
    /* 实时画像（定性，给出手前看；不泄露这手的具体下注，避免白嫖） */
    liveProfile(){
      const fsum = freq[0]+freq[1]+freq[2];
      let bias=null;
      if(fsum>=3){ const i=argmax(freq); bias={ move:i, pct:Math.round(freq[i]/fsum*100) }; }
      let combo=null;
      for(const a in m1){ const row=m1[a], rs=row[0]+row[1]+row[2]; if(rs<2) continue;
        for(let b=0;b<3;b++){ const pc=row[b]/rs;
          if(pc>=0.5 && (!combo || pc>combo.pct/100)) combo={ a:+a, b, pct:Math.round(pc*100) }; } }
      let after=0, switched=0;
      for(let t=1;t<my.length;t++){ if(outs[t-1]==='read'){ after++; if(my[t]!==my[t-1]) switched++; } }
      let reaction=null;
      if(after>=2){ const sp=Math.round(switched/after*100);
        reaction = sp>=60 ? {kind:'switch',pct:sp} : (sp<=40 ? {kind:'stay',pct:100-sp} : null); }
      return { bias, combo, reaction, samples:fsum, topLine: topPred(preds()) };
    },
    stats(){ return { freq, m1, m2, my, ai, outs, catchBy }; }
  };
}

/* ════════════════════ 流程 ════════════════════ */
function start(){
  injectStyles();
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
    GG.el('div',{style:{marginTop:'6px'}}, '🧠 出手前，它会把 ',
      GG.el('b', null, '「它眼中的你」'), ' 实时画像摆在你面前，并 🔒 封盘下注——你看得见它懂你，但下注藏到你出手后才揭晓。'),
    GG.el('div',{style:{marginTop:'6px'}}, '🪞 终局它会复盘抓到你哪条规律；连上 AI，还能让「读心师」给你写一段侧写。')
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
  state = { rounds, i:0, win:0, tie:0, read:0, streak:0, hist:[] };
  GG.clear(main);
  const stage = GG.el('div',{class:'um-stage'}); main.appendChild(stage);

  // HUD
  const roundEl = GG.el('span',{class:'um-round'});
  const streakEl = GG.el('span',{class:'um-streak'});
  const tWin = GG.el('b',{style:{color:'var(--good)'}}, '0');
  const tTie = GG.el('b', null, '0');
  const tRead= GG.el('b',{style:{color:'var(--bad)'}}, '0');
  stage.appendChild(GG.el('div',{class:'um-hud'},
    roundEl, streakEl,
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

  // 「它眼中的你」实时画像 + 封盘下注
  const readPanel = GG.el('div',{class:'um-read'});
  stage.appendChild(readPanel);

  // 三选
  const choices = GG.el('div',{class:'um-choices'});
  const btns = EMO.map((e,m)=> GG.el('button',{class:'um-choice', onClick:()=>pickMove(m)},
    GG.el('span',{class:'em'}, e), GG.el('span',{class:'nm'}, NAME[m])));
  btns.forEach(b=>choices.appendChild(b));

  // 揭示区（放在三选上方，出手即见结果）+ 历史条
  const reveal = GG.el('div',{class:'um-reveal'});
  const hist = GG.el('div',{class:'um-hist'});
  stage.appendChild(reveal);
  stage.appendChild(choices);
  stage.appendChild(hist);

  function setRound(){ roundEl.textContent = `第 ${Math.min(state.i+1,state.rounds)} / ${state.rounds} 回合`; }
  function setStreak(){ streakEl.textContent = state.streak>=2 ? `🔥 连骗 ${state.streak}` : ''; }

  /* 锁定「下一手」的下注 + 刷新实时画像；不动揭示区（让上一手结果留在屏上） */
  function lockBet(){
    turn = brain.play();
    setRound(); setStreak();
    renderRead(readPanel, state.i+1);
    btns.forEach(b=>b.disabled=false);
  }

  function pickMove(myMove){
    btns.forEach(b=>b.disabled=true);
    const aiMove = turn.aiMove;
    let outcome;
    if(beats(aiMove, myMove)) outcome='read';   // 它克制了你 → 被看穿
    else if(aiMove===myMove)  outcome='tie';
    else                      outcome='win';     // 你克制了它 → 骗过它
    brain.learn(myMove, aiMove, outcome);

    state.i++;
    if(outcome==='win'){ state.win++; state.streak++; }
    else { if(outcome==='tie') state.tie++; else state.read++; state.streak=0; }
    state.hist.push({myMove, aiMove, outcome});

    renderReveal(reveal, myMove, aiMove, outcome, turn);

    // 仪表 = 被看穿率
    const pred = Math.round(state.read / state.i * 100);
    pctEl.textContent = pred + '%';
    fill.style.width = pred + '%';
    fill.style.background = pred<=40 ? 'var(--good)' : (pred<=58 ? 'var(--warn)' : 'var(--bad)');

    tWin.textContent = state.win; tTie.textContent = state.tie; tRead.textContent = state.read;
    setStreak();
    hist.appendChild(GG.el('div',{class:'um-dot '+outcome}, EMO[myMove]));

    if(state.i >= state.rounds){
      readPanel.style.opacity = '.5';
      btns.forEach(b=>b.disabled=true);
      setTimeout(()=>endGame(), 1100);
    } else {
      lockBet();                       // 锁定下一手；上一手结果留在揭示区
    }
  }

  // 开局：先锁定第 1 手的下注，揭示区给个出手提示
  lockBet();
  reveal.appendChild(GG.el('div',{class:'um-wait'}, '出手吧 —— 它已经封盘押注你这一手了。'));
}

/* 实时画像面板 */
function renderRead(panel, betRound){
  const prof = brain.liveProfile();
  GG.clear(panel);
  panel.style.opacity = '1';
  panel.appendChild(GG.el('div',{class:'um-read-h'},
    GG.el('span',{class:'t'}, '🧠 它眼中的你'),
    GG.el('span',{class:'s'}, prof.samples>0 ? `已采样 ${prof.samples} 手` : '刚开局')));

  // tells
  const tells = GG.el('div',{class:'um-tells'});
  const biasOn = prof.bias && prof.bias.pct>=42;
  tells.appendChild(tell(biasOn, biasOn ? `偏${EMO[prof.bias.move]} ${prof.bias.pct}%` : '偏手习惯'));
  tells.appendChild(tell(!!prof.combo, prof.combo ? `连招 ${EMO[prof.combo.a]}→${EMO[prof.combo.b]}` : '下意识连招'));
  const rOn = !!prof.reaction;
  tells.appendChild(tell(rOn, rOn ? (prof.reaction.kind==='switch' ? `输了就换 ${prof.reaction.pct}%` : `输了不改 ${prof.reaction.pct}%`) : '输赢后的反应'));
  panel.appendChild(tells);

  // 最信哪条线
  panel.appendChild(GG.el('div',{class:'um-trust'},
    prof.topLine && prof.samples>=2
      ? GG.el('span', null, '它现在最信：', GG.el('b', null, LABEL[prof.topLine]||'综合判断'))
      : GG.el('span', null, '它还在摸你的底——多出几手，画像才会成形。')));

  // 封盘下注（不泄露具体内容）
  panel.appendChild(GG.el('div',{class:'um-bet'},
    GG.el('span',{class:'lk'}, '🔒'),
    GG.el('span', null, `它已对第 ${betRound} 手下注，封盘等你出招`)));

  function tell(on, txt){ return GG.el('span',{class:'um-tell'+(on?' on':'')}, txt); }
}

/* 揭示：VS + 结果 + 它赌你出什么的概率分布 + 命中/落空 + 高光 */
function renderReveal(reveal, myMove, aiMove, outcome, turn){
  const oTxt = outcome==='read' ? '🔍 被看穿了' : (outcome==='tie' ? '🤝 平手' : '🏆 你骗过了它');
  const oCol = outcome==='read' ? 'var(--bad)' : (outcome==='tie' ? 'var(--ink-3)' : 'var(--good)');
  GG.clear(reveal);
  reveal.appendChild(GG.el('div',{class:'um-vs'},
    GG.el('div',{class:'side'}, GG.el('div',{class:'big'}, EMO[myMove]), GG.el('div',{class:'lab'}, '你')),
    GG.el('div',{class:'mid'}, 'VS'),
    GG.el('div',{class:'side'}, GG.el('div',{class:'big'}, EMO[aiMove]), GG.el('div',{class:'lab'}, 'AI'))
  ));
  reveal.appendChild(GG.el('div',{class:'um-outcome', style:{color:oCol}}, oTxt));

  // 高光：它有多少把握
  const confPct = Math.round(turn.conf*100);
  if(outcome==='win' && turn.conf>=0.5)
    reveal.appendChild(GG.el('div',{class:'um-drama win'}, `💥 它有 ${confPct}% 把握押中你，你偏偏没上钩！`));
  else if(outcome==='win' && state.streak>=3)
    reveal.appendChild(GG.el('div',{class:'um-drama win'}, `🔥 连骗 ${state.streak} 手——它有点跟不上你了`));
  else if(outcome==='read' && turn.conf>=0.55)
    reveal.appendChild(GG.el('div',{class:'um-drama read'}, `🎯 ${confPct}% 把握，正中——这一手它早看穿了`));

  // 它赌你出什么（封盘揭晓）
  const dist = turn.dist;
  const distBox = GG.el('div',{class:'um-dist'});
  distBox.appendChild(GG.el('div',{class:'dh'}, '🔓 揭晓它这手赌你出什么'));
  [0,1,2].forEach(m=>{
    const pc = Math.round(dist[m]*100);
    const isBet = m===turn.predMove;
    distBox.appendChild(GG.el('div',{class:'um-distrow'+(isBet?' bet':'')},
      GG.el('span',{class:'e'}, EMO[m]),
      GG.el('div',{class:'bar'}, GG.el('i',{style:{width:pc+'%'}})),
      GG.el('span',{class:'pc'}, pc+'%'),
      m===myMove ? GG.el('span',{class:'mk'}, '← 你') : null
    ));
  });
  const hitWord = (turn.predMove===myMove)
    ? `<span class="hit">命中</span> —— 它押你出 ${EMO[turn.predMove]}，你真就出了`
    : `<span class="miss">落空</span> —— 它押你出 ${EMO[turn.predMove]}，你没上钩`;
  distBox.appendChild(GG.el('div',{class:'um-guess', style:{marginTop:'10px'}, html:
    `${hitWord}<br><span style="opacity:.8">用的线：${LABEL[turn.by]||'综合判断'}</span>`}));
  reveal.appendChild(distBox);
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
  const col = pred<=40?'var(--good)':(pred<=58?'var(--warn)':'var(--bad)');
  stage.appendChild(GG.el('div',{class:'um-meterwrap', style:{marginTop:'18px'}},
    GG.el('div',{class:'um-meterhead'},
      GG.el('span', null, '它对你的可预测度（随机线 33%）'),
      GG.el('span',{class:'pct', style:{color:col}}, pred+'%')),
    GG.el('div',{class:'um-meter'},
      GG.el('div',{class:'um-track'}, GG.el('div',{class:'um-fill', style:{width:pred+'%', background:col}})),
      GG.el('div',{class:'um-base', style:{left:'33%'}}, GG.el('span', null, '随机线')))
  ));

  // 它抓到的规律
  const pats = analyzePatterns(s, total);
  stage.appendChild(GG.el('div',{class:'section-t'}, '它抓到的规律'));
  const patWrap = GG.el('div',{class:'um-patterns'});
  pats.forEach(p=> patWrap.appendChild(GG.el('div',{class:'um-pat'},
    GG.el('div',{class:'t'}, p.t), GG.el('div',{class:'v', html:p.v}))));
  stage.appendChild(patWrap);

  // 🔮 读心师侧写（本地兜底；连 key 由 AI 重写）
  mountSeer(stage, s, total, pred, title, pats);

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

  window.scrollTo(0,0);
}

/* ---------- 读心师侧写 ---------- */
const SEER_SYS = '你是一个有点神秘、像能看透人心的「读心师」。下面是一名玩家在"剪刀石头布对抗一个实时预测 AI"里暴露的行为数据。'+
  '请用第二人称写一段 110~170 字、略带瘆人但不冒犯、不油腻、不算命迷信的心理侧写：点破 ta 以为自己在随机、其实暴露了的模式，'+
  '最后落一句关于「人很难真正随机、越想藏越暴露」的洞察。只输出严格 JSON：{"profile":"整段侧写","tells":["一句话点破的小习惯",2到3条]}';

function statsDigest(s, total, pred){
  const sum=a=>a[0]+a[1]+a[2];
  const f=s.freq, fs=sum(f)||1;
  const fb=[0,1,2].map(i=>({i,pct:Math.round(f[i]/fs*100)})).sort((a,b)=>b.pct-a.pct);
  let combo=null;
  for(const a in s.m1){ const row=s.m1[a], rs=sum(row); if(rs<3) continue;
    for(let b=0;b<3;b++){ const pc=row[b]/rs; if(!combo||pc>combo.pct) combo={a:+a,b,pct:pc}; } }
  let after=0,switched=0;
  for(let t=1;t<s.my.length;t++){ if(s.outs[t-1]==='read'){after++; if(s.my[t]!==s.my[t-1])switched++;} }
  let topBy=null,topN=0;
  for(const id in s.catchBy){ if(s.catchBy[id]>topN){topN=s.catchBy[id];topBy=id;} }
  return {
    text:`回合数:${total}；被看穿率:${pred}%(随机线33%)；偏手:${NAME[fb[0].i]} ${fb[0].pct}% > ${NAME[fb[1].i]} ${fb[1].pct}% > ${NAME[fb[2].i]} ${fb[2].pct}%；`+
      (combo&&combo.pct>=0.5?`最强连招:出${NAME[combo.a]}后${Math.round(combo.pct*100)}%接${NAME[combo.b]}；`:'')+
      (after>=2?`被看穿后:${switched/after>=0.5?'倾向立刻换手':'倾向坚持原手'}(${after}次样本)；`:'')+
      (topBy?`它主要靠"${LABEL[topBy]||topBy}"识破你。`:''),
    fb, combo, after, switched, topBy, topN
  };
}

function localSeer(dg, pred, title){
  const lead = pred<=40
    ? '你几乎没给它留下把柄。'
    : (pred<=58 ? '你以为自己在随便出，但有几处出卖了你。' : '你以为自己在随机，其实从第几手起就开始重复自己了。');
  const biasTxt = dg.fb[0].pct>=42 ? `你的手偏向${NAME[dg.fb[0].i]}（${dg.fb[0].pct}%），紧张或犹豫时尤其会回到它。` : '你的三手分布还算均匀，这是少数人才有的克制。';
  const reactTxt = dg.after>=2 ? (dg.switched/dg.after>=0.5 ? '更要命的是：一旦被识破，你几乎立刻换手——这个「输了就变」本身就成了规律。' : '而且被识破后你常常嘴硬不改，这种执拗也被它记下了。') : '';
  const close = '真正的随机对人类几乎是奢望——你越用力去藏，模式越清楚。';
  const tells=[];
  if(dg.fb[0].pct>=42) tells.push(`偏爱出${NAME[dg.fb[0].i]}`);
  if(dg.combo && dg.combo.pct>=0.5) tells.push(`出${NAME[dg.combo.a]}后爱接${NAME[dg.combo.b]}`);
  if(dg.after>=2) tells.push(dg.switched/dg.after>=0.5?'输了就换手':'输了爱嘴硬不改');
  if(!tells.length) tells.push('节奏稳，难抓');
  return { profile:`${lead}${biasTxt}${reactTxt}\n${close}`, tells };
}

function mountSeer(stage, s, total, pred, title, pats){
  const dg = statsDigest(s, total, pred);
  stage.appendChild(GG.el('div',{class:'section-t', style:{marginTop:'18px'}}, '🔮 读心师侧写'));
  const box = GG.el('div',{class:'um-seer'});
  const pEl = GG.el('div',{class:'p'});
  const tellsEl = GG.el('div',{class:'tells'});
  const byEl = GG.el('div',{class:'um-seer-by'});
  box.appendChild(pEl); box.appendChild(tellsEl); box.appendChild(byEl);
  stage.appendChild(box);

  function paint(profile, tells, by){
    pEl.textContent = profile;
    GG.clear(tellsEl);
    (tells||[]).forEach(t=> tellsEl.appendChild(GG.el('div',{class:'it'}, t)));
    byEl.textContent = by;
  }
  // 先放本地侧写
  const loc = localSeer(dg, pred, title);
  paint(loc.profile, loc.tells, '— 本地读心（连 AI 可升级为真实模型）');

  // 连了 key：给个按钮让 AI 重写
  if(GG.llm.connected()){
    const btn = GG.el('button',{class:'btn', style:{marginTop:'12px'}, onClick:async()=>{
      if(btn.disabled) return; btn.disabled=true; const old=btn.textContent; btn.textContent='读心师正在落笔…';
      try{
        const r = await GG.llm.json(SEER_SYS, dg.text, {max_tokens:520});
        if(r && r.profile){ paint(String(r.profile), Array.isArray(r.tells)?r.tells.map(String):loc.tells, '— ✨ AI 读心师'); btn.remove(); }
        else throw new Error('PARSE_FAIL');
      }catch(e){ btn.disabled=false; btn.textContent=old; GG.toast(GG.llm.errMsg(e)); }
    }}, '✨ 让 AI 读心师重写这段');
    stage.appendChild(GG.el('div',{class:'center'}, btn));
  } else {
    stage.appendChild(GG.el('div',{style:{marginTop:'12px'}}, GG.llm.bar()));
  }
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
