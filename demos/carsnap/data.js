/* carsnap 数据 —— 答题荐车。自建，不依赖 whips。
   QUESTIONS：5 道单选题，每个选项带：
     - 直接约束/偏好：budget（价位上限档）、bodyPref、energyPref、seatNeed
     - axes：在 5 个需求轴上的权重 {经济,空间,操控,舒适,通过性,智能,续航}
   CARS：12 台，每台带 priceTier/body/seats/energy + axes 评分(0~5) + strengths 标签 + blurb + 简笔 SVG 颜色。
   引擎：把答案的 axes 累加成"需求画像" → 对每台车按 axes 点积 + 硬偏好加成打分。
*/
(function(){

// 价位档：1=15万内 2=15~25万 3=25~40万 4=40万+
const QUESTIONS = [
  {
    id:'budget', q:'预算大概在哪一档？',
    options:[
      {key:'b1', label:'15 万以内 · 务实代步', budget:1, axes:{经济:3, 智能:1}},
      {key:'b2', label:'15~25 万 · 主流家用', budget:2, axes:{经济:1, 舒适:1, 智能:1}},
      {key:'b3', label:'25~40 万 · 想要点品质', budget:3, axes:{舒适:2, 操控:1, 智能:1}},
      {key:'b4', label:'40 万以上 · 预算充足', budget:4, axes:{舒适:2, 操控:2, 智能:2}},
    ]
  },
  {
    id:'use', q:'主要拿来干嘛？',
    options:[
      {key:'u1', label:'城市通勤代步为主', axes:{经济:3, 智能:1}},
      {key:'u2', label:'家庭出行 · 接送一家人', bodyPref:'SUV', axes:{空间:3, 舒适:2}},
      {key:'u3', label:'长途自驾 / 偶尔越野', bodyPref:'SUV', axes:{通过性:3, 续航:2, 空间:1}},
      {key:'u4', label:'就想开着爽 · 驾驶乐趣', axes:{操控:3, 舒适:1}},
    ]
  },
  {
    id:'seat', q:'平时要坐几个人？',
    options:[
      {key:'s1', label:'1~2 人 · 基本自己开', seatNeed:2, axes:{操控:1, 经济:1}},
      {key:'s2', label:'4~5 人 · 标准小家庭', seatNeed:5, axes:{舒适:1}},
      {key:'s3', label:'6~7 人 · 三代同堂 / 娃多', seatNeed:7, bodyPref:'MPV', axes:{空间:3, 舒适:1}},
    ]
  },
  {
    id:'energy', q:'能源偏好？',
    options:[
      {key:'e1', label:'纯电 · 接受充电', energyPref:'纯电', axes:{智能:2, 经济:1}},
      {key:'e2', label:'混动 · 又省又没里程焦虑', energyPref:'混动', axes:{经济:2, 续航:2}},
      {key:'e3', label:'燃油 · 省心好加油', energyPref:'燃油', axes:{续航:2, 通过性:1}},
      {key:'e4', label:'都行 · 看车定', axes:{}},
    ]
  },
  {
    id:'care', q:'最看重哪一点？',
    options:[
      {key:'c1', label:'省钱 · 油耗 / 保养便宜', axes:{经济:3}},
      {key:'c2', label:'空间大 · 装人装货', axes:{空间:3}},
      {key:'c3', label:'乘坐舒适 · 安静柔顺', axes:{舒适:3}},
      {key:'c4', label:'智能科技 · 大屏 / 辅助驾驶', axes:{智能:3}},
      {key:'c5', label:'开起来有劲 · 好开', axes:{操控:3}},
    ]
  },
];

// axes 顺序固定，便于点积
const AXES = ['经济','空间','操控','舒适','通过性','智能','续航'];

// 车目录。axes 为该车在各轴的"满足能力"0~5。
const CARS = [
  { name:'飞度风行 1.5L', body:'两厢', seats:5, energy:'燃油', priceTier:1, color:'#e6534a',
    strengths:['省油','灵活','便宜养'],
    axes:{经济:5, 空间:2, 操控:3, 舒适:2, 通过性:1, 智能:1, 续航:4},
    blurb:'小型车里的空间魔术师，市区穿梭灵巧，养车成本极低。' },

  { name:'轩朗 1.5T', body:'轿车', seats:5, energy:'燃油', priceTier:1, color:'#4a7fe6',
    strengths:['经济','省心','好开'],
    axes:{经济:4, 空间:3, 操控:3, 舒适:3, 通过性:1, 智能:2, 续航:4},
    blurb:'紧凑家轿标杆，油耗低、保值省心，新手友好。' },

  { name:'瀚电 EV 标准版', body:'两厢', seats:5, energy:'纯电', priceTier:1, color:'#2fa890',
    strengths:['代步电车','便宜','智能小屏'],
    axes:{经济:5, 空间:2, 操控:3, 舒适:2, 通过性:1, 智能:3, 续航:2},
    blurb:'城市通勤纯电小车，电费几分钱一公里，停车也省心。' },

  { name:'宋远 PLUS DM-i', body:'SUV', seats:5, energy:'混动', priceTier:2, color:'#d9772b',
    strengths:['超省油','空间够','没里程焦虑'],
    axes:{经济:5, 空间:4, 操控:3, 舒适:3, 通过性:3, 智能:3, 续航:5},
    blurb:'插混家用 SUV 顶流，亏电油耗低、纯电短途通勤，长途加油就走。' },

  { name:'途岳锐 2.0T', body:'SUV', seats:5, energy:'燃油', priceTier:2, color:'#7a6cd4',
    strengths:['空间大','通过性','可靠'],
    axes:{经济:3, 空间:4, 操控:3, 舒适:4, 通过性:4, 智能:2, 续航:4},
    blurb:'扎实的合资燃油 SUV，底盘稳、空间够，适合家用兼偶尔野路。' },

  { name:'凯睿 2.0L 双擎', body:'轿车', seats:5, energy:'混动', priceTier:2, color:'#3aa0c9',
    strengths:['省油','舒适静谧','耐用'],
    axes:{经济:5, 空间:3, 操控:3, 舒适:4, 通过性:1, 智能:3, 续航:5},
    blurb:'中级混动轿车，安静顺滑、油耗惊人，省心耐造的家用之选。' },

  { name:'极氪 ZX 长续航', body:'SUV', seats:5, energy:'纯电', priceTier:3, color:'#2f6fe6',
    strengths:['长续航','智能强','加速猛'],
    axes:{经济:3, 空间:4, 操控:4, 舒适:4, 通过性:2, 智能:5, 续航:4},
    blurb:'高智能纯电 SUV，大屏 + 辅助驾驶拉满，加速爽快、续航扎实。' },

  { name:'领程 06 2.0T', body:'轿车', seats:5, energy:'燃油', priceTier:3, color:'#c94a6b',
    strengths:['操控好','运动','质感'],
    axes:{经济:2, 空间:3, 操控:5, 舒适:4, 通过性:1, 智能:3, 续航:4},
    blurb:'偏运动的中级轿车，底盘扎实、转向跟手，要驾驶乐趣选它。' },

  { name:'格越 MAX', body:'MPV', seats:7, energy:'混动', priceTier:3, color:'#5a8f3a',
    strengths:['七座大空间','舒适','省油'],
    axes:{经济:4, 空间:5, 操控:2, 舒适:5, 通过性:2, 智能:3, 续航:5},
    blurb:'插混七座 MPV，三排都好坐、二排能躺，多人长途的舒适担当。' },

  { name:'拓野 4.0 越野版', body:'SUV', seats:5, energy:'燃油', priceTier:3, color:'#8a6a3a',
    strengths:['硬派越野','通过性强','可靠'],
    axes:{经济:1, 空间:4, 操控:3, 舒适:3, 通过性:5, 智能:2, 续航:5},
    blurb:'硬派越野 SUV，四驱 + 高底盘，烂路林道都能闯，自驾远征首选。' },

  { name:'星耀 7 纯电旗舰', body:'轿车', seats:5, energy:'纯电', priceTier:4, color:'#6c4ad4',
    strengths:['豪华舒适','智能旗舰','静谧'],
    axes:{经济:3, 空间:4, 操控:4, 舒适:5, 通过性:1, 智能:5, 续航:4},
    blurb:'纯电豪华旗舰轿车，零百加速强、座舱安静豪华、智能配置顶格。' },

  { name:'瑞驰 X7 大六座', body:'SUV', seats:6, energy:'混动', priceTier:4, color:'#b8852a',
    strengths:['六座','豪华舒适','长续航'],
    axes:{经济:3, 空间:5, 操控:3, 舒适:5, 通过性:3, 智能:4, 续航:5},
    blurb:'大六座插混 SUV，二排独立座椅 + 冰箱彩电，全家长途的顶级享受。' },
];

window.CARSNAP = { QUESTIONS, AXES, CARS };
})();
