/* pet-health 数据：检查部位 + 本地 canvas 样图参数（参数不同→外观不同→真实像素读出不同指标） */
window.PETHEALTH = {
  // 两个检查部位
  PARTS: [
    { id:'eye',  label:GG.T('眼睛','Eye'), emoji:'👁️', hint:GG.T('对准宠物的一只眼睛，看结膜是否发红、有无分泌物。','Aim at one of your pet\'s eyes and check the conjunctiva for redness or discharge.') },
    { id:'skin', label:GG.T('皮肤','Skin'), emoji:'🐕', hint:GG.T('拨开毛发，对准一小块皮肤，看有无红斑、皮屑或脱毛。','Part the fur and focus on a small patch of skin — look for red patches, dander, or hair loss.') },
  ],

  // 本地样图：每个都用 canvas 现画，参数决定外观；分析时真实读这些像素
  // eye:  redness 越高结膜越红；discharge 眼角分泌物点数
  // skin: spots 红斑/斑点数；scale 皮屑程度；redness 底色泛红
  SAMPLES: {
    eye: [
      { id:'eye-mild',   label:GG.T('眼睛 · 轻微泛红','Eye · Slight redness'), part:'eye',
        draw:{ redness:0.18, discharge:0, iris:'#5b3b1e' } },
      { id:'eye-red',    label:GG.T('眼睛 · 明显充血','Eye · Visibly bloodshot'), part:'eye',
        draw:{ redness:0.62, discharge:2, iris:'#7a4a22' } },
    ],
    skin: [
      { id:'skin-clear', label:GG.T('皮肤 · 基本正常','Skin · Mostly normal'), part:'skin',
        draw:{ spots:1, scale:0.08, redness:0.10 } },
      { id:'skin-rash',  label:GG.T('皮肤 · 有红斑','Skin · Red patches'),   part:'skin',
        draw:{ spots:7, scale:0.30, redness:0.38 } },
    ],
  },

  // 观察项文案池：按指标命中范围给出（用于报告清单）
  OBS: {
    eye: {
      rednessLow:  GG.T('结膜颜色正常，未见明显充血','Conjunctiva color looks normal, no visible redness'),
      rednessMid:  GG.T('结膜轻度发红，建议持续观察 1~2 天','Mild conjunctival redness — keep monitoring for 1–2 days'),
      rednessHigh: GG.T('结膜明显充血发红，提示可能的炎症或刺激','Marked conjunctival redness, suggesting possible inflammation or irritation'),
      dischargeNone:GG.T('眼周清洁，未见明显分泌物','Eye area is clean with no visible discharge'),
      dischargeSome:GG.T('眼角可见分泌物堆积，注意是否增多或变色','Discharge buildup at the eye corner — watch for increase or color change'),
    },
    skin: {
      rednessLow:  GG.T('皮肤底色均匀，未见大面积泛红','Skin tone is even, no widespread redness'),
      rednessHigh: GG.T('局部皮肤泛红，可能存在刺激或过敏','Localized skin redness — possible irritation or allergy'),
      spotsLow:    GG.T('未见明显红斑或皮疹','No obvious red patches or rash'),
      spotsHigh:   GG.T('可见多处红斑/丘疹样斑点，注意是否瘙痒抓挠','Multiple red or papule-like spots — watch for itching and scratching'),
      scaleLow:    GG.T('毛发与皮屑情况正常','Coat and dander look normal'),
      scaleHigh:   GG.T('皮屑偏多，建议留意是否干燥或寄生虫','Excess dander — check for dry skin or parasites'),
    },
  },

  // 就医建议三档（按健康分）
  TRIAGE: [
    { min:75, level:GG.T('在家观察','Monitor at home'), tone:'good', advice:GG.T('当前表现总体平稳，可在家继续观察并保持清洁；如症状加重或持续超过 2~3 天再就医。','Things look stable overall — keep monitoring at home and keep the area clean; see a vet if symptoms worsen or persist beyond 2–3 days.') },
    { min:50, level:GG.T('建议预约','Book a checkup'), tone:'warn', advice:GG.T('存在需要留意的迹象，建议近几天预约宠物医院做一次当面检查，以排除潜在问题。','There are signs worth watching — book an in-person exam at a vet clinic in the next few days to rule out underlying issues.') },
    { min:0,  level:GG.T('尽快就诊','See a vet soon'), tone:'bad',  advice:GG.T('观察到较明显的异常迹象，建议尽快带宠物前往医院由兽医面诊，不要自行用药。','Clear abnormal signs were observed — take your pet to a vet for an in-person exam as soon as possible, and do not medicate on your own.') },
  ],
};
