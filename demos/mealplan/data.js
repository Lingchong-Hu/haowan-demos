/* mealplan — 7 天饮食计划 数据。
   MEALS：菜品池。每道 {
     name,
     meal: '早'|'午'|'晚',
     goalFit: {减脂, 增肌, 均衡}  // 0~2 权重，越高越契合该目标
     tags: [...]                  // 用于忌口/过敏过滤：辣 / 素 / 海鲜 / 麸质 / 牛奶 / 坚果
     ingredients: [{name, cat}]   // cat: 蔬菜/肉蛋/主食/调料/其他
   }
   设计原则：每个餐位(早/午/晚)都有足够多候选菜（>=10），
   且各目标都有契合项，保证任意目标+忌口组合都能铺满 7 天不太重复。 */
window.MEALPLAN = (function(){

  // 调料默认贴在很多菜上，归并时会自然去重合并
  const OIL   = {name:'食用油', cat:'调料'};
  const SALT  = {name:'盐',     cat:'调料'};
  const SOY   = {name:'生抽',   cat:'调料'};
  const GARLIC= {name:'蒜',     cat:'调料'};
  const GINGER= {name:'姜',     cat:'调料'};
  const SUGAR = {name:'糖',     cat:'调料'};
  const CHILI = {name:'辣椒',   cat:'调料'};
  const PEPPER= {name:'黑胡椒', cat:'调料'};

  const MEALS = [

    /* ===================== 早餐 ===================== */
    { name:'燕麦牛奶碗（配蓝莓）', meal:'早',
      goalFit:{减脂:2, 增肌:1, 均衡:2}, tags:['素','麸质','牛奶'],
      ingredients:[{name:'燕麦片',cat:'主食'},{name:'牛奶',cat:'其他'},{name:'蓝莓',cat:'蔬菜'},{name:'蜂蜜',cat:'调料'}] },
    { name:'水煮蛋 + 全麦吐司', meal:'早',
      goalFit:{减脂:2, 增肌:2, 均衡:2}, tags:['素','麸质'],
      ingredients:[{name:'鸡蛋',cat:'肉蛋'},{name:'全麦面包',cat:'主食'},SALT] },
    { name:'豆浆油条', meal:'早',
      goalFit:{减脂:0, 增肌:1, 均衡:1}, tags:['素','麸质'],
      ingredients:[{name:'黄豆',cat:'其他'},{name:'油条',cat:'主食'},OIL] },
    { name:'鸡胸三明治', meal:'早',
      goalFit:{减脂:2, 增肌:2, 均衡:1}, tags:['麸质'],
      ingredients:[{name:'鸡胸肉',cat:'肉蛋'},{name:'全麦面包',cat:'主食'},{name:'生菜',cat:'蔬菜'},{name:'番茄',cat:'蔬菜'},SALT] },
    { name:'蔬菜杂粮粥', meal:'早',
      goalFit:{减脂:2, 增肌:0, 均衡:2}, tags:['素'],
      ingredients:[{name:'小米',cat:'主食'},{name:'南瓜',cat:'蔬菜'},{name:'胡萝卜',cat:'蔬菜'},SALT] },
    { name:'希腊酸奶坚果杯', meal:'早',
      goalFit:{减脂:1, 增肌:2, 均衡:1}, tags:['素','牛奶','坚果'],
      ingredients:[{name:'酸奶',cat:'其他'},{name:'核桃',cat:'其他'},{name:'香蕉',cat:'蔬菜'}] },
    { name:'番茄鸡蛋面', meal:'早',
      goalFit:{减脂:1, 增肌:1, 均衡:2}, tags:['素','麸质'],
      ingredients:[{name:'面条',cat:'主食'},{name:'番茄',cat:'蔬菜'},{name:'鸡蛋',cat:'肉蛋'},OIL,SALT] },
    { name:'藜麦蔬菜碗', meal:'早',
      goalFit:{减脂:2, 增肌:1, 均衡:2}, tags:['素'],
      ingredients:[{name:'藜麦',cat:'主食'},{name:'牛油果',cat:'蔬菜'},{name:'圣女果',cat:'蔬菜'},{name:'菠菜',cat:'蔬菜'},OIL,SALT] },
    { name:'香蕉花生酱吐司', meal:'早',
      goalFit:{减脂:0, 增肌:2, 均衡:1}, tags:['素','麸质','坚果'],
      ingredients:[{name:'全麦面包',cat:'主食'},{name:'花生酱',cat:'其他'},{name:'香蕉',cat:'蔬菜'}] },
    { name:'蒸玉米 + 水煮蛋', meal:'早',
      goalFit:{减脂:2, 增肌:1, 均衡:2}, tags:['素'],
      ingredients:[{name:'玉米',cat:'蔬菜'},{name:'鸡蛋',cat:'肉蛋'}] },
    { name:'虾仁蔬菜煎蛋', meal:'早',
      goalFit:{减脂:2, 增肌:2, 均衡:1}, tags:['海鲜'],
      ingredients:[{name:'虾仁',cat:'肉蛋'},{name:'鸡蛋',cat:'肉蛋'},{name:'西兰花',cat:'蔬菜'},OIL,SALT] },
    { name:'红薯 + 牛奶', meal:'早',
      goalFit:{减脂:2, 增肌:1, 均衡:2}, tags:['素','牛奶'],
      ingredients:[{name:'红薯',cat:'主食'},{name:'牛奶',cat:'其他'}] },

    /* ===================== 午餐 ===================== */
    { name:'香煎鸡胸 + 糙米饭', meal:'午',
      goalFit:{减脂:2, 增肌:2, 均衡:2}, tags:[],
      ingredients:[{name:'鸡胸肉',cat:'肉蛋'},{name:'糙米',cat:'主食'},{name:'西兰花',cat:'蔬菜'},OIL,SALT,PEPPER] },
    { name:'番茄牛腩饭', meal:'午',
      goalFit:{减脂:1, 增肌:2, 均衡:2}, tags:[],
      ingredients:[{name:'牛肉',cat:'肉蛋'},{name:'番茄',cat:'蔬菜'},{name:'米饭',cat:'主食'},{name:'洋葱',cat:'蔬菜'},OIL,SALT,GINGER] },
    { name:'麻婆豆腐盖饭', meal:'午',
      goalFit:{减脂:1, 增肌:1, 均衡:2}, tags:['辣','素'],
      ingredients:[{name:'豆腐',cat:'肉蛋'},{name:'米饭',cat:'主食'},CHILI,OIL,SOY,GARLIC] },
    { name:'清蒸鲈鱼 + 米饭', meal:'午',
      goalFit:{减脂:2, 增肌:2, 均衡:2}, tags:['海鲜'],
      ingredients:[{name:'鲈鱼',cat:'肉蛋'},{name:'米饭',cat:'主食'},{name:'葱',cat:'蔬菜'},GINGER,SOY,OIL] },
    { name:'素炒时蔬 + 杂粮饭', meal:'午',
      goalFit:{减脂:2, 增肌:0, 均衡:2}, tags:['素'],
      ingredients:[{name:'青椒',cat:'蔬菜'},{name:'胡萝卜',cat:'蔬菜'},{name:'木耳',cat:'蔬菜'},{name:'糙米',cat:'主食'},OIL,SALT,GARLIC] },
    { name:'宫保鸡丁饭', meal:'午',
      goalFit:{减脂:1, 增肌:2, 均衡:1}, tags:['辣','坚果'],
      ingredients:[{name:'鸡腿肉',cat:'肉蛋'},{name:'米饭',cat:'主食'},{name:'花生',cat:'其他'},{name:'黄瓜',cat:'蔬菜'},CHILI,SOY,OIL,SUGAR] },
    { name:'牛肉藜麦沙拉', meal:'午',
      goalFit:{减脂:2, 增肌:2, 均衡:1}, tags:[],
      ingredients:[{name:'牛肉',cat:'肉蛋'},{name:'藜麦',cat:'主食'},{name:'生菜',cat:'蔬菜'},{name:'圣女果',cat:'蔬菜'},OIL,SALT,PEPPER] },
    { name:'三文鱼牛油果饭', meal:'午',
      goalFit:{减脂:2, 增肌:2, 均衡:2}, tags:['海鲜'],
      ingredients:[{name:'三文鱼',cat:'肉蛋'},{name:'牛油果',cat:'蔬菜'},{name:'米饭',cat:'主食'},SOY,OIL] },
    { name:'西红柿鸡蛋盖饭', meal:'午',
      goalFit:{减脂:1, 增肌:1, 均衡:2}, tags:['素'],
      ingredients:[{name:'番茄',cat:'蔬菜'},{name:'鸡蛋',cat:'肉蛋'},{name:'米饭',cat:'主食'},OIL,SALT,SUGAR] },
    { name:'香菇滑鸡饭', meal:'午',
      goalFit:{减脂:1, 增肌:2, 均衡:2}, tags:[],
      ingredients:[{name:'鸡腿肉',cat:'肉蛋'},{name:'香菇',cat:'蔬菜'},{name:'米饭',cat:'主食'},GINGER,SOY,OIL] },
    { name:'凉拌鸡丝荞麦面', meal:'午',
      goalFit:{减脂:2, 增肌:1, 均衡:1}, tags:['辣'],
      ingredients:[{name:'鸡胸肉',cat:'肉蛋'},{name:'荞麦面',cat:'主食'},{name:'黄瓜',cat:'蔬菜'},CHILI,SOY,GARLIC] },
    { name:'豆腐蔬菜杂烩饭', meal:'午',
      goalFit:{减脂:2, 增肌:1, 均衡:2}, tags:['素'],
      ingredients:[{name:'豆腐',cat:'肉蛋'},{name:'西兰花',cat:'蔬菜'},{name:'胡萝卜',cat:'蔬菜'},{name:'糙米',cat:'主食'},OIL,SALT,SOY] },

    /* ===================== 晚餐 ===================== */
    { name:'白灼西兰花 + 蒸鸡胸', meal:'晚',
      goalFit:{减脂:2, 增肌:2, 均衡:1}, tags:[],
      ingredients:[{name:'西兰花',cat:'蔬菜'},{name:'鸡胸肉',cat:'肉蛋'},OIL,SALT,GARLIC] },
    { name:'番茄豆腐汤 + 杂粮饭', meal:'晚',
      goalFit:{减脂:2, 增肌:1, 均衡:2}, tags:['素'],
      ingredients:[{name:'番茄',cat:'蔬菜'},{name:'豆腐',cat:'肉蛋'},{name:'糙米',cat:'主食'},SALT,OIL] },
    { name:'青椒炒牛肉 + 米饭', meal:'晚',
      goalFit:{减脂:1, 增肌:2, 均衡:2}, tags:['辣'],
      ingredients:[{name:'牛肉',cat:'肉蛋'},{name:'青椒',cat:'蔬菜'},{name:'米饭',cat:'主食'},CHILI,SOY,OIL,GARLIC] },
    { name:'蒜蓉粉丝蒸虾', meal:'晚',
      goalFit:{减脂:2, 增肌:2, 均衡:1}, tags:['海鲜'],
      ingredients:[{name:'虾',cat:'肉蛋'},{name:'粉丝',cat:'主食'},GARLIC,OIL,SOY] },
    { name:'手撕包菜 + 糙米饭', meal:'晚',
      goalFit:{减脂:2, 增肌:0, 均衡:2}, tags:['辣','素'],
      ingredients:[{name:'圆白菜',cat:'蔬菜'},{name:'糙米',cat:'主食'},CHILI,OIL,SALT,GARLIC] },
    { name:'照烧鸡腿 + 蔬菜', meal:'晚',
      goalFit:{减脂:1, 增肌:2, 均衡:2}, tags:[],
      ingredients:[{name:'鸡腿肉',cat:'肉蛋'},{name:'西兰花',cat:'蔬菜'},{name:'米饭',cat:'主食'},SOY,SUGAR,OIL,GINGER] },
    { name:'冬瓜排骨汤 + 米饭', meal:'晚',
      goalFit:{减脂:1, 增肌:1, 均衡:2}, tags:[],
      ingredients:[{name:'排骨',cat:'肉蛋'},{name:'冬瓜',cat:'蔬菜'},{name:'米饭',cat:'主食'},GINGER,SALT] },
    { name:'清炒菠菜 + 蒸鱼', meal:'晚',
      goalFit:{减脂:2, 增肌:2, 均衡:2}, tags:['海鲜'],
      ingredients:[{name:'菠菜',cat:'蔬菜'},{name:'鲈鱼',cat:'肉蛋'},OIL,SALT,GINGER] },
    { name:'蔬菜豆腐火锅', meal:'晚',
      goalFit:{减脂:2, 增肌:1, 均衡:2}, tags:['辣','素'],
      ingredients:[{name:'豆腐',cat:'肉蛋'},{name:'金针菇',cat:'蔬菜'},{name:'生菜',cat:'蔬菜'},{name:'白菜',cat:'蔬菜'},CHILI,SALT] },
    { name:'香煎三文鱼 + 芦笋', meal:'晚',
      goalFit:{减脂:2, 增肌:2, 均衡:1}, tags:['海鲜'],
      ingredients:[{name:'三文鱼',cat:'肉蛋'},{name:'芦笋',cat:'蔬菜'},OIL,SALT,PEPPER] },
    { name:'土豆炖牛肉 + 米饭', meal:'晚',
      goalFit:{减脂:0, 增肌:2, 均衡:2}, tags:[],
      ingredients:[{name:'牛肉',cat:'肉蛋'},{name:'土豆',cat:'蔬菜'},{name:'胡萝卜',cat:'蔬菜'},{name:'米饭',cat:'主食'},SOY,OIL,GINGER] },
    { name:'蒜香口蘑炒蛋', meal:'晚',
      goalFit:{减脂:2, 增肌:1, 均衡:2}, tags:['素'],
      ingredients:[{name:'口蘑',cat:'蔬菜'},{name:'鸡蛋',cat:'肉蛋'},{name:'糙米',cat:'主食'},GARLIC,OIL,SALT] },
  ];

  return { MEALS };
})();
