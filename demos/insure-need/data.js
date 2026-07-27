/* insure-need — 静态文案/选项数据。纯本地，无网络。 */
window.INSURE = {
  // 险种说明（用于结果卡推荐文案）
  PRODUCTS: {
    life:    { key:'life',    name:GG.T('定期寿险','Term life'), desc:GG.T('身故/全残赔付，专为家庭顶梁柱兜底，杠杆最高、最便宜。','Pays out on death or total disability — the cheapest, highest-leverage backstop for a family breadwinner.') },
    ci:      { key:'ci',      name:GG.T('重疾险','Critical illness'),   desc:GG.T('确诊即赔一笔钱，用于治疗与收入中断的弥补。','Pays a lump sum on diagnosis, to cover treatment and lost income.') },
    medical: { key:'medical', name:GG.T('百万医疗险','High-limit medical'), desc:GG.T('报销大额住院/手术费，每年几百元、保额数百万。','Reimburses major hospitalization/surgery bills — a few hundred yuan a year for millions in coverage.') },
    accident:{ key:'accident',name:GG.T('意外险','Accident'),   desc:GG.T('意外身故伤残与意外医疗，保费极低、人人可配。','Covers accidental death/disability and accident medical costs — extremely cheap, worth having for everyone.') },
  },
  // 优先级标签
  PRIO: { must:GG.T('必配','Must-have'), strong:GG.T('建议','Recommended'), option:GG.T('可选','Optional'), skip:GG.T('暂不急','Not urgent') },
};
