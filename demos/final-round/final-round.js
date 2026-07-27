/* final-round — 模拟面试即时反馈。
   选岗 → AI 随机出一道行为面试题 → 用户写回答 → 提交 → thinking →
   结构化三项反馈（STAR 完整度 / 具体性 / 改进建议），全部针对用户实际答案内容。
   纯文字、零外部依赖、零语音：「语速」用字数/句长近似。 */
(function(){
const SLUG = 'final-round';
const { ROLES } = window.FINAL_ROUND;
let main;
let state = { role:null, question:null, qIdx:-1 };

/* ---------------- 分析引擎 ----------------
   读用户的回答文本，启发式判定四要素 / 具体性 / 改进建议。
   关键：所有结论都引用从答案里真实抽到的片段或数字，不同回答 → 不同反馈。 */

// STAR 四要素的触发关键词（EN 模式换用英文关键词组，保证与英文回答可匹配）
const STAR = [
  { key:'S', label:GG.T('情境 Situation','Situation'), desc:GG.T('交代背景','set the scene'),
    kw:GG.EN
      ? ['at the time','back then','background','context','initially','at first','faced','we were','client','customer','company','the project','situation','ran into','struggling','when i']
      : ['当时','背景','项目','那时','一开始','起初','面临','场景','客户','公司','团队负责','遇到'] },
  { key:'T', label:GG.T('任务 Task','Task'), desc:GG.T('你的目标 / 职责','your goal / responsibility'),
    kw:GG.EN
      ? ['responsible for','my goal','the goal','needed to','task','required','target','kpi','okr','expected','my job','my role','had to','asked to','in charge of']
      : ['负责','目标','需要','任务','要求','指标','kpi','KPI','希望','期望','我的职责','要做到','要解决'] },
  { key:'A', label:GG.T('行动 Action','Action'), desc:GG.T('你具体做了什么','what you actually did'),
    kw:GG.EN
      ? ['i ','we ','decided','pushed','built','designed','set up','optimiz','communicat','aligned','adjusted','analyz','implement','launch','led','drove','propos','organiz','negotiat']
      : ['我','采取','推动','做了','方案','于是','因此','我们','决定','设计','搭建','优化','沟通','拉','复盘','调整','分析','落地','上线'] },
  { key:'R', label:GG.T('结果 Result','Result'), desc:GG.T('可衡量的成果','a measurable outcome'),
    kw:GG.EN
      ? ['result','in the end','eventually','finally','improv','increas','grew','growth','reduc','achiev','exceed','deliver','revenue','conversion','closed','won','saved','went up','recover']
      : ['结果','最终','提升','下降','增长','达成','超额','完成','带来','收益','转化','拿下','成交','省','降低','上涨','回升'] },
];

function sentences(text){
  return text.split(GG.EN ? /[.。！？!?\n;；]+/ : /[。！？!?\n;；]+/).map(s=>s.trim()).filter(Boolean);
}

// 抽取答案里所有「具体数字 / 量化表达」，返回真实片段（用于引用）
function extractNumbers(text){
  const out = [];
  // 百分比、倍数、金额（万/亿/元/k）、绝对数字带量词、时间量（EN 模式换用英文量词）
  const re = GG.EN
    ? /(\d+(?:\.\d+)?\s*%)|(\d+(?:\.\d+)?\s*(?:x|times|pp|percentage points?))|((?:\$|€|£)\s*\d+(?:[,.]\d+)?\s*(?:k|K|m|M|bn|B)?)|(\d+(?:[,.]\d+)?\s*(?:k|K|m|M)\b)|(\d+(?:\.\d+)?\s*(?:days?|weeks?|months?|years?|hours?|minutes?|people|users?|clients?|customers?|deals?|orders?|leads?|releases?|rounds?|sprints?))/g
    : /(\d+(?:\.\d+)?\s*%)|(\d+(?:\.\d+)?\s*(?:倍|万|亿|个百分点|pp))|((?:￥|\$)?\s*\d+(?:\.\d+)?\s*(?:元|块|w|W|k|K|万元|亿元))|(\d+(?:\.\d+)?\s*(?:天|周|个月|月|年|小时|分钟|人|位|名|单|条|次|版|轮))/g;
  let m;
  while((m = re.exec(text)) !== null){
    const hit = GG.EN ? m[0].trim() : m[0].replace(/\s+/g,'');
    if(hit && !out.includes(hit)) out.push(hit);
    if(out.length >= 8) break;
  }
  return out;
}

function analyze(text){
  const clean = (text||'').trim();
  const chars = clean.replace(/\s/g,'').length;
  const sents = sentences(clean);
  const sentCount = sents.length;
  const avgLen = sentCount ? Math.round(chars / sentCount) : chars;
  const longest = sents.reduce((m,s)=> Math.max(m, s.replace(/\s/g,'').length), 0);

  // —— STAR 四要素判定 ——
  const present = {};   // key -> 命中的第一个关键词（用于"读了"的证据）
  const hay = GG.EN ? clean.toLowerCase() : clean;
  STAR.forEach(part=>{
    const hitKw = part.kw.find(k=> hay.includes(k));
    if(hitKw) present[part.key] = hitKw;
  });
  // Result 额外条件：含数字更算"有结果"；只有"我"很弱，需配动词上下文已在 kw 体现
  const numbers = extractNumbers(clean);
  if(numbers.length && !present.R) present.R = numbers[0];
  const presentKeys = STAR.filter(p=> present[p.key]);
  const missingKeys = STAR.filter(p=> !present[p.key]);

  // —— 评分 ——
  // STAR 完整度：每要素 25 分，过短打折
  let starPct = presentKeys.length * 25;
  if(chars < 40) starPct = Math.min(starPct, 35);          // 太短，要素再多也虚
  starPct = GG.clamp(Math.round(starPct), 0, 100);

  // 具体性：数字数量 + 字数 + 句子结构
  let specPct = 18;
  specPct += Math.min(numbers.length, 4) * 16;             // 每个量化 +16，封顶 64
  if(chars >= 80) specPct += 10;
  if(chars >= 180) specPct += 8;
  if(sentCount >= 3) specPct += 6;
  if(chars < 30) specPct = Math.min(specPct, 20);
  specPct = GG.clamp(Math.round(specPct), 0, 100);

  // 综合
  const overall = GG.clamp(Math.round(starPct*0.5 + specPct*0.4 + Math.min(100, chars/2.4)*0.1), 0, 100);

  return { clean, chars, sentCount, avgLen, longest, present, presentKeys, missingKeys, numbers,
           starPct, specPct, overall };
}

/* ---------------- 反馈文案（针对性，非模板） ---------------- */

function starFeedback(a){
  const have = a.presentKeys.map(p=>p.key).join('');
  if(a.presentKeys.length === 0){
    return GG.T(`这段回答里我没能识别出清晰的 STAR 结构——背景、任务、行动、结果都比较模糊。建议改成「当时…（背景）→ 我要…（任务）→ 我做了…（行动）→ 最终…（结果）」的骨架重讲一遍。`,
      `I could not identify a clear STAR structure in this answer — the situation, task, action and result are all fuzzy. Try retelling it on a skeleton of "At the time… (Situation) → I needed to… (Task) → I did… (Action) → In the end… (Result)".`);
  }
  const haveTxt = a.presentKeys.map(p=> GG.T(`${p.label.split(' ')[0]}（你用了"${snippet(a.present[p.key])}"这类表述）`,
    `${p.label.split(' ')[0]} (you used wording like "${snippet(a.present[p.key])}")`)).join(GG.T('、', ', '));
  if(a.missingKeys.length === 0){
    return GG.T(`STAR 四要素都讲到了：${haveTxt}。结构很完整，面试官能顺着背景→行动→结果听下来。继续保持，再把每一段压实即可。`,
      `All four STAR elements are there: ${haveTxt}. The structure is complete — an interviewer can follow you from situation to action to result. Keep it up, and just tighten each part further.`);
  }
  const missTxt = a.missingKeys.map(p=> GG.T(`${p.label.split(' ')[0]}（${p.desc}）`, `${p.label.split(' ')[0]} (${p.desc})`)).join(GG.T('、', ', '));
  return GG.T(`你已经讲清了 ${a.presentKeys.length} 个要素：${haveTxt}；但还缺 ${missTxt}。面试官最容易追问的就是缺的这块——尤其要补上「${a.missingKeys[0].label.split(' ')[0]}」，否则故事会显得不完整。`,
    `You covered ${a.presentKeys.length} element(s) clearly: ${haveTxt}; still missing: ${missTxt}. That gap is exactly what interviewers probe — add "${a.missingKeys[0].label.split(' ')[0]}" above all, or the story will feel incomplete.`);
}
function snippet(s){ s=String(s); const n = GG.EN ? 18 : 6; return s.length>n ? s.slice(0,n) : s; }

function specFeedback(a){
  if(a.numbers.length === 0){
    const tail = a.chars < 50 ? GG.T('而且整段偏短，','and the whole answer is on the short side — ') : '';
    return GG.T(`整段回答里我没有找到任何量化数据，${tail}全是定性描述。面试官很难判断你的贡献有多大。哪怕加一个数字也好——比如"提升了多少 %""带来了几万""压缩到几天"，立刻就有说服力。`,
      `I did not find a single quantified data point in this answer — ${tail}it is all qualitative description. That makes it hard for an interviewer to size your contribution. Even one number helps — "improved by X%", "brought in $Xk", "cut it down to X days" — and it instantly becomes convincing.`);
  }
  const quoted = a.numbers.slice(0,4).map(n=> GG.T(`「${n}」`, `"${n}"`)).join(GG.T('、', ', '));
  const more = a.numbers.length > 4 ? GG.T(`（共 ${a.numbers.length} 处量化）`, ` (${a.numbers.length} quantified details in total)`) : '';
  let body = GG.T(`具体性不错，你引用了真实数字：${quoted}${more}，这正是面试官想听的。`,
    `Good specificity — you cited real numbers: ${quoted}${more}, which is exactly what interviewers want to hear.`);
  if(a.numbers.length === 1){
    body += GG.T(` 不过全文只有这一个数据点，可以再补一两个（比如投入侧的资源、对比基线），让成果更立体。`,
      ` That said, it is the only data point in the whole answer — add one or two more (the resources you put in, a comparison baseline) to round out the result.`);
  } else {
    body += GG.T(` 多个量化让你的成果可信。下一步可以补一句"对比之前/同期"的基线，数字会更有冲击力。`,
      ` Multiple quantified points make your result credible. Next, add one line of "versus before / versus the same period" baseline and the numbers will hit even harder.`);
  }
  if(a.chars < 60) body += GG.T(` 另外整段还可以再展开一点。`, ` The answer could also be expanded a little overall.`);
  return body;
}

function adviceFeedback(a){
  const tips = [];
  // 1) 先补最关键的缺失要素
  if(a.missingKeys.length){
    const m0 = a.missingKeys[0];
    if(m0.key==='R') tips.push(GG.T('结尾一定要落到一个可量化的结果（数字 / 百分比 / 金额），别停在"做了什么"。','Always land the ending on a quantifiable result (a number / percentage / dollar figure) — do not stop at "what I did".'));
    else if(m0.key==='S') tips.push(GG.T('开头先用一句话交代背景与处境，让面试官知道这件事的难度和上下文。','Open with one sentence of situation and stakes, so the interviewer knows the difficulty and the context.'));
    else if(m0.key==='T') tips.push(GG.T('明确点出"我的目标 / 我负责的部分"，把个人职责从团队里拎出来。','Call out "my goal / the part I owned" explicitly — lift your personal responsibility out of the team.'));
    else if(m0.key==='A') tips.push(GG.T('把"我具体做了哪几步"讲细，用"我决定…、我推动…"凸显你的主导动作。','Spell out the concrete steps you took — "I decided…", "I drove…" — to highlight the moves you led.'));
  }
  // 2) 数字
  if(a.numbers.length === 0) tips.push(GG.T('至少补一个量化指标——这是结构化面试拿高分的关键。','Add at least one quantified metric — it is the key to scoring high in a structured interview.'));
  // 3) 篇幅 / 句长
  if(a.chars < 50) tips.push(GG.T(`目前约 ${a.chars} 字，偏短；行为题理想回答约 150–300 字，建议展开行动细节。`, `About ${a.chars} characters right now — on the short side; a strong behavioral answer runs roughly 100–200 words, so expand the action details.`));
  else if(a.chars > 600) tips.push(GG.T(`目前约 ${a.chars} 字，偏长；建议砍掉枝节，突出"关键决策 + 结果"。`, `About ${a.chars} characters — on the long side; trim the tangents and spotlight "key decision + result".`));
  if(a.longest >= 60) tips.push(GG.T(`有句子长达 ${a.longest} 字，口述时容易绕；拆成几句短句会更清楚（这也影响"语速"观感）。`, `One sentence runs ${a.longest} characters — easy to get tangled when spoken; break it into shorter sentences (this also affects perceived pacing).`));
  // 4) 兜底正向
  if(!tips.length) tips.push(GG.T('结构和数据都到位了，临场把语气放稳、控制好节奏，就是一段很强的回答。','Structure and data are both in place — keep your tone steady and your pacing controlled on the day, and this is a very strong answer.'));

  return { lead: tips[0], all: tips.slice(0,3) };
}

/* ---------------- AI 通路（连了 key 用真实模型出题 + 反馈，没连退回本地题库 + 启发式分析） ---------------- */
const FR_FB_SYS = [
  '你是资深面试教练。读候选人对一道行为面试题的回答，按 STAR 框架打分并给针对性反馈。',
  '只输出严格 JSON（不要 markdown、不要前言）：',
  '{ "star_present":["命中的要素，取值只能是 S/T/A/R"], "star_pct":0到100, "spec_pct":0到100, "overall":0到100,',
  '  "numbers":["从回答里摘到的量化片段(逐字)"], "star_feedback":"针对回答的 STAR 结构点评(2到3句)",',
  '  "spec_feedback":"针对具体性/数据的点评(2到3句)", "advice":["可执行的改进建议",2到3条] }',
  '反馈必须针对候选人实际写的内容、引用其中的细节，不同回答给不同反馈；'+GG.T('全部简体中文。','all user-visible text fields (star_feedback, spec_feedback, advice, numbers) must be written in English.')
].join('\n');

async function pickQuestion(role){
  if(GG.llm.connected()){
    GG.clear(main); const s = GG.el('div'); main.appendChild(s);
    const think = GG.thinking(s, [GG.T('AI 正在为「'+role.label+'」出题…','AI is drafting a question for “'+role.label+'”…')], 900);
    try{
      const [r] = await Promise.all([
        GG.llm.json('你是资深面试官。为指定岗位出一道高质量的行为面试题（STAR 类、考察真实经历、一句话提问）。只输出 JSON：{"question":"..."}'+GG.T('','\nWrite the question in English.'),
          '岗位：'+role.label, {max_tokens:200}),
        think ]);
      if(r && r.question) return String(r.question);
    }catch(e){ GG.toast(GG.llm.errMsg(e)); await think; }
  }
  return localPick(role);
}
function localPick(role){
  let idx = Math.floor(GG.rng(Date.now())()*role.questions.length);
  if(idx === state.qIdx && role.questions.length > 1) idx = (idx+1) % role.questions.length;
  state.qIdx = idx;
  return role.questions[idx];
}

async function aiAnalyze(role, question, answerText){
  const obj = await GG.llm.json(FR_FB_SYS,
    '岗位：'+role.label+'\n面试题：'+question+'\n候选人回答：\n'+answerText, {max_tokens:900});
  const clean = (answerText||'').trim();
  const present = Array.isArray(obj.star_present) ? obj.star_present : [];
  const cl = n => GG.clamp(parseInt(n,10)||0, 0, 100);
  return {
    clean, chars: clean.replace(/\s/g,'').length, sentCount: sentences(clean).length,
    numbers: (Array.isArray(obj.numbers)?obj.numbers:[]).map(String).filter(Boolean),
    present: {}, presentKeys: STAR.filter(p=> present.includes(p.key)),
    missingKeys: STAR.filter(p=> !present.includes(p.key)),
    starPct: cl(obj.star_pct), specPct: cl(obj.spec_pct), overall: cl(obj.overall),
    _ai: true, _starFb: String(obj.star_feedback||''), _specFb: String(obj.spec_feedback||''),
    _advice: (Array.isArray(obj.advice)?obj.advice:[]).map(String).filter(Boolean)
  };
}

/* ============== ＋1：面试官追问一轮（真实面试的第二刀） ==============
   一次性打分像 Google Interview Warmup；真面试官会盯着你回答里最虚的一点再追一刀。
   这里基于第①轮分析挑出"最该被追"的点 → 以面试官口吻追问 + 解释他为什么追 →
   你再答一次 → 给「面试官心证」。连 key 用 AI 出更锋利的追问，没连用启发式。 */

// 判定追问回答有没有"接住"用的关键词（EN 模式换用英文关键词组）
const KW_OWN  = GG.EN
  ? ['i decided','i led','i owned','i proposed','i drove','i pushed','on my own','it was me','i personally','i took the lead','my call','i was responsible','i made the call']
  : ['我决定','我拍板','我主导','我提出','我推动','亲自','我一个人','主要是我','我牵头','是我做','我来做','我负责'];
const KW_HARD = GG.EN
  ? ['hard','difficult','constraint','limited','lacked','no budget','first time','nobody','tight','deadline','stuck','blocked','complex','risk','pressure','at the time','challeng','tough']
  : ['难','约束','限制','没有','缺','第一次','没人','时间紧','deadline','卡','坑','复杂','风险','背景','当时','压力'];
const KW_GOAL = GG.EN
  ? ['goal','target','kpi','okr','responsible','quota','metric','objective','north star','required','expected to','on the hook']
  : ['目标','指标','kpi','KPI','要做到','负责','考核','okr','OKR','要求','北极星'];

function pickProbeLocal(a){
  const miss = new Set(a.missingKeys.map(p=>p.key));
  // 优先级：缺结果 > 数字孤单/没基线 > 个人贡献存疑 > 缺背景 > 缺目标 > 都有则深挖可复用性
  if(miss.has('R')){
    return { kind:'R', focus:GG.T('缺量化结果','No quantified result'),
      q:GG.T('你把"做了什么"讲清楚了，但我没真正听到结果。这件事最后落到一个可衡量的成效是多少——提升了百分之几、省下多少、还是几天内拿下？',
        'You explained what you did, but I did not really hear the result. What did this ultimately amount to in measurable terms — what percentage lift, how much saved, or how fast did you land it?'),
      why:GG.T('真实面试官最爱在这儿追第二刀：没有数字的成果，约等于没发生。',
        'This is where real interviewers love to take the second cut: an outcome without a number might as well not have happened.') };
  }
  if(a.numbers.length <= 1){
    const n = a.numbers[0];
    return { kind:'base', focus: n?GG.T('「'+n+'」缺基线','“'+n+'” has no baseline'):GG.T('数据太单薄','Data too thin'),
      q: n
        ? GG.T('你提到「'+n+'」——这个数字的对比基线是什么？之前是多少、用了多久达成、是你一个人的功劳吗？',
            'You mentioned “'+n+'” — what is the baseline for that number? What was it before, how long did it take, and was it really your doing alone?')
        : GG.T('你的成果基本是定性描述。能给一个能量化的点吗——规模、增幅、耗时、金额，任意一个数字都行。',
            'Your results are mostly qualitative. Can you give me one quantifiable point — scale, growth, time, or money, any number will do?'),
      why:GG.T('孤零零一个数字，面试官会怀疑是"包装"。基线 + 投入 + 对比，数字才站得住。',
        'A single unanchored number reads like packaging. Baseline + input + comparison is what makes a number stand up.') };
  }
  if(miss.has('A')){
    return { kind:'A', focus:GG.T('个人贡献存疑','Personal contribution unclear'),
      q:GG.T('这件事听下来更像团队的成果。具体哪一步是你个人拍板 / 主导的？如果当时没有你，结果会差在哪？',
        'This sounds more like a team win. Which step did you personally call or drive? If you had not been there, what would have turned out worse?'),
      why:GG.T('行为面试考的是"你"不是"你们"。讲不清个人动作，功劳就被稀释了。',
        'Behavioral interviews test "you", not "your team". If your own moves are unclear, the credit gets diluted.') };
  }
  if(miss.has('S')){
    return { kind:'S', focus:GG.T('背景太空','Context too thin'),
      q:GG.T('先补一句当时的处境吧——这件事真正的难点或约束是什么？为什么它不好做？',
        'Give me one line on the situation first — what was the real difficulty or constraint here? Why was it hard to pull off?'),
      why:GG.T('没有难度的故事不加分。先让面试官知道"这有多难"，你的功劳才显出来。',
        'A story with no difficulty earns no points. Show the interviewer how hard it was, and your contribution stands out.') };
  }
  if(miss.has('T')){
    return { kind:'T', focus:GG.T('目标不清','Goal unclear'),
      q:GG.T('在这件事里，你个人被考核的目标 / 要达成的指标具体是什么？',
        'In this project, what exactly was the goal or metric you personally were on the hook for?'),
      why:GG.T('说不清目标，后面的"结果"就没有参照系，数字再好也悬空。',
        'Without a clear goal, the "result" has no reference point — even great numbers float in mid-air.') };
  }
  return { kind:'deep', focus:GG.T('深挖可复用性','Probing repeatability'),
    q:GG.T('结果不错。那它之后呢——有没有沉淀成一套可复用的机制 / 流程，还是一次性的？换个场景你还能复现吗？',
      'Nice result. What happened after — did it get distilled into a repeatable mechanism or process, or was it a one-off? Could you replicate it in a different setting?'),
    why:GG.T('到这步面试官在分辨：你是运气好，还是真有方法论。讲出可迁移的部分最加分。',
      'At this point the interviewer is separating luck from method. The transferable part is what earns the most credit.') };
}

function probeCheckLocal(kind, fuText, fuNums){
  const t = GG.EN ? fuText.toLowerCase() : fuText;
  if(kind==='R' || kind==='base') return fuNums.length > 0;
  if(kind==='A') return KW_OWN.some(k=>t.includes(k));
  if(kind==='S') return KW_HARD.some(k=>t.includes(k));
  if(kind==='T') return KW_GOAL.some(k=>t.includes(k));
  return (GG.EN ? /mechanism|process|playbook|framework|template|repeatab|reusab|replicat|standardi|methodolog|since then|still use/ : /机制|流程|沉淀|复用|复制|迁移|标准化|后来一直|形成了|方法论/).test(t) || t.replace(/\s/g,'').length>=24;
}

function localVerdict(a, patched){
  const ov = a.overall;
  if(patched && ov>=70) return { pass:'good', verdict:GG.T('✅ 这轮稳了。故事完整、追问也接住了，面试官心里基本给过。','✅ Solid round. The story is complete and you handled the follow-up — the interviewer is basically sold.'), tip:GG.T('临场把语速放稳、开头 10 秒先说结论，就是一段很强的回答。','On the day, steady your pace and lead with the conclusion in the first 10 seconds — that makes this a very strong answer.') };
  if(patched && ov>=45) return { pass:'ok',   verdict:GG.T('🟢 基本能过。你接住了追问、补上了关键一块——整体故事再压实一点会更稳。','🟢 Likely a pass. You caught the follow-up and filled the key gap — tighten the overall story a bit more and it will hold.'), tip:GG.T('把第①轮里偏虚的地方，也用这次追问的"具体劲儿"重讲一遍。','Take the vaguer parts of round ① and retell them with the same concreteness you just showed.') };
  if(patched)           return { pass:'ok',   verdict:GG.T('🟡 追问答得不错，但整体故事还偏薄。先把 STAR 四要素补全，再谈细节。','🟡 Good response to the probe, but the overall story is still thin. Complete all four STAR elements first, then polish the details.'), tip:GG.T('回到第①轮缺的要素，从骨架重讲一遍。','Go back to the elements missing in round ① and retell the story from the skeleton up.') };
  if(ov>=70)            return { pass:'warn', verdict:GG.T('🟡 前面很强，但这一刀没接住。真实面试里，恰恰是这种追问最容易让人翻车。','🟡 A strong opening, but you missed this probe. In real interviews, this is exactly the kind of follow-up that trips people up.'), tip:GG.T('盯着面试官追问的"那个点"正面回答，别绕开。','Answer the exact point the interviewer is probing, head-on — do not sidestep it.') };
  return { pass:'bad', verdict:GG.T('🔴 还差一口气。追问戳的正是你回答最弱的地方，这次也没补上——这就是会被卡住的位置。','🔴 Not quite there. The probe hit the weakest spot in your answer and it still went unaddressed — this is exactly where you would get stuck.'), tip:GG.T('下次准备故事，先自问一句"面试官会从哪追？"，把答案提前想好。','Next time you prep a story, first ask yourself "where will the interviewer probe?" — and have the answer ready.') };
}

const SYS_PROBE = [
  '你是严格但专业的面试官。基于候选人对一道行为题的回答，提出「一个」最锋利的追问——',
  '专戳他回答里最薄弱、最含糊、最缺证据的一点（例：没有量化结果 / 把团队功劳说成个人 / 关键动作一笔带过 / 数字没有基线）。',
  '像真实面试的第二刀，口语、直接、对候选人说。',
  '只输出严格 JSON（无 markdown、无前言）：',
  '{ "q":"追问(1到2句)", "focus":"你在戳的点(5到10字,如 缺量化结果/个人贡献存疑)", "why":"给候选人的提示:你为什么追这里、想听到什么(1句)" }',
  GG.T('全部简体中文。','Write q, focus and why in English.')
].join('\n');

const SYS_PROBE_JUDGE = [
  '你是面试官。candidate 刚回答了你的追问。判断这次补充有没有真正「接住」——即补上了你想要的证据 / 澄清 / 数字。',
  '只输出严格 JSON：{ "patched":true或false, "verdict":"面试官心证:这轮整体能不能过+一句点评(1到2句,直接专业,可带emoji)", "tip":"还能更好的一点(1句,可留空)" }',
  GG.T('简体中文。','Write verdict and tip in English.')
].join('\n');

async function genProbe(a, answerText){
  if(GG.llm.connected()){
    try{
      const r = await GG.llm.json(SYS_PROBE,
        '岗位：'+state.role.label+'\n面试题：'+state.question+'\n候选人回答：\n'+answerText, {max_tokens:300});
      if(r && r.q) return { kind:'ai', focus:String(r.focus||GG.T('最薄弱的一点','the weakest point')), q:String(r.q), why:String(r.why||''), _ai:true };
    }catch(e){ GG.toast(GG.llm.errMsg(e)); }
  }
  return pickProbeLocal(a);
}

async function judgeProbe(a, probe, fuText, answerText){
  if(probe._ai && GG.llm.connected()){
    try{
      const r = await GG.llm.json(SYS_PROBE_JUDGE,
        '岗位：'+state.role.label+'\n面试题：'+state.question+'\n原回答：\n'+answerText+
        '\n\n我的追问：'+probe.q+'\n候选人的追问回答：\n'+fuText, {max_tokens:400});
      if(r) return { patched:!!r.patched, verdict:String(r.verdict||''), tip:String(r.tip||''), pass:r.patched?'good':'warn', _ai:true };
    }catch(e){ GG.toast(GG.llm.errMsg(e)); }
  }
  const fuNums = extractNumbers(fuText);
  const patched = probeCheckLocal(probe.kind, fuText, fuNums);
  const v = localVerdict(a, patched);
  return { patched, verdict:v.verdict, tip:v.tip, pass:v.pass };
}

function followUpStage(a, answerText){
  GG.clear(main);
  main.appendChild(GG.el('div',{class:'row', style:{justifyContent:'space-between', marginTop:'18px', alignItems:'center'}},
    GG.el('span',{class:'pill'}, state.role.emoji+' '+state.role.label),
    GG.el('span',{class:'small muted'}, GG.T('第 ① 轮：STAR ','Round ①: STAR ')+a.presentKeys.length+'/4'+GG.T(' · 综合 ',' · Overall ')+a.overall)
  ));
  const slot = GG.el('div'); main.appendChild(slot);
  const think = GG.thinking(slot, [GG.T('面试官在盯着你的回答…','The interviewer is re-reading your answer…'),GG.T('找出最该追问的一点…','Picking the one point worth probing…'), GG.llm.connected()?GG.T('AI 组织追问…','AI drafting the follow-up…'):GG.T('组织追问…','Drafting the follow-up…')], 1100);
  genProbe(a, answerText).then(async (probe)=>{
    await think; GG.clear(slot);
    renderFollowUpAsk(slot, a, answerText, probe);
  });
}

function renderFollowUpAsk(slot, a, answerText, probe){
  slot.appendChild(GG.el('div',{class:'card pad', style:{marginTop:'12px', background:'linear-gradient(160deg,#fff6ee,#fff 64%)', borderColor:'var(--warn)'}},
    GG.el('div',{class:'row', style:{justifyContent:'space-between', alignItems:'center', gap:'10px'}},
      GG.el('div',{class:'section-t', style:{marginTop:'0'}}, GG.T('🎯 面试官追问','🎯 Interviewer Follow-up')),
      GG.el('span',{class:'pill', style:{background:'var(--warn)', color:'#fff', borderColor:'transparent', flex:'none'}}, probe.focus)
    ),
    GG.el('div',{style:{fontSize:'18px', fontWeight:'600', lineHeight:'1.5', marginTop:'4px'}}, probe.q)
  ));
  if(probe.why){
    slot.appendChild(GG.el('div',{class:'card pad', style:{marginTop:'10px', background:'#fbfbf9'}},
      GG.el('div',{class:'small', style:{color:'var(--ink-2)', lineHeight:'1.6'}},
        GG.el('b', null, GG.T('💡 他为什么追这里：','💡 Why they are probing here: ')), ' '+probe.why)
    ));
  }
  const ta = GG.el('textarea',{class:'field', placeholder:GG.T('直接正面接住这个追问，别绕开——一两句、补上他想听的那块就够。','Take the follow-up head-on, no sidestepping — a sentence or two that supplies exactly what they want to hear is enough.'), style:{marginTop:'14px', minHeight:'120px'}});
  const counter = GG.el('div',{class:'small muted', style:{marginTop:'6px', textAlign:'right'}}, GG.T('0 字','0 chars'));
  ta.addEventListener('input', ()=>{ const n = ta.value.replace(/\s/g,'').length; counter.textContent = GG.T(n+' 字', n+' chars'); });
  slot.appendChild(GG.el('label',{class:'label', style:{marginTop:'14px'}}, GG.T('你的应对','Your response')));
  slot.appendChild(ta); slot.appendChild(counter);
  slot.appendChild(GG.el('button',{class:'btn primary lg block', style:{marginTop:'14px'}, onClick:()=>{
    if(ta.value.replace(/\s/g,'').length < 2){ GG.toast(GG.T('正面接住这一刀再提交～','Take the probe head-on before submitting')); ta.focus(); return; }
    runProbeVerdict(a, probe, ta.value, answerText);
  }}, GG.T('接住这一刀 →','Take the hit →')));
  slot.appendChild(GG.el('div',{class:'center', style:{marginTop:'10px'}},
    GG.el('button',{class:'btn ghost small', onClick:nextQuestion}, GG.T('跳过，直接下一题 →','Skip — next question →'))));
  setTimeout(()=>ta.focus(), 60);
}

async function runProbeVerdict(a, probe, fuText, answerText){
  GG.clear(main);
  const slot = GG.el('div'); main.appendChild(slot);
  const think = GG.thinking(slot, [GG.T('面试官在掂量你的应对…','The interviewer is weighing your response…'), (GG.llm.connected()&&probe._ai)?GG.T('AI 给出心证…','AI forming a read…'):GG.T('生成心证…','Forming a read…')], 1200);
  const res = await judgeProbe(a, probe, fuText, answerText);
  await think; GG.clear(slot);
  showProbeVerdict(slot, a, probe, fuText, answerText, res);
}

function showProbeVerdict(slot, a, probe, fuText, answerText, res){
  const passColor = res.pass==='bad'?'var(--bad)':(res.pass==='warn'?'var(--warn)':'var(--good)');
  slot.appendChild(GG.el('div',{class:'hero', style:{paddingTop:'8px', paddingBottom:'4px'}},
    GG.el('h1',{style:{fontSize:'24px'}}, GG.T('🧑‍⚖️ 面试官心证','🧑‍⚖️ The Interviewer’s Read'))));
  slot.appendChild(GG.el('div',{style:{marginBottom:'8px'}}, GG.llm.badge(!!res._ai)));

  slot.appendChild(GG.el('div',{class:'card pad'},
    GG.el('div',{class:'row', style:{justifyContent:'space-between', alignItems:'center', gap:'10px'}},
      GG.el('div',{style:{fontWeight:'680', fontSize:'15.5px'}}, GG.T('追问应对 · ','Follow-up response · ')+probe.focus),
      GG.el('span',{style:{fontWeight:'800', fontSize:'15px', flex:'none', color: res.patched?'var(--good)':'var(--bad)'}}, res.patched?GG.T('✓ 接住了','✓ Caught it'):GG.T('✗ 没接住','✗ Missed it'))
    ),
    GG.el('div',{class:'small muted', style:{margin:'8px 0 0', lineHeight:'1.6'}}, GG.el('b', null, GG.T('追问：','Follow-up:')), ' '+probe.q),
    GG.el('div',{class:'small', style:{margin:'8px 0 0', lineHeight:'1.6', color:'var(--ink-2)', whiteSpace:'pre-wrap'}}, GG.el('b', null, GG.T('你的应对：','Your response:')), ' '+fuText.trim())
  ));
  slot.appendChild(GG.el('div',{style:{height:'12px'}}));

  slot.appendChild(GG.el('div',{class:'card pad', style:{borderColor:passColor, background: res.pass==='bad'?'#fdf3f1':(res.pass==='warn'?'#fff8ee':'#f1faf6')}},
    GG.el('div',{style:{fontWeight:'750', fontSize:'17px', lineHeight:'1.5', color:passColor}}, res.verdict)
  ));
  if(res.tip){
    slot.appendChild(GG.el('div',{class:'card pad', style:{marginTop:'10px', background:'#fbfbf9'}},
      GG.el('div',{class:'small', style:{color:'var(--ink-2)', lineHeight:'1.6'}}, GG.el('b',null,GG.T('下一步：','Next step:')), ' '+res.tip)));
  }

  const shareSpec = {
    slug: SLUG, title:GG.T('模拟面试 · 扛住追问','Mock Interview · Surviving the Follow-up'),
    subtitle: state.role.label+' · '+probe.focus,
    bars: [ {label:GG.T('第①轮综合','Round ① overall'), pct:a.overall}, {label:GG.T('STAR 完整度','STAR completeness'), pct:a.starPct}, {label:GG.T('具体性','Specificity'), pct:a.specPct} ],
    note: (res.patched?GG.T('接住了面试官的追问：','Handled the follow-up: '):GG.T('追问没接住：','Missed the follow-up: '))+probe.focus,
    tags: [ res.patched?GG.T('扛住追问','Held the line'):GG.T('追问待补','Follow-up to fix'), state.role.label ],
  };
  slot.appendChild(GG.resultCard(SLUG,
    GG.el('div',{class:'center muted small'}, GG.T('截图分享这轮面试 ↓','Screenshot & share this round ↓')), shareSpec));

  slot.appendChild(GG.el('div',{class:'row', style:{justifyContent:'center', gap:'12px', marginTop:'18px', flexWrap:'wrap'}},
    GG.el('button',{class:'btn primary', onClick:nextQuestion}, GG.T('下一题 →','Next question →')),
    GG.el('button',{class:'btn', onClick:askStage}, GG.T('↻ 重答这题','↻ Retry this question')),
    GG.el('button',{class:'btn ghost', onClick:start}, GG.T('换岗位','Switch role'))
  ));
}

/* ---------------- 流程 ---------------- */
function start(){
  main = GG.mountShell(SLUG);
  state = { role:null, question:null, qIdx:-1 };
  intro();
}

function intro(){
  GG.clear(main);
  main.appendChild(GG.el('div',{class:'hero'},
    GG.el('h1', null, GG.T('选个岗位，进入模拟面试','Pick a role to start your mock interview')),
    GG.el('p', null, GG.T('AI 出一道行为面试题，你用文字作答，立刻拿到结构化反馈（STAR 完整度 / 具体性 / 改进建议，全部针对你写的内容）——然后像真面试一样，面试官会盯着你最虚的一点，追问第二刀。','The AI asks a behavioral interview question, you answer in writing, and you get instant structured feedback (STAR completeness / specificity / suggestions — all grounded in what you actually wrote). Then, just like a real interview, the interviewer zeroes in on your weakest point and takes a second cut.'))
  ));
  main.appendChild(GG.llm.bar());
  main.appendChild(GG.el('div',{class:'section-t'}, GG.T('应聘岗位','Role you are applying for')));
  const grid = GG.el('div',{class:'stack'});
  ROLES.forEach(role=>{
    grid.appendChild(GG.el('div',{class:'opt', onClick:()=>chooseRole(role)},
      GG.el('span',{style:{fontSize:'24px', flex:'none'}}, role.emoji),
      GG.el('div',{style:{flex:'1'}},
        GG.el('div',{style:{fontWeight:'650', fontSize:'17px'}}, role.label),
        GG.el('div',{class:'small muted'}, GG.T(`${role.questions.length} 道行为面试题题库 · 随机抽题`, `${role.questions.length} behavioral questions in the bank · random draw`))
      ),
      GG.el('span',{class:'muted'}, '→')
    ));
  });
  main.appendChild(grid);
}

async function chooseRole(role){
  state.role = role;
  state.question = await pickQuestion(role);   // 连了 AI 现出题，否则本地题库
  askStage();
}

async function nextQuestion(){
  state.question = await pickQuestion(state.role);
  askStage();
}

function askStage(){
  GG.clear(main);
  main.appendChild(GG.el('div',{class:'row', style:{justifyContent:'space-between', marginTop:'18px'}},
    GG.el('span',{class:'kpi'}, GG.el('span',{class:'pill'}, `${state.role.emoji} ${state.role.label}`)),
    GG.el('button',{class:'btn ghost small', style:{padding:'6px 12px'}, onClick:start}, GG.T('↺ 换岗位','↺ Switch role'))
  ));
  main.appendChild(GG.el('div',{class:'card pad', style:{marginTop:'12px', background:'linear-gradient(160deg,var(--accent-soft),#fff 62%)'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, GG.T('🎤 面试官提问','🎤 Interviewer Question')),
    GG.el('div',{style:{fontSize:'19px', fontWeight:'600', lineHeight:'1.45'}}, state.question)
  ));

  const ta = GG.el('textarea',{class:'field', placeholder:GG.T('用 STAR 结构作答：当时的背景 / 你的目标 / 你具体做了什么 / 最终的（量化）结果…','Answer in the STAR structure: the Situation you were in / your Task / the Actions you took / the final (quantified) Result…'), style:{marginTop:'16px', minHeight:'180px'}});
  const counter = GG.el('div',{class:'small muted', style:{marginTop:'6px', textAlign:'right'}}, GG.T('0 字','0 chars'));
  ta.addEventListener('input', ()=>{
    const n = ta.value.replace(/\s/g,'').length;
    counter.textContent = GG.T(`${n} 字`, `${n} chars`) + (n>0 && n<40 ? GG.T('　· 偏短，再展开一点会更有说服力',' · a bit short — expand a little for more impact') : '');
  });
  main.appendChild(GG.el('label',{class:'label', style:{marginTop:'16px'}}, GG.T('你的回答','Your answer')));
  main.appendChild(ta);
  main.appendChild(counter);

  const submit = GG.el('button',{class:'btn primary lg block', style:{marginTop:'14px'}, onClick:()=>{
    if(ta.value.replace(/\s/g,'').length < 4){ GG.toast(GG.T('先写下你的回答再提交～','Write your answer before submitting')); ta.focus(); return; }
    runFeedback(ta.value);
  }}, GG.T('提交，获取反馈 →','Submit for feedback →'));
  main.appendChild(submit);
  setTimeout(()=>ta.focus(), 60);
}

async function runFeedback(answerText){
  GG.clear(main);
  const stage = GG.el('div'); main.appendChild(stage);
  const useAI = GG.llm.connected();
  const think = GG.thinking(stage, [
    GG.T('正在读你的回答…','Reading your answer…'),
    GG.T('检测 STAR 四要素是否齐全…','Checking the four STAR elements…'),
    GG.T('提取你提到的量化数据…','Extracting the numbers you cited…'),
    useAI ? GG.T('AI 逐条点评、生成反馈…','AI reviewing point by point…') : GG.T('评估篇幅 / 句长 / 语速…','Assessing length / sentence flow / pacing…'),
    GG.T('生成针对性反馈…','Writing targeted feedback…'),
  ], 2000);

  let a=null;
  if(useAI){ try{ a = await aiAnalyze(state.role, state.question, answerText); }catch(e){ GG.toast(GG.llm.errMsg(e)); } }
  await think;
  if(!a) a = analyze(answerText);
  GG.clear(stage);
  showResult(stage, a, answerText);
}

function bar(label, pct, color){
  return GG.el('div',{class:'bar-row'},
    GG.el('div',{class:'nm', style:{width:'92px'}}, label),
    GG.el('div',{class:'bar'}, GG.el('i',{style:{width:'0%', background:color||'var(--accent)'}})),
    GG.el('div',{class:'pct'}, pct+'%')
  );
}

function feedbackBlock(title, scoreLabel, pct, bodyNode, color){
  return GG.el('div',{class:'card pad'},
    GG.el('div',{class:'row', style:{justifyContent:'space-between', alignItems:'baseline'}},
      GG.el('div',{style:{fontWeight:'680', fontSize:'16px'}}, title),
      GG.el('div',{style:{fontWeight:'700', fontSize:'15px', color:color||'var(--accent)'}}, pct+' / 100')
    ),
    GG.el('div',{class:'bar', style:{margin:'10px 0 12px'}}, GG.el('i',{class:'fb-fill', dataset:{pct:String(pct)}, style:{width:'0%', background:color||'var(--accent)'}})),
    GG.el('div',{style:{fontSize:'14.5px', lineHeight:'1.6', color:'var(--ink-2)'}}, bodyNode)
  );
}

function colorFor(pct){ return pct>=75 ? 'var(--good)' : (pct>=45 ? 'var(--warn)' : 'var(--bad)'); }

/* STAR 四要素地图（2×2 宫格，✓/✗ + 命中证据）——区别于线性评分条的一眼概览 */
function starGrid(a){
  const presentSet = new Set(a.presentKeys.map(p=>p.key));
  const cells = STAR.map(p=>{
    const on = presentSet.has(p.key);
    const ev = a.present && a.present[p.key];
    return GG.el('div',{style:{border:'1px solid '+(on?'var(--accent)':'var(--line)'), borderRadius:'12px', padding:'11px 12px',
      background: on?'var(--accent-soft)':'#fbfbf9'}},
      GG.el('div',{class:'row', style:{justifyContent:'space-between', alignItems:'center'}},
        GG.el('span',{style:{fontWeight:'700', fontSize:'14.5px', color:on?'var(--accent)':'var(--ink-3)'}}, p.label),
        GG.el('span',{style:{fontWeight:'800', fontSize:'16px', color:on?'#2e9e7b':'#c2536f'}}, on?'✓':'✗')),
      GG.el('p',{class:'small muted', style:{margin:'5px 0 0', lineHeight:'1.5'}},
        on ? (ev?GG.T('你提到「'+snippet(ev)+'…」','You mentioned “'+snippet(ev)+'…”'):GG.T('已讲到','Covered')) : (GG.T('缺：','Missing: ')+p.desc)));
  });
  return GG.el('div',{class:'card pad'},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, GG.T('STAR 四要素地图','STAR Element Map')),
    GG.el('div',{style:{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}, cells[0], cells[1], cells[2], cells[3]),
    GG.el('p',{class:'small muted', style:{margin:'10px 0 0'}}, GG.T('绿勾=已讲到，红叉=缺这块；面试官最爱追问缺的那格。','Green check = covered, red cross = missing; interviewers love to probe the missing cell.')));
}

function showResult(stage, a, answerText){
  const advice = a._ai ? { lead:(a._advice[0]||''), all:a._advice.slice(0,3) } : adviceFeedback(a);
  const starText = a._ai ? a._starFb : starFeedback(a);
  const specText = a._ai ? a._specFb : specFeedback(a);
  const starTags = a.presentKeys.map(p=> p.label.split(' ')[0]);

  stage.appendChild(GG.el('div',{class:'hero', style:{paddingTop:'8px', paddingBottom:'4px'}},
    GG.el('h1',{style:{fontSize:'24px'}}, GG.T('📋 你的面试反馈','📋 Your Interview Feedback'))));
  stage.appendChild(GG.el('div',{style:{marginBottom:'4px'}}, GG.llm.badge(!!a._ai)));
  stage.appendChild(GG.el('div',{class:'small muted', style:{marginBottom:'4px'}},
    GG.T(`${state.role.emoji} ${state.role.label} · 共识别 ${a.presentKeys.length}/4 个 STAR 要素 · ${a.numbers.length} 处量化 · ${a.chars} 字`,
         `${state.role.emoji} ${state.role.label} · ${a.presentKeys.length}/4 STAR elements detected · ${a.numbers.length} quantified details · ${a.chars} chars`)));

  // 你的回答回显（证明"读了"）
  stage.appendChild(GG.el('div',{class:'card pad', style:{margin:'14px 0', background:'#fbfbf9'}},
    GG.el('div',{class:'small muted', style:{marginBottom:'6px'}}, GG.T('你的回答','Your answer')),
    GG.el('div',{style:{fontSize:'14.5px', lineHeight:'1.6', whiteSpace:'pre-wrap', color:'var(--ink-2)'}}, a.clean)
  ));

  // STAR 四要素地图（可视化概览）
  stage.appendChild(starGrid(a));
  stage.appendChild(GG.el('div',{style:{height:'12px'}}));

  const blocks = GG.el('div',{class:'stack'});
  blocks.appendChild(feedbackBlock(GG.T('① STAR 完整度','① STAR Completeness'), '', a.starPct, fbNode(starText), colorFor(a.starPct)));
  blocks.appendChild(feedbackBlock(GG.T('② 具体性（数据 / 细节）','② Specificity (data / details)'), '', a.specPct, fbNode(specText), colorFor(a.specPct)));
  // 改进建议块：列出最多 3 条可执行项
  const adviceInner = GG.el('div', null,
    GG.el('div',{style:{marginBottom:'6px'}}, GG.T('为你列出最该改的几点：','The top things to fix:')),
    GG.el('ul',{style:{margin:'0', paddingLeft:'20px'}}, advice.all.map(t=> GG.el('li',{style:{marginBottom:'4px'}}, t)))
  );
  blocks.appendChild(feedbackBlock(GG.T('③ 改进建议','③ Suggestions'), '', a.overall, adviceInner, colorFor(a.overall)));
  stage.appendChild(blocks);

  // ＋1：把"一次性打分"升级成真面试——面试官追问第二刀（headline 下一步）
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginTop:'14px', background:'linear-gradient(160deg,#fff6ee,#fff 60%)', borderColor:'var(--warn)'}},
    GG.el('div',{class:'row', style:{justifyContent:'space-between', alignItems:'center', gap:'12px', flexWrap:'wrap'}},
      GG.el('div',{style:{flex:'1', minWidth:'170px'}},
        GG.el('div',{style:{fontWeight:'700', fontSize:'16px'}}, GG.T('🔥 真面试不会就此放过你','🔥 A real interview would not stop here')),
        GG.el('div',{class:'small muted', style:{marginTop:'3px', lineHeight:'1.55'}}, GG.T('面试官会盯着你回答里最虚的一点，追第二刀。敢接吗？','The interviewer will zero in on the weakest spot in your answer and take a second cut. Ready for it?'))
      ),
      GG.el('button',{class:'btn primary', style:{flex:'none'}, onClick:()=>followUpStage(a, answerText)}, GG.T('面试官追问我 →','Hit me with the follow-up →'))
    )
  ));

  // 分享 / 结果卡
  const shareSpec = {
    slug: SLUG,
    title: GG.T('模拟面试反馈','Mock Interview Feedback'),
    subtitle: `${state.role.label} · ${state.question.slice(0, 22)}${state.question.length>22?'…':''}`,
    bars: [
      { label:GG.T('STAR 完整度','STAR completeness'), pct:a.starPct },
      { label:GG.T('具体性','Specificity'), pct:a.specPct },
      { label:GG.T('综合','Overall'), pct:a.overall },
    ],
    note: advice.lead,
    tags: starTags.length ? starTags : [GG.T('STAR 待补全','STAR incomplete')],
  };

  stage.appendChild(GG.resultCard(SLUG,
    GG.el('div',{class:'center muted small'}, GG.T('截图分享这张面试反馈 ↓','Screenshot & share this feedback ↓')),
    shareSpec
  ));

  // 加分 feature：连了 AI 时，一键看「按 STAR 改写的范例答案」（沿用你的真实经历）
  if(a._ai){
    const out = GG.el('div',{class:'card pad', style:{display:'none', marginTop:'4px', background:'#fbfbf9',
      lineHeight:'1.7', whiteSpace:'pre-wrap', color:'var(--ink-2)'}});
    let loaded=false, busy=false;
    const mb = GG.el('button',{class:'btn', onClick:async()=>{
      if(busy) return;
      if(loaded){ out.style.display = out.style.display==='none'?'block':'none'; return; }
      busy=true; const old=mb.textContent; mb.textContent=GG.T('AI 改写中…','AI rewriting…'); out.style.display='block'; out.textContent=GG.T('AI 正在按 STAR 改写一版范例…','AI is rewriting a model version with STAR…');
      try{
        const r = await GG.llm.json(
          '你是面试教练。基于候选人的原始回答，按 STAR 结构改写出一版更强的范例答案（150到300字，沿用其真实经历、补全缺失要素、加入合理量化）。只输出 JSON：{"model":"..."}'+GG.T('','\nWrite the model answer in English.'),
          '岗位：'+state.role.label+'\n面试题：'+state.question+'\n原始回答：\n'+answerText, {max_tokens:800});
        out.textContent = r.model || GG.T('（无）','(none)'); loaded=true; mb.textContent=GG.T('✦ 收起范例','✦ Hide the model answer');
      }catch(e){ out.textContent = GG.llm.errMsg(e); mb.textContent=old; }
      busy=false;
    }}, GG.T('✦ 看 AI 改写的范例答案','✦ See an AI-rewritten model answer'));
    stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'14px'}}, mb));
    stage.appendChild(out);
  }

  // 操作区
  stage.appendChild(GG.el('div',{class:'row', style:{justifyContent:'center', gap:'12px', marginTop:'18px', flexWrap:'wrap'}},
    GG.el('button',{class:'btn primary', onClick:nextQuestion}, GG.T('下一题 →','Next question →')),
    GG.el('button',{class:'btn', onClick:askStage}, GG.T('↻ 重答这题','↻ Retry this question')),
    GG.el('button',{class:'btn ghost', onClick:start}, GG.T('换岗位','Switch role'))
  ));

  // 进度条动画
  requestAnimationFrame(()=>{
    GG.$$('.fb-fill', stage).forEach(el=>{ el.style.width = (el.dataset.pct||0)+'%'; });
  });
}

// 把含「」标记的字符串渲染成节点（引用片段不必特殊高亮，纯文本即可，保留可读性）
function fbNode(text){ return text; }

start();
})();
