/* mealplan — 7 天饮食计划。
   饮食问卷（目标 / 忌口过敏 / 每天餐数 / 口味偏好）→ thinking →
   （1）7 天计划：每天 早/午/晚（餐数=2 时省略午餐）；
   （2）购物清单：把所有选中菜的 ingredients 收集 → 按品类(蔬菜/肉蛋/主食/调料/其他)分组、同名合并并累计次数。
   换偏好 → 不同 7 天计划；购物清单按品类分组展示。 */
(function(){
const SLUG='mealplan';
const { MEALS } = window.MEALPLAN;

const GOALS = ['减脂','增肌','均衡'];
// 忌口/过敏 → 命中即排除带该 tag 的菜
const AVOID = [
  {key:'不吃辣',  tag:'辣'},
  {key:'素食',    tag:'__veg__'},   // 特殊：只保留含 素 tag 的菜
  {key:'无麸质',  tag:'麸质'},
  {key:'不吃海鲜',tag:'海鲜'},
  {key:'不喝牛奶',tag:'牛奶'},
  {key:'无坚果',  tag:'坚果'},
];
const TASTES = ['清淡','重口','均衡'];           // 口味偏好（影响选菜种子，重口偏好带辣的菜）
const CAT_ORDER = ['蔬菜','肉蛋','主食','调料','其他'];
const DAYS = ['第1天','第2天','第3天','第4天','第5天','第6天','第7天'];

let main;

/* ---------- AI 通路（连了 key 让模型排个性化周计划，没连退回本地配餐引擎） ---------- */
function mpSys(meals){
  return '你是营养配餐助手。根据用户的目标/忌口/每天餐数/口味，排一份 7 天饮食计划并汇总购物清单。'+
    '只输出严格 JSON：{ "plan":[ {"day":"第1天","早":"早餐菜名","午":"午餐菜名(2餐时留空字符串)","晚":"晚餐菜名"} (共7天) ],'+
    ' "shopping":[ {"cat":"蔬菜|肉蛋|主食|调料|其他","items":["食材",...]} ] }。'+
    '规则：严格尊重忌口/过敏；7 天尽量不重样；每天 '+meals+' 餐；全部简体中文。';
}
async function getMealData(goal, avoids, meals, taste, seed, useAI){
  if(useAI){
    try{
      const u = `目标：${goal}；忌口/过敏：${avoids.length?avoids.join('、'):'无'}；每天 ${meals} 餐；口味：${taste}`;
      const obj = await GG.llm.json(mpSys(meals), u, {max_tokens:1900});
      const data = normalizeMeal(obj, meals);
      if(data){ data._ai = true; return data; }
    }catch(e){ GG.toast(GG.llm.errMsg(e)); }
  }
  const { plan, useLunch } = buildPlan(goal, avoids, meals, taste, seed);
  return { plan, useLunch, list: shoppingList(plan) };
}
function normalizeMeal(obj, meals){
  const useLunch = meals >= 3;
  const days = Array.isArray(obj && obj.plan) ? obj.plan : [];
  if(days.length < 3) return null;
  const plan = days.slice(0,7).map((d,i)=>({
    label: String(d.day || ('第'+(i+1)+'天')),
    早: d.早 ? {name:String(d.早)} : null,
    午: (useLunch && d.午) ? {name:String(d.午)} : null,
    晚: d.晚 ? {name:String(d.晚)} : null,
  }));
  const sh = Array.isArray(obj.shopping) ? obj.shopping : [];
  const list = sh.map(g=>({ cat:String(g.cat||'其他'),
    items:(Array.isArray(g.items)?g.items:[]).map(x=>({name:String(x), n:1})) })).filter(g=>g.items.length);
  return { plan, useLunch, list };
}

/* ---------- 引擎 ---------- */
// 按目标 + 忌口过滤可用菜
function available(meals, goal, avoids){
  const veg = avoids.includes('素食');
  const banTags = AVOID.filter(a=>avoids.includes(a.key) && a.tag!=='__veg__').map(a=>a.tag);
  return meals.filter(m=>{
    if(veg && !m.tags.includes('素')) return false;
    if(m.tags.some(t=>banTags.includes(t))) return false;
    return true;
  });
}
// 给某餐位排 7 天，尽量不连续重复、按目标+口味打分加权
function planSlot(pool, goal, taste, seed){
  if(!pool.length) return [];
  const rnd = GG.rng(seed);
  const out = [];
  let prev = null, prev2 = null;
  for(let d=0; d<7; d++){
    // 打分：目标契合 + 口味偏好 + 一点随机，惩罚最近重复
    const scored = pool.map(m=>{
      let s = (m.goalFit[goal]||0) * 3;
      if(taste==='重口' && m.tags.includes('辣')) s += 2;
      if(taste==='清淡' && m.tags.includes('辣')) s -= 2;
      s += rnd() * 4;                         // 随机扰动 → 不同种子出不同计划
      if(m===prev)  s -= 100;                 // 不和昨天重
      if(m===prev2) s -= 6;                   // 尽量不和前天重
      return {m, s};
    }).sort((a,b)=>b.s-a.s);
    const pick = scored[0].m;
    out.push(pick); prev2 = prev; prev = pick;
  }
  return out;
}
// 生成完整 7 天计划
function buildPlan(goal, avoids, meals, taste, seed){
  const useLunch = meals >= 3;
  const pool = m => available(MEALS.filter(x=>x.meal===m), goal, avoids);
  const breakfast = planSlot(pool('早'), goal, taste, seed+':b');
  const lunch     = useLunch ? planSlot(pool('午'), goal, taste, seed+':l') : null;
  const dinner    = planSlot(pool('晚'), goal, taste, seed+':d');
  const plan = DAYS.map((label,i)=>({
    label,
    早: breakfast[i] || null,
    午: lunch ? (lunch[i]||null) : null,
    晚: dinner[i] || null,
  }));
  return { plan, useLunch };
}
// 购物清单：收集所有选中菜 ingredients → 按 cat 分组 + 同名合并累计次数
function shoppingList(plan){
  const map = {};   // cat -> { name -> count }
  for(const day of plan){
    ['早','午','晚'].forEach(slot=>{
      const dish = day[slot];
      if(!dish) return;
      for(const ing of dish.ingredients){
        (map[ing.cat] || (map[ing.cat]={}));
        map[ing.cat][ing.name] = (map[ing.cat][ing.name]||0) + 1;
      }
    });
  }
  // 输出按 CAT_ORDER，每类内按出现次数降序
  return CAT_ORDER.filter(c=>map[c]).map(cat=>({
    cat,
    items: Object.entries(map[cat]).sort((a,b)=>b[1]-a[1]).map(([name,n])=>({name,n})),
  }));
}

/* ---------- 流程 ---------- */
function start(){
  main = GG.mountShell(SLUG);
  const st = GG.decodeState();
  if(st && st.g){
    showResult(st.g, st.a||[], st.m||3, st.t||'均衡', st.seed||1, true);
    return;
  }
  intro();
}

function intro(){
  // 问卷状态
  const ans = { goal:null, avoids:[], meals:3, taste:'均衡' };

  main.appendChild(GG.el('div',{class:'hero'},
    GG.el('h1', null, '7 天饮食计划 + 购物清单'),
    GG.el('p', null, '回答几个问题，我按你的目标和忌口排出整周三餐，并把所有食材按品类归并成一张购物清单。')
  ));
  main.appendChild(GG.llm.bar());

  const form = GG.el('div',{class:'stack', style:{marginTop:'20px'}});
  main.appendChild(form);

  // Q1 目标
  const goalRow = GG.el('div',{class:'chips'});
  GOALS.forEach(g=>{
    const c = GG.el('button',{class:'chip', onClick:()=>{ ans.goal=g;
      GG.$$('button',goalRow).forEach(b=>b.classList.toggle('on', b.textContent===g)); validate(); }}, g);
    goalRow.appendChild(c);
  });
  form.appendChild(card('1 · 你的目标', '选一个本周的主线', goalRow));

  // Q2 忌口 / 过敏（多选）
  const avoidRow = GG.el('div',{class:'chips'});
  AVOID.forEach(a=>{
    const c = GG.el('button',{class:'chip', onClick:()=>{
      const i = ans.avoids.indexOf(a.key);
      if(i>=0) ans.avoids.splice(i,1); else ans.avoids.push(a.key);
      c.classList.toggle('on'); }}, a.key);
    avoidRow.appendChild(c);
  });
  form.appendChild(card('2 · 忌口 / 过敏', '可多选，命中的菜会被排除（不选也行）', avoidRow));

  // Q3 每天餐数
  const mealRow = GG.el('div',{class:'chips'});
  [{n:2,t:'2 餐（早 + 晚）'},{n:3,t:'3 餐（早 + 午 + 晚）'}].forEach((o,i)=>{
    const c = GG.el('button',{class:'chip'+(o.n===3?' on':''), onClick:()=>{ ans.meals=o.n;
      GG.$$('button',mealRow).forEach((b,bi)=>b.classList.toggle('on', bi===i)); }}, o.t);
    mealRow.appendChild(c);
  });
  form.appendChild(card('3 · 每天几餐', '', mealRow));

  // Q4 口味偏好
  const tasteRow = GG.el('div',{class:'chips'});
  TASTES.forEach((t,i)=>{
    const c = GG.el('button',{class:'chip'+(t==='均衡'?' on':''), onClick:()=>{ ans.taste=t;
      GG.$$('button',tasteRow).forEach((b)=>b.classList.toggle('on', b.textContent===t)); }}, t);
    tasteRow.appendChild(c);
  });
  form.appendChild(card('4 · 口味偏好', '', tasteRow));

  const goBtn = GG.el('button',{class:'btn primary lg', disabled:true,
    onClick:()=>{
      const seed = (GG.hash(ans.goal+ans.avoids.join('|')+ans.meals+ans.taste) % 9000) + (Date.now()%97);
      GG.encodeState({g:ans.goal, a:ans.avoids, m:ans.meals, t:ans.taste, seed});
      showResult(ans.goal, ans.avoids, ans.meals, ans.taste, seed, false);
    }}, '✨ 生成我的 7 天计划 →');
  main.appendChild(GG.el('div',{class:'center', style:{marginTop:'8px'}}, goBtn));

  function validate(){ goBtn.disabled = !ans.goal; }
}

function card(title, sub, body){
  return GG.el('div',{class:'card pad'},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, title),
    sub ? GG.el('p',{class:'small muted', style:{margin:'0 0 12px'}}, sub) : null,
    body
  );
}

async function showResult(goal, avoids, meals, taste, seed, fromLink){
  main = main || GG.mountShell(SLUG);
  GG.clear(main);
  const stage = GG.el('div'); main.appendChild(stage);

  const useAI = GG.llm.connected();
  let plan, useLunch, list, isAI=false;
  if(!fromLink){
    const think = GG.thinking(stage, [
      `锁定目标：${goal}…`,
      useAI ? 'AI 为你排整周三餐…' : (avoids.length? `避开 ${avoids.join('、')}…` : '筛选可用菜品…'),
      '排布整周三餐，避免连着重样…',
      '归并食材，生成购物清单…',
    ], useAI?1900:1600);
    const [data] = await Promise.all([getMealData(goal, avoids, meals, taste, seed, useAI), think]);
    plan = data.plan; useLunch = data.useLunch; list = data.list; isAI = !!data._ai;
  } else {
    const data = await getMealData(goal, avoids, meals, taste, seed, useAI);
    plan = data.plan; useLunch = data.useLunch; list = data.list; isAI = !!data._ai;
  }
  GG.clear(stage);

  const subtitle = `目标：${goal}　·　${avoids.length? '忌口：'+avoids.join('、') : '不忌口'}　·　每天${meals}餐　·　口味${taste}`;

  stage.appendChild(GG.el('div',{class:'hero', style:{paddingTop:'8px'}},
    GG.el('h1',{style:{fontSize:'26px'}}, '🥗 你的 7 天饮食计划'),
    GG.el('p',{style:{fontSize:'15px'}}, subtitle)
  ));
  stage.appendChild(GG.el('div',{style:{margin:'0 0 6px'}}, GG.llm.badge(isAI)));

  // ---- (1) 7 天计划 ----
  stage.appendChild(GG.el('div',{class:'section-t'}, '7 天三餐安排'));
  const slots = useLunch ? ['早','午','晚'] : ['早','晚'];
  const planWrap = GG.el('div',{class:'stack'});
  plan.forEach(day=>{
    planWrap.appendChild(GG.el('div',{class:'card pad', style:{display:'flex', gap:'14px', alignItems:'flex-start', flexWrap:'wrap'}},
      GG.el('div',{style:{width:'56px', flex:'none', fontWeight:'700', color:'var(--accent)', fontSize:'15px'}}, day.label),
      GG.el('div',{style:{flex:'1', minWidth:'220px', display:'flex', flexDirection:'column', gap:'8px'}},
        slots.map(s=>GG.el('div',{class:'row', style:{gap:'10px', alignItems:'baseline'}},
          GG.el('span',{class:'pill', style:{background:'var(--accent-soft)', color:'var(--accent)', borderRadius:'999px', padding:'2px 10px', fontSize:'12px', fontWeight:'600', flex:'none'}}, s+'餐'),
          GG.el('span',{style:{fontSize:'15px'}}, day[s] ? day[s].name : '—')
        ))
      )
    ));
  });
  stage.appendChild(planWrap);

  // ---- (2) 购物清单（按品类归并） ----
  stage.appendChild(GG.el('div',{class:'section-t'}, '购物清单 · 按品类归并'));
  const totalItems = list.reduce((a,g)=>a+g.items.length,0);
  const shopWrap = GG.el('div',{class:'card pad'});
  shopWrap.appendChild(GG.el('p',{class:'small muted', style:{margin:'0 0 14px'}},
    `共 ${totalItems} 种食材，已去重合并，括号内为本周用到的次数。`));
  list.forEach(group=>{
    shopWrap.appendChild(GG.el('div',{style:{marginBottom:'14px'}},
      GG.el('div',{style:{fontWeight:'700', fontSize:'14px', marginBottom:'8px'}}, '🛒 '+group.cat),
      GG.el('div',{class:'chips'},
        group.items.map(it=>GG.el('span',{class:'chip', style:{cursor:'default'}},
          it.name + (it.n>1 ? `（×${it.n}）` : '')))
      )
    ));
  });
  stage.appendChild(shopWrap);

  // ---- 分享卡 ----
  const highlightDays = plan.slice(0,4).map(d=>({
    label: d.label,
    value: slots.map(s=> d[s] ? d[s].name : '—').join(' / '),
  }));
  const shareSpec = {
    slug: SLUG,
    title: '我的 7 天饮食计划',
    subtitle: subtitle,
    rows: highlightDays,
    note: '按品类归并的购物清单已生成',
    tags: [goal].concat(avoids.length? avoids : ['不忌口']).concat(['口味'+taste]),
  };

  stage.appendChild(GG.resultCard(SLUG,
    GG.el('div',{class:'center muted small'}, '截图分享你的一周吃法 ↓'),
    shareSpec));

  stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'18px'}},
    GG.el('button',{class:'btn', onClick:()=>{ location.hash=''; start(); }}, '↻ 换个偏好再来一份')
  ));
}

start();
})();
