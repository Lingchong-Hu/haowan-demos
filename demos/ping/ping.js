/* ping — PING 留学生身份合规导航 / Immigration-status compliance navigator for F-1 students
   一句话描述身份情况 → AI 产出个性化合规路线图(标权威出处+错过后果) + 2026 政策风险雷达 + 家长「安心卡」。
   定位：不是产品，是「交付保证」演示——把分散吓人的身份合规复杂度，收敛成可决策、可验证的画面。
   引擎：GG.llm.json(SYS, ..., {model:'claude-sonnet-4-6'})；失败/未连接 → 内置确定性规则引擎兜底，永不白屏。
   合规护栏：全局免责声明常显；信息参考、非法律建议；绝不代填/代办政府表；结论尽量挂 uscis.gov/ice.gov/DHS 出处。
   ⚠️ 内置规则集为「演示用示意」，数字按通行规则编码，真实以 USCIS / 学校 ISSS / 持证移民律师为准。 */
(function(){
const SLUG = 'ping';

/* ── 权威出处（均为真实官方页面）── */
const SRC = {
  opt:  {url:'https://www.uscis.gov/working-in-the-united-states/students-and-exchange-visitors/optional-practical-training-opt-for-f-1-students', label:'USCIS · OPT'},
  stem: {url:'https://www.uscis.gov/working-in-the-united-states/students-and-exchange-visitors/students-and-employment/stem-opt', label:'USCIS · STEM OPT'},
  i765: {url:'https://www.uscis.gov/i-765', label:'USCIS · I-765'},
  sevp: {url:'https://www.ice.gov/sevis', label:'ICE · SEVP/SEVIS'},
  dhs:  {url:'https://studyinthestates.dhs.gov/', label:'DHS · Study in the States'},
  h1b:  {url:'https://www.uscis.gov/working-in-the-united-states/h-1b-specialty-occupations', label:'USCIS · H-1B'},
  isss: {url:'', label:GG.T('向学校 ISSS 核实','Verify with your school ISSS')}
};

/* ── 阶段状态机 ── */
const STAGES = [
  {key:'f1',         label:GG.T('F-1 在读','F-1 Enrolled')},
  {key:'opt-apply',  label:GG.T('OPT 申请','OPT Application')},
  {key:'opt-active', label:GG.T('OPT 在用','OPT Active')},
  {key:'stem',       label:GG.T('STEM 延期','STEM Extension')},
  {key:'h1b',        label:GG.T('H-1B 衔接','H-1B Transition')}
];
const STAGE_KEYS = STAGES.map(s=>s.key);
const STAGE_LABEL = Object.fromEntries(STAGES.map(s=>[s.key,s.label]));

const STATUS = {
  green:  {color:'#2d9e7b', word:GG.T('在轨道上','On track'), dot:'🟢'},
  yellow: {color:'#d4882b', word:GG.T('有临近节点','Milestone approaching'), dot:'🟡'},
  red:    {color:'#d64545', word:GG.T('需立即关注','Needs immediate attention'), dot:'🔴'}
};

/* ════════════════════════════════════════════════════════════════════════
   内置示意规则引擎（演示用，非法律意见）—— 同时作为 API 失败/未连接时的确定性兜底
   数字按 F-1 STEM 主干通行规则编码；UI 一律提示「以官方为准」
   ════════════════════════════════════════════════════════════════════════ */
const PLAYBOOK = {
  'f1': {
    currentStage:'f1',
    roadmap:[
      {action:GG.T('确认毕业日期，规划 OPT 申请窗口','Confirm your graduation date and plan the OPT application window'),
       window:GG.T('最早毕业前 90 天可向 USCIS 递交 I-765，最晚不超过毕业后 60 天','You may file Form I-765 with USCIS as early as 90 days before graduation, and no later than 60 days after'),
       consequence:GG.T('错过毕业后 60 天宽限期，将无法在美申请 post-completion OPT','Missing the 60-day grace period after graduation means you can no longer apply for post-completion OPT from within the U.S.'), sourceUrl:SRC.opt.url, sourceLabel:SRC.opt.label},
      {action:GG.T('向学校 ISSS 申请带 OPT 推荐的新 I-20','Request a new I-20 with OPT recommendation from your school ISSS'),
       window:GG.T('递交 I-765 之前完成','Complete before filing Form I-765'),
       consequence:GG.T('没有 ISSS 背书的 I-20，OPT 申请会被退回','Without an ISSS-endorsed I-20, the OPT application will be rejected'), sourceUrl:SRC.isss.url, sourceLabel:SRC.isss.label},
      {action:GG.T('若为 STEM 学位，求职时确认雇主是否使用 E-Verify','If you hold a STEM degree, confirm whether prospective employers use E-Verify'),
       window:GG.T('求职 / 选 offer 阶段','During job search / offer selection'),
       consequence:GG.T('非 E-Verify 雇主无法支持日后 24 个月 STEM 延期','A non-E-Verify employer cannot support the future 24-month STEM extension'), sourceUrl:SRC.stem.url, sourceLabel:SRC.stem.label}
    ],
    risks:[
      {label:GG.T('STEM 敏感领域审查趋严','Tighter scrutiny of sensitive STEM fields'), meaning:GG.T('部分专业的签证/审查环节可能更慢、更不确定','Visa processing and vetting for some majors may be slower and less predictable'), hedge:GG.T('预留更长处理时间、保持 SEVIS 记录干净、材料齐备','Budget extra processing time, keep your SEVIS record clean, and have documents ready')},
      {label:GG.T('政策变动频繁','Frequent policy changes'), meaning:GG.T('OPT/STEM 规则与处理时长可能调整','OPT/STEM rules and processing times may change'), hedge:GG.T('以 USCIS 官网为准、定期与学校 ISSS 同步','Rely on the official USCIS site and sync with your school ISSS regularly')}
    ],
    parentCard:{status:'green', line:GG.T('孩子身份状态：在读、在轨道上，暂无紧迫节点','Student status: enrolled and on track, no urgent milestones'), nextMilestone:GG.T('毕业前 90 天开放 OPT 申请窗口','OPT application window opens 90 days before graduation')}
  },
  'opt-apply': {
    currentStage:'opt-apply',
    roadmap:[
      {action:GG.T('保留 I-797C 收据通知，凭它合法等待 EAD','Keep the I-797C receipt notice — it lets you lawfully wait for the EAD'),
       window:GG.T('EAD 通常需数周至数月审理','EAD processing typically takes weeks to months'),
       consequence:GG.T('未持有效 EAD 卡，不得开始任何工作','You may not start any work without a valid EAD card'), sourceUrl:SRC.i765.url, sourceLabel:SRC.i765.label},
      {action:GG.T('自查 I-765 关键字段（姓名 / SEVIS 号 / 分类码 c3B）','Double-check key I-765 fields (name / SEVIS number / category code c3B)'),
       window:GG.T('尽快；如发现错误立即联系 ISSS','As soon as possible; contact ISSS immediately if you find an error'),
       consequence:GG.T('字段错误可能触发 RFE 或拒批，拖延 EAD','Field errors can trigger an RFE or a denial and delay the EAD'), sourceUrl:SRC.i765.url, sourceLabel:SRC.i765.label},
      {action:GG.T('确认 OPT 申请已在毕业后 60 天宽限期内被受理','Confirm the OPT application was received within the 60-day grace period after graduation'),
       window:GG.T('毕业后 60 天内','Within 60 days after graduation'),
       consequence:GG.T('超期未被受理将丧失 OPT 资格','If not received in time, you lose OPT eligibility'), sourceUrl:SRC.opt.url, sourceLabel:SRC.opt.label}
    ],
    risks:[
      {label:GG.T('审理时长波动','Processing-time fluctuations'), meaning:GG.T('EAD 出卡时间不稳定，可能影响入职日','EAD issuance timing is unstable and may affect your start date'), hedge:GG.T('与雇主沟通弹性入职日、留意是否可加急','Discuss a flexible start date with your employer and watch for expedite options')},
      {label:GG.T('SEVIS 记录异常','SEVIS record issues'), meaning:GG.T('记录问题可能波及 OPT 审批','Record problems can spill over into OPT adjudication'), hedge:GG.T('保持地址/状态在 SEVIS 及时更新、与 ISSS 核对','Keep your address/status current in SEVIS and verify with ISSS')}
    ],
    parentCard:{status:'yellow', line:GG.T('孩子身份状态：OPT 审理中，正在等待 EAD','Student status: OPT pending, waiting for the EAD'), nextMilestone:GG.T('收到 EAD 卡后方可入职（审理中，已在跟进）','Employment can begin only after the EAD card arrives (pending, being tracked)')}
  },
  'opt-active': {
    currentStage:'opt-active',
    roadmap:[
      {action:GG.T('盯紧累计失业天数，标准 OPT 上限 90 天','Track cumulative unemployment days — the standard OPT limit is 90 days'),
       window:GG.T('自 EAD 生效日起累计','Counted from the EAD start date'),
       consequence:GG.T('累计失业超过 90 天将失去 F-1 身份','Exceeding 90 cumulative unemployment days means losing F-1 status'), sourceUrl:SRC.dhs.url, sourceLabel:SRC.dhs.label},
      {action:GG.T('换工作后 10 天内向学校 ISSS 上报新雇主','Report a new employer to your school ISSS within 10 days of changing jobs'),
       window:GG.T('入职/离职后及时','Promptly after starting or leaving a job'),
       consequence:GG.T('未及时上报违反 OPT 报告义务，可能影响身份','Late reporting violates OPT reporting obligations and may affect your status'), sourceUrl:SRC.sevp.url, sourceLabel:SRC.sevp.label},
      {action:GG.T('若为 STEM 学位，提前准备 24 个月 STEM 延期','If you hold a STEM degree, prepare early for the 24-month STEM extension'),
       window:GG.T('必须在当前 OPT 到期前递交','Must be filed before your current OPT expires'),
       consequence:GG.T('错过递交窗口将无法获得 STEM 延期','Missing the filing window means no STEM extension'), sourceUrl:SRC.stem.url, sourceLabel:SRC.stem.label}
    ],
    risks:[
      {label:GG.T('失业天数累计','Unemployment days accruing'), meaning:GG.T('工作间隔会消耗宝贵的失业额度','Gaps between jobs burn through your precious unemployment allowance'), hedge:GG.T('尽量缩短空窗期、保留在职与求职记录','Minimize gaps and keep records of employment and job searching')},
      {label:GG.T('岗位合规','Job compliance'), meaning:GG.T('工作须与专业相关并达到最低工时要求','Work must relate to your major and meet minimum-hours requirements'), hedge:GG.T('保留岗位与所学专业相关性的书面说明','Keep a written explanation of how the job relates to your field of study')}
    ],
    parentCard:{status:'green', line:GG.T('孩子身份状态：OPT 工作中，失业天数在安全范围内','Student status: working on OPT, unemployment days within the safe range'), nextMilestone:GG.T('换工作后 10 天内完成 ISSS 上报','Report to ISSS within 10 days of any job change')}
  },
  'stem': {
    currentStage:'stem',
    roadmap:[
      {action:GG.T('确认雇主为 E-Verify 并已在到期前递交 STEM 延期','Confirm the employer is E-Verify enrolled and the STEM extension was filed before expiration'),
       window:GG.T('当前 OPT 到期前递交，可获 +24 个月','File before your current OPT expires to get +24 months'),
       consequence:GG.T('未在到期前递交，将无法延期、需另寻身份','Filing late means no extension — you would need another status'), sourceUrl:SRC.stem.url, sourceLabel:SRC.stem.label},
      {action:GG.T('与雇主完成并按期评估 I-983 培训计划','Complete the I-983 training plan with your employer and do the scheduled evaluations'),
       window:GG.T('STEM 延期全程（含 12 / 24 月评估）','Throughout the STEM extension (incl. 12- and 24-month evaluations)'),
       consequence:GG.T('缺 I-983 或未按期评估违反 STEM 要求','A missing I-983 or an overdue evaluation violates STEM requirements'), sourceUrl:SRC.stem.url, sourceLabel:SRC.stem.label},
      {action:GG.T('持续累计失业天数，STEM 期间上限 150 天','Keep tracking cumulative unemployment days — the limit during STEM is 150 days'),
       window:GG.T('整段 OPT+STEM 累计','Accumulated across the entire OPT+STEM period'),
       consequence:GG.T('累计失业超过 150 天将失去身份','Exceeding 150 cumulative unemployment days means losing status'), sourceUrl:SRC.dhs.url, sourceLabel:SRC.dhs.label}
    ],
    risks:[
      {label:GG.T('H-1B 抽签不确定','H-1B lottery uncertainty'), meaning:GG.T('抽不中需要其它衔接路径','If not selected, you need another transition path'), hedge:GG.T('提前评估 cap-gap、多年/多雇主抽签策略','Evaluate cap-gap and multi-year / multi-employer lottery strategies early')},
      {label:GG.T('H-1B 成本上升','Rising H-1B costs'), meaning:GG.T('雇主担保意愿可能受费用影响','Fees may dampen employer willingness to sponsor'), hedge:GG.T('尽早与雇主确认担保计划与时间表','Confirm the sponsorship plan and timeline with your employer early')}
    ],
    parentCard:{status:'yellow', line:GG.T('孩子身份状态：STEM 延期中，有临近的衔接节点','Student status: on STEM extension, with a transition milestone approaching'), nextMilestone:GG.T('关注 H-1B 抽签与 cap-gap 衔接安排','Watch the H-1B lottery and cap-gap transition arrangements')}
  },
  'h1b': {
    currentStage:'h1b',
    roadmap:[
      {action:GG.T('确保 H-1B 在 OPT 到期前被受理，以触发 cap-gap','Make sure the H-1B petition is received before OPT expires, to trigger cap-gap'),
       window:GG.T('当前 OPT 到期前递交并被受理','Filed and received before your current OPT expires'),
       consequence:GG.T('未及时受理将无法用 cap-gap 衔接，可能出现身份空档','If not received in time, cap-gap cannot bridge you and a status gap may open'), sourceUrl:SRC.h1b.url, sourceLabel:SRC.h1b.label},
      {action:GG.T('用 cap-gap 把工作/身份延续至 10/1 生效','Use cap-gap to extend work/status until the 10/1 start date'),
       window:GG.T('抽中后的春夏衔接期','The spring–summer bridge period after selection'),
       consequence:GG.T('若未中签或被拒，cap-gap 终止，须立即规划离境或转身份','If not selected or denied, cap-gap ends — plan departure or a change of status immediately'), sourceUrl:SRC.h1b.url, sourceLabel:SRC.h1b.label},
      {action:GG.T('与雇主的移民律师保持进度同步','Stay in sync with the employer\'s immigration attorney on progress'),
       window:GG.T('全程','Throughout'),
       consequence:GG.T('信息断层容易错过关键时间窗','Information gaps make it easy to miss critical windows'), sourceUrl:SRC.isss.url, sourceLabel:GG.T('与雇主移民律师核实','Verify with the employer\'s immigration attorney')}
    ],
    risks:[
      {label:GG.T('抽签结果不确定','Lottery outcome uncertain'), meaning:GG.T('未中签需要 Plan B（再读 / 换身份 / 海外远程）','If not selected you need a Plan B (further study / change of status / remote work abroad)'), hedge:GG.T('提前准备备选路径与对应时间线','Prepare backup paths and their timelines in advance')},
      {label:GG.T('SEVIS 记录无预警变动','Unannounced SEVIS record changes'), meaning:GG.T('记录异常可能影响身份连续性','Record anomalies can affect status continuity'), hedge:GG.T('保持 SEVIS 信息准确、与 ISSS 紧密沟通','Keep SEVIS information accurate and stay in close touch with ISSS')}
    ],
    parentCard:{status:'yellow', line:GG.T('孩子身份状态：H-1B 衔接中，需关注关键节点','Student status: in H-1B transition, key milestones need attention'), nextMilestone:GG.T('确认 H-1B 在 OPT 到期前被受理（cap-gap）','Confirm the H-1B is received before OPT expires (cap-gap)')}
  }
};

/* 关键词推断阶段（供自由输入的兜底 / 预填 profile 显式指定） */
function detectStage(text, struct){
  if(struct && struct.stage && STAGE_KEYS.includes(struct.stage)) return struct.stage;
  const t = (text||'').toLowerCase();
  if(/h-?1b|抽签|cap.?gap|抽 ?h/.test(t)) return 'h1b';
  if(/i-?983|stem ?opt|stem.*延期|延期.*24|24 ?个?月/.test(t)) return 'stem';
  if(/已激活|激活|失业|换工作|换了工作|在用|入职/.test(t)) return 'opt-active';
  if(/刚交|交了|递交.*opt|opt.*申请|申请.*opt|ead|没收到|未收到|i-?765/.test(t)) return 'opt-apply';
  if(/在读|在校|硕士|博士|明年|想了解|时间线|没毕业|快毕业/.test(t)) return 'f1';
  return 'f1';
}
function localEngine(text, struct){
  const stage = detectStage(text, struct);
  return JSON.parse(JSON.stringify(PLAYBOOK[stage]));   // 深拷贝，避免被 normalize 改动
}

/* ── 预填 profile（点一下直接进结果，降低冷启动）── */
const PRESETS = [
  {em:'🎓', stage:'f1',         text:GG.T('在读 STEM 硕士，明年毕业，想了解 OPT 时间线','Enrolled STEM master\'s student graduating next year — want to understand the OPT timeline')},
  {em:'💼', stage:'opt-active', text:GG.T('OPT 已激活 2 个月，刚换工作担心失业天数','OPT active for 2 months, just changed jobs and worried about unemployment days')},
  {em:'🎲', stage:'h1b',        text:GG.T('OPT 快到期，公司说要帮我抽 H-1B','OPT expiring soon — my company says it will enter me in the H-1B lottery')}
];

/* ════════════════════════════════════════════════════════════════════════
   System prompt（含示意规则 + 严格 JSON 契约 + 合规护栏）
   ════════════════════════════════════════════════════════════════════════ */
const SYS = [
  '你是「PING 留学生身份合规导航」：帮在美 F-1 中国留学生，把分散、吓人的身份合规信息，收敛成个性化、可验证、可决策的路线图。',
  '只输出严格 JSON（单个对象），不要 markdown 代码块、不要任何前言或解释文字。',
  'JSON 结构：',
  '{',
  '  "currentStage": "f1|opt-apply|opt-active|stem|h1b",  // 用户当前所处阶段，五选一',
  '  "roadmap": [        // 接下来必须做的 2-3 件事，按紧迫度排序',
  GG.T('    {"action": string,       // 做什么（简体中文）',
       '    {"action": string,       // what to do (in English)'),
  GG.T('     "window": string,       // 时间窗：什么时候，尽量相对用户情况（简体中文）',
       '     "window": string,       // timing window, relative to the user\'s situation where possible (in English)'),
  GG.T('     "consequence": string,  // 错过的后果 / 红线（简体中文，克制陈述、不渲染恐慌）',
       '     "consequence": string,  // consequence of missing it / red line (in English, stated calmly, no fear-mongering)'),
  '     "sourceUrl": string,    // 权威出处链接，优先 uscis.gov / ice.gov / studyinthestates.dhs.gov；给不出就留空字符串',
  GG.T('     "sourceLabel": string}  // 出处名称；无链接时写「向学校 ISSS 核实」',
       '     "sourceLabel": string}  // source name; if no link, write "Verify with your school ISSS"'),
  '  ],',
  '  "risks": [          // 2-3 条当前政策环境下与此 profile 相关的风险',
  GG.T('    {"label": string,    // 风险标签（简体中文）',
       '    {"label": string,    // risk label (in English)'),
  GG.T('     "meaning": string,  // 这对你意味着什么（简体中文）',
       '     "meaning": string,  // what it means for you (in English)'),
  GG.T('     "hedge": string}    // 你能做的对冲动作（简体中文）',
       '     "hedge": string}    // hedging action you can take (in English)'),
  '  ],',
  '  "parentCard": {     // 家长端「安心卡」，信息密度压到最低、不暴露敏感细节',
  '    "status": "green|yellow|red",  // green=在轨道上 yellow=有临近节点 red=需立即关注',
  GG.T('    "line": string,                // 一句话状态（简体中文）',
       '    "line": string,                // one-line status (in English)'),
  GG.T('    "nextMilestone": string        // 下一关键节点（简体中文）',
       '    "nextMilestone": string        // next key milestone (in English)'),
  '  }',
  '}',
  '内置示意规则（演示用，非法律意见，真实以官方为准）：',
  '- OPT 申请窗口：毕业前 90 天至毕业后 60 天；post-completion OPT 共 12 个月。',
  '- 标准 OPT 失业累计上限 90 天。',
  '- STEM 延期：需 STEM 学位 + E-Verify 雇主，+24 个月，须在 OPT 到期前递交；STEM 期间失业累计上限 150 天；须完成 I-983 与按期 SEVIS 上报。',
  '- H-1B cap-gap：OPT 到期前递交 H-1B 并被受理，可把工作/身份延至 10/1。',
  '- 2026 风险上下文：审查加强、签证可能撤销、H-1B 成本上升（仅作风险标签，不作断言）。',
  '硬规则：',
  '1) currentStage 必须是五个枚举值之一，并与 roadmap / parentCard 自洽。',
  GG.T('2) roadmap 每条都要有 action / window / consequence；尽量挂 uscis.gov / ice.gov / studyinthestates.dhs.gov 出处，给不出则 sourceUrl 留空、sourceLabel 写「向学校 ISSS 核实」。',
       '2) Every roadmap item needs action / window / consequence; cite uscis.gov / ice.gov / studyinthestates.dhs.gov where possible; otherwise leave sourceUrl empty and set sourceLabel to "Verify with your school ISSS".'),
  '3) 这是信息参考、不是法律建议；绝不声称替用户填表、提交或代办任何政府流程。',
  '4) consequence 用克制语气陈述红线，不要渲染恐慌。',
  GG.T('5) 全部文本用简体中文，移民术语保留英文（OPT / EAD / STEM / H-1B / SEVIS / I-765 / I-983）。',
       '5) Write all user-visible text fields in English; keep immigration terms as-is (OPT / EAD / STEM / H-1B / SEVIS / I-765 / I-983).')
].join('\n');

function buildUser(text, s){
  const extra = [];
  if(s.visa)  extra.push('签证类型：'+s.visa);
  if(s.stem)  extra.push('是否 STEM 学位：是');
  if(s.stage && s.stage!=='auto') extra.push('当前阶段：'+STAGE_LABEL[s.stage]);
  if(s.date)  extra.push('关键日期：'+s.date);
  return (text||'').trim() + (extra.length ? '\n\n补充信息：\n'+extra.join('\n') : '');
}

/* ── 规整 + 兜底 ── */
function normalize(d){
  d = d || {};
  const stage = STAGE_KEYS.includes(d.currentStage) ? d.currentStage : 'f1';
  const pc = d.parentCard || {};
  return {
    currentStage: stage,
    roadmap: Array.isArray(d.roadmap) ? d.roadmap.filter(x=>x&&x.action).map(x=>({
      action:String(x.action), window:x.window?String(x.window):'', consequence:x.consequence?String(x.consequence):'',
      sourceUrl:x.sourceUrl?String(x.sourceUrl):'', sourceLabel:x.sourceLabel?String(x.sourceLabel):GG.T('向学校 ISSS 核实','Verify with your school ISSS')
    })).slice(0,3) : [],
    risks: Array.isArray(d.risks) ? d.risks.filter(x=>x&&x.label).map(x=>({
      label:String(x.label), meaning:x.meaning?String(x.meaning):'', hedge:x.hedge?String(x.hedge):''
    })).slice(0,3) : [],
    parentCard: {
      status: STATUS[pc.status] ? pc.status : 'yellow',
      line: pc.line ? String(pc.line) : GG.T('孩子身份状态：已生成，请查看路线图','Student status: generated — see the roadmap'),
      nextMilestone: pc.nextMilestone ? String(pc.nextMilestone) : ''
    }
  };
}

/* ════════════════════════════════════════════════════════════════════════
   UI
   ════════════════════════════════════════════════════════════════════════ */
let main, taEl, resultMount, morePanel, struct;
function freshStruct(){ return {visa:'', stem:false, stage:'auto', date:''}; }

function disclaimerBanner(){
  return GG.el('div',{class:'pg-disc', html:
    GG.T('<b>信息参考，不构成法律建议。</b>请以官方来源（USCIS / ICE SEVP / DHS）及持证移民律师、学校 ISSS 为准。本工具不代填、不提交、不代办任何政府流程。',
         '<b>For information only — not legal advice.</b> Rely on official sources (USCIS / ICE SEVP / DHS), licensed immigration attorneys, and your school ISSS. This tool never fills out, submits, or handles any government process on your behalf.')});
}

function intro(){
  main = GG.mountShell(SLUG);
  struct = freshStruct();

  main.appendChild(GG.el('div',{class:'hero'},
    GG.el('h1', null, GG.T('把身份合规，收敛成一张能决策的图','Distill status compliance into one decision-ready picture')),
    GG.el('p',{class:'pg-lede'},
      GG.T('留学生的身份合规，散落在一堆吓人的官方页面里。用一句话描述你的情况，PING 立刻给你一张'+
      '<b>个性化路线图</b>（每条都标权威出处和「错过的后果」）+ 2026 政策风险雷达，'+
      '再一键生成给家长的「安心卡」。把判断的负担，从你身上卸下来。',
      'An international student\'s status compliance is scattered across a pile of intimidating official pages. Describe your situation in one sentence and PING instantly gives you a '+
      '<b>personalized roadmap</b> (each step tagged with an authoritative source and the consequence of missing it) + a 2026 policy risk radar, '+
      'plus a one-tap "peace-of-mind card" for your parents. We take the burden of judgment off your shoulders.')))
  );

  // 全局免责（屏 1 即可见）
  main.appendChild(disclaimerBanner());

  // 共享 AI 连接条
  main.appendChild(GG.llm.bar(()=>{}));

  // 自然语言输入
  taEl = GG.el('textarea',{class:'field', style:{minHeight:'92px'},
    placeholder:GG.T('用一句话描述你现在的身份情况，例如：我是 CS 硕士，今年 5 月毕业，刚交了 OPT 申请，还没收到 EAD',
                     'Describe your current status in one sentence, e.g.: I\'m a CS master\'s student graduating this May, I just filed my OPT application and haven\'t received the EAD yet')});
  main.appendChild(GG.el('div',{class:'pg-inwrap'}, taEl));

  // 预填 profile
  main.appendChild(GG.el('div',{class:'pg-eg-label'}, GG.T('懒得打字？点一个最像你的情况 ↓','Don\'t feel like typing? Pick the situation closest to yours ↓')));
  const ps = GG.el('div',{class:'pg-presets'});
  PRESETS.forEach(p=> ps.appendChild(
    GG.el('button',{class:'pg-preset', onClick:()=>{ taEl.value=p.text; run(p.text, {...freshStruct(), stage:p.stage}); }},
      GG.el('span',{class:'em'}, p.em), p.text)));
  main.appendChild(ps);

  // 可选结构化补充（折叠）
  const moreBtn = GG.el('button',{class:'pg-more-toggle', onClick:toggleMore}, GG.T('＋ 补充更精确的信息（可选）','+ Add more precise details (optional)'));
  main.appendChild(moreBtn);

  main.appendChild(GG.el('button',{class:'btn primary lg block pg-go',
    onClick:()=>run(taEl.value, struct)}, GG.T('🧭 生成我的合规路线图','🧭 Generate my compliance roadmap')));

  resultMount = GG.el('div'); main.appendChild(resultMount);
}

function toggleMore(e){
  if(morePanel){ morePanel.remove(); morePanel=null; e.target.textContent=GG.T('＋ 补充更精确的信息（可选）','+ Add more precise details (optional)'); return; }
  const stageSel = GG.el('select',{class:'field', onChange:ev=>struct.stage=ev.target.value},
    GG.el('option',{value:'auto'}, GG.T('自动判断','Auto-detect')),
    ...STAGES.map(s=>GG.el('option',{value:s.key}, s.label)));
  const visaSel = GG.el('select',{class:'field', onChange:ev=>struct.visa=ev.target.value},
    GG.el('option',{value:''}, GG.T('签证类型','Visa type')),
    GG.el('option',{value:'F-1'}, 'F-1'),
    GG.el('option',{value:'F-1 OPT'}, GG.T('F-1（OPT）','F-1 (OPT)')),
    GG.el('option',{value:'F-1 STEM OPT'}, GG.T('F-1（STEM OPT）','F-1 (STEM OPT)')));
  const stemChk = GG.el('label',{style:{fontSize:'13px',display:'flex',gap:'7px',alignItems:'center',color:'var(--ink-2)'}},
    GG.el('input',{type:'checkbox', onChange:ev=>struct.stem=ev.target.checked}), GG.T('是 STEM 学位','STEM degree'));
  const dateIn = GG.el('input',{class:'field', type:'date', onChange:ev=>struct.date=ev.target.value});
  morePanel = GG.el('div',{class:'pg-more'},
    GG.el('div',{class:'f'}, GG.el('label',null,GG.T('当前阶段','Current stage')), stageSel),
    GG.el('div',{class:'f'}, GG.el('label',null,GG.T('签证类型','Visa type')), visaSel),
    GG.el('div',{class:'f'}, GG.el('label',null,GG.T('关键日期（毕业 / OPT 到期）','Key date (graduation / OPT expiry)')), dateIn),
    GG.el('div',{class:'f'}, GG.el('label',null,GG.T('学位','Degree')), stemChk));
  e.target.after(morePanel);
  e.target.textContent=GG.T('－ 收起补充信息','- Hide extra details');
}

async function run(text, s){
  text = (text||'').trim();
  s = s || struct;
  if(!text){ GG.toast(GG.T('先用一句话描述你的情况，或点一个示例','First describe your situation in one sentence, or pick an example')); return; }

  GG.clear(resultMount);
  const stage = GG.el('div'); resultMount.appendChild(stage);
  stage.scrollIntoView({behavior:'smooth', block:'center'});

  // 未连接 AI → 走内置规则引擎（确定性兜底，永不白屏）
  if(!GG.llm.connected()){
    const data = normalize(localEngine(text, s));
    GG.clear(stage); stage.appendChild(renderResult(data, false));
    stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'12px'}},
      GG.el('p',{class:'pg-lede', style:{textAlign:'center', margin:'0 auto', fontSize:'13px'}},
        GG.T('👆 当前由内置示意规则引擎生成。点上方「连接 AI 升级」填一个 Anthropic Key，'+
        '即可用真实模型读懂你的自由描述、给更贴合的路线图。',
        '👆 Generated by the built-in sample rule engine. Click "Connect AI to upgrade" above and paste an Anthropic key '+
        'to have a real model read your free-form description and produce a better-fitting roadmap.'))));
    stage.scrollIntoView({behavior:'smooth', block:'start'});
    return;
  }

  const t = GG.thinking(stage, [GG.T('读懂你的身份情况…','Reading your status situation…'),GG.T('定位你在合规链上的位置…','Locating you on the compliance chain…'),GG.T('收敛成可决策的路线图…','Distilling a decision-ready roadmap…'),GG.T('核对权威出处与风险…','Checking authoritative sources and risks…')], 1900);
  let data;
  try{
    const [obj] = await Promise.all([GG.llm.json(SYS, buildUser(text, s), {model:'claude-sonnet-4-6', max_tokens:1300}), t]);
    data = normalize(obj);
    if(!data.roadmap.length) data = normalize(localEngine(text, s));   // 模型空返回也兜底
    GG.clear(stage); stage.appendChild(renderResult(data, true));
  }catch(err){
    GG.toast(GG.llm.errMsg(err));
    data = normalize(localEngine(text, s));
    GG.clear(stage); stage.appendChild(renderResult(data, false));
  }
  stage.scrollIntoView({behavior:'smooth', block:'start'});
}

