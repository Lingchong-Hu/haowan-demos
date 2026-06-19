/* whips 数据：DECK = 用来学口味的滑动卡；CATALOG = 用来精配的候选车。
   属性维度：body(车型) size(尺寸) vibe(气质) power(动力) price(定位) */
window.WHIPS = {
  // 学口味的牌堆（固定顺序，所有人滑同一副牌，差异来自各自的选择）
  DECK: [
    { id:'d1',  name:'都市小钢炮', color:'#e8543f', body:'掀背', size:'小型', vibe:'运动', power:'燃油', price:'主流', blurb:'红得发烫的两厢小车，红绿灯起步最爱抢跑。' },
    { id:'d2',  name:'静音电动轿跑', color:'#2f5fae', body:'轿车', size:'中型', vibe:'极简', power:'纯电', price:'高端', blurb:'关上门世界安静，一块大屏管一切。' },
    { id:'d3',  name:'方盒子硬派越野', color:'#3b7d4f', body:'SUV', size:'大型', vibe:'硬派', power:'燃油', price:'高端', blurb:'方头方脑，泥地和雪地才是它的主场。' },
    { id:'d4',  name:'居家七座 MPV', color:'#6a6f7a', body:'MPV', size:'大型', vibe:'居家', power:'混动', price:'主流', blurb:'二胎家庭的移动客厅，后排能翘脚。' },
    { id:'d5',  name:'复古敞篷', color:'#d99a2b', body:'跑车', size:'小型', vibe:'复古', power:'燃油', price:'豪华', blurb:'圆灯、皮座椅、风从发间穿过的周末玩具。' },
    { id:'d6',  name:'城市通勤纯电', color:'#3aa6a0', body:'掀背', size:'小型', vibe:'极简', power:'纯电', price:'经济', blurb:'一周一充，停车缝里也能塞进去。' },
    { id:'d7',  name:'轿跑 SUV', color:'#8a5cc2', body:'SUV', size:'中型', vibe:'运动', power:'混动', price:'高端', blurb:'溜背造型 + 高坐姿，又帅又能装。' },
    { id:'d8',  name:'豪华行政轿车', color:'#1f1f28', body:'轿车', size:'大型', vibe:'优雅', power:'混动', price:'豪华', blurb:'后排老板位，安静、平顺、有面子。' },
    { id:'d9',  name:'硬核皮卡', color:'#9c5a2b', body:'皮卡', size:'大型', vibe:'硬派', power:'燃油', price:'主流', blurb:'后斗能拉能装，工地露营两不误。' },
    { id:'d10', name:'优雅旅行轿车', color:'#4a6f8a', body:'轿车', size:'中型', vibe:'优雅', power:'燃油', price:'主流', blurb:'低调有气质，长途巡航最舒服。' },
    { id:'d11', name:'紧凑家用 SUV', color:'#c2569b', body:'SUV', size:'紧凑', vibe:'居家', power:'混动', price:'经济', blurb:'省油好停、空间够用，家庭第一台车。' },
    { id:'d12', name:'极速电动超跑', color:'#e0a020', body:'跑车', size:'中型', vibe:'运动', power:'纯电', price:'豪华', blurb:'两秒破百，红绿灯无人能及。' },
  ],
  // 精配候选库（结果从这里选）
  CATALOG: [
    { id:'c1',  name:'飞驰 GT-R 掀背', color:'#e8543f', body:'掀背', size:'紧凑', vibe:'运动', power:'燃油', price:'主流', blurb:'热血两厢，弯道里最贴地的那个。' },
    { id:'c2',  name:'静界 7 纯电轿车', color:'#2f5fae', body:'轿车', size:'中型', vibe:'极简', power:'纯电', price:'高端', blurb:'极简座舱 + 长续航，安静到能听见心跳。' },
    { id:'c3',  name:'磐石 X 硬派 SUV', color:'#3b7d4f', body:'SUV', size:'大型', vibe:'硬派', power:'燃油', price:'高端', blurb:'非承载车身，越野能力拉满。' },
    { id:'c4',  name:'阖家 M9 混动 MPV', color:'#6a6f7a', body:'MPV', size:'大型', vibe:'居家', power:'混动', price:'主流', blurb:'六座独立 + 超低油耗，全家出行神器。' },
    { id:'c5',  name:'风尚 Spider 敞篷', color:'#d99a2b', body:'跑车', size:'小型', vibe:'复古', power:'燃油', price:'豪华', blurb:'复古线条的双门敞篷，纯粹为快乐而生。' },
    { id:'c6',  name:'微光 mini 纯电', color:'#3aa6a0', body:'掀背', size:'小型', vibe:'极简', power:'纯电', price:'经济', blurb:'城市代步小可爱，养车几乎零成本。' },
    { id:'c7',  name:'锐影 Coupe SUV', color:'#8a5cc2', body:'SUV', size:'中型', vibe:'运动', power:'混动', price:'高端', blurb:'轿跑姿态的混动 SUV，帅与实用兼得。' },
    { id:'c8',  name:'御座 L 行政轿车', color:'#1f1f28', body:'轿车', size:'大型', vibe:'优雅', power:'混动', price:'豪华', blurb:'后排航空座椅，商务接待第一选择。' },
    { id:'c9',  name:'拓野 King 皮卡', color:'#9c5a2b', body:'皮卡', size:'大型', vibe:'硬派', power:'燃油', price:'主流', blurb:'能拉能扛的全能皮卡，玩乐工作两相宜。' },
    { id:'c10', name:'雅程 Tourer 旅行车', color:'#4a6f8a', body:'轿车', size:'中型', vibe:'优雅', power:'燃油', price:'主流', blurb:'旅行车造型，气质与装载力的平衡点。' },
    { id:'c11', name:'安家 Pro 紧凑 SUV', color:'#c2569b', body:'SUV', size:'紧凑', vibe:'居家', power:'混动', price:'经济', blurb:'省心耐用、空间灵活，新手家庭友好。' },
    { id:'c12', name:'闪电 R 电动超跑', color:'#e0a020', body:'跑车', size:'中型', vibe:'运动', power:'纯电', price:'豪华', blurb:'弹射起步推背感，电门即是引擎咆哮。' },
    { id:'c13', name:'悠然 e 家用轿车', color:'#5aaa6a', body:'轿车', size:'紧凑', vibe:'居家', power:'混动', price:'经济', blurb:'省油好养、皮实可靠，通勤通家的老实人。' },
    { id:'c14', name:'凌云 GT 电动猎装', color:'#7a6cf0', body:'掀背', size:'中型', vibe:'运动', power:'纯电', price:'高端', blurb:'猎装造型 + 电动性能，小众又有腔调。' },
  ]
};
