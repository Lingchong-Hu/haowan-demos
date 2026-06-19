/* gamma — 数据：幻灯片原型序列 + 占位图（inline SVG）生成参数。
   原型用 {topic} 占位；gamma.js 注入主题后生成 ≥5 页 deck。
   占位图全部用纯 SVG 形状/色块现画，无任何外部图片。 */
(function(){
window.GAMMA = {

  /* 配色梯队：不同主题→不同色板（按主题 hash 选一组），每页轮用其中颜色 */
  PALETTES: [
    ['#6a5cf0','#8d7bff','#b9b0ff','#3b2fb0'],   // 紫（默认 accent 家族）
    ['#2e9e7b','#46c79c','#a8e6cf','#1c6b52'],   // 绿
    ['#e0773a','#f2a05a','#ffd2a8','#a8521f'],   // 橙
    ['#2f8fd4','#5cb0ef','#bfe0f7','#1d5e94'],   // 蓝
    ['#c2569b','#e07fc0','#f5c2e4','#8a2f6b'],   // 品红
  ],

  /* 占位图「种类」：每种用一套几何形状现画，gamma.js 据 kind + 配色绘制 */
  ART_KINDS: ['cover','grid','flow','bars','pie','rings','timeline','wave','stack','spark'],

  /* 幻灯片原型序列：>8 种，gamma.js 取前若干 + 必含封面/结语，保证 ≥5 页。
     title / points 里的 {topic} 会被替换为用户主题。
     art = 占位图种类。kicker = 页眉小标。 */
  PROTOTYPES: [
    { id:'cover', kicker:'封面', art:'cover',
      title:'{topic}',
      sub:'一份由 AI 即时排版的演示稿',
      points:[] },

    { id:'agenda', kicker:'议程', art:'grid',
      title:'今天我们要讲什么',
      points:[
        '为什么「{topic}」现在值得关注',
        '核心问题与机会',
        '我们的方案与工作原理',
        '收益、路线图与下一步' ] },

    { id:'why', kicker:'背景', art:'wave',
      title:'为什么是「{topic}」',
      points:[
        '需求正在快速变化，旧做法跟不上',
        '围绕「{topic}」的期待越来越高',
        '早一步行动 = 更大的先发优势' ] },

    { id:'problem', kicker:'问题', art:'bars',
      title:'当下的三道坎',
      points:[
        '信息分散，缺一个统一的「{topic}」视角',
        '人工处理慢、易出错、难复用',
        '决策缺乏可量化的依据' ] },

    { id:'solution', kicker:'方案', art:'rings',
      title:'我们的解法',
      points:[
        '把「{topic}」拆成可执行的模块',
        '用自动化承接重复劳动',
        '关键节点保留人来把关' ] },

    { id:'how', kicker:'工作原理', art:'flow',
      title:'它是怎么跑起来的',
      points:[
        '输入：围绕「{topic}」的原始素材',
        '处理：解析 → 结构化 → 生成',
        '输出：可直接用的成果与建议' ] },

    { id:'benefit', kicker:'收益', art:'spark',
      title:'你会得到什么',
      points:[
        '效率：把「{topic}」相关耗时压缩一大截',
        '质量：结果更一致、更可追溯',
        '成本：少返工，资源用在刀刃上' ] },

    { id:'metric', kicker:'数据', art:'pie',
      title:'用数字说话',
      points:[
        '关键指标围绕「{topic}」全面向好',
        '试点阶段已看到正向反馈',
        '可衡量、可复盘、可持续优化' ] },

    { id:'case', kicker:'案例', art:'stack',
      title:'一个典型场景',
      points:[
        '某团队把「{topic}」接入日常流程',
        '上手当天就跑通了第一版',
        '两周后成为团队默认做法' ] },

    { id:'roadmap', kicker:'路线图', art:'timeline',
      title:'接下来的节奏',
      points:[
        '近期：打磨「{topic}」核心体验',
        '中期：扩展场景与集成',
        '远期：沉淀为可复用的能力' ] },

    { id:'closing', kicker:'结语', art:'cover',
      title:'让「{topic}」就此启程',
      sub:'谢谢观看 · 欢迎一起把它做成',
      points:[] },
  ],
};
})();
