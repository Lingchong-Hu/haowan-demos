/* origin — 财务体检 的输入字段定义 + 文案库（纯静态，无外部依赖） */
window.ORIGIN = {
  // 表单字段：key 用于引擎计算，所有值都是「元」或「个月」或「岁」
  FIELDS: [
    {key:'income',   label:'税后月收入',        unit:'元',   ph:'例：18000',  hint:'到手工资 + 稳定副业'},
    {key:'expense',  label:'月固定支出',        unit:'元',   ph:'例：11000',  hint:'房租/房贷、吃住、通勤、订阅等'},
    {key:'savings',  label:'可动用存款',        unit:'元',   ph:'例：60000',  hint:'活期 + 货币基金等能随时取出的钱'},
    {key:'debt',     label:'负债总额',          unit:'元',   ph:'例：120000', hint:'房贷/车贷/信用卡/花呗等本金合计'},
    {key:'emFund',   label:'应急金够撑几个月',  unit:'个月', ph:'例：2',      hint:'存款能覆盖几个月的固定支出'},
    {key:'age',      label:'年龄',              unit:'岁',   ph:'例：29',     hint:'用于参考同龄人基准'},
  ],

  // 分项维度的展示名（用于条形图与分享卡）
  DIM_LABEL: {
    savingRate: '储蓄率',
    debtRatio:  '负债比',
    emergency:  '应急金',
    spendRatio: '支出占比',
  },

  // 总分的定性评级
  GRADES: [
    {min:85, tag:'体质优秀', desc:'财务地基很稳，能扛住意外，可以开始想增值的事了。'},
    {min:70, tag:'整体健康', desc:'底子不错，补齐一两个短板就能更从容。'},
    {min:55, tag:'亚健康',   desc:'勉强转得动，但抗风险能力偏弱，有明显短板要补。'},
    {min:40, tag:'需要调理', desc:'现金流和负债都吃紧，建议尽快做减法。'},
    {min:0,  tag:'亮红灯',   desc:'结构性风险较高，先稳住现金流、控住负债是当务之急。'},
  ],
};
