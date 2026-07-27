/* fortuna — AI 财务管家 的数据/模型层（纯静态，无外部依赖）。
   设计：体检快照字段 + 风险意愿题 + 资产类别模型 + 风险等级 + 健康评级 + 目标模板。
   所有「市场假设」（预期年化 r、波动率 vol）都是用于演示的简化模型参数，非真实预测。 */
window.FORTUNA = {
  // 财务快照输入（元 / % / 岁）
  SNAPSHOT: [
    { key:'income',  label:GG.T('税后月收入','Monthly income (after tax)'),     unit:GG.T('元','CNY'), ph:GG.T('例：20000','e.g. 20000'),  hint:GG.T('到手工资 + 稳定副业','Take-home pay + steady side income') },
    { key:'expense', label:GG.T('月固定支出','Monthly fixed expenses'),     unit:GG.T('元','CNY'), ph:GG.T('例：12000','e.g. 12000'),  hint:GG.T('房贷房租、吃住、通勤、订阅等','Mortgage/rent, food, commuting, subscriptions, etc.') },
    { key:'cash',    label:GG.T('流动存款','Liquid savings'),       unit:GG.T('元','CNY'), ph:GG.T('例：80000','e.g. 80000'),  hint:GG.T('活期 + 货币基金等可随时取用的钱','Checking + money-market funds you can tap anytime') },
    { key:'invested',label:GG.T('已投资产','Invested assets'),       unit:GG.T('元','CNY'), ph:GG.T('例：150000','e.g. 150000'), hint:GG.T('基金 / 股票 / 理财的当前市值，没有就填 0','Current market value of funds / stocks / wealth products — enter 0 if none') },
    { key:'debt',    label:GG.T('负债总额','Total debt'),       unit:GG.T('元','CNY'), ph:GG.T('例：200000','e.g. 200000'), hint:GG.T('房贷 / 车贷 / 信用卡 / 消费贷本金合计','Outstanding principal on mortgage / auto / credit cards / consumer loans') },
    { key:'debtApr', label:GG.T('负债平均年利率','Average debt APR'), unit:'%',  ph:GG.T('例：5','e.g. 5'),      hint:GG.T('多笔就估个加权值；纯房贷约 3~4，消费贷/信用卡可达 15+','Estimate a weighted average across loans; mortgages run ~3-4, consumer loans / credit cards can hit 15+') },
    { key:'age',     label:GG.T('年龄','Age'),           unit:GG.T('岁','yrs'), ph:GG.T('例：30','e.g. 30'),     hint:GG.T('用于评估风险承受能力与退休期限','Used to gauge risk capacity and the runway to retirement') },
  ],

  // 风险「意愿」题（2 题）。风险「能力」由年龄/期限/应急金/负债客观推算，不靠问卷。
  RISK_Q: [
    { id:'tolerance', label:GG.T('你的风险承受意愿','Your risk appetite'), options:[
      { label:GG.T('只想保本，不能亏','Preserve capital — no losses'),   score:5 },
      { label:GG.T('可接受小幅波动','OK with small swings'),     score:35 },
      { label:GG.T('愿为收益担中等波动','Accept moderate swings for returns'), score:65 },
      { label:GG.T('追高收益、扛得住大波动','Chase high returns, can stomach big drops'), score:95 } ] },
    { id:'reaction', label:GG.T('若组合一个月内跌 20%，你会','If the portfolio fell 20% in a month, you would'), options:[
      { label:GG.T('立刻全部赎回','Sell everything immediately'),     score:5 },
      { label:GG.T('赎回一部分观望','Sell part and wait it out'),   score:30 },
      { label:GG.T('继续持有等回本','Hold on until it recovers'),   score:70 },
      { label:GG.T('加仓，是上车机会','Buy more — a buying opportunity'), score:100 } ] },
  ],

  // 四大类资产：r 预期年化、vol 年化波动率（用于蒙特卡洛）、color
  ASSETS: [
    { key:'stock', label:GG.T('股票 / 权益基金','Stocks / equity funds'),   r:0.080, vol:0.180, color:'#1f9e8f' },
    { key:'alt',   label:GG.T('另类(黄金/REITs)','Alternatives (gold/REITs)'),  r:0.050, vol:0.140, color:'#f0a830' },
    { key:'bond',  label:GG.T('债券基金','Bond funds'),          r:0.035, vol:0.050, color:'#5b8def' },
    { key:'cash',  label:GG.T('货币 / 现金','Money market / cash'),       r:0.020, vol:0.006, color:'#b8bcc4' },
  ],

  // 风险等级（按 0~100 风险分分段，沿用中国基金风险 C1~C5 的叫法）
  LEVELS: [
    { min:0,  name:GG.T('保守型','Conservative'), tag:'C1', desc:GG.T('把波动降到最低，优先保住本金。','Minimize volatility; capital preservation comes first.') },
    { min:25, name:GG.T('稳健型','Cautious'), tag:'C2', desc:GG.T('债券打底，少量权益增厚收益。','A bond core with a small equity sleeve to boost returns.') },
    { min:45, name:GG.T('平衡型','Balanced'), tag:'C3', desc:GG.T('股债大致均衡，攻守兼备。','Roughly balanced stocks and bonds — offense and defense.') },
    { min:65, name:GG.T('成长型','Growth'), tag:'C4', desc:GG.T('权益为主，承受波动换取增长。','Equity-led; accept volatility in exchange for growth.') },
    { min:82, name:GG.T('进取型','Aggressive'), tag:'C5', desc:GG.T('高仓位权益，追求长期高回报。','High equity exposure, aiming for high long-term returns.') },
  ],

  // 财务健康评级（总分 0~100）
  GRADES: [
    { min:85, tag:GG.T('体质优秀','Excellent shape'), desc:GG.T('财务地基很稳、扛得住意外，可以放心谈增值。','Rock-solid foundations that can absorb shocks — ready to focus on growth.') },
    { min:70, tag:GG.T('整体健康','Healthy overall'), desc:GG.T('底子不错，补齐一两个短板就更从容。','Good fundamentals; patch one or two weak spots and you are set.') },
    { min:55, tag:GG.T('亚健康','Sub-healthy'),   desc:GG.T('转得动但抗风险偏弱，有明显短板要补。','Running fine but fragile to shocks — clear gaps to close.') },
    { min:40, tag:GG.T('需要调理','Needs work'), desc:GG.T('现金流与负债吃紧，先做减法。','Cash flow and debt are strained — cut back first.') },
    { min:0,  tag:GG.T('亮红灯','Red flags'),   desc:GG.T('结构性风险较高，先稳现金流、控负债。','Elevated structural risk — stabilize cash flow and rein in debt first.') },
  ],

  // 目标模板（target/horizon 在 JS 里按快照算默认值，可被用户改）
  GOALS: [
    { key:'emergency', label:GG.T('应急储备','Emergency fund'), emoji:'🛟', desc:GG.T('先把抗风险的底盘打牢（货币基金即可）','Build your safety base first (a money-market fund will do)') },
    { key:'house',     label:GG.T('买房首付','Home down payment'), emoji:'🏠', desc:GG.T('攒够一套房的首付','Save up the down payment on a home') },
    { key:'edu',       label:GG.T('子女教育','Kids\' education'), emoji:'🎓', desc:GG.T('为孩子备一笔教育金','Set aside an education fund for your kids') },
    { key:'retire',    label:GG.T('退休自由','Retire free'), emoji:'🌴', desc:GG.T('攒够能支撑退休的本金（按 4% 法则）','Save enough principal to retire on (per the 4% rule)') },
    { key:'grow',      label:GG.T('财富增值','Wealth growth'), emoji:'📈', desc:GG.T('让闲钱跑赢通胀、长期增值','Keep idle cash ahead of inflation and compounding long term') },
  ],
};