/* ── 屏2：时间线状态机 ── */
function timeline(currentKey){
  const idx = STAGE_KEYS.indexOf(currentKey);
  const wrap = GG.el('div',{class:'pg-timeline'});
  STAGES.forEach((s,i)=>{
    const cls = i<idx ? 'done' : (i===idx ? 'on' : '');
    wrap.appendChild(GG.el('div',{class:'pg-stage '+cls},
      GG.el('div',{class:'dot'}), GG.el('div',{class:'lbl'}, s.label)));
  });
  return wrap;
}

/* ── 屏2：必须做的事 ── */
function stepCard(it, i){
  const card = GG.el('div',{class:'pg-step'});
  card.appendChild(GG.el('div',{class:'act'}, GG.el('span',{class:'pg-stepno'}, (i+1)+'.'), it.action));
  if(it.window) card.appendChild(GG.el('div',{class:'row win'},
    GG.el('span',{class:'ic'}, '🕒'), GG.el('span', null, it.window)));
  if(it.consequence) card.appendChild(GG.el('div',{class:'row cons'},
    GG.el('span',{class:'ic'}, '⚠️'), GG.el('span', null, [GG.el('b',null,GG.T('错过：','If missed:')), ' '+it.consequence])));
  const src = GG.el('div',{class:'src'});
  if(it.sourceUrl){
    src.appendChild(GG.el('a',{href:it.sourceUrl, target:'_blank', rel:'noopener'},
      '🔗 '+(it.sourceLabel||GG.T('官方出处','Official source'))+' ↗'));
  } else {
    src.appendChild(GG.el('span',{class:'noref'}, '· '+(it.sourceLabel||GG.T('向学校 ISSS 核实','Verify with your school ISSS'))));
  }
  card.appendChild(src);
  return card;
}

