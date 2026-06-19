/* robo-core 数据：风险问卷 + 资产类别模型。全离线，无外部依赖。 */
window.ROBO = {
  // 单选题：每个选项带分值 score（0~100 区间贡献）。weight 为该题在总分里的权重。
  QUESTIONS: [
    {
      id: 'age', label: '你的年龄段', weight: 1.0, type: 'choice',
      options: [
        { label: '25 岁以下', score: 95 },
        { label: '25–35 岁', score: 80 },
        { label: '36–45 岁', score: 60 },
        { label: '46–55 岁', score: 38 },
        { label: '55 岁以上', score: 18 },
      ],
    },
    {
      id: 'horizon', label: '这笔钱计划投资多久', weight: 1.3, type: 'choice',
      options: [
        { label: '1 年内可能要用', score: 8 },
        { label: '1–3 年', score: 35 },
        { label: '3–5 年', score: 60 },
        { label: '5–10 年', score: 82 },
        { label: '10 年以上', score: 98 },
      ],
    },
    {
      id: 'tolerance', label: '你的风险承受能力', weight: 1.2, type: 'choice',
      options: [
        { label: '只想保本，不能亏', score: 5 },
        { label: '可接受小幅波动', score: 35 },
        { label: '愿为收益承担中等波动', score: 65 },
        { label: '追求高收益，能扛大波动', score: 95 },
      ],
    },
    {
      id: 'goal', label: '主要投资目标', weight: 0.9, type: 'choice',
      options: [
        { label: '养老 / 子女教育（稳）', score: 25 },
        { label: '稳健增值跑赢通胀', score: 55 },
        { label: '财富较快增长', score: 80 },
        { label: '激进博取超额收益', score: 98 },
      ],
    },
    {
      id: 'reaction', label: '若组合一个月内下跌 20%，你会', weight: 1.4, type: 'choice',
      options: [
        { label: '立刻全部赎回，受不了', score: 5 },
        { label: '赎回一部分先观望', score: 30 },
        { label: '继续持有，等它回来', score: 70 },
        { label: '加仓，这是上车机会', score: 100 },
      ],
    },
  ],

  // 四大资产类别：预期年化收益 r、波动率 vol（用于乐观/保守带宽）、颜色
  ASSETS: [
    { key: 'stock', label: '股票', r: 0.085, vol: 0.18, color: '#1f9e8f' },
    { key: 'alt',   label: '另类', r: 0.070, vol: 0.16, color: '#f0a830' },
    { key: 'bond',  label: '债券', r: 0.040, vol: 0.06, color: '#5b8def' },
    { key: 'cash',  label: '现金', r: 0.020, vol: 0.01, color: '#b8bcc4' },
  ],

  // 风险等级文案（按 0~100 总分分段）
  LEVELS: [
    { min: 0,  name: '保守型', tag: 'C1', desc: '把波动降到最低，优先保住本金。' },
    { min: 25, name: '稳健型', tag: 'C2', desc: '以债券打底，少量权益增厚收益。' },
    { min: 45, name: '平衡型', tag: 'C3', desc: '股债大致均衡，攻守兼备。' },
    { min: 65, name: '成长型', tag: 'C4', desc: '权益为主，承受波动换取增长。' },
    { min: 82, name: '进取型', tag: 'C5', desc: '高仓位权益，追求长期高回报。' },
  ],
};
