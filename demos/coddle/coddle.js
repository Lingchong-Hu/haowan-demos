/* coddle — 随手记一条观察（类型 + 备注）+ 滑月龄 → 针对「类型 × 月龄段」的个性化指引。
   签名核心：同一条记录，把月龄滑到不同值 → 指引明显不同（滑块 onInput 即时重渲染）。 */
(function(){
const SLUG='coddle';
const { TOPICS, bandOf } = window.CODDLE;

let main;
let state = { topicId: null, note:'', months: 6 };

function start(){
  main = GG.mountShell(SLUG);
  // 可复现链接：URL 带状态就直接进结果视图
  const st = GG.decodeState();
  if(st && st.t){
    state.topicId = st.t;
    state.note = st.n || '';
    state.months = (st.m==null? 6 : st.m)|0;
  }
  render();
}

function topicById(id){ return TOPICS.find(t=>t.id===id); }

/* ---------- 主渲染 ---------- */
function render(){
  GG.clear(main);

  main.appendChild(GG.el('div',{class:'hero', style:{paddingBottom:'8px'}},
    GG.el('h1', null, '随手记一条，给到月龄个性化指引'),
    GG.el('p', null, '选一类观察、写句备注，再滑动宝宝月龄 —— 同一条记录，月龄不同，指引完全不同。')
  ));

  // 1) 选类型
  main.appendChild(GG.el('div',{class:'section-t'}, '① 这条记的是哪方面？'));
  const grid = GG.el('div',{class:'row', style:{flexWrap:'wrap', gap:'10px'}});
  TOPICS.forEach(t=>{
    const active = state.topicId===t.id;
    grid.appendChild(GG.el('button',{
      class:'chip'+(active?' active':''),
      style:{ cursor:'pointer', fontSize:'15px', padding:'8px 14px',
        ...(active? {background:'var(--accent)', color:'#fff', borderColor:'var(--accent)'} : {}) },
      onClick:()=>{ state.topicId = t.id; render(); }
    }, (t.emoji+' '+t.label)));
  });
  main.appendChild(grid);

  if(!state.topicId){
    main.appendChild(GG.el('p',{class:'small muted', style:{marginTop:'14px'}}, '👆 先选一类，再继续。'));
    return;
  }
  const topic = topicById(state.topicId);

  // 2) 备注
  main.appendChild(GG.el('div',{class:'section-t'}, '② 随手写一句（可选）'));
  const noteInput = GG.el('input',{
    type:'text', value: state.note, placeholder: topic.placeholder,
    class:'input',
    style:{ width:'100%', padding:'12px 14px', fontSize:'15px', borderRadius:'12px',
      border:'1px solid var(--line, #e3e3e8)', boxSizing:'border-box' },
    onInput:(e)=>{ state.note = e.target.value; updateGuide(); }
  });
  main.appendChild(noteInput);

  // 3) 月龄滑块（强烈建议：0~36 月，onInput 即时更新）
  main.appendChild(GG.el('div',{class:'section-t'}, '③ 宝宝月龄（拖动看指引怎么变）'));
  const monLabel = GG.el('span',{style:{fontWeight:'800', fontSize:'22px', color:'var(--accent)'}}, state.months+' 个月');
  const bandLabel = GG.el('span',{class:'pill', style:{marginLeft:'10px', background:'var(--accent-soft)', color:'var(--accent)', padding:'4px 12px', borderRadius:'999px', fontWeight:'700', fontSize:'13px'}}, bandOf(state.months).label);
  main.appendChild(GG.el('div',{class:'row', style:{alignItems:'center', marginBottom:'6px'}}, monLabel, bandLabel));

  const slider = GG.el('input',{
    type:'range', min:'0', max:'36', step:'1', value:String(state.months),
    style:{ width:'100%', accentColor:'var(--accent)', cursor:'pointer' },
    onInput:(e)=>{
      state.months = parseInt(e.target.value,10);
      monLabel.textContent = state.months+' 个月';
      const b = bandOf(state.months);
      bandLabel.textContent = b.label;
      updateGuide();      // 关键：滑块动 → 指引即时重渲染
    }
  });
  main.appendChild(slider);
  main.appendChild(GG.el('div',{class:'row small muted', style:{justifyContent:'space-between', marginTop:'2px'}},
    GG.el('span',null,'出生'), GG.el('span',null,'1 岁'), GG.el('span',null,'2 岁'), GG.el('span',null,'3 岁')));

  // 4) 指引容器（updateGuide 往里塞）
  const guideBox = GG.el('div',{id:'guideBox', style:{marginTop:'18px'}});
  main.appendChild(guideBox);

  updateGuide();
}

/* ---------- 指引重渲染（滑块/备注变都走这里）---------- */
function updateGuide(){
  const box = GG.$('#guideBox', main);
  if(!box) return;
  GG.clear(box);

  const topic = topicById(state.topicId);
  const band = bandOf(state.months);
  const g = topic.byBand[band.id];

  // 持久化到 URL，方便分享复现
  GG.encodeState({ t: state.topicId, n: state.note, m: state.months });

  const noteEcho = state.note.trim()
    ? GG.el('p',{class:'small', style:{margin:'0 0 12px', color:'var(--ink-2, #55555c)'}},
        '你的记录：', GG.el('span',{style:{fontStyle:'italic'}}, '“'+state.note.trim()+'”'))
    : null;

  const sectionRow = (title, text)=> GG.el('div',{style:{marginBottom:'12px'}},
    GG.el('div',{style:{fontSize:'13px', fontWeight:'700', color:'var(--accent)', marginBottom:'3px'}}, title),
    GG.el('p',{style:{margin:'0', lineHeight:'1.55'}}, text)
  );

  const inner = GG.el('div',null,
    GG.el('div',{class:'row', style:{justifyContent:'space-between', alignItems:'center', marginBottom:'10px', flexWrap:'wrap'}},
      GG.el('h3',{style:{fontSize:'19px', margin:'0'}}, topic.emoji+' '+topic.label+' · '+state.months+' 个月'),
      GG.el('span',{class:'pill', style:{background:'var(--accent)', color:'#fff', padding:'4px 12px', borderRadius:'999px', fontWeight:'700', fontSize:'13px'}}, band.label)
    ),
    noteEcho,
    sectionRow('这个阶段的典型表现', g.read),
    sectionRow('给你的指引', g.guide),
    sectionRow('小贴士', g.tip)
  );

  // shareSpec：行=典型表现/建议/贴士，note=一句核心指引
  const shareSpec = {
    slug: SLUG,
    title: '月龄指引 · '+topic.label,
    subtitle: state.months+' 个月（'+band.label+'）',
    tags: [topic.label, band.label],
    note: g.guide,
    rows: [
      { label:'典型表现', value: g.read },
      { label:'建议',     value: g.guide },
      { label:'小贴士',   value: g.tip },
    ],
    copyText: [
      '【月龄指引 · '+topic.label+'】',
      state.months+' 个月（'+band.label+'）',
      state.note.trim()? '记录："'+state.note.trim()+'"' : null,
      '· 典型表现：'+g.read,
      '· 建议：'+g.guide,
      '· 小贴士：'+g.tip,
      '', '—— 那一下 · AI 交互 Demo 画廊  '+location.href
    ].filter(Boolean).join('\n')
  };

  // GG.resultCard 自动附「非建议」免责 + 分享栏
  box.appendChild(GG.resultCard(SLUG, inner, shareSpec));

  box.appendChild(GG.el('p',{class:'small muted center', style:{marginTop:'10px'}},
    '↑ 试着拖动上面的月龄滑块 —— 同一条记录，指引会随月龄明显改变。'));
}

start();
})();