/* ── 屏3：风险雷达 ── */
function riskCard(r){
  const card = GG.el('div',{class:'pg-risk'});
  card.appendChild(GG.el('div',{class:'label'}, '📡 '+r.label));
  if(r.meaning) card.appendChild(GG.el('div',{class:'meaning'}, r.meaning));
  if(r.hedge) card.appendChild(GG.el('div',{class:'hedge'},
    GG.el('span',{class:'ic'}, '🛡️'), GG.el('span', null, [GG.el('b',null,GG.T('对冲：','Hedge:')), ' '+r.hedge])));
  return card;
}

/* ── 屏4：家长安心卡（可导出图片，不泄露细节）── */
function parentSpec(pc){
  const st = STATUS[pc.status];
  return {
    slug:SLUG, accent:st.color,
    title:GG.T('孩子身份状态：','Student status: ')+st.word,
    subtitle: pc.line,
    rows: pc.nextMilestone ? [{label:GG.T('下一关键节点','Next key milestone'), value:pc.nextMilestone}] : null,
    tags: [GG.T('由 PING 自动生成','Auto-generated by PING'),GG.T('孩子无需手动汇报','No manual reporting by your child')],
    footer:GG.T('PING 平安 · 留学生身份合规导航（信息参考，非法律建议）','PING · International student status compliance navigator (information only, not legal advice)')
  };
}
function parentCardView(pc){
  const st = STATUS[pc.status];
  const card = GG.el('div',{class:'pg-parent'});
  card.style.setProperty('--pc', st.color);   // 自定义属性须 setProperty，Object.assign(style,…) 不生效
  card.appendChild(GG.el('div',{class:'pg-pstatus'}, GG.el('span',{class:'d'}, st.dot), st.word));
  card.appendChild(GG.el('div',{class:'pg-pline'}, pc.line));
  if(pc.nextMilestone) card.appendChild(GG.el('div',{class:'pg-pmile'},
    GG.el('span', null, '📍'), GG.el('span', null, [GG.el('b',null,GG.T('下一关键节点：','Next key milestone:')), ' '+pc.nextMilestone])));
  card.appendChild(GG.el('div',{class:'pg-pfoot'}, GG.T('由 PING 自动生成，孩子无需手动汇报','Auto-generated by PING — no manual reporting by your child')));

  let cache=null; const getCard=()=> cache || (cache = GG.shareCard(parentSpec(pc)));
  card.appendChild(GG.el('div',{class:'pg-pacts'},
    GG.el('button',{class:'btn primary', onClick:()=>GG.downloadCanvas(getCard(), GG.T('PING-安心卡','PING-peace-of-mind-card'))}, GG.T('⬇️ 导出安心卡','⬇️ Export the card')),
    GG.el('button',{class:'btn', onClick:()=>GG.copyCanvas(getCard())}, GG.T('📷 复制图片','📷 Copy image'))));
  return card;
}

