/* 今天吃什么 — 融合数据层（window.FOOD）。
   一个「吃饭大脑」，三个入口共用一条冰箱库存主线：
     ING        食材主数据：key -> {label,emoji,cat,shelf(冷藏可放天数),price¥,g克}
     STAPLES    常备调料 key（冰箱一直有，不进「先吃我」）
     FRIDGE_SEED 冰箱初始库存：{key,n,unit,days(入库至今天数)}；新鲜度 = shelf - days
     RECIPES    今晚引擎菜谱（原 ollie）：{name,emoji,minutes,blurb,need:[key],steps:[文字]}
     MEALS      一周引擎菜池（原 mealplan）：{name,meal,goalFit,tags,ingredients:[{name,cat}]}
     EXAMPLES   灵感示例帖（原 dinner）：{em,label,text, recipe:{离线菜谱契约}}——离线即可出真菜谱
   设计：消费向，能离线即时算；连 key 才把「灵感解析任意帖子 / 个性化周计划」升级成真 AI。 */
window.FOOD = (function(){

  /* ───────── 食材主数据 ───────── */
  // cat: 蔬菜 / 蛋白 / 乳制品 / 主食 / 调料
  const ING = {
    // 蔬菜
    tomato:   {label:'番茄',   emoji:'🍅', cat:'蔬菜', shelf:7,  price:3, g:200},
    potato:   {label:'土豆',   emoji:'🥔', cat:'蔬菜', shelf:30, price:2, g:200},
    onion:    {label:'洋葱',   emoji:'🧅', cat:'蔬菜', shelf:30, price:2, g:180},
    pepper:   {label:'青椒',   emoji:'🫑', cat:'蔬菜', shelf:7,  price:3, g:150},
    cucumber: {label:'黄瓜',   emoji:'🥒', cat:'蔬菜', shelf:6,  price:3, g:200},
    cabbage:  {label:'白菜',   emoji:'🥬', cat:'蔬菜', shelf:8,  price:4, g:400},
    mushroom: {label:'香菇',   emoji:'🍄', cat:'蔬菜', shelf:4,  price:6, g:150},
    carrot:   {label:'胡萝卜', emoji:'🥕', cat:'蔬菜', shelf:21, price:2, g:150},
    corn:     {label:'玉米',   emoji:'🌽', cat:'蔬菜', shelf:4,  price:3, g:200},
    spinach:  {label:'菠菜',   emoji:'🥬', cat:'蔬菜', shelf:3,  price:4, g:200},
    // 蛋白
    egg:      {label:'鸡蛋',   emoji:'🥚', cat:'蛋白', shelf:21, price:1.5, g:60},
    chicken:  {label:'鸡肉',   emoji:'🍗', cat:'蛋白', shelf:3,  price:12, g:300},
    pork:     {label:'猪肉',   emoji:'🥩', cat:'蛋白', shelf:3,  price:14, g:300},
    beef:     {label:'牛肉',   emoji:'🐄', cat:'蛋白', shelf:4,  price:20, g:250},
    shrimp:   {label:'虾',     emoji:'🦐', cat:'蛋白', shelf:2,  price:18, g:200},
    tofu:     {label:'豆腐',   emoji:'🧈', cat:'蛋白', shelf:4,  price:3, g:300},
    // 乳制品
    milk:     {label:'牛奶',   emoji:'🥛', cat:'乳制品', shelf:7,  price:6, g:250},
    yogurt:   {label:'酸奶',   emoji:'🍶', cat:'乳制品', shelf:14, price:5, g:150},
    // 主食
    rice:     {label:'米饭',   emoji:'🍚', cat:'主食', shelf:3,  price:2, g:200},
    noodle:   {label:'面条',   emoji:'🍜', cat:'主食', shelf:180},
    flour:    {label:'面粉',   emoji:'🌾', cat:'主食', shelf:200},
    bread:    {label:'面包',   emoji:'🍞', cat:'主食', shelf:5,  price:6, g:120},
    // 调料（常备）
    soy:      {label:'生抽',   emoji:'🫙', cat:'调料', shelf:365},
    salt:     {label:'盐',     emoji:'🧂', cat:'调料', shelf:3650},
    oil:      {label:'食用油', emoji:'🛢️', cat:'调料', shelf:365},
    sugar:    {label:'糖',     emoji:'🍯', cat:'调料', shelf:3650},
    vinegar:  {label:'醋',     emoji:'🍶', cat:'调料', shelf:3650},
    chili:    {label:'辣椒',   emoji:'🌶️', cat:'调料', shelf:365},
    garlic:   {label:'蒜',     emoji:'🧄', cat:'调料', shelf:40},
    ginger:   {label:'姜',     emoji:'🫚', cat:'调料', shelf:30},
    scallion: {label:'葱',     emoji:'🌿', cat:'调料', shelf:10, price:1, g:50},
  };

  // 常备调料：默认一直在冰箱里，不算缺料、不进「先吃我」
  const STAPLES = ['soy','salt','oil','sugar','vinegar','chili','garlic','ginger','scallion'];

  /* ───────── 冰箱初始库存 ─────────
     days = 入库至今天数；新鲜度 daysLeft = ING.shelf - days。
     精心配比：3 样🔴该先吃 + 4 样🟡这两天 + 一批🟢新鲜，让「先吃我」一上来就有戏。 */
  const FRIDGE_SEED = [
    {key:'spinach',  n:1, unit:'1 把',    days:3},  // shelf3 → 今天就该吃 🔴
    {key:'mushroom', n:1, unit:'1 盒',    days:3},  // shelf4 → 明天 🔴
    {key:'milk',     n:1, unit:'剩 ~30%', days:6},  // shelf7 → 明天 🔴
    {key:'tomato',   n:3, unit:'3 个',    days:5},  // shelf7 → 2 天 🟡
    {key:'tofu',     n:1, unit:'1 盒',    days:2},  // shelf4 → 2 天 🟡
    {key:'chicken',  n:1, unit:'1 块',    days:1},  // shelf3 → 2 天 🟡
    {key:'rice',     n:1, unit:'剩一碗',  days:1},  // shelf3 → 2 天 🟡（剩饭）
    {key:'egg',      n:5, unit:'5 个',    days:4},  // shelf21 → 还久 🟢
    {key:'pepper',   n:2, unit:'2 个',    days:2},  // 🟢
    {key:'carrot',   n:2, unit:'2 根',    days:5},  // 🟢
    {key:'cucumber', n:2, unit:'2 根',    days:2},  // 🟢
    // 常备调料（折叠展示，不参与新鲜度）
    {key:'scallion', n:1, unit:'一小把',  days:3, staple:true},
    {key:'garlic',   n:1, unit:'一头',    days:6, staple:true},
    {key:'ginger',   n:1, unit:'一块',    days:6, staple:true},
    {key:'oil',      n:1, unit:'一瓶',    days:8, staple:true},
    {key:'salt',     n:1, unit:'一罐',    days:8, staple:true},
    {key:'soy',      n:1, unit:'一瓶',    days:8, staple:true},
    {key:'sugar',    n:1, unit:'一罐',    days:8, staple:true},
    {key:'vinegar',  n:1, unit:'一瓶',    days:8, staple:true},
  ];

  /* ───────── 今晚引擎菜谱（原 ollie，need 引用 ING 的 key） ───────── */
  const RECIPES = [
    { name:'番茄炒蛋', emoji:'🍅', minutes:10, need:['tomato','egg','oil','salt','scallion'],
      blurb:'国民下饭菜，酸甜软嫩，三两下出锅。',
      steps:['鸡蛋打散，热油炒成块盛出','番茄切块下锅炒出汁','倒回鸡蛋，加盐翻匀，撒葱花'] },
    { name:'西红柿鸡蛋面', emoji:'🍜', minutes:15, need:['tomato','egg','noodle','oil','salt'],
      blurb:'一碗连汤带面，番茄炒蛋的汤版。',
      steps:['番茄炒出红汁，加水煮开','打入蛋花，加盐调味','另锅煮面，浇上番茄蛋汤'] },
    { name:'蛋炒饭', emoji:'🍚', minutes:12, need:['rice','egg','scallion','oil','salt'],
      blurb:'剩饭救星，粒粒分明带蛋香。',
      steps:['鸡蛋炒散，盛出备用','米饭下锅炒散，回蛋同炒','加盐、撒葱花，翻匀出锅'] },
    { name:'青椒土豆丝', emoji:'🥔', minutes:15, need:['potato','pepper','oil','salt','vinegar'],
      blurb:'清爽脆口，加点醋更开胃。',
      steps:['土豆切丝泡水去淀粉，青椒切丝','热油爆炒土豆丝至断生','加青椒、盐、少许醋，快炒出锅'] },
    { name:'醋溜土豆丝', emoji:'🥔', minutes:12, need:['potato','oil','salt','vinegar','chili'],
      blurb:'酸辣脆爽，最下饭的一盘。',
      steps:['土豆切细丝泡水沥干','热油下干辣椒，倒土豆丝快炒','沿锅边淋醋，加盐翻匀'] },
    { name:'黄瓜拌虾', emoji:'🦐', minutes:12, need:['cucumber','shrimp','garlic','salt','vinegar'],
      blurb:'白灼虾配脆黄瓜，清爽不腻。',
      steps:['虾焯水剥壳，黄瓜拍碎','蒜末、盐、醋调汁','和虾、黄瓜拌匀'] },
    { name:'蒜蓉炒白菜', emoji:'🥬', minutes:10, need:['cabbage','garlic','oil','salt'],
      blurb:'清甜爽口，蒜香十足。',
      steps:['白菜切片，蒜切末','热油爆香蒜末','下白菜大火快炒，加盐出锅'] },
    { name:'香菇滑鸡', emoji:'🍗', minutes:20, need:['chicken','mushroom','ginger','soy','oil'],
      blurb:'鸡肉滑嫩，香菇吸饱汤汁。',
      steps:['鸡肉切块，香菇切片，姜切片','热油爆姜，下鸡肉炒变色','加香菇、生抽，焖煮入味'] },
    { name:'青椒炒肉', emoji:'🥩', minutes:15, need:['pork','pepper','garlic','soy','oil'],
      blurb:'家常硬菜，咸香下饭。',
      steps:['猪肉切片，青椒切块','热油下肉片炒变色','加蒜、青椒、生抽翻炒出锅'] },
    { name:'洋葱炒牛肉', emoji:'🐄', minutes:18, need:['beef','onion','soy','oil','garlic'],
      blurb:'牛肉嫩滑，洋葱回甜。',
      steps:['牛肉切片用生抽抓匀，洋葱切丝','热油大火快炒牛肉盛出','炒洋葱至软，回牛肉翻匀'] },
    { name:'麻婆豆腐', emoji:'🧈', minutes:18, need:['tofu','pork','chili','soy','garlic','scallion'],
      blurb:'麻辣鲜烫，豆腐嫩到入口即化。',
      steps:['豆腐切块焯水，肉末备好','炒香肉末、辣椒、蒜','下豆腐与生抽烧入味，撒葱花'] },
    { name:'番茄牛腩汤', emoji:'🍲', minutes:25, need:['tomato','beef','onion','salt','ginger'],
      blurb:'酸甜浓郁，连汤带肉都满足。',
      steps:['牛肉焯水，番茄洋葱切块','姜片爆香，下牛肉与番茄','加水炖煮至软烂，加盐调味'] },
    { name:'胡萝卜炒蛋', emoji:'🥕', minutes:10, need:['carrot','egg','oil','salt'],
      blurb:'颜色好看，清甜营养。',
      steps:['胡萝卜切丝，鸡蛋打散','炒蛋盛出，炒软胡萝卜丝','回蛋加盐翻匀出锅'] },
    { name:'葱油拌面', emoji:'🍜', minutes:12, need:['noodle','scallion','soy','oil','sugar'],
      blurb:'葱香扑鼻，简单却让人上瘾。',
      steps:['葱段小火熬出葱油','生抽加糖调成酱汁','煮面拌入葱油与酱汁'] },
    { name:'玉米炒虾仁', emoji:'🌽', minutes:15, need:['corn','shrimp','oil','salt','scallion'],
      blurb:'清甜弹牙，老少都爱。',
      steps:['虾仁焯水，玉米粒备好','热油下玉米炒香','加虾仁、盐快炒，撒葱花'] },
    { name:'家常煎豆腐', emoji:'🧈', minutes:15, need:['tofu','soy','oil','garlic','scallion'],
      blurb:'外焦里嫩，浇汁咸香。',
      steps:['豆腐切片煎至两面金黄','蒜末爆香，加生抽调汁','浇在豆腐上，撒葱花'] },
    { name:'番茄豆腐汤', emoji:'🍲', minutes:15, need:['tomato','tofu','egg','salt','scallion'],
      blurb:'清爽暖胃，三样主料就成汤。',
      steps:['番茄炒出汁，加水煮开','下豆腐块煮几分钟','淋蛋花，加盐撒葱花'] },
    { name:'凉拌黄瓜', emoji:'🥒', minutes:8, need:['cucumber','garlic','salt','vinegar','oil'],
      blurb:'拍一拍拌一拌，几分钟上桌。',
      steps:['黄瓜拍碎切段','蒜末、盐、醋、香油调汁','拌匀腌几分钟即可'] },
  ];

  /* ───────── 一周引擎菜池（原 mealplan，name 制） ───────── */
  const OIL={name:'食用油',cat:'调料'}, SALT={name:'盐',cat:'调料'}, SOY={name:'生抽',cat:'调料'},
        GARLIC={name:'蒜',cat:'调料'}, GINGER={name:'姜',cat:'调料'}, SUGAR={name:'糖',cat:'调料'},
        CHILI={name:'辣椒',cat:'调料'}, BPEP={name:'黑胡椒',cat:'调料'};
  const MEALS = [
    // 早餐
    { name:'燕麦牛奶碗（配蓝莓）', meal:'早', goalFit:{减脂:2,增肌:1,均衡:2}, tags:['素','麸质','牛奶'],
      ingredients:[{name:'燕麦片',cat:'主食'},{name:'牛奶',cat:'其他'},{name:'蓝莓',cat:'蔬菜'},{name:'蜂蜜',cat:'调料'}] },
    { name:'水煮蛋 + 全麦吐司', meal:'早', goalFit:{减脂:2,增肌:2,均衡:2}, tags:['素','麸质'],
      ingredients:[{name:'鸡蛋',cat:'肉蛋'},{name:'全麦面包',cat:'主食'},SALT] },
    { name:'豆浆油条', meal:'早', goalFit:{减脂:0,增肌:1,均衡:1}, tags:['素','麸质'],
      ingredients:[{name:'黄豆',cat:'其他'},{name:'油条',cat:'主食'},OIL] },
    { name:'鸡胸三明治', meal:'早', goalFit:{减脂:2,增肌:2,均衡:1}, tags:['麸质'],
      ingredients:[{name:'鸡胸肉',cat:'肉蛋'},{name:'全麦面包',cat:'主食'},{name:'生菜',cat:'蔬菜'},{name:'番茄',cat:'蔬菜'},SALT] },
    { name:'蔬菜杂粮粥', meal:'早', goalFit:{减脂:2,增肌:0,均衡:2}, tags:['素'],
      ingredients:[{name:'小米',cat:'主食'},{name:'南瓜',cat:'蔬菜'},{name:'胡萝卜',cat:'蔬菜'},SALT] },
    { name:'希腊酸奶坚果杯', meal:'早', goalFit:{减脂:1,增肌:2,均衡:1}, tags:['素','牛奶','坚果'],
      ingredients:[{name:'酸奶',cat:'其他'},{name:'核桃',cat:'其他'},{name:'香蕉',cat:'蔬菜'}] },
    { name:'番茄鸡蛋面', meal:'早', goalFit:{减脂:1,增肌:1,均衡:2}, tags:['素','麸质'],
      ingredients:[{name:'面条',cat:'主食'},{name:'番茄',cat:'蔬菜'},{name:'鸡蛋',cat:'肉蛋'},OIL,SALT] },
    { name:'藜麦蔬菜碗', meal:'早', goalFit:{减脂:2,增肌:1,均衡:2}, tags:['素'],
      ingredients:[{name:'藜麦',cat:'主食'},{name:'牛油果',cat:'蔬菜'},{name:'圣女果',cat:'蔬菜'},{name:'菠菜',cat:'蔬菜'},OIL,SALT] },
    { name:'香蕉花生酱吐司', meal:'早', goalFit:{减脂:0,增肌:2,均衡:1}, tags:['素','麸质','坚果'],
      ingredients:[{name:'全麦面包',cat:'主食'},{name:'花生酱',cat:'其他'},{name:'香蕉',cat:'蔬菜'}] },
    { name:'蒸玉米 + 水煮蛋', meal:'早', goalFit:{减脂:2,增肌:1,均衡:2}, tags:['素'],
      ingredients:[{name:'玉米',cat:'蔬菜'},{name:'鸡蛋',cat:'肉蛋'}] },
    { name:'虾仁蔬菜煎蛋', meal:'早', goalFit:{减脂:2,增肌:2,均衡:1}, tags:['海鲜'],
      ingredients:[{name:'虾仁',cat:'肉蛋'},{name:'鸡蛋',cat:'肉蛋'},{name:'西兰花',cat:'蔬菜'},OIL,SALT] },
    { name:'红薯 + 牛奶', meal:'早', goalFit:{减脂:2,增肌:1,均衡:2}, tags:['素','牛奶'],
      ingredients:[{name:'红薯',cat:'主食'},{name:'牛奶',cat:'其他'}] },
    // 午餐
    { name:'香煎鸡胸 + 糙米饭', meal:'午', goalFit:{减脂:2,增肌:2,均衡:2}, tags:[],
      ingredients:[{name:'鸡胸肉',cat:'肉蛋'},{name:'糙米',cat:'主食'},{name:'西兰花',cat:'蔬菜'},OIL,SALT,BPEP] },
    { name:'番茄牛腩饭', meal:'午', goalFit:{减脂:1,增肌:2,均衡:2}, tags:[],
      ingredients:[{name:'牛肉',cat:'肉蛋'},{name:'番茄',cat:'蔬菜'},{name:'米饭',cat:'主食'},{name:'洋葱',cat:'蔬菜'},OIL,SALT,GINGER] },
    { name:'麻婆豆腐盖饭', meal:'午', goalFit:{减脂:1,增肌:1,均衡:2}, tags:['辣','素'],
      ingredients:[{name:'豆腐',cat:'肉蛋'},{name:'米饭',cat:'主食'},CHILI,OIL,SOY,GARLIC] },
    { name:'清蒸鲈鱼 + 米饭', meal:'午', goalFit:{减脂:2,增肌:2,均衡:2}, tags:['海鲜'],
      ingredients:[{name:'鲈鱼',cat:'肉蛋'},{name:'米饭',cat:'主食'},{name:'葱',cat:'蔬菜'},GINGER,SOY,OIL] },
    { name:'素炒时蔬 + 杂粮饭', meal:'午', goalFit:{减脂:2,增肌:0,均衡:2}, tags:['素'],
      ingredients:[{name:'青椒',cat:'蔬菜'},{name:'胡萝卜',cat:'蔬菜'},{name:'木耳',cat:'蔬菜'},{name:'糙米',cat:'主食'},OIL,SALT,GARLIC] },
    { name:'宫保鸡丁饭', meal:'午', goalFit:{减脂:1,增肌:2,均衡:1}, tags:['辣','坚果'],
      ingredients:[{name:'鸡腿肉',cat:'肉蛋'},{name:'米饭',cat:'主食'},{name:'花生',cat:'其他'},{name:'黄瓜',cat:'蔬菜'},CHILI,SOY,OIL,SUGAR] },
    { name:'牛肉藜麦沙拉', meal:'午', goalFit:{减脂:2,增肌:2,均衡:1}, tags:[],
      ingredients:[{name:'牛肉',cat:'肉蛋'},{name:'藜麦',cat:'主食'},{name:'生菜',cat:'蔬菜'},{name:'圣女果',cat:'蔬菜'},OIL,SALT,BPEP] },
    { name:'三文鱼牛油果饭', meal:'午', goalFit:{减脂:2,增肌:2,均衡:2}, tags:['海鲜'],
      ingredients:[{name:'三文鱼',cat:'肉蛋'},{name:'牛油果',cat:'蔬菜'},{name:'米饭',cat:'主食'},SOY,OIL] },
    { name:'西红柿鸡蛋盖饭', meal:'午', goalFit:{减脂:1,增肌:1,均衡:2}, tags:['素'],
      ingredients:[{name:'番茄',cat:'蔬菜'},{name:'鸡蛋',cat:'肉蛋'},{name:'米饭',cat:'主食'},OIL,SALT,SUGAR] },
    { name:'香菇滑鸡饭', meal:'午', goalFit:{减脂:1,增肌:2,均衡:2}, tags:[],
      ingredients:[{name:'鸡腿肉',cat:'肉蛋'},{name:'香菇',cat:'蔬菜'},{name:'米饭',cat:'主食'},GINGER,SOY,OIL] },
    { name:'凉拌鸡丝荞麦面', meal:'午', goalFit:{减脂:2,增肌:1,均衡:1}, tags:['辣'],
      ingredients:[{name:'鸡胸肉',cat:'肉蛋'},{name:'荞麦面',cat:'主食'},{name:'黄瓜',cat:'蔬菜'},CHILI,SOY,GARLIC] },
    { name:'豆腐蔬菜杂烩饭', meal:'午', goalFit:{减脂:2,增肌:1,均衡:2}, tags:['素'],
      ingredients:[{name:'豆腐',cat:'肉蛋'},{name:'西兰花',cat:'蔬菜'},{name:'胡萝卜',cat:'蔬菜'},{name:'糙米',cat:'主食'},OIL,SALT,SOY] },
    // 晚餐
    { name:'白灼西兰花 + 蒸鸡胸', meal:'晚', goalFit:{减脂:2,增肌:2,均衡:1}, tags:[],
      ingredients:[{name:'西兰花',cat:'蔬菜'},{name:'鸡胸肉',cat:'肉蛋'},OIL,SALT,GARLIC] },
    { name:'番茄豆腐汤 + 杂粮饭', meal:'晚', goalFit:{减脂:2,增肌:1,均衡:2}, tags:['素'],
      ingredients:[{name:'番茄',cat:'蔬菜'},{name:'豆腐',cat:'肉蛋'},{name:'糙米',cat:'主食'},SALT,OIL] },
    { name:'青椒炒牛肉 + 米饭', meal:'晚', goalFit:{减脂:1,增肌:2,均衡:2}, tags:['辣'],
      ingredients:[{name:'牛肉',cat:'肉蛋'},{name:'青椒',cat:'蔬菜'},{name:'米饭',cat:'主食'},CHILI,SOY,OIL,GARLIC] },
    { name:'蒜蓉粉丝蒸虾', meal:'晚', goalFit:{减脂:2,增肌:2,均衡:1}, tags:['海鲜'],
      ingredients:[{name:'虾',cat:'肉蛋'},{name:'粉丝',cat:'主食'},GARLIC,OIL,SOY] },
    { name:'手撕包菜 + 糙米饭', meal:'晚', goalFit:{减脂:2,增肌:0,均衡:2}, tags:['辣','素'],
      ingredients:[{name:'圆白菜',cat:'蔬菜'},{name:'糙米',cat:'主食'},CHILI,OIL,SALT,GARLIC] },
    { name:'照烧鸡腿 + 蔬菜', meal:'晚', goalFit:{减脂:1,增肌:2,均衡:2}, tags:[],
      ingredients:[{name:'鸡腿肉',cat:'肉蛋'},{name:'西兰花',cat:'蔬菜'},{name:'米饭',cat:'主食'},SOY,SUGAR,OIL,GINGER] },
    { name:'冬瓜排骨汤 + 米饭', meal:'晚', goalFit:{减脂:1,增肌:1,均衡:2}, tags:[],
      ingredients:[{name:'排骨',cat:'肉蛋'},{name:'冬瓜',cat:'蔬菜'},{name:'米饭',cat:'主食'},GINGER,SALT] },
    { name:'清炒菠菜 + 蒸鱼', meal:'晚', goalFit:{减脂:2,增肌:2,均衡:2}, tags:['海鲜'],
      ingredients:[{name:'菠菜',cat:'蔬菜'},{name:'鲈鱼',cat:'肉蛋'},OIL,SALT,GINGER] },
    { name:'蔬菜豆腐火锅', meal:'晚', goalFit:{减脂:2,增肌:1,均衡:2}, tags:['辣','素'],
      ingredients:[{name:'豆腐',cat:'肉蛋'},{name:'金针菇',cat:'蔬菜'},{name:'生菜',cat:'蔬菜'},{name:'白菜',cat:'蔬菜'},CHILI,SALT] },
    { name:'香煎三文鱼 + 芦笋', meal:'晚', goalFit:{减脂:2,增肌:2,均衡:1}, tags:['海鲜'],
      ingredients:[{name:'三文鱼',cat:'肉蛋'},{name:'芦笋',cat:'蔬菜'},OIL,SALT,BPEP] },
    { name:'土豆炖牛肉 + 米饭', meal:'晚', goalFit:{减脂:0,增肌:2,均衡:2}, tags:[],
      ingredients:[{name:'牛肉',cat:'肉蛋'},{name:'土豆',cat:'蔬菜'},{name:'胡萝卜',cat:'蔬菜'},{name:'米饭',cat:'主食'},SOY,OIL,GINGER] },
    { name:'蒜香口蘑炒蛋', meal:'晚', goalFit:{减脂:2,增肌:1,均衡:2}, tags:['素'],
      ingredients:[{name:'口蘑',cat:'蔬菜'},{name:'鸡蛋',cat:'肉蛋'},{name:'糙米',cat:'主食'},GARLIC,OIL,SALT] },
  ];

  /* ───────── 灵感示例帖（含离线菜谱契约，未连 key 也能出真菜谱） ─────────
     recipe 字段同 dinner 引擎契约：is_food/dish_name/one_line/servings/time_minutes/
     difficulty/ingredients[{name,amount,emoji}]/steps[{title,detail,minutes,icon}]/source_snippet
     icon ∈ knife pan pot oven mix timer plate flame */
  const EXAMPLES = [
    { em:'🌶️', label:'爆款探店帖',
      text:'家人们谁懂啊！！巷子深处这家苍蝇馆子的辣子鸡丁真的绝🌶️ 鸡腿肉切丁先用料酒生抽腌十分钟，下油锅炸到外壳金黄酥脆捞出，留底油把一大把干辣椒和花椒爆出香味，鸡丁回锅猛火颠两下，最后撒白芝麻和葱段，外酥里嫩越嚼越香，就着米饭我直接炫了两碗，下次还来！',
      recipe:{ is_food:true, dish_name:'干香辣子鸡丁', one_line:'外酥里嫩、越嚼越香的下饭神器', servings:2, time_minutes:25, difficulty:'medium',
        ingredients:[{name:'鸡腿肉',amount:'300g',emoji:'🍗'},{name:'干辣椒',amount:'一大把',emoji:'🌶️'},{name:'花椒',amount:'1 小勺',emoji:'🫑'},{name:'白芝麻',amount:'适量',emoji:'⚪'},{name:'葱段',amount:'2 根',emoji:'🌿'},{name:'料酒生抽',amount:'各 1 勺',emoji:'🫙'}],
        steps:[{title:'腌鸡丁',detail:'鸡腿肉切丁，加料酒、生抽抓匀腌 10 分钟。',minutes:10,icon:'mix'},{title:'炸至金黄',detail:'下油锅中火炸到外壳金黄酥脆，捞出控油。',minutes:6,icon:'pan'},{title:'爆香',detail:'留底油，下干辣椒、花椒小火爆出香味。',minutes:2,icon:'flame'},{title:'回锅颠炒',detail:'鸡丁回锅猛火颠炒两下，让香味裹匀。',minutes:2,icon:'pan'},{title:'装盘',detail:'撒白芝麻和葱段，出锅装盘。',minutes:null,icon:'plate'}],
        source_snippet:'巷子深处这家苍蝇馆子的辣子鸡丁真的绝' } },
    { em:'🥑', label:'brunch 配文',
      text:'周末睡到自然醒的慵懒 brunch ☀️ 全麦面包烤到边缘微焦，牛油果用叉子压成泥挤一点青柠汁拌匀铺上去，再卧一颗溏心水波蛋，叉子一戳金黄的蛋液缓缓流下来，最后撒现磨黑胡椒、海盐和几粒红椒碎，配一杯冰美式，治愈一整周的班味。',
      recipe:{ is_food:true, dish_name:'牛油果水波蛋吐司', one_line:'戳破溏心、流心治愈的周末 brunch', servings:1, time_minutes:15, difficulty:'easy',
        ingredients:[{name:'全麦面包',amount:'2 片',emoji:'🍞'},{name:'牛油果',amount:'1 个',emoji:'🥑'},{name:'鸡蛋',amount:'1 个',emoji:'🥚'},{name:'青柠',amount:'几滴',emoji:'🍋'},{name:'黑胡椒海盐',amount:'适量',emoji:'🧂'}],
        steps:[{title:'烤面包',detail:'全麦面包烤到边缘微焦。',minutes:3,icon:'oven'},{title:'压牛油果泥',detail:'牛油果压成泥，挤青柠汁拌匀。',minutes:2,icon:'mix'},{title:'煮水波蛋',detail:'水微沸打入鸡蛋，煮成溏心捞出。',minutes:3,icon:'pot'},{title:'组装',detail:'牛油果泥铺面包上，卧上水波蛋。',minutes:null,icon:'plate'},{title:'调味',detail:'撒现磨黑胡椒、海盐和红椒碎。',minutes:null,icon:'plate'}],
        source_snippet:'卧一颗溏心水波蛋，叉子一戳金黄的蛋液缓缓流下来' } },
    { em:'🍅', label:'家常菜文案',
      text:'妈妈的拿手番茄炒蛋🍅 三个番茄顶部划十字烫一下去皮切块，四个鸡蛋打散加一点盐，热油把蛋液炒到蓬松金黄先盛出来，锅里再放油下番茄中火炒出沙、加一小勺糖提鲜，倒回鸡蛋翻匀，出锅前撒一把葱花，酸甜开胃巨下饭，这辈子吃不腻。',
      recipe:{ is_food:true, dish_name:'妈妈的番茄炒蛋', one_line:'酸甜开胃、这辈子吃不腻的家常味', servings:2, time_minutes:12, difficulty:'easy',
        ingredients:[{name:'番茄',amount:'3 个',emoji:'🍅'},{name:'鸡蛋',amount:'4 个',emoji:'🥚'},{name:'葱花',amount:'一把',emoji:'🌿'},{name:'糖',amount:'1 小勺',emoji:'🍯'},{name:'盐',amount:'少许',emoji:'🧂'}],
        steps:[{title:'备料',detail:'番茄划十字烫去皮切块，鸡蛋打散加盐。',minutes:3,icon:'knife'},{title:'炒蛋盛出',detail:'热油把蛋液炒到蓬松金黄，先盛出来。',minutes:2,icon:'pan'},{title:'炒番茄',detail:'下番茄中火炒出沙，加一小勺糖提鲜。',minutes:3,icon:'pan'},{title:'合炒',detail:'倒回鸡蛋翻匀。',minutes:2,icon:'pan'},{title:'出锅',detail:'出锅前撒一把葱花。',minutes:null,icon:'plate'}],
        source_snippet:'下番茄中火炒出沙、加一小勺糖提鲜，倒回鸡蛋翻匀' } },
    { em:'🌙', label:'深夜放毒',
      text:'深夜报复社会系列又来了🌙 煮一锅热腾腾的螺蛳粉，酸笋的味道直冲天灵盖，米粉煮到软弹捞进碗里，浇上熬足时间的螺蛳汤底，加腐竹、炸花生、青菜和一颗入味的卤蛋，再来一勺辣油，嗦一大口辣到脑门冒汗，爽到跺脚，减肥是明天的事！',
      recipe:{ is_food:true, dish_name:'深夜螺蛳粉', one_line:'酸笋冲天灵盖、嗦到脑门冒汗', servings:1, time_minutes:20, difficulty:'easy',
        ingredients:[{name:'螺蛳粉',amount:'1 包',emoji:'🍜'},{name:'酸笋',amount:'适量',emoji:'🎋'},{name:'腐竹',amount:'几根',emoji:'🟡'},{name:'炸花生',amount:'一把',emoji:'🥜'},{name:'青菜',amount:'一把',emoji:'🥬'},{name:'卤蛋',amount:'1 颗',emoji:'🥚'}],
        steps:[{title:'熬汤底',detail:'按包装把螺蛳汤底煮开，下酸笋。',minutes:6,icon:'pot'},{title:'煮米粉',detail:'米粉煮到软弹，捞进碗里。',minutes:6,icon:'pot'},{title:'码配菜',detail:'腐竹、炸花生、青菜、卤蛋码上。',minutes:3,icon:'plate'},{title:'浇汤',detail:'浇上汤底，再来一勺辣油。',minutes:null,icon:'flame'}],
        source_snippet:'浇上熬足时间的螺蛳汤底，加腐竹、炸花生、青菜和一颗入味的卤蛋' } },
  ];

  return { ING, STAPLES, FRIDGE_SEED, RECIPES, MEALS, EXAMPLES };
})();
