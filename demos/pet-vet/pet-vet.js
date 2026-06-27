/* pet-vet —— AI 兽医病历助手（Scribe）。
   兽医贴一段问诊速记 → 30 秒还你：SOAP 病历 + 鉴别诊断 + 给主人的出院医嘱 + 费用预估。
   · 4 个预置病例：首屏示例 + 未连 key 的离线兜底（点示例即出完整文书）。
   · 自由速记：连 key 走真实模型生成同结构；没 key 友好提示去连接 / 先试示例。
   定位：给执业兽医的「文书草稿」工具——AI 起草、兽医复核，不替代临床判断。 */
(function(){
const SLUG = 'pet-vet';
const { LIKE, URGENCY, CASES } = window.PETVET;
let main;

/* ---------------- 作用域样式 ---------------- */
function injectStyles(){
  if(GG.$('#pv-style')) return;
  const s = GG.el('style',{id:'pv-style'});
  s.textContent = `
  .pv-hd{border-radius:18px;padding:20px 18px;color:#fff;position:relative;overflow:hidden;
    background:linear-gradient(135deg,#157a6e,#1f9e8f 60%,#39b0a0);box-shadow:0 10px 26px rgba(21,122,110,.28)}
  .pv-hd .em{font-size:30px;line-height:1}
  .pv-hd h1{margin:8px 0 2px;font-size:22px;font-weight:850;letter-spacing:.3px}
  .pv-hd .sub{font-size:13.5px;opacity:.92;line-height:1.6}
  .pv-hd .tag{position:absolute;top:14px;right:14px;font-size:11px;font-weight:800;letter-spacing:1px;
    background:rgba(255,255,255,.2);padding:3px 9px;border-radius:999px}
  .pv-trust{display:flex;align-items:center;gap:6px;margin-top:12px;font-size:12px;opacity:.92}
  .pv-hook{display:flex;gap:10px;align-items:flex-start;margin:16px 0 4px;padding:12px 14px;
    background:var(--accent-soft);border-radius:12px;font-size:13.5px;line-height:1.6;color:var(--ink-2)}
  .pv-hook b{color:var(--accent)}
  .pv-egrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0 4px}
  .pv-eg{cursor:pointer;text-align:left;border:1px solid var(--line);background:var(--surface);
    border-radius:12px;padding:11px 12px;transition:.15s}
  .pv-eg:hover{border-color:var(--accent);transform:translateY(-1px)}
  .pv-eg.on{border-color:var(--accent);background:var(--accent-soft);box-shadow:0 0 0 1px var(--accent) inset}
  .pv-eg .t{font-weight:750;font-size:14px}
  .pv-eg .k{font-size:11.5px;color:var(--ink-3);margin-top:2px}
  .pv-ta{width:100%;box-sizing:border-box;min-height:108px;resize:vertical;border:1px solid var(--line);
    border-radius:12px;padding:12px 14px;font-size:14.5px;line-height:1.6;font-family:inherit;
    background:var(--surface);color:var(--ink-1)}
  .pv-ta:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
  .pv-gen{width:100%;font-size:16px;padding:14px;font-weight:800;margin-top:12px}
  .pv-genhint{text-align:center;font-size:12px;color:var(--ink-3);margin-top:8px}
  .pv-genhint b{color:var(--accent)}

  .pv-urg{display:flex;align-items:center;gap:12px;border-radius:14px;padding:13px 16px;margin:6px 0 14px}
  .pv-urg .ue{font-size:26px;line-height:1}
  .pv-urg .ul{font-weight:850;font-size:17px}
  .pv-urg .un{font-size:12.5px;opacity:.85;margin-top:1px}

  .pv-sig{display:flex;flex-wrap:wrap;gap:7px;align-items:center;margin-bottom:6px}
  .pv-sig .nm{font-weight:800;font-size:16px;margin-right:2px}
  .pv-sig .s{font-size:12px;background:var(--bg-soft,#f3f3ef);border:1px solid var(--line);
    border-radius:999px;padding:2px 9px;color:var(--ink-2)}
  .pv-stamp{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:800;
    color:#157a6e;background:rgba(21,122,110,.1);border:1px dashed #157a6e;border-radius:6px;padding:3px 8px}

  .pv-doc{margin:14px 0}
  .pv-doch{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
  .pv-doch .tt{font-weight:800;font-size:15px;display:flex;align-items:center;gap:7px}
  .pv-doch .tt .e{font-size:17px}
  .pv-copy{flex:none;font-size:12px;border:1px solid var(--line);background:var(--surface);
    border-radius:8px;padding:5px 10px;cursor:pointer;color:var(--ink-2)}
  .pv-copy:hover{border-color:var(--accent);color:var(--accent)}

  .pv-soap{display:grid;grid-template-columns:34px 1fr;gap:0}
  .pv-soap .lab{font-weight:850;color:var(--accent);font-size:15px;padding:10px 0 10px 0}
  .pv-soap .bd{padding:10px 0;border-bottom:1px solid var(--line);line-height:1.65;font-size:14px;color:var(--ink-1)}
  .pv-soap .bd .cap{display:block;font-size:11.5px;font-weight:700;color:var(--ink-3);margin-bottom:2px}
  .pv-soap .row:last-child .bd{border-bottom:none}

  .pv-dx{border:1px solid var(--line);border-radius:12px;padding:11px 13px;margin-top:9px}
  .pv-dx .top{display:flex;align-items:center;gap:8px}
  .pv-dx .rk{font-size:12px;font-weight:800;color:var(--ink-3);min-width:18px}
  .pv-dx .nm{font-weight:750;font-size:15px;flex:1}
  .pv-dx .lk{font-size:11.5px;font-weight:800;border-radius:999px;padding:2px 9px}
  .pv-dxbar{height:6px;border-radius:4px;background:#eee;margin:8px 0 6px;overflow:hidden}
  .pv-dxbar i{display:block;height:100%;border-radius:4px}
  .pv-dx .meta{font-size:12.5px;color:var(--ink-2);line-height:1.55}
  .pv-dx .meta b{color:var(--ink-1)}
  .pv-dx .meta .tst{color:var(--accent);font-weight:600}

  .pv-owner .os{font-size:14.5px;line-height:1.7;background:var(--accent-soft);border-radius:10px;
    padding:11px 13px;margin-bottom:10px}
  .pv-owner .blk{margin-top:10px}
  .pv-owner .blk .h{font-size:12.5px;font-weight:800;color:var(--ink-3);margin-bottom:4px}
  .pv-owner ul{margin:0;padding-left:18px;line-height:1.7;font-size:13.5px}
  .pv-owner .rc{font-size:13.5px}
  .pv-red{background:rgba(210,74,58,.08);border-left:3px solid #d24a3a;border-radius:8px;padding:9px 12px}
  .pv-red .h{color:#d24a3a !important}
  .pv-red ul li{color:#a1342a}

  .pv-est .er{display:flex;justify-content:space-between;gap:10px;padding:9px 0;
    border-bottom:1px dashed var(--line);font-size:13.5px}
  .pv-est .er .it{color:var(--ink-1)}
  .pv-est .er .pr{color:var(--ink-2);font-variant-numeric:tabular-nums;white-space:nowrap}
  .pv-est .tot{display:flex;justify-content:space-between;align-items:baseline;margin-top:10px;
    padding-top:10px;border-top:2px solid var(--ink-1)}
  .pv-est .tot .tl{font-weight:800;font-size:14px}
  .pv-est .tot .tv{font-weight:850;font-size:19px;color:var(--accent);font-variant-numeric:tabular-nums}
  .pv-est .note{font-size:11.5px;color:var(--ink-3);margin-top:7px}
  `;
  document.head.appendChild(s);
}

/* ---------------- AI ---------------- */
const AI_SYS = '你是给执业兽医使用的病历起草助手（Scribe）。基于兽医口述/速记的问诊信息，起草结构化文书草稿，供兽医复核修改后使用，绝不替代临床判断。要求：① 严格区分客观所见与推断；② 鉴别诊断按可能性排序、仅作提示不下确诊；③ 用药只给类别/原则，不写精确剂量数字（剂量由兽医按体重核定）。只输出严格 JSON：'+
  '{"signalment":{"species":"犬/猫/…","breed":"品种或\'未提供\'","sex":"如 公·已绝育","age":"如 8 岁","weight":"如 5.6 kg 或 未提供","bcs":"如 5/9 或 未提供"},'+
  '"urgency":"er|today|routine",'+
  '"soap":{"s":"主诉与病史","o":"客观检查/生命体征（无则写\'未提供，建议补充体格检查\'）","a":"评估：问题概括 + 思路","p":"诊疗计划：建议的检查与处置"},'+
  '"differentials":[{"dx":"鉴别诊断名","like":"高|中|低","why":"支持依据","test":"推荐检查"}](3到5条,按可能性降序),'+
  '"discharge":{"summary":"给主人的大白话一句话说明","care":["在家护理",2到4条],"meds":["用药提示，仅类别/原则",1到3条],"recheck":"复诊安排","redflags":["出现这些立刻回诊",2到4条]},'+
  '"estimate":[{"item":"项目","low":整数元,"high":整数元}](4到6项)}。'+
  '全部中文。信息不足处合理留白或写\'待检查\'，不要编造体检数值。';

function caseToDoc(c){
  return { signalment:c.signalment, urgency:c.urgency, soap:c.soap,
           differentials:c.differentials, discharge:c.discharge, estimate:c.estimate };
}

function sanitizeDoc(raw){
  const d = raw || {};
  const sg = d.signalment || {};
  const signalment = {
    species: str(sg.species)||'宠物', breed: str(sg.breed)||'未提供',
    sex: str(sg.sex)||'未提供', age: str(sg.age)||'未提供',
    weight: str(sg.weight)||'未提供', bcs: str(sg.bcs)||'未提供'
  };
  const urgency = URGENCY[d.urgency] ? d.urgency : 'today';
  const so = d.soap || {};
  const soap = { s:str(so.s)||'—', o:str(so.o)||'—', a:str(so.a)||'—', p:str(so.p)||'—' };
  let differentials = Array.isArray(d.differentials) ? d.differentials.map(x=>({
    dx: str(x.dx)||'—', like: LIKE[x.like]?x.like:'中',
    why: str(x.why)||'', test: str(x.test)||''
  })).filter(x=>x.dx!=='—').slice(0,5) : [];
  if(!differentials.length) differentials = [{dx:'待进一步检查明确', like:'中', why:'信息有限', test:'基础体格 + 血液检查'}];
  const dc = d.discharge || {};
  const discharge = {
    summary: str(dc.summary)||'具体情况以院内检查为准。',
    care: arr(dc.care), meds: arr(dc.meds),
    recheck: str(dc.recheck)||'按医嘱复诊',
    redflags: arr(dc.redflags)
  };
  let estimate = Array.isArray(d.estimate) ? d.estimate.map(x=>({
    item: str(x.item)||'项目', low: int(x.low), high: int(x.high)
  })).filter(x=>x.high>0).slice(0,6) : [];
  return { signalment, urgency, soap, differentials, discharge, estimate };
}
const str = v => (v==null?'':String(v)).trim();
const int = v => { const n = Math.round(Number(v)); return isFinite(n)&&n>0 ? n : 0; };
const arr = v => Array.isArray(v) ? v.map(str).filter(Boolean).slice(0,4) : [];

/* ---------------- 启动 ---------------- */
function start(){
  injectStyles();
  main = GG.mountShell(SLUG);
  const st = GG.decodeState();
  if(st && st.doc && st.doc.soap){ renderResult(sanitizeDoc(st.doc), !!st.ai, true); return; }
  intro();
}

/* ---------------- 首屏：门面 + 工作区 ---------------- */
function intro(){
  GG.clear(main);
  let loadedId = null;

  main.appendChild(GG.el('div',{class:'pv-hd'},
    GG.el('span',{class:'tag'}, 'DEMO'),
    GG.el('span',{class:'em'}, '🩺'),
    GG.el('h1', null, 'AI 兽医病历助手'),
    GG.el('div',{class:'sub'}, 'Scribe · 把问诊变成病历，文书时间还给看诊'),
    GG.el('div',{class:'pv-trust'}, GG.el('span',null,'🔒'),
      GG.el('span',null,'AI 起草 · 兽医复核 · 记录只存本机浏览器'))
  ));

  main.appendChild(GG.el('div',{class:'pv-hook'},
    GG.el('span',null,'⏱️'),
    GG.el('span',{html:'兽医平均每天 <b>2–3 小时</b>耗在写病历。贴一段问诊速记，30 秒拿回 <b>SOAP 病历 · 鉴别诊断 · 出院医嘱 · 费用预估</b>。'})
  ));

  main.appendChild(GG.el('div',{class:'section-t', style:{marginTop:'16px'}}, '① 选个示例病例，或直接贴你自己的速记'));
  const egrid = GG.el('div',{class:'pv-egrid'});
  const ta = GG.el('textarea',{class:'pv-ta', placeholder:'例：「贵宾/5岁/母，咳嗽一周、夜里更明显，活动后偶尔干呕，精神食欲都正常，没发烧……」\n口语速记就行，AI 会整理成规范病历。'});
  function paintEg(){
    GG.clear(egrid);
    CASES.forEach(c=>{
      egrid.appendChild(GG.el('button',{class:'pv-eg'+(loadedId===c.id?' on':''), onClick:()=>{
        loadedId = c.id; ta.value = c.raw; paintEg();
      }},
        GG.el('div',{class:'t'}, c.chip),
        GG.el('div',{class:'k'}, c.kind)
      ));
    });
  }
  paintEg();
  main.appendChild(egrid);
  main.appendChild(ta);
  ta.addEventListener('input', ()=>{ // 改动后不再算「原样示例」
    const c = CASES.find(c=>c.id===loadedId);
    if(c && ta.value.trim()!==c.raw.trim()){ loadedId=null; paintEg(); }
  });

  main.appendChild(GG.llm.bar());

  const gen = GG.el('button',{class:'btn primary pv-gen', onClick:()=>onGenerate(ta.value, loadedId)},
    '⚡ 生成全套文书');
  main.appendChild(gen);
  main.appendChild(GG.el('div',{class:'pv-genhint', html:
    '示例病例<b>无需联网</b>即可出完整文书；自由速记连 AI 后由真实模型起草。'}));
}

/* ---------------- 生成 ---------------- */
async function onGenerate(text, loadedId){
  const t = (text||'').trim();
  if(!t){ GG.toast('先点一个示例病例，或贴一段问诊速记'); return; }
  const c = CASES.find(c=>c.id===loadedId);

  // 原样示例 → 离线出完整文书
  if(c && t===c.raw.trim()){
    await runStage();
    renderResult(caseToDoc(c), false);
    return;
  }
  // 自由速记，未连 key → 友好引导
  if(!GG.llm.connected()){
    GG.toast('自由速记需连接 AI 起草（上方「连接 AI 升级」）；或先点一个示例病例看效果');
    return;
  }
  // 自由速记 + 已连 key → 真实模型
  await runStage();
  try{
    const doc = sanitizeDoc(await GG.llm.json(AI_SYS, '问诊速记：\n'+t, { max_tokens:2600 }));
    renderResult(doc, true);
  }catch(e){
    GG.clear(main);
    main.appendChild(GG.el('div',{class:'card pad', style:{textAlign:'center'}},
      GG.el('p',{style:{margin:'0 0 10px'}}, '😣 '+GG.llm.errMsg(e)),
      GG.el('p',{class:'muted small', style:{margin:'0 0 14px'}}, '可重试，或先点示例病例查看完整效果。'),
      GG.el('button',{class:'btn', onClick:intro}, '← 返回')));
  }
}

function runStage(){
  GG.clear(main);
  const stage = GG.el('div'); main.appendChild(stage);
  return GG.thinking(stage, ['解析问诊速记…','提取主诉与体格检查…','梳理鉴别诊断…','起草 SOAP 与出院医嘱…','估算费用区间…'], 1700);
}

/* ---------------- 结果 ---------------- */
function renderResult(doc, fromAI, isReplay){
  GG.clear(main);
  GG.encodeState({ doc, ai: fromAI?1:0 });
  const sg = doc.signalment, U = URGENCY[doc.urgency] || URGENCY.today;

  // 顶部：紧急度
  main.appendChild(GG.el('div',{class:'pv-urg', style:{background:U.soft, border:'1px solid '+U.color}},
    GG.el('span',{class:'ue'}, U.emoji),
    GG.el('div', null,
      GG.el('div',{class:'ul', style:{color:U.color}}, '建议处置：'+U.label),
      GG.el('div',{class:'un'}, U.note))
  ));

  // 病历抬头
  const head = GG.el('div',{class:'card pad', style:{marginBottom:'2px'}});
  head.appendChild(GG.el('div',{class:'pv-sig'},
    GG.el('span',{class:'nm'}, (sg.species||'宠物')+' · '+(sg.breed||'')),
    GG.el('span',{class:'s'}, sg.sex),
    GG.el('span',{class:'s'}, sg.age),
    sg.weight && sg.weight!=='未提供' ? GG.el('span',{class:'s'}, sg.weight) : null,
    sg.bcs && sg.bcs!=='未提供' ? GG.el('span',{class:'s'}, 'BCS '+sg.bcs) : null
  ));
  head.appendChild(GG.el('div',{style:{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap',marginTop:'4px'}},
    GG.el('span',{class:'pv-stamp'}, '✍️ AI 起草 · 待兽医复核'),
    GG.llm.badge(fromAI)
  ));
  main.appendChild(head);

  // ① SOAP 病历
  main.appendChild(docSection('📋','SOAP 病历', soapText(doc), buildSOAP(doc.soap)));

  // ② 鉴别诊断
  main.appendChild(docSection('🔬','鉴别诊断（按可能性）', dxText(doc), buildDx(doc.differentials)));

  // ③ 出院医嘱（给主人）
  main.appendChild(docSection('🏠','给主人的出院医嘱', dischargeText(doc), buildOwner(doc.discharge)));

  // ④ 费用预估
  main.appendChild(docSection('💰','费用预估', estText(doc), buildEst(doc.estimate)));

  // 分享（disclaimer 自动追加）
  const top = doc.differentials[0];
  const shareSpec = {
    slug: SLUG, title:'AI 兽医病历草稿',
    subtitle: (sg.species||'宠物')+' · '+(sg.breed||'')+'　'+U.emoji+' '+U.label,
    bars: doc.differentials.slice(0,4).map(x=>({ label:x.dx.slice(0,8), pct:(LIKE[x.like]||LIKE['中']).pct, color:(LIKE[x.like]||LIKE['中']).color })),
    note: doc.soap.a.length>72 ? doc.soap.a.slice(0,70)+'…' : doc.soap.a,
    tags: ['SOAP','鉴别诊断','出院医嘱','费用预估']
  };
  main.appendChild(GG.el('div',{style:{marginTop:'16px'}},
    GG.resultCard(SLUG, GG.el('div',{class:'center muted small'}, '把这份草稿截图 / 复制带走 ↓'), shareSpec)));

  main.appendChild(GG.el('div',{class:'center', style:{marginTop:'16px'}},
    GG.el('button',{class:'btn', onClick:()=>{ location.hash=''; start(); }}, '← 写新病例 / 换示例')));

  window.scrollTo(0,0);
}

/* 文书区块外壳：标题行 + 复制按钮 */
function docSection(emoji, title, copyStr, body){
  const card = GG.el('div',{class:'card pad pv-doc'});
  card.appendChild(GG.el('div',{class:'pv-doch'},
    GG.el('div',{class:'tt'}, GG.el('span',{class:'e'}, emoji), title),
    GG.el('button',{class:'pv-copy', onClick:()=>GG.copyText(copyStr)}, '📋 复制')
  ));
  card.appendChild(body);
  return card;
}

function buildSOAP(soap){
  const rows = [['S','主诉 / 病史', soap.s],['O','客观检查', soap.o],['A','评估', soap.a],['P','诊疗计划', soap.p]];
  const grid = GG.el('div',{class:'pv-soap'});
  rows.forEach(([k,cap,txt])=>{
    grid.appendChild(GG.el('div',{class:'row', style:{display:'contents'}},
      GG.el('div',{class:'lab'}, k),
      GG.el('div',{class:'bd'}, GG.el('span',{class:'cap'}, cap), txt)
    ));
  });
  return grid;
}

function buildDx(list){
  const wrap = GG.el('div');
  list.forEach((x,i)=>{
    const L = LIKE[x.like] || LIKE['中'];
    wrap.appendChild(GG.el('div',{class:'pv-dx'},
      GG.el('div',{class:'top'},
        GG.el('span',{class:'rk'}, '#'+(i+1)),
        GG.el('span',{class:'nm'}, x.dx),
        GG.el('span',{class:'lk', style:{color:L.color, background:L.soft}}, '可能性 '+x.like)),
      GG.el('div',{class:'pv-dxbar'}, GG.el('i',{style:{width:L.pct+'%', background:L.color}})),
      GG.el('div',{class:'meta'}, x.why ? GG.el('div',null, GG.el('b',null,'依据：'), x.why) : null,
        x.test ? GG.el('div',null, GG.el('b',null,'推荐检查：'), GG.el('span',{class:'tst'}, x.test)) : null)
    ));
  });
  return wrap;
}

function buildOwner(dc){
  const box = GG.el('div',{class:'pv-owner'});
  box.appendChild(GG.el('div',{class:'os'}, dc.summary));
  if(dc.care.length) box.appendChild(blk('在家这样照顾', GG.el('ul', null, dc.care.map(x=>GG.el('li',null,x)))));
  if(dc.meds.length) box.appendChild(blk('用药', GG.el('ul', null, dc.meds.map(x=>GG.el('li',null,x)))));
  if(dc.recheck) box.appendChild(blk('复诊', GG.el('div',{class:'rc'}, dc.recheck)));
  if(dc.redflags.length){
    const r = GG.el('div',{class:'blk pv-red'});
    r.appendChild(GG.el('div',{class:'h'}, '⚠️ 出现这些立刻回诊'));
    r.appendChild(GG.el('ul', null, dc.redflags.map(x=>GG.el('li',null,x))));
    box.appendChild(r);
  }
  return box;
  function blk(h, node){ return GG.el('div',{class:'blk'}, GG.el('div',{class:'h'}, h), node); }
}

function buildEst(list){
  const box = GG.el('div',{class:'pv-est'});
  if(!list.length){ box.appendChild(GG.el('div',{class:'muted small'}, '（待明确检查项后估算）')); return box; }
  let lo=0, hi=0;
  list.forEach(e=>{ lo+=e.low; hi+=e.high;
    box.appendChild(GG.el('div',{class:'er'},
      GG.el('span',{class:'it'}, e.item),
      GG.el('span',{class:'pr'}, '¥'+GG.fmt(e.low)+'–'+GG.fmt(e.high))));
  });
  box.appendChild(GG.el('div',{class:'tot'},
    GG.el('span',{class:'tl'}, '预估合计'),
    GG.el('span',{class:'tv'}, '¥'+GG.fmt(lo)+' – '+GG.fmt(hi))));
  box.appendChild(GG.el('div',{class:'note'}, '* 预估区间，实际项目与价格以院内方案为准。'));
  return box;
}

/* ---------------- 复制用纯文本 ---------------- */
function soapText(d){
  const s=d.soap;
  return `【SOAP 病历】（AI 起草 · 待兽医复核）\n患宠：${sigLine(d.signalment)}\n\nS 主诉/病史：${s.s}\nO 客观检查：${s.o}\nA 评估：${s.a}\nP 诊疗计划：${s.p}`;
}
function dxText(d){
  return '【鉴别诊断】（仅提示，供兽医判断）\n'+d.differentials.map((x,i)=>
    `${i+1}. ${x.dx}（可能性${x.like}）\n   依据：${x.why}\n   推荐检查：${x.test}`).join('\n');
}
function dischargeText(d){
  const c=d.discharge;
  let t = `【给主人的出院医嘱】\n${c.summary}\n`;
  if(c.care.length) t += `\n在家照顾：\n`+c.care.map(x=>'· '+x).join('\n');
  if(c.meds.length) t += `\n\n用药：\n`+c.meds.map(x=>'· '+x).join('\n');
  if(c.recheck) t += `\n\n复诊：${c.recheck}`;
  if(c.redflags.length) t += `\n\n⚠️ 出现这些立刻回诊：\n`+c.redflags.map(x=>'· '+x).join('\n');
  return t;
}
function estText(d){
  let lo=0,hi=0; d.estimate.forEach(e=>{lo+=e.low;hi+=e.high;});
  return '【费用预估】\n'+d.estimate.map(e=>`· ${e.item}：¥${e.low}–${e.high}`).join('\n')+
    `\n预估合计：¥${lo} – ${hi}\n（区间预估，以院内方案为准）`;
}
function sigLine(sg){
  return [sg.species, sg.breed, sg.sex, sg.age, sg.weight, sg.bcs&&sg.bcs!=='未提供'?('BCS '+sg.bcs):'']
    .filter(x=>x&&x!=='未提供').join(' · ');
}

start();
})();