function renderResult(d, fromAI){
  const box = GG.el('div');
  const card = GG.el('div',{class:'card pad result'});
  card.appendChild(GG.llm.badge(fromAI));

  // 屏2
  card.appendChild(GG.el('div',{class:'pg-sec-h'}, GG.T('① 你的合规路线图','① Your compliance roadmap')));
  card.appendChild(GG.el('p',{class:'pg-sec-sub'},
    GG.T('你现在在这里（高亮）。下面是接下来必须做的事，每条都标了时间窗、错过的后果和可点击的官方出处。',
         'You are here (highlighted). Below are the things you must do next, each tagged with a timing window, the consequence of missing it, and a clickable official source.')));
  card.appendChild(timeline(d.currentStage));
  d.roadmap.forEach((it,i)=> card.appendChild(stepCard(it,i)));

  // 屏3
  card.appendChild(GG.el('div',{class:'pg-sec-h'}, GG.T('② 2026 政策风险雷达','② 2026 policy risk radar')));
  card.appendChild(GG.el('div',{class:'pg-radar-note'},
    GG.T('本雷达为演示用，反映截至 demo 构建时的公开信息；政策变动频繁，一切以官方为准。',
         'This radar is for demo purposes and reflects public information as of the demo build; policies change often — official sources always prevail.')));
  d.risks.forEach(r=> card.appendChild(riskCard(r)));

  // 屏4
  card.appendChild(GG.el('div',{class:'pg-sec-h'}, GG.T('③ 给家长的安心卡','③ A peace-of-mind card for your parents')));
  card.appendChild(GG.el('p',{class:'pg-sec-sub'},
    GG.T('一张只看状态、不看细节的卡片。截图发给家长——他们要的是「安心」，不是一堆术语。',
         'A card that shows status only, no details. Screenshot it and send it to your parents — what they want is peace of mind, not a pile of jargon.')));
  card.appendChild(parentCardView(d.parentCard));

  // 底部免责（每屏可见）
  card.appendChild(disclaimerBanner());
  box.appendChild(card);

  box.appendChild(GG.el('div',{class:'pg-restart'},
    GG.el('button',{class:'btn', onClick:()=>{ GG.clear(resultMount); taEl.focus();
      taEl.scrollIntoView({behavior:'smooth',block:'center'}); }}, GG.T('↻ 换一种情况再试','↻ Try another situation'))));
  return box;
}

/* ── 开发自检钩子（无 key 时验证渲染层）── */
window.PING_DEV = {
  render: (stage)=>{ GG.clear(resultMount);
    resultMount.appendChild(renderResult(normalize(PLAYBOOK[stage]||PLAYBOOK['opt-active']), false)); },
  detect: detectStage, localEngine, normalize, PLAYBOOK
};

intro();
})();
