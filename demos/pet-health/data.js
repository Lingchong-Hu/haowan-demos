/* pet-health 数据：检查部位 + 本地 canvas 样图参数（参数不同→外观不同→真实像素读出不同指标） */
window.PETHEALTH = {
  // 两个检查部位
  PARTS: [
    { id:'eye',  label:'眼睛', emoji:'👁️', hint:'对准宠物的一只眼睛，看结膜是否发红、有无分泌物。' },
    { id:'skin', label:'皮肤', emoji:'🐕', hint:'拨开毛发，对准一小块皮肤，看有无红斑、皮屑或脱毛。' },
  ],

  // 本地样图：每个都用 canvas 现画，参数决定外观；分析时真实读这些像素
  // eye:  redness 越高结膜越红；discharge 眼角分泌物点数
  // skin: spots 红斑/斑点数；scale 皮屑程度；redness 底色泛红
  SAMPLES: {
    eye: [
      { id:'eye-mild',   label:'眼睛 · 轻微泛红', part:'eye',
        draw:{ redness:0.18, discharge:0, iris:'#5b3b1e' } },
      { id:'eye-red',    label:'眼睛 · 明显充血', part:'eye',
        draw:{ redness:0.62, discharge:2, iris:'#7a4a22' } },
    ],
    skin: [
      { id:'skin-clear', label:'皮肤 · 基本正常', part:'skin',
        draw:{ spots:1, scale:0.08, redness:0.10 } },
      { id:'skin-rash',  label:'皮肤 · 有红斑',   part:'skin',
        draw:{ spots:7, scale:0.30, redness:0.38 } },
    ],
  },

  // 观察项文案池：按指标命中范围给出（用于报告清单）
  OBS: {
    eye: {
      rednessLow:  '结膜颜色正常，未见明显充血',
      rednessMid:  '结膜轻度发红，建议持续观察 1~2 天',
      rednessHigh: '结膜明显充血发红，提示可能的炎症或刺激',
      dischargeNone:'眼周清洁，未见明显分泌物',
      dischargeSome:'眼角可见分泌物堆积，注意是否增多或变色',
    },
    skin: {
      rednessLow:  '皮肤底色均匀，未见大面积泛红',
      rednessHigh: '局部皮肤泛红，可能存在刺激或过敏',
      spotsLow:    '未见明显红斑或皮疹',
      spotsHigh:   '可见多处红斑/丘疹样斑点，注意是否瘙痒抓挠',
      scaleLow:    '毛发与皮屑情况正常',
      scaleHigh:   '皮屑偏多，建议留意是否干燥或寄生虫',
    },
  },

  // 就医建议三档（按健康分）
  TRIAGE: [
    { min:75, level:'在家观察', tone:'good', advice:'当前表现总体平稳，可在家继续观察并保持清洁；如症状加重或持续超过 2~3 天再就医。' },
    { min:50, level:'建议预约', tone:'warn', advice:'存在需要留意的迹象，建议近几天预约宠物医院做一次当面检查，以排除潜在问题。' },
    { min:0,  level:'尽快就诊', tone:'bad',  advice:'观察到较明显的异常迹象，建议尽快带宠物前往医院由兽医面诊，不要自行用药。' },
  ],
};
