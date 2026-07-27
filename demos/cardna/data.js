/* cardna 数据 —— 购车品味 DNA（真实车名版 · 扩充车库）
   DECK   : 滑动牌堆，采集“隐式品味”（你被什么吸引）
   CATALOG: 精配候选库，结果从这里选（带 seats / range / caveat）
   QUIZ   : 轻问卷，采集“显式约束 + 购买意图”

   ⚠ 车型与价位为「按市场普遍认知」的简化标签，用于演示推荐链路，非报价/选车依据。
   维度：body(车型) size(尺寸) vibe(气质) power(动力) price(定位档)
   定位档：经济≤15万 · 主流15–25万 · 高端25–40万 · 豪华40万+
   收录均为认知度高、口碑相对稳的主流车型。
   i18n 注：body/size/vibe/power/price/use/energy 为内部维度键（参与查表与比较），保持中文，显示层由 cardna.js 的 TV() 翻译；
           range 需被 priceK() 解析，保持中文，显示层由 rangeT() 翻译。 */
window.CARDNA = {
  // ── 滑动牌堆：20 台，覆盖各价位/气质/动力；前 5 张是多样化种子 ──
  DECK: [
    { id:'d1',  name:GG.T('大众 高尔夫','Volkswagen Golf'),     color:'#cc3333', body:'掀背', size:'紧凑', vibe:'运动', power:'燃油', price:'主流', range:'13–18 万', scene:GG.T('钢炮的入门券，红绿灯起步就上头。','Your ticket into hot hatches — addictive off every stoplight.') },
    { id:'d2',  name:GG.T('特斯拉 Model 3','Tesla Model 3'),  color:'#2f3a4a', body:'轿车', size:'中型', vibe:'极简', power:'纯电', price:'高端', range:'24–28 万', scene:GG.T('上车像登录一台手机，安静得只剩胎噪。','Getting in feels like logging into a phone — so quiet all you hear is the tires.') },
    { id:'d3',  name:GG.T('坦克 300','Tank 300'),        color:'#3b6b4a', body:'SUV', size:'中型', vibe:'硬派', power:'燃油', price:'主流', range:'20–28 万', scene:GG.T('方盒子往那一停，就想往没路的地方开。','Park the boxy thing anywhere and you itch to drive where roads end.') },
    { id:'d4',  name:GG.T('别克 GL8','Buick GL8'),        color:'#5a6270', body:'MPV', size:'大型', vibe:'居家', power:'燃油', price:'主流', range:'23–35 万', scene:GG.T('中国家庭的移动客厅，老板和娃都坐得住。',"China's living room on wheels — keeps the boss and the kids equally happy.") },
    { id:'d5',  name:GG.T('马自达 MX-5','Mazda MX-5'),     color:'#d23b3b', body:'跑车', size:'小型', vibe:'复古', power:'燃油', price:'高端', range:'34–40 万', scene:GG.T('两个座、一块布顶，周末山路的纯粹快乐。','Two seats, one cloth top — pure weekend joy on a mountain road.') },
    { id:'d6',  name:GG.T('比亚迪 海鸥','BYD Seagull'),     color:'#36a0a6', body:'掀背', size:'小型', vibe:'极简', power:'纯电', price:'经济', range:'8–11 万',  scene:GG.T('几万块的电动小可爱，市区代步零负担。','An adorable little EV for pocket change — zero-stress city runabout.') },
    { id:'d7',  name:GG.T('小米 SU7','Xiaomi SU7'),        color:'#f06a3a', body:'轿车', size:'中型', vibe:'运动', power:'纯电', price:'主流', range:'22–30 万', scene:GG.T('颜值与性能拉满，年轻人的第一台电轿。','Looks and performance dialed to max — a first electric sedan for the young.') },
    { id:'d8',  name:GG.T('奔驰 E 级','Mercedes-Benz E-Class'),       color:'#1f2228', body:'轿车', size:'大型', vibe:'优雅', power:'燃油', price:'豪华', range:'45–55 万', scene:GG.T('后排一坐，谈生意的底气就有了。','One seat in the back and you negotiate from strength.') },
    { id:'d9',  name:GG.T('长城炮','GWM Poer'),          color:'#9c6b3b', body:'皮卡', size:'大型', vibe:'硬派', power:'燃油', price:'主流', range:'13–20 万', scene:GG.T('工地能拉货，周末能露营，一台顶俩。','Hauls at the job site, camps on weekends — one truck doing two jobs.') },
    { id:'d10', name:GG.T('极氪 001','Zeekr 001'),        color:'#1f7a8c', body:'旅行车', size:'中型', vibe:'运动', power:'纯电', price:'高端', range:'27–33 万', scene:GG.T('猎装的姿态 + 电门的暴力，小众又带感。','Shooting-brake stance plus brutal EV torque — niche and very cool.') },
    { id:'d11', name:GG.T('比亚迪 宋PLUS DM-i','BYD Song Plus DM-i'), color:'#c2569b', body:'SUV', size:'紧凑', vibe:'居家', power:'混动', price:'经济', range:'14–17 万', scene:GG.T('国民家用 SUV，省油好养，第一台车稳。',"The nation's family SUV — thrifty, easy to own, a safe first car.") },
    { id:'d12', name:GG.T('保时捷 911','Porsche 911'),      color:'#d9a520', body:'跑车', size:'小型', vibe:'运动', power:'燃油', price:'豪华', range:'130 万 +', scene:GG.T('圆灯一亮，几代人的跑车信仰。','Those round lights come on, and generations of sports-car faith answer.') },
    { id:'d13', name:GG.T('理想 L8','Li Auto L8'),         color:'#3f8f7a', body:'SUV', size:'大型', vibe:'居家', power:'混动', price:'高端', range:'32–38 万', scene:GG.T('全家的大沙发，奶爸的科技梦。','A big sofa for the whole family, a tech dream for dads.') },
    { id:'d14', name:GG.T('丰田 卡罗拉','Toyota Corolla'),     color:'#5aaa6a', body:'轿车', size:'紧凑', vibe:'居家', power:'混动', price:'经济', range:'12–16 万', scene:GG.T('开不坏的丰田，十年后还能卖个好价。',"The Toyota that won't die — and still fetches good money ten years on.") },
    { id:'d15', name:GG.T('本田 思域','Honda Civic'),       color:'#cc3a3a', body:'轿车', size:'紧凑', vibe:'运动', power:'燃油', price:'主流', range:'13–18 万', scene:GG.T('年轻人的运动入门，改装圈的常客。',"A young driver's first taste of sporty — a regular in the tuning scene.") },
    { id:'d16', name:GG.T('蔚来 ET5','NIO ET5'),        color:'#5b8def', body:'轿车', size:'中型', vibe:'优雅', power:'纯电', price:'高端', range:'30–36 万', scene:GG.T('换电五分钟满血，服务把你宠成 VIP。','Five-minute battery swap to full — and service that pampers you like a VIP.') },
    { id:'d17', name:GG.T('比亚迪 唐 DM-i','BYD Tang DM-i'),  color:'#7a4a3a', body:'SUV', size:'大型', vibe:'居家', power:'混动', price:'主流', range:'20–28 万', scene:GG.T('七座 + 低油耗，全家出行的性价比之选。','Seven seats plus low fuel burn — the value pick for family trips.') },
    { id:'d18', name:GG.T('路虎 卫士','Land Rover Defender'),       color:'#6b7a52', body:'SUV', size:'大型', vibe:'硬派', power:'燃油', price:'豪华', range:'75 万 +',  scene:GG.T('方正硬朗，城市与荒野通吃的英伦硬汉。','Boxy and tough — a British bruiser at home in the city and the wild.') },
    { id:'d19', name:GG.T('丰田 赛那','Toyota Sienna'),       color:'#46607a', body:'MPV', size:'大型', vibe:'居家', power:'混动', price:'高端', range:'32–42 万', scene:GG.T('混动大 MPV，长途全家睡成一片也不慌。','A big hybrid MPV — the whole family can doze through the long haul.') },
    { id:'d20', name:GG.T('比亚迪 海豚','BYD Dolphin'),     color:'#39b0c0', body:'掀背', size:'小型', vibe:'极简', power:'纯电', price:'经济', range:'10–13 万', scene:GG.T('圆润可爱的小电掀，通勤代步刚刚好。','A round, cheerful little electric hatch — just right for the commute.') }
  ],

  // ── 精配候选库：覆盖各档/座位/动力，结果从这里选 ──
  CATALOG: [
    /* 经济 ≤15万 */
    { id:'e1',  name:GG.T('比亚迪 海鸥','BYD Seagull'),       color:'#36a0a6', body:'掀背', size:'小型', vibe:'极简', power:'纯电', price:'经济', range:'8–11 万',  seats:4, caveat:GG.T('空间小、高速与长途底气不足。','Tight on space; short on confidence at highway speeds and on long trips.') },
    { id:'e2',  name:GG.T('比亚迪 海豚','BYD Dolphin'),       color:'#39b0c0', body:'掀背', size:'小型', vibe:'极简', power:'纯电', price:'经济', range:'10–13 万', seats:5, caveat:GG.T('高速续航打折、动力够用不亢奋。','Range shrinks on the highway; power is adequate, never thrilling.') },
    { id:'e3',  name:GG.T('丰田 卡罗拉双擎','Toyota Corolla Hybrid'),   color:'#5aaa6a', body:'轿车', size:'紧凑', vibe:'居家', power:'混动', price:'经济', range:'13–16 万', seats:5, caveat:GG.T('配置朴素、驾驶平淡，胜在省心耐开。','Plain equipment, uneventful to drive — wins on worry-free durability.') },
    { id:'e4',  name:GG.T('大众 朗逸','Volkswagen Lavida'),         color:'#6a7480', body:'轿车', size:'紧凑', vibe:'居家', power:'燃油', price:'经济', range:'11–15 万', seats:5, caveat:GG.T('动力与配置平平，胜在皮实好养、保值稳。','Middling power and kit — wins on toughness, cheap upkeep, steady resale.') },
    { id:'e5',  name:GG.T('比亚迪 秦PLUS DM-i','BYD Qin Plus DM-i'), color:'#8a5cae', body:'轿车', size:'紧凑', vibe:'居家', power:'混动', price:'经济', range:'10–14 万', seats:5, caveat:GG.T('内饰塑料感、隔音一般，主打超低油耗。',"Plasticky cabin, so-so sound insulation — it's all about ultra-low fuel costs.") },
    { id:'e6',  name:GG.T('本田 飞度','Honda Fit'),         color:'#e07a3a', body:'掀背', size:'小型', vibe:'运动', power:'燃油', price:'经济', range:'9–12 万',  seats:5, caveat:GG.T('隔音差、高级感欠，但空间魔术、改装潜力大。','Noisy and short on polish, but a space wizard with big tuning potential.') },
    { id:'e7',  name:GG.T('比亚迪 宋PLUS DM-i','BYD Song Plus DM-i'), color:'#c2569b', body:'SUV', size:'紧凑', vibe:'居家', power:'混动', price:'经济', range:'14–17 万', seats:5, caveat:GG.T('高速隔音一般、内饰偏塑料感。','So-so highway insulation; cabin leans plasticky.') },
    { id:'e8',  name:GG.T('比亚迪 元PLUS','BYD Atto 3'),     color:'#3a8a9a', body:'SUV', size:'紧凑', vibe:'极简', power:'纯电', price:'经济', range:'12–16 万', seats:5, caveat:GG.T('高速能耗偏高、悬架偏软。','Thirsty at highway speeds; suspension on the soft side.') },
    { id:'e9',  name:GG.T('哈弗 H6','Haval H6'),           color:'#7a6a5a', body:'SUV', size:'紧凑', vibe:'居家', power:'燃油', price:'经济', range:'13–18 万', seats:5, caveat:GG.T('油耗偏高、变速箱平顺度一般。','Fuel economy runs high; gearbox smoothness is average.') },
    { id:'e10', name:GG.T('长安 UNI-V','Changan UNI-V'),        color:'#b53a3a', body:'轿车', size:'紧凑', vibe:'运动', power:'燃油', price:'经济', range:'11–15 万', seats:5, caveat:GG.T('后排空间紧凑、长期保值一般。','Tight rear seat; long-term resale is middling.') },
    { id:'e11', name:GG.T('比亚迪 宋MAX DM-i','BYD Song Max DM-i'), color:'#8a6fae', body:'MPV', size:'中型', vibe:'居家', power:'混动', price:'经济', range:'13–17 万', seats:6, caveat:GG.T('第三排偏局促、隔音一般。','Cramped third row; average sound insulation.') },

    /* 主流 15–25万 */
    { id:'m1',  name:GG.T('大众 高尔夫','Volkswagen Golf'),       color:'#cc3333', body:'掀背', size:'紧凑', vibe:'运动', power:'燃油', price:'主流', range:'13–18 万', seats:5, caveat:GG.T('后期小毛病、终端优惠后才香。','Minor gremlins with age; only a deal after dealer discounts.') },
    { id:'m2',  name:GG.T('本田 思域','Honda Civic'),         color:'#cc3a3a', body:'轿车', size:'紧凑', vibe:'运动', power:'燃油', price:'主流', range:'13–18 万', seats:5, caveat:GG.T('后排与地板隔音一般、CVT 急加速偏肉。','Average rear and floor insulation; the CVT feels doughy under hard acceleration.') },
    { id:'m3',  name:GG.T('马自达 昂克赛拉','Mazda3 Axela'),   color:'#9a2f2f', body:'轿车', size:'紧凑', vibe:'运动', power:'燃油', price:'主流', range:'12–17 万', seats:5, caveat:GG.T('后排小、动力够用不够猛，胜在底盘质感。','Small back seat, adequate-not-punchy power — wins on chassis feel.') },
    { id:'m4',  name:GG.T('比亚迪 汉 DM-i','BYD Han DM-i'),    color:'#2f4f8a', body:'轿车', size:'中型', vibe:'优雅', power:'混动', price:'主流', range:'17–23 万', seats:5, caveat:GG.T('车机偶有卡顿、保值率一般。','Infotainment stutters now and then; resale value is average.') },
    { id:'m5',  name:GG.T('比亚迪 海豹','BYD Seal'),       color:'#2f6a8a', body:'轿车', size:'中型', vibe:'运动', power:'纯电', price:'主流', range:'18–24 万', seats:5, caveat:GG.T('后排头部一般、底盘偏硬。','Average rear headroom; ride on the firm side.') },
    { id:'m6',  name:GG.T('丰田 凯美瑞','Toyota Camry'),       color:'#3a4a6a', body:'轿车', size:'中型', vibe:'优雅', power:'混动', price:'主流', range:'18–26 万', seats:5, caveat:GG.T('内饰与隔音偏保守，主打省心保值。',"Conservative cabin and insulation — it's about peace of mind and resale.") },
    { id:'m7',  name:GG.T('本田 雅阁','Honda Accord'),         color:'#3a5a4a', body:'轿车', size:'中型', vibe:'居家', power:'混动', price:'主流', range:'18–26 万', seats:5, caveat:GG.T('低速偶有顿挫，空间与油耗是强项。','Occasional low-speed jerkiness; space and fuel economy are the strong suits.') },
    { id:'m8',  name:GG.T('丰田 RAV4 荣放双擎','Toyota RAV4 Hybrid'), color:'#3b7d6a', body:'SUV', size:'中型', vibe:'居家', power:'混动', price:'主流', range:'18–25 万', seats:5, caveat:GG.T('内饰廉价感、隔音一般。','Cabin feels cheap; average sound insulation.') },
    { id:'m9',  name:GG.T('本田 CR-V','Honda CR-V'),         color:'#4a7a6a', body:'SUV', size:'中型', vibe:'居家', power:'混动', price:'主流', range:'18–25 万', seats:5, caveat:GG.T('隔音一般，可选七座但第三排偏鸡肋。','Average insulation; seven seats optional, but the third row is token.') },
    { id:'m10', name:GG.T('大众 途观L','Volkswagen Tiguan L'),        color:'#5a6a7a', body:'SUV', size:'中型', vibe:'居家', power:'燃油', price:'主流', range:'20–26 万', seats:5, caveat:GG.T('油耗偏高、车机偏老旧。','Thirsty, and the infotainment feels dated.') },
    { id:'m11', name:GG.T('比亚迪 唐 DM-i','BYD Tang DM-i'),    color:'#7a4a3a', body:'SUV', size:'大型', vibe:'居家', power:'混动', price:'主流', range:'20–28 万', seats:7, caveat:GG.T('车重操控一般、第三排应急为主。','Heavy with average handling; third row is for emergencies only.') },
    { id:'m12', name:GG.T('小米 SU7','Xiaomi SU7'),          color:'#f06a3a', body:'轿车', size:'中型', vibe:'运动', power:'纯电', price:'主流', range:'22–30 万', seats:5, caveat:GG.T('新品牌产能/售后待验、后排坐姿偏低。','New brand — production and service still unproven; low rear seating position.') },
    { id:'m13', name:GG.T('坦克 300','Tank 300'),          color:'#3b6b4a', body:'SUV', size:'中型', vibe:'硬派', power:'燃油', price:'主流', range:'20–28 万', seats:5, caveat:GG.T('油耗高、城市笨重、停车费劲。','Thirsty, clumsy in town, a chore to park.') },
    { id:'m14', name:GG.T('长城炮','GWM Poer'),            color:'#9c6b3b', body:'皮卡', size:'大型', vibe:'硬派', power:'燃油', price:'主流', range:'13–20 万', seats:5, caveat:GG.T('部分城市限行/限高，舒适与油耗一般。','Some cities restrict pickups (road bans / height limits); comfort and economy are average.') },
    { id:'m15', name:GG.T('别克 GL8','Buick GL8'),          color:'#5a6270', body:'MPV', size:'大型', vibe:'居家', power:'燃油', price:'主流', range:'23–35 万', seats:7, caveat:GG.T('油耗偏高、电气化滞后。','Thirsty and late to electrification.') },

    /* 高端 25–40万 */
    { id:'h1',  name:GG.T('特斯拉 Model 3','Tesla Model 3'),    color:'#2f3a4a', body:'轿车', size:'中型', vibe:'极简', power:'纯电', price:'高端', range:'24–28 万', seats:5, caveat:GG.T('内饰极简到简陋、悬架偏硬、智驾需选装。','Interior minimal to the point of spartan; firm ride; assisted driving costs extra.') },
    { id:'h2',  name:GG.T('特斯拉 Model Y','Tesla Model Y'),    color:'#6a5acd', body:'SUV', size:'中型', vibe:'运动', power:'纯电', price:'高端', range:'26–35 万', seats:5, caveat:GG.T('悬架偏硬、内饰极简、智驾需选装。','Firm ride, ultra-minimal cabin, assisted driving costs extra.') },
    { id:'h3',  name:GG.T('小鹏 G6','XPeng G6'),           color:'#2f7a6a', body:'SUV', size:'中型', vibe:'运动', power:'纯电', price:'高端', range:'20–27 万', seats:5, caveat:GG.T('早期车机偶发 bug、品牌渠道较新。','Occasional early software bugs; brand and dealer network still young.') },
    { id:'h4',  name:GG.T('理想 L7','Li Auto L7'),           color:'#4a8a7a', body:'SUV', size:'大型', vibe:'居家', power:'混动', price:'高端', range:'30–37 万', seats:5, caveat:GG.T('亏电油耗回升、操控偏舒适、无纯电版。','Fuel use climbs with a drained battery; comfort-tuned handling; no full-EV version.') },
    { id:'h5',  name:GG.T('理想 L8','Li Auto L8'),           color:'#3f8f7a', body:'SUV', size:'大型', vibe:'居家', power:'混动', price:'高端', range:'32–38 万', seats:6, caveat:GG.T('亏电油耗回升、操控偏舒适不运动。','Fuel use climbs with a drained battery; comfort-tuned, not sporty.') },
    { id:'h6',  name:GG.T('蔚来 ES6','NIO ES6'),          color:'#5b8def', body:'SUV', size:'中型', vibe:'优雅', power:'纯电', price:'高端', range:'33–40 万', seats:5, caveat:GG.T('补能依赖换电网络、保值率待观察。','Charging leans on the swap network; resale value still unproven.') },
    { id:'h7',  name:GG.T('蔚来 ET5','NIO ET5'),          color:'#4a7ad0', body:'轿车', size:'中型', vibe:'优雅', power:'纯电', price:'高端', range:'30–36 万', seats:5, caveat:GG.T('后排偏压抑、保值率待观察。','Rear seat feels confined; resale value still unproven.') },
    { id:'h8',  name:GG.T('极氪 001','Zeekr 001'),          color:'#1f7a8c', body:'旅行车', size:'中型', vibe:'运动', power:'纯电', price:'高端', range:'27–33 万', seats:5, caveat:GG.T('车长不好停、早期车机口碑一般。','Long body is hard to park; early infotainment earned mixed reviews.') },
    { id:'h9',  name:GG.T('极氪 007','Zeekr 007'),          color:'#2f8a9c', body:'轿车', size:'中型', vibe:'运动', power:'纯电', price:'高端', range:'21–30 万', seats:5, caveat:GG.T('后排地台偏高、品牌较新。','High rear floor; brand still young.') },
    { id:'h10', name:GG.T('宝马 3 系','BMW 3 Series'),         color:'#2b4a8a', body:'轿车', size:'中型', vibe:'运动', power:'燃油', price:'高端', range:'30–36 万', seats:5, caveat:GG.T('低配减配明显、后期维保偏贵。','Base trims are noticeably stripped; upkeep gets pricey with age.') },
    { id:'h11', name:GG.T('奥迪 A4L','Audi A4L'),          color:'#3a3f4a', body:'轿车', size:'中型', vibe:'优雅', power:'燃油', price:'高端', range:'30–38 万', seats:5, caveat:GG.T('依赖终端大优惠、科技感稍显成熟。','Leans on big dealer discounts; the tech feels a touch dated.') },
    { id:'h12', name:GG.T('奔驰 C 级','Mercedes-Benz C-Class'),         color:'#2a2d33', body:'轿车', size:'中型', vibe:'优雅', power:'燃油', price:'高端', range:'33–40 万', seats:5, caveat:GG.T('后排偏窄、小毛病与维保成本。','Narrow rear seat; niggles and upkeep costs add up.') },
    { id:'h13', name:GG.T('沃尔沃 XC60','Volvo XC60'),       color:'#46566a', body:'SUV', size:'中型', vibe:'优雅', power:'燃油', price:'高端', range:'35–45 万', seats:5, caveat:GG.T('动力调校保守、车机一般，主打安全与质感。',"Conservative power tuning, so-so infotainment — it's about safety and refinement.") },
    { id:'h14', name:GG.T('问界 M7','AITO M7'),           color:'#5a6a4a', body:'SUV', size:'大型', vibe:'居家', power:'混动', price:'高端', range:'28–37 万', seats:6, caveat:GG.T('满载动力偏肉、第三排应急为主。','Doughy when fully loaded; third row is for emergencies only.') },
    { id:'h15', name:GG.T('腾势 D9','Denza D9'),           color:'#3a5a6a', body:'MPV', size:'大型', vibe:'优雅', power:'混动', price:'高端', range:'33–46 万', seats:7, caveat:GG.T('车长难停、价格不低。','Long and hard to park; not cheap either.') },
    { id:'h16', name:GG.T('马自达 MX-5','Mazda MX-5'),       color:'#d23b3b', body:'跑车', size:'小型', vibe:'复古', power:'燃油', price:'高端', range:'34–40 万', seats:2, caveat:GG.T('后排几乎没有、实用性极低、雨雪天娇气。','Practically no back seat, minimal practicality, fussy in rain or snow.') },

    /* 豪华 40万+ */
    { id:'l1',  name:GG.T('奔驰 E 级','Mercedes-Benz E-Class'),         color:'#1f2228', body:'轿车', size:'大型', vibe:'优雅', power:'燃油', price:'豪华', range:'45–55 万', seats:5, caveat:GG.T('落地税费高、三年保值率一般。','Heavy taxes and fees on the road; three-year resale is average.') },
    { id:'l2',  name:GG.T('宝马 5 系','BMW 5 Series'),         color:'#23355f', body:'轿车', size:'大型', vibe:'优雅', power:'燃油', price:'豪华', range:'43–55 万', seats:5, caveat:GG.T('低配略寒酸、后期维保偏贵。','Base trims feel austere; upkeep gets pricey with age.') },
    { id:'l3',  name:GG.T('理想 L9','Li Auto L9'),           color:'#4a5a6a', body:'SUV', size:'大型', vibe:'居家', power:'混动', price:'豪华', range:'43–46 万', seats:6, caveat:GG.T('体型大，城市停车与掉头吃力。','Big footprint — city parking and U-turns are a struggle.') },
    { id:'l4',  name:GG.T('问界 M9','AITO M9'),           color:'#4a5560', body:'SUV', size:'大型', vibe:'居家', power:'混动', price:'豪华', range:'47–57 万', seats:6, caveat:GG.T('车重大、补能与油耗看路况。','Very heavy; charging and fuel use depend on conditions.') },
    { id:'l5',  name:GG.T('蔚来 ES8','NIO ES8'),          color:'#3a6ad0', body:'SUV', size:'大型', vibe:'优雅', power:'纯电', price:'豪华', range:'50 万 +',  seats:6, caveat:GG.T('电耗偏高、长途依赖换电。','High energy use; long trips depend on battery swaps.') },
    { id:'l6',  name:GG.T('保时捷 Macan','Porsche Macan'),      color:'#b89020', body:'SUV', size:'中型', vibe:'运动', power:'燃油', price:'豪华', range:'60 万 +',  seats:5, caveat:GG.T('选装昂贵、后排与后备箱偏小。','Options are pricey; rear seat and trunk run small.') },
    { id:'l7',  name:GG.T('保时捷 Taycan','Porsche Taycan'),     color:'#d9a520', body:'跑车', size:'中型', vibe:'运动', power:'纯电', price:'豪华', range:'90 万 +',  seats:4, caveat:GG.T('价格高、补能与续航焦虑、维保昂贵。','Expensive, with charging and range anxiety — and costly upkeep.') },
    { id:'l8',  name:GG.T('保时捷 911','Porsche 911'),        color:'#caa01c', body:'跑车', size:'小型', vibe:'运动', power:'燃油', price:'豪华', range:'130 万 +', seats:4, caveat:GG.T('后排是摆设、选装无底洞、日用不便。','Back seats are decoration, the options list is a bottomless pit, daily use is a hassle.') },
    { id:'l9',  name:GG.T('路虎 卫士','Land Rover Defender'),         color:'#6b7a52', body:'SUV', size:'大型', vibe:'硬派', power:'燃油', price:'豪华', range:'75 万 +',  seats:5, caveat:GG.T('可靠性口碑有波动、油耗与维保高。','Reliability reputation is patchy; fuel and upkeep costs run high.') },
    { id:'l10', name:GG.T('奔驰 S 级','Mercedes-Benz S-Class'),         color:'#15171c', body:'轿车', size:'大型', vibe:'优雅', power:'燃油', price:'豪华', range:'90 万 +',  seats:5, caveat:GG.T('落地与折旧惊人、电子件娇贵。','Eye-watering price and depreciation; delicate electronics.') },
    { id:'l11', name:GG.T('丰田 赛那','Toyota Sienna'),         color:'#46607a', body:'MPV', size:'大型', vibe:'居家', power:'混动', price:'豪华', range:'32–42 万', seats:7, caveat:GG.T('终端常加价、操控偏船，胜在可靠省心。','Dealers often mark it up; handles like a boat — wins on worry-free reliability.') },
    { id:'l12', name:GG.T('福特 Mustang','Ford Mustang'),      color:'#b5402a', body:'跑车', size:'中型', vibe:'复古', power:'燃油', price:'豪华', range:'40–55 万', seats:4, caveat:GG.T('油耗高、后排狭小、内饰用料一般。','Thirsty, cramped in back, so-so cabin materials.') }
  ],

  // ── 轻问卷：显式约束 + 购买意图（意图分级是 B2B 数据价值的发动机） ──
  QUIZ: [
    { id:'budget', q:GG.T('买车预算大概在哪一档？','Roughly what is your budget?'), options:[
      { key:'a', label:GG.T('15 万以内','Under ¥150k'),         cap:15,  bl:GG.T('≤15万','≤¥150k') },
      { key:'b', label:GG.T('15–25 万','¥150–250k'),          cap:25,  bl:GG.T('15–25万','¥150–250k') },
      { key:'c', label:GG.T('25–40 万','¥250–400k'),          cap:40,  bl:GG.T('25–40万','¥250–400k') },
      { key:'d', label:GG.T('40–80 万','¥400–800k'),          cap:80,  bl:GG.T('40–80万','¥400–800k') },
      { key:'e', label:GG.T('80 万以上 / 不封顶','¥800k+ / no ceiling'), cap:999, bl:GG.T('80万+','¥800k+') } ]},
    { id:'seats', q:GG.T('主要坐几个人 / 什么用途？',"Who's usually on board / what's it for?"), options:[
      { key:'a', label:GG.T('就我自己 / 两人，通勤代步','Just me / two of us — mostly commuting'), seat:2, use:'通勤' },
      { key:'b', label:GG.T('小两口 + 偶尔带人，主打玩乐','A couple, occasional passengers — mainly for fun'), seat:2, use:'玩乐' },
      { key:'c', label:GG.T('一家三四口，日常家用','A family of three or four — everyday duty'),       seat:5, use:'家用' },
      { key:'d', label:GG.T('三代同堂 / 经常六七人','Three generations / often six or seven people'),       seat:7, use:'多人' } ]},
    { id:'energy', q:GG.T('动力上更想要？','What kind of power do you want?'), options:[
      { key:'a', label:GG.T('纯电，安静、零油费','Full EV — quiet, zero gas bills'),           energy:'纯电' },
      { key:'b', label:GG.T('油电混动，省油又没续航焦虑','Hybrid — great mileage, no range anxiety'),   energy:'混动' },
      { key:'c', label:GG.T('燃油，随加随走最省心','Gas — fill up and go, zero hassle'),         energy:'燃油' },
      { key:'d', label:GG.T('都行，看车定','Open to anything — depends on the car'),                 energy:null } ]},
    { id:'timeline', q:GG.T('大概什么时候会买？','When are you likely to buy?'), options:[
      { key:'a', label:GG.T('就是看看、玩玩，暂时没计划','Just looking around — no plans yet'), intent:0, intentLabel:GG.T('纯逛逛','Just browsing') },
      { key:'b', label:GG.T('半年内有可能','Possibly within six months'),               intent:1, intentLabel:GG.T('半年内','Within 6 months') },
      { key:'c', label:GG.T('3 个月内基本要定','Pretty much decided — within 3 months'),           intent:2, intentLabel:GG.T('3个月内必入','Buying within 3 months') } ]},
    { id:'first', q:GG.T('这会是你的第一台车吗？','Will this be your first car?'), options:[
      { key:'a', label:GG.T('是，人生第一台','Yes — my first ever'), first:true },
      { key:'b', label:GG.T('不是，增购 / 换车','No — adding or replacing one'), first:false } ]}
  ]
};
