/* fortuna — AI 财务管家 的数据/模型层（纯静态，无外部依赖）。
   设计：体检快照字段 + 风险意愿题 + 资产类别模型 + 风险等级 + 健康评级 + 目标模板。
   所有「市场假设」（预期年化 r、波动率 vol）都是用于演示的简化模型参数，非真实预测。 */
window.FORTUNA = {
  // 财务快照输入（元 / % / 岁）
  SNAPSHOT: [
    { key:'income',  label:'税后月收入',     unit:'元', ph:'例：20000',  hint:'到手工资 + 稳定副业' },
    { key:'expense', label:'月固定支出',     unit:'元', ph:'例：12000',  hint:'房贷房租、吃住、通勤、订阅等' },
    { key:'cash',    label:'流动存款',       unit:'元', ph:'例：80000',  hint:'活期 + 货币基金等可随时取用的钱' },
    { key:'invested',label:'已投资产',       unit:'元', ph:'例：150000', hint:'基金 / 股票 / 理财的当前市值，没有就填 0' },
    { key:'debt',    label:'负债总额',       unit:'元', ph:'例：200000', hint:'房贷 / 车贷 / 信用卡 / 消费贷本金合计' },
    { key:'debtApr', label:'负债平均年利率', unit:'%',  ph:'例：5',      hint:'多笔就估个加权值；纯房贷约 3~4，消费贷/信用卡可达 15+' },
    { key:'age',     label:'年龄',           unit:'岁', ph:'例：30',     hint:'用于评估风险承受能力与退休期限' },
  ],

  // 风险「意愿」题（2 题）。风险「能力」由年龄/期限/应急金/负债客观推算，不靠问卷。
  RISK_Q: [
    { id:'tolerance', label:'你的风险承受意愿', options:[
      { label:'只想保本，不能亏',   score:5 },
      { label:'可接受小幅波动',     score:35 },
      { label:'愿为收益担中等波动', score:65 },
      { label:'追高收益、扛得住大波动', score:95 } ] },
    { id:'reaction', label:'若组合一个月内跌 20%，你会', options:[
      { label:'立刻全部赎回',     score:5 },
      { label:'赎回一部分观望',   score:30 },
      { label:'继续持有等回本',   score:70 },
      { label:'加仓，是上车机会', score:100 } ] },
  ],

  // 四大类资产：r 预期年化、vol 年化波动率（用于蒙特卡洛）、color
  ASSETS: [
    { key:'stock', label:'股票 / 权益基金',   r:0.080, vol:0.180, color:'#1f9e8f' },
    { key:'alt',   label:'另类(黄金/REITs)',  r:0.050, vol:0.140, color:'#f0a830' },
    { key:'bond',  label:'债券基金',          r:0.035, vol:0.050, color:'#5b8def' },
    { key:'cash',  label:'货币 / 现金',       r:0.020, vol:0.006, color:'#b8bcc4' },
  ],

  // 风险等级（按 0~100 风险分分段，沿用中国基金风险 C1~C5 的叫法）
  LEVELS: [
    { min:0,  name:'保守型', tag:'C1', desc:'把波动降到最低，优先保住本金。' },
    { min:25, name:'稳健型', tag:'C2', desc:'债券打底，少量权益增厚收益。' },
    { min:45, name:'平衡型', tag:'C3', desc:'股债大致均衡，攻守兼备。' },
    { min:65, name:'成长型', tag:'C4', desc:'权益为主，承受波动换取增长。' },
    { min:82, name:'进取型', tag:'C5', desc:'高仓位权益，追求长期高回报。' },
  ],

  // 财务健康评级（总分 0~100）
  GRADES: [
    { min:85, tag:'体质优秀', desc:'财务地基很稳、扛得住意外，可以放心谈增值。' },
    { min:70, tag:'整体健康', desc:'底子不错，补齐一两个短板就更从容。' },
    { min:55, tag:'亚健康',   desc:'转得动但抗风险偏弱，有明显短板要补。' },
    { min:40, tag:'需要调理', desc:'现金流与负债吃紧，先做减法。' },
    { min:0,  tag:'亮红灯',   desc:'结构性风险较高，先稳现金流、控负债。' },
  ],

  // 目标模板（target/horizon 在 JS 里按快照算默认值，可被用户改）
  GOALS: [
    { key:'emergency', label:'应急储备', emoji:'🛟', desc:'先把抗风险的底盘打牢（货币基金即可）' },
    { key:'house',     label:'买房首付', emoji:'🏠', desc:'攒够一套房的首付' },
    { key:'edu',       label:'子女教育', emoji:'🎓', desc:'为孩子备一笔教育金' },
    { key:'retire',    label:'退休自由', emoji:'🌴', desc:'攒够能支撑退休的本金（按 4% 法则）' },
    { key:'grow',      label:'财富增值', emoji:'📈', desc:'让闲钱跑赢通胀、长期增值' },
  ],
};
