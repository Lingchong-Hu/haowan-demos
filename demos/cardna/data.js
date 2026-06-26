/* cardna 数据 —— 购车品味 DNA（真实车名版 · 扩充车库）
   DECK   : 滑动牌堆，采集“隐式品味”（你被什么吸引）
   CATALOG: 精配候选库，结果从这里选（带 seats / range / caveat）
   QUIZ   : 轻问卷，采集“显式约束 + 购买意图”

   ⚠ 车型与价位为「按市场普遍认知」的简化标签，用于演示推荐链路，非报价/选车依据。
   维度：body(车型) size(尺寸) vibe(气质) power(动力) price(定位档)
   定位档：经济≤15万 · 主流15–25万 · 高端25–40万 · 豪华40万+
   收录均为认知度高、口碑相对稳的主流车型。 */
window.CARDNA = {
  // ── 滑动牌堆：20 台，覆盖各价位/气质/动力；前 5 张是多样化种子 ──
  DECK: [
    { id:'d1',  name:'大众 高尔夫',     color:'#cc3333', body:'掀背', size:'紧凑', vibe:'运动', power:'燃油', price:'主流', range:'13–18 万', scene:'钢炮的入门券，红绿灯起步就上头。' },
    { id:'d2',  name:'特斯拉 Model 3',  color:'#2f3a4a', body:'轿车', size:'中型', vibe:'极简', power:'纯电', price:'高端', range:'24–28 万', scene:'上车像登录一台手机，安静得只剩胎噪。' },
    { id:'d3',  name:'坦克 300',        color:'#3b6b4a', body:'SUV', size:'中型', vibe:'硬派', power:'燃油', price:'主流', range:'20–28 万', scene:'方盒子往那一停，就想往没路的地方开。' },
    { id:'d4',  name:'别克 GL8',        color:'#5a6270', body:'MPV', size:'大型', vibe:'居家', power:'燃油', price:'主流', range:'23–35 万', scene:'中国家庭的移动客厅，老板和娃都坐得住。' },
    { id:'d5',  name:'马自达 MX-5',     color:'#d23b3b', body:'跑车', size:'小型', vibe:'复古', power:'燃油', price:'高端', range:'34–40 万', scene:'两个座、一块布顶，周末山路的纯粹快乐。' },
    { id:'d6',  name:'比亚迪 海鸥',     color:'#36a0a6', body:'掀背', size:'小型', vibe:'极简', power:'纯电', price:'经济', range:'8–11 万',  scene:'几万块的电动小可爱，市区代步零负担。' },
    { id:'d7',  name:'小米 SU7',        color:'#f06a3a', body:'轿车', size:'中型', vibe:'运动', power:'纯电', price:'主流', range:'22–30 万', scene:'颜值与性能拉满，年轻人的第一台电轿。' },
    { id:'d8',  name:'奔驰 E 级',       color:'#1f2228', body:'轿车', size:'大型', vibe:'优雅', power:'燃油', price:'豪华', range:'45–55 万', scene:'后排一坐，谈生意的底气就有了。' },
    { id:'d9',  name:'长城炮',          color:'#9c6b3b', body:'皮卡', size:'大型', vibe:'硬派', power:'燃油', price:'主流', range:'13–20 万', scene:'工地能拉货，周末能露营，一台顶俩。' },
    { id:'d10', name:'极氪 001',        color:'#1f7a8c', body:'旅行车', size:'中型', vibe:'运动', power:'纯电', price:'高端', range:'27–33 万', scene:'猎装的姿态 + 电门的暴力，小众又带感。' },
    { id:'d11', name:'比亚迪 宋PLUS DM-i', color:'#c2569b', body:'SUV', size:'紧凑', vibe:'居家', power:'混动', price:'经济', range:'14–17 万', scene:'国民家用 SUV，省油好养，第一台车稳。' },
    { id:'d12', name:'保时捷 911',      color:'#d9a520', body:'跑车', size:'小型', vibe:'运动', power:'燃油', price:'豪华', range:'130 万 +', scene:'圆灯一亮，几代人的跑车信仰。' },
    { id:'d13', name:'理想 L8',         color:'#3f8f7a', body:'SUV', size:'大型', vibe:'居家', power:'混动', price:'高端', range:'32–38 万', scene:'全家的大沙发，奶爸的科技梦。' },
    { id:'d14', name:'丰田 卡罗拉',     color:'#5aaa6a', body:'轿车', size:'紧凑', vibe:'居家', power:'混动', price:'经济', range:'12–16 万', scene:'开不坏的丰田，十年后还能卖个好价。' },
    { id:'d15', name:'本田 思域',       color:'#cc3a3a', body:'轿车', size:'紧凑', vibe:'运动', power:'燃油', price:'主流', range:'13–18 万', scene:'年轻人的运动入门，改装圈的常客。' },
    { id:'d16', name:'蔚来 ET5',        color:'#5b8def', body:'轿车', size:'中型', vibe:'优雅', power:'纯电', price:'高端', range:'30–36 万', scene:'换电五分钟满血，服务把你宠成 VIP。' },
    { id:'d17', name:'比亚迪 唐 DM-i',  color:'#7a4a3a', body:'SUV', size:'大型', vibe:'居家', power:'混动', price:'主流', range:'20–28 万', scene:'七座 + 低油耗，全家出行的性价比之选。' },
    { id:'d18', name:'路虎 卫士',       color:'#6b7a52', body:'SUV', size:'大型', vibe:'硬派', power:'燃油', price:'豪华', range:'75 万 +',  scene:'方正硬朗，城市与荒野通吃的英伦硬汉。' },
    { id:'d19', name:'丰田 赛那',       color:'#46607a', body:'MPV', size:'大型', vibe:'居家', power:'混动', price:'高端', range:'32–42 万', scene:'混动大 MPV，长途全家睡成一片也不慌。' },
    { id:'d20', name:'比亚迪 海豚',     color:'#39b0c0', body:'掀背', size:'小型', vibe:'极简', power:'纯电', price:'经济', range:'10–13 万', scene:'圆润可爱的小电掀，通勤代步刚刚好。' }
  ],

  // ── 精配候选库：覆盖各档/座位/动力，结果从这里选 ──
  CATALOG: [
    /* 经济 ≤15万 */
    { id:'e1',  name:'比亚迪 海鸥',       color:'#36a0a6', body:'掀背', size:'小型', vibe:'极简', power:'纯电', price:'经济', range:'8–11 万',  seats:4, caveat:'空间小、高速与长途底气不足。' },
    { id:'e2',  name:'比亚迪 海豚',       color:'#39b0c0', body:'掀背', size:'小型', vibe:'极简', power:'纯电', price:'经济', range:'10–13 万', seats:5, caveat:'高速续航打折、动力够用不亢奋。' },
    { id:'e3',  name:'丰田 卡罗拉双擎',   color:'#5aaa6a', body:'轿车', size:'紧凑', vibe:'居家', power:'混动', price:'经济', range:'13–16 万', seats:5, caveat:'配置朴素、驾驶平淡，胜在省心耐开。' },
    { id:'e4',  name:'大众 朗逸',         color:'#6a7480', body:'轿车', size:'紧凑', vibe:'居家', power:'燃油', price:'经济', range:'11–15 万', seats:5, caveat:'动力与配置平平，胜在皮实好养、保值稳。' },
    { id:'e5',  name:'比亚迪 秦PLUS DM-i', color:'#8a5cae', body:'轿车', size:'紧凑', vibe:'居家', power:'混动', price:'经济', range:'10–14 万', seats:5, caveat:'内饰塑料感、隔音一般，主打超低油耗。' },
    { id:'e6',  name:'本田 飞度',         color:'#e07a3a', body:'掀背', size:'小型', vibe:'运动', power:'燃油', price:'经济', range:'9–12 万',  seats:5, caveat:'隔音差、高级感欠，但空间魔术、改装潜力大。' },
    { id:'e7',  name:'比亚迪 宋PLUS DM-i', color:'#c2569b', body:'SUV', size:'紧凑', vibe:'居家', power:'混动', price:'经济', range:'14–17 万', seats:5, caveat:'高速隔音一般、内饰偏塑料感。' },
    { id:'e8',  name:'比亚迪 元PLUS',     color:'#3a8a9a', body:'SUV', size:'紧凑', vibe:'极简', power:'纯电', price:'经济', range:'12–16 万', seats:5, caveat:'高速能耗偏高、悬架偏软。' },
    { id:'e9',  name:'哈弗 H6',           color:'#7a6a5a', body:'SUV', size:'紧凑', vibe:'居家', power:'燃油', price:'经济', range:'13–18 万', seats:5, caveat:'油耗偏高、变速箱平顺度一般。' },
    { id:'e10', name:'长安 UNI-V',        color:'#b53a3a', body:'轿车', size:'紧凑', vibe:'运动', power:'燃油', price:'经济', range:'11–15 万', seats:5, caveat:'后排空间紧凑、长期保值一般。' },
    { id:'e11', name:'比亚迪 宋MAX DM-i', color:'#8a6fae', body:'MPV', size:'中型', vibe:'居家', power:'混动', price:'经济', range:'13–17 万', seats:6, caveat:'第三排偏局促、隔音一般。' },

    /* 主流 15–25万 */
    { id:'m1',  name:'大众 高尔夫',       color:'#cc3333', body:'掀背', size:'紧凑', vibe:'运动', power:'燃油', price:'主流', range:'13–18 万', seats:5, caveat:'后期小毛病、终端优惠后才香。' },
    { id:'m2',  name:'本田 思域',         color:'#cc3a3a', body:'轿车', size:'紧凑', vibe:'运动', power:'燃油', price:'主流', range:'13–18 万', seats:5, caveat:'后排与地板隔音一般、CVT 急加速偏肉。' },
    { id:'m3',  name:'马自达 昂克赛拉',   color:'#9a2f2f', body:'轿车', size:'紧凑', vibe:'运动', power:'燃油', price:'主流', range:'12–17 万', seats:5, caveat:'后排小、动力够用不够猛，胜在底盘质感。' },
    { id:'m4',  name:'比亚迪 汉 DM-i',    color:'#2f4f8a', body:'轿车', size:'中型', vibe:'优雅', power:'混动', price:'主流', range:'17–23 万', seats:5, caveat:'车机偶有卡顿、保值率一般。' },
    { id:'m5',  name:'比亚迪 海豹',       color:'#2f6a8a', body:'轿车', size:'中型', vibe:'运动', power:'纯电', price:'主流', range:'18–24 万', seats:5, caveat:'后排头部一般、底盘偏硬。' },
    { id:'m6',  name:'丰田 凯美瑞',       color:'#3a4a6a', body:'轿车', size:'中型', vibe:'优雅', power:'混动', price:'主流', range:'18–26 万', seats:5, caveat:'内饰与隔音偏保守，主打省心保值。' },
    { id:'m7',  name:'本田 雅阁',         color:'#3a5a4a', body:'轿车', size:'中型', vibe:'居家', power:'混动', price:'主流', range:'18–26 万', seats:5, caveat:'低速偶有顿挫，空间与油耗是强项。' },
    { id:'m8',  name:'丰田 RAV4 荣放双擎', color:'#3b7d6a', body:'SUV', size:'中型', vibe:'居家', power:'混动', price:'主流', range:'18–25 万', seats:5, caveat:'内饰廉价感、隔音一般。' },
    { id:'m9',  name:'本田 CR-V',         color:'#4a7a6a', body:'SUV', size:'中型', vibe:'居家', power:'混动', price:'主流', range:'18–25 万', seats:5, caveat:'隔音一般，可选七座但第三排偏鸡肋。' },
    { id:'m10', name:'大众 途观L',        color:'#5a6a7a', body:'SUV', size:'中型', vibe:'居家', power:'燃油', price:'主流', range:'20–26 万', seats:5, caveat:'油耗偏高、车机偏老旧。' },
    { id:'m11', name:'比亚迪 唐 DM-i',    color:'#7a4a3a', body:'SUV', size:'大型', vibe:'居家', power:'混动', price:'主流', range:'20–28 万', seats:7, caveat:'车重操控一般、第三排应急为主。' },
    { id:'m12', name:'小米 SU7',          color:'#f06a3a', body:'轿车', size:'中型', vibe:'运动', power:'纯电', price:'主流', range:'22–30 万', seats:5, caveat:'新品牌产能/售后待验、后排坐姿偏低。' },
    { id:'m13', name:'坦克 300',          color:'#3b6b4a', body:'SUV', size:'中型', vibe:'硬派', power:'燃油', price:'主流', range:'20–28 万', seats:5, caveat:'油耗高、城市笨重、停车费劲。' },
    { id:'m14', name:'长城炮',            color:'#9c6b3b', body:'皮卡', size:'大型', vibe:'硬派', power:'燃油', price:'主流', range:'13–20 万', seats:5, caveat:'部分城市限行/限高，舒适与油耗一般。' },
    { id:'m15', name:'别克 GL8',          color:'#5a6270', body:'MPV', size:'大型', vibe:'居家', power:'燃油', price:'主流', range:'23–35 万', seats:7, caveat:'油耗偏高、电气化滞后。' },

    /* 高端 25–40万 */
    { id:'h1',  name:'特斯拉 Model 3',    color:'#2f3a4a', body:'轿车', size:'中型', vibe:'极简', power:'纯电', price:'高端', range:'24–28 万', seats:5, caveat:'内饰极简到简陋、悬架偏硬、智驾需选装。' },
    { id:'h2',  name:'特斯拉 Model Y',    color:'#6a5acd', body:'SUV', size:'中型', vibe:'运动', power:'纯电', price:'高端', range:'26–35 万', seats:5, caveat:'悬架偏硬、内饰极简、智驾需选装。' },
    { id:'h3',  name:'小鹏 G6',           color:'#2f7a6a', body:'SUV', size:'中型', vibe:'运动', power:'纯电', price:'高端', range:'20–27 万', seats:5, caveat:'早期车机偶发 bug、品牌渠道较新。' },
    { id:'h4',  name:'理想 L7',           color:'#4a8a7a', body:'SUV', size:'大型', vibe:'居家', power:'混动', price:'高端', range:'30–37 万', seats:5, caveat:'亏电油耗回升、操控偏舒适、无纯电版。' },
    { id:'h5',  name:'理想 L8',           color:'#3f8f7a', body:'SUV', size:'大型', vibe:'居家', power:'混动', price:'高端', range:'32–38 万', seats:6, caveat:'亏电油耗回升、操控偏舒适不运动。' },
    { id:'h6',  name:'蔚来 ES6',          color:'#5b8def', body:'SUV', size:'中型', vibe:'优雅', power:'纯电', price:'高端', range:'33–40 万', seats:5, caveat:'补能依赖换电网络、保值率待观察。' },
    { id:'h7',  name:'蔚来 ET5',          color:'#4a7ad0', body:'轿车', size:'中型', vibe:'优雅', power:'纯电', price:'高端', range:'30–36 万', seats:5, caveat:'后排偏压抑、保值率待观察。' },
    { id:'h8',  name:'极氪 001',          color:'#1f7a8c', body:'旅行车', size:'中型', vibe:'运动', power:'纯电', price:'高端', range:'27–33 万', seats:5, caveat:'车长不好停、早期车机口碑一般。' },
    { id:'h9',  name:'极氪 007',          color:'#2f8a9c', body:'轿车', size:'中型', vibe:'运动', power:'纯电', price:'高端', range:'21–30 万', seats:5, caveat:'后排地台偏高、品牌较新。' },
    { id:'h10', name:'宝马 3 系',         color:'#2b4a8a', body:'轿车', size:'中型', vibe:'运动', power:'燃油', price:'高端', range:'30–36 万', seats:5, caveat:'低配减配明显、后期维保偏贵。' },
    { id:'h11', name:'奥迪 A4L',          color:'#3a3f4a', body:'轿车', size:'中型', vibe:'优雅', power:'燃油', price:'高端', range:'30–38 万', seats:5, caveat:'依赖终端大优惠、科技感稍显成熟。' },
    { id:'h12', name:'奔驰 C 级',         color:'#2a2d33', body:'轿车', size:'中型', vibe:'优雅', power:'燃油', price:'高端', range:'33–40 万', seats:5, caveat:'后排偏窄、小毛病与维保成本。' },
    { id:'h13', name:'沃尔沃 XC60',       color:'#46566a', body:'SUV', size:'中型', vibe:'优雅', power:'燃油', price:'高端', range:'35–45 万', seats:5, caveat:'动力调校保守、车机一般，主打安全与质感。' },
    { id:'h14', name:'问界 M7',           color:'#5a6a4a', body:'SUV', size:'大型', vibe:'居家', power:'混动', price:'高端', range:'28–37 万', seats:6, caveat:'满载动力偏肉、第三排应急为主。' },
    { id:'h15', name:'腾势 D9',           color:'#3a5a6a', body:'MPV', size:'大型', vibe:'优雅', power:'混动', price:'高端', range:'33–46 万', seats:7, caveat:'车长难停、价格不低。' },
    { id:'h16', name:'马自达 MX-5',       color:'#d23b3b', body:'跑车', size:'小型', vibe:'复古', power:'燃油', price:'高端', range:'34–40 万', seats:2, caveat:'后排几乎没有、实用性极低、雨雪天娇气。' },

    /* 豪华 40万+ */
    { id:'l1',  name:'奔驰 E 级',         color:'#1f2228', body:'轿车', size:'大型', vibe:'优雅', power:'燃油', price:'豪华', range:'45–55 万', seats:5, caveat:'落地税费高、三年保值率一般。' },
    { id:'l2',  name:'宝马 5 系',         color:'#23355f', body:'轿车', size:'大型', vibe:'优雅', power:'燃油', price:'豪华', range:'43–55 万', seats:5, caveat:'低配略寒酸、后期维保偏贵。' },
    { id:'l3',  name:'理想 L9',           color:'#4a5a6a', body:'SUV', size:'大型', vibe:'居家', power:'混动', price:'豪华', range:'43–46 万', seats:6, caveat:'体型大，城市停车与掉头吃力。' },
    { id:'l4',  name:'问界 M9',           color:'#4a5560', body:'SUV', size:'大型', vibe:'居家', power:'混动', price:'豪华', range:'47–57 万', seats:6, caveat:'车重大、补能与油耗看路况。' },
    { id:'l5',  name:'蔚来 ES8',          color:'#3a6ad0', body:'SUV', size:'大型', vibe:'优雅', power:'纯电', price:'豪华', range:'50 万 +',  seats:6, caveat:'电耗偏高、长途依赖换电。' },
    { id:'l6',  name:'保时捷 Macan',      color:'#b89020', body:'SUV', size:'中型', vibe:'运动', power:'燃油', price:'豪华', range:'60 万 +',  seats:5, caveat:'选装昂贵、后排与后备箱偏小。' },
    { id:'l7',  name:'保时捷 Taycan',     color:'#d9a520', body:'跑车', size:'中型', vibe:'运动', power:'纯电', price:'豪华', range:'90 万 +',  seats:4, caveat:'价格高、补能与续航焦虑、维保昂贵。' },
    { id:'l8',  name:'保时捷 911',        color:'#caa01c', body:'跑车', size:'小型', vibe:'运动', power:'燃油', price:'豪华', range:'130 万 +', seats:4, caveat:'后排是摆设、选装无底洞、日用不便。' },
    { id:'l9',  name:'路虎 卫士',         color:'#6b7a52', body:'SUV', size:'大型', vibe:'硬派', power:'燃油', price:'豪华', range:'75 万 +',  seats:5, caveat:'可靠性口碑有波动、油耗与维保高。' },
    { id:'l10', name:'奔驰 S 级',         color:'#15171c', body:'轿车', size:'大型', vibe:'优雅', power:'燃油', price:'豪华', range:'90 万 +',  seats:5, caveat:'落地与折旧惊人、电子件娇贵。' },
    { id:'l11', name:'丰田 赛那',         color:'#46607a', body:'MPV', size:'大型', vibe:'居家', power:'混动', price:'豪华', range:'32–42 万', seats:7, caveat:'终端常加价、操控偏船，胜在可靠省心。' },
    { id:'l12', name:'福特 Mustang',      color:'#b5402a', body:'跑车', size:'中型', vibe:'复古', power:'燃油', price:'豪华', range:'40–55 万', seats:4, caveat:'油耗高、后排狭小、内饰用料一般。' }
  ],

  // ── 轻问卷：显式约束 + 购买意图（意图分级是 B2B 数据价值的发动机） ──
  QUIZ: [
    { id:'budget', q:'买车预算大概在哪一档？', options:[
      { key:'a', label:'15 万以内',         cap:15,  bl:'≤15万' },
      { key:'b', label:'15–25 万',          cap:25,  bl:'15–25万' },
      { key:'c', label:'25–40 万',          cap:40,  bl:'25–40万' },
      { key:'d', label:'40–80 万',          cap:80,  bl:'40–80万' },
      { key:'e', label:'80 万以上 / 不封顶', cap:999, bl:'80万+' } ]},
    { id:'seats', q:'主要坐几个人 / 什么用途？', options:[
      { key:'a', label:'就我自己 / 两人，通勤代步', seat:2, use:'通勤' },
      { key:'b', label:'小两口 + 偶尔带人，主打玩乐', seat:2, use:'玩乐' },
      { key:'c', label:'一家三四口，日常家用',       seat:5, use:'家用' },
      { key:'d', label:'三代同堂 / 经常六七人',       seat:7, use:'多人' } ]},
    { id:'energy', q:'动力上更想要？', options:[
      { key:'a', label:'纯电，安静、零油费',           energy:'纯电' },
      { key:'b', label:'油电混动，省油又没续航焦虑',   energy:'混动' },
      { key:'c', label:'燃油，随加随走最省心',         energy:'燃油' },
      { key:'d', label:'都行，看车定',                 energy:null } ]},
    { id:'timeline', q:'大概什么时候会买？', options:[
      { key:'a', label:'就是看看、玩玩，暂时没计划', intent:0, intentLabel:'纯逛逛' },
      { key:'b', label:'半年内有可能',               intent:1, intentLabel:'半年内' },
      { key:'c', label:'3 个月内基本要定',           intent:2, intentLabel:'3个月内必入' } ]},
    { id:'first', q:'这会是你的第一台车吗？', options:[
      { key:'a', label:'是，人生第一台', first:true },
      { key:'b', label:'不是，增购 / 换车', first:false } ]}
  ]
};
