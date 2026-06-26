/* whips 数据：DECK = 用来学口味的滑动卡；CATALOG = 用来精配的候选车。
   属性维度：body(车型) size(尺寸) vibe(气质) power(动力) price(定位)
   加厚字段：range(价格区间，用于预算现实感) · scene(场景一句话，让滑动有情绪)
   CATALOG 每台带 caveat(诚实短板)——决策简报里"买它之前注意"用。
   DECK 前 6 张(d1~d6)是固定的"多样化种子"，覆盖运动/电动/越野/家用/玩乐/通勤，
   先拿到基线信号；之后由 whips.js 自适应发牌，专攻你还没想好的那根轴。 */
window.WHIPS = {
  DECK: [
    { id:'d1',  name:'都市小钢炮',   color:'#e8543f', body:'掀背', size:'小型', vibe:'运动', power:'燃油', price:'主流', range:'13–17 万', scene:'红绿灯起步，第一个窜出去的总是你。', blurb:'红得发烫的两厢小车，弯道里最贴地。' },
    { id:'d2',  name:'静音电动轿跑', color:'#2f5fae', body:'轿车', size:'中型', vibe:'极简', power:'纯电', price:'高端', range:'28–35 万', scene:'关上门，世界一下安静下来。',     blurb:'一块大屏管一切，安静到能听见心跳。' },
    { id:'d3',  name:'方盒子硬派越野', color:'#3b7d4f', body:'SUV', size:'大型', vibe:'硬派', power:'燃油', price:'高端', range:'35–50 万', scene:'导航尽头没有路的时候，它最来劲。', blurb:'方头方脑，泥地雪地才是主场。' },
    { id:'d4',  name:'居家七座 MPV', color:'#6a6f7a', body:'MPV', size:'大型', vibe:'居家', power:'混动', price:'主流', range:'25–33 万', scene:'二胎、爸妈、露营装备，一趟全装下。', blurb:'移动的客厅，后排能翘脚。' },
    { id:'d5',  name:'复古敞篷',     color:'#d99a2b', body:'跑车', size:'小型', vibe:'复古', power:'燃油', price:'豪华', range:'45 万 +',  scene:'周末山路，风从发间穿过。',       blurb:'圆灯、皮座椅，纯粹的周末玩具。' },
    { id:'d6',  name:'城市通勤纯电', color:'#3aa6a0', body:'掀背', size:'小型', vibe:'极简', power:'纯电', price:'经济', range:'10–14 万', scene:'一周一充，停车缝里也塞得进。',     blurb:'养车几乎零成本的城市小可爱。' },
    { id:'d7',  name:'轿跑 SUV',     color:'#8a5cc2', body:'SUV', size:'中型', vibe:'运动', power:'混动', price:'高端', range:'26–34 万', scene:'又想坐得高，又不想认怂。',       blurb:'溜背造型 + 高坐姿，又帅又能装。' },
    { id:'d8',  name:'豪华行政轿车', color:'#1f1f28', body:'轿车', size:'大型', vibe:'优雅', power:'混动', price:'豪华', range:'50 万 +',  scene:'后排，是你谈生意的底气。',       blurb:'安静、平顺、有面子的老板位。' },
    { id:'d9',  name:'硬核皮卡',     color:'#9c5a2b', body:'皮卡', size:'大型', vibe:'硬派', power:'燃油', price:'主流', range:'18–28 万', scene:'工地和露营地，它都不挑。',       blurb:'后斗能拉能装，工作玩乐两不误。' },
    { id:'d10', name:'优雅旅行车',   color:'#4a6f8a', body:'旅行车', size:'中型', vibe:'优雅', power:'燃油', price:'主流', range:'20–28 万', scene:'低调，但懂的人一眼看得出。',   blurb:'气质与装载力的平衡点，长途巡航最舒服。' },
    { id:'d11', name:'紧凑家用 SUV', color:'#c2569b', body:'SUV', size:'紧凑', vibe:'居家', power:'混动', price:'经济', range:'12–17 万', scene:'人生第一台车，省心比什么都强。', blurb:'省油好停、空间够用，家庭友好。' },
    { id:'d12', name:'极速电动超跑', color:'#e0a020', body:'跑车', size:'中型', vibe:'运动', power:'纯电', price:'豪华', range:'60 万 +',  scene:'两秒破百，红绿灯无人能及。',     blurb:'电门即咆哮，弹射起步推背。' },
    { id:'d13', name:'科技大六座纯电SUV', color:'#7a6cf0', body:'SUV', size:'大型', vibe:'极简', power:'纯电', price:'高端', range:'30–40 万', scene:'全家的大沙发，还带最新的屏。', blurb:'空间、智能、零油费，奶爸的科技梦。' },
    { id:'d14', name:'经济家用轿车', color:'#5aaa6a', body:'轿车', size:'紧凑', vibe:'居家', power:'燃油', price:'经济', range:'9–13 万',  scene:'皮实好养，开十年也不闹脾气。',   blurb:'通勤通家的老实人，预算第一选择。' }
  ],
  // 精配候选库（结果从这里选；命名与牌堆略有不同，避免"原样镜像"）
  CATALOG: [
    { id:'c1',  name:'飞驰 GT 掀背',    color:'#e8543f', body:'掀背', size:'紧凑', vibe:'运动', power:'燃油', price:'主流', range:'14–18 万', blurb:'热血两厢，弯道里最贴地的那个。',   caveat:'市区油耗偏高、悬架偏硬，舒适让位给操控。' },
    { id:'c2',  name:'静界 7 纯电轿车', color:'#2f5fae', body:'轿车', size:'中型', vibe:'极简', power:'纯电', price:'高端', range:'27–34 万', blurb:'极简座舱 + 长续航，安静到极致。',   caveat:'冬季续航打折，长途要提前规划补能。' },
    { id:'c3',  name:'磐石 X 硬派 SUV', color:'#3b7d4f', body:'SUV', size:'大型', vibe:'硬派', power:'燃油', price:'高端', range:'36–52 万', blurb:'非承载车身，越野能力拉满。',       caveat:'油耗高、市区笨重，停车找位费劲。' },
    { id:'c4',  name:'阖家 M9 混动 MPV', color:'#6a6f7a', body:'MPV', size:'大型', vibe:'居家', power:'混动', price:'主流', range:'26–34 万', blurb:'六座独立 + 超低油耗，全家神器。', caveat:'车长考验车位，转弯掉头要适应。' },
    { id:'c5',  name:'风尚 Spider 敞篷', color:'#d99a2b', body:'跑车', size:'小型', vibe:'复古', power:'燃油', price:'豪华', range:'48 万 +',  blurb:'复古线条双门敞篷，为快乐而生。',   caveat:'后排形同虚设，雨雪天娇气、实用性低。' },
    { id:'c6',  name:'微光 mini 纯电',  color:'#3aa6a0', body:'掀背', size:'小型', vibe:'极简', power:'纯电', price:'经济', range:'9–13 万',  blurb:'城市代步小可爱，养车近乎零成本。', caveat:'空间小、跑长途吃力，高速底气不足。' },
    { id:'c7',  name:'锐影 Coupe SUV',  color:'#8a5cc2', body:'SUV', size:'中型', vibe:'运动', power:'混动', price:'高端', range:'27–35 万', blurb:'轿跑姿态的混动 SUV，帅与实用兼得。', caveat:'溜背牺牲后排头部空间和后备箱高度。' },
    { id:'c8',  name:'御座 L 行政轿车', color:'#1f1f28', body:'轿车', size:'大型', vibe:'优雅', power:'混动', price:'豪华', range:'52 万 +',  blurb:'后排航空座椅，商务接待第一选择。', caveat:'落地税费高，三年保值率一般。' },
    { id:'c9',  name:'拓野 King 皮卡',  color:'#9c5a2b', body:'皮卡', size:'大型', vibe:'硬派', power:'燃油', price:'主流', range:'18–28 万', blurb:'能拉能扛的全能皮卡，玩乐工作两宜。', caveat:'部分城市限行/限高，市区停车不便。' },
    { id:'c10', name:'雅程 Tourer 旅行车', color:'#4a6f8a', body:'旅行车', size:'中型', vibe:'优雅', power:'燃油', price:'主流', range:'21–29 万', blurb:'旅行车造型，气质与装载的平衡点。', caveat:'小众车型，二手流通慢、保值偏弱。' },
    { id:'c11', name:'安家 Pro 紧凑 SUV', color:'#c2569b', body:'SUV', size:'紧凑', vibe:'居家', power:'混动', price:'经济', range:'12–17 万', blurb:'省心耐用、空间灵活，新手家庭友好。', caveat:'高速动力和隔音一般，长途略乏力。' },
    { id:'c12', name:'闪电 R 电动超跑', color:'#e0a020', body:'跑车', size:'中型', vibe:'运动', power:'纯电', price:'豪华', range:'60 万 +',  blurb:'弹射起步推背感，电门即引擎咆哮。', caveat:'价高、两座实用性低，长途充电焦虑。' },
    { id:'c13', name:'悠然 e 家用轿车', color:'#5aaa6a', body:'轿车', size:'紧凑', vibe:'居家', power:'混动', price:'经济', range:'11–15 万', blurb:'省油好养、皮实可靠的老实人。',     caveat:'配置朴素、驾驶乐趣少，主打一个安稳。' },
    { id:'c14', name:'凌云 GT 电动猎装', color:'#7a6cf0', body:'掀背', size:'中型', vibe:'运动', power:'纯电', price:'高端', range:'28–36 万', blurb:'猎装造型 + 电动性能，小众有腔调。', caveat:'猎装小众，保值与维修网点偏少。' },
    { id:'c15', name:'阔野 7 纯电 SUV', color:'#3f8fb0', body:'SUV', size:'大型', vibe:'极简', power:'纯电', price:'高端', range:'30–40 万', blurb:'大六座 + 智能座舱，零油费的全家车。', caveat:'块头大，城市停车与补能都要提前规划。' }
  ]
};
