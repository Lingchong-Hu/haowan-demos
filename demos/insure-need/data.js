/* insure-need — 静态文案/选项数据。纯本地，无网络。 */
window.INSURE = {
  // 险种说明（用于结果卡推荐文案）
  PRODUCTS: {
    life:    { key:'life',    name:'定期寿险', desc:'身故/全残赔付，专为家庭顶梁柱兜底，杠杆最高、最便宜。' },
    ci:      { key:'ci',      name:'重疾险',   desc:'确诊即赔一笔钱，用于治疗与收入中断的弥补。' },
    medical: { key:'medical', name:'百万医疗险', desc:'报销大额住院/手术费，每年几百元、保额数百万。' },
    accident:{ key:'accident',name:'意外险',   desc:'意外身故伤残与意外医疗，保费极低、人人可配。' },
  },
  // 优先级标签
  PRIO: { must:'必配', strong:'建议', option:'可选', skip:'暂不急' },
};
