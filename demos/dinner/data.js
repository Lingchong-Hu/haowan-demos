/* 今天吃什么 — 融合数据层（window.FOOD）。
   一个「吃饭大脑」，三个入口共用一条冰箱库存主线：
     ING        食材主数据：key -> {label,emoji,cat,shelf(冷藏可放天数),price¥,g克}
     STAPLES    常备调料 key（冰箱一直有，不进「先吃我」）
     FRIDGE_SEED 冰箱初始库存：{key,n,unit,days(入库至今天数)}；新鲜度 = shelf - days
     RECIPES    今晚引擎菜谱（原 ollie）：{name,emoji,minutes,blurb,need:[key],steps:[文字]}
     MEALS      一周引擎菜池（原 mealplan）：{name,meal,goalFit,tags,ingredients:[{name,cat}]}
     EXAMPLES   示例菜谱数据（原灵感档遗留，现仅 FOOD_DEV 自检用）：{em,label,text, recipe:{离线菜谱契约}}——离线即可出真菜谱
   设计：消费向，能离线即时算；连 key 才把「灵感解析任意帖子 / 个性化周计划」升级成真 AI。
   i18n：显示字段用 GG.T(zh,en) 包裹；cat/meal/tags/goalFit 键等查表值保持中文枚举不译（display 层再译）。 */
window.FOOD = (function(){
  const T = GG.T;

  /* ───────── 食材主数据 ───────── */
  // cat: 蔬菜 / 蛋白 / 乳制品 / 主食 / 调料
  const ING = {
    // 蔬菜
    tomato:   {label:T('番茄','Tomato'),   emoji:'🍅', cat:'蔬菜', shelf:7,  price:3, g:200},
    potato:   {label:T('土豆','Potato'),   emoji:'🥔', cat:'蔬菜', shelf:30, price:2, g:200},
    onion:    {label:T('洋葱','Onion'),    emoji:'🧅', cat:'蔬菜', shelf:30, price:2, g:180},
    pepper:   {label:T('青椒','Bell pepper'),   emoji:'🫑', cat:'蔬菜', shelf:7,  price:3, g:150},
    cucumber: {label:T('黄瓜','Cucumber'),   emoji:'🥒', cat:'蔬菜', shelf:6,  price:3, g:200},
    cabbage:  {label:T('白菜','Cabbage'),   emoji:'🥬', cat:'蔬菜', shelf:8,  price:4, g:400},
    mushroom: {label:T('香菇','Shiitake'),   emoji:'🍄', cat:'蔬菜', shelf:4,  price:6, g:150},
    carrot:   {label:T('胡萝卜','Carrot'), emoji:'🥕', cat:'蔬菜', shelf:21, price:2, g:150},
    corn:     {label:T('玉米','Corn'),   emoji:'🌽', cat:'蔬菜', shelf:4,  price:3, g:200},
    spinach:  {label:T('菠菜','Spinach'),   emoji:'🥬', cat:'蔬菜', shelf:3,  price:4, g:200},
    // 蛋白
    egg:      {label:T('鸡蛋','Egg'),   emoji:'🥚', cat:'蛋白', shelf:21, price:1.5, g:60},
    chicken:  {label:T('鸡肉','Chicken'),   emoji:'🍗', cat:'蛋白', shelf:3,  price:12, g:300},
    pork:     {label:T('猪肉','Pork'),   emoji:'🥩', cat:'蛋白', shelf:3,  price:14, g:300},
    beef:     {label:T('牛肉','Beef'),   emoji:'🐄', cat:'蛋白', shelf:4,  price:20, g:250},
    shrimp:   {label:T('虾','Shrimp'),     emoji:'🦐', cat:'蛋白', shelf:2,  price:18, g:200},
    tofu:     {label:T('豆腐','Tofu'),   emoji:'🧈', cat:'蛋白', shelf:4,  price:3, g:300},
    // 乳制品
    milk:     {label:T('牛奶','Milk'),   emoji:'🥛', cat:'乳制品', shelf:7,  price:6, g:250},
    yogurt:   {label:T('酸奶','Yogurt'),   emoji:'🍶', cat:'乳制品', shelf:14, price:5, g:150},
    // 主食
    rice:     {label:T('米饭','Rice'),   emoji:'🍚', cat:'主食', shelf:3,  price:2, g:200},
    noodle:   {label:T('面条','Noodles'),   emoji:'🍜', cat:'主食', shelf:180},
    flour:    {label:T('面粉','Flour'),   emoji:'🌾', cat:'主食', shelf:200},
    bread:    {label:T('面包','Bread'),   emoji:'🍞', cat:'主食', shelf:5,  price:6, g:120},
    // 调料（常备）
    soy:      {label:T('生抽','Soy sauce'),   emoji:'🫙', cat:'调料', shelf:365},
    salt:     {label:T('盐','Salt'),     emoji:'🧂', cat:'调料', shelf:3650},
    oil:      {label:T('食用油','Cooking oil'), emoji:'🛢️', cat:'调料', shelf:365},
    sugar:    {label:T('糖','Sugar'),     emoji:'🍯', cat:'调料', shelf:3650},
    vinegar:  {label:T('醋','Vinegar'),     emoji:'🍶', cat:'调料', shelf:3650},
    chili:    {label:T('辣椒','Chili'),   emoji:'🌶️', cat:'调料', shelf:365},
    garlic:   {label:T('蒜','Garlic'),     emoji:'🧄', cat:'调料', shelf:40},
    ginger:   {label:T('姜','Ginger'),     emoji:'🫚', cat:'调料', shelf:30},
    scallion: {label:T('葱','Scallion'),     emoji:'🌿', cat:'调料', shelf:10, price:1, g:50},
  };

  // 常备调料：默认一直在冰箱里，不算缺料、不进「先吃我」
  const STAPLES = ['soy','salt','oil','sugar','vinegar','chili','garlic','ginger','scallion'];

  /* ───────── 冰箱初始库存 ─────────
     days = 入库至今天数；新鲜度 daysLeft = ING.shelf - days。
     精心配比：3 样🔴该先吃 + 4 样🟡这两天 + 一批🟢新鲜，让「先吃我」一上来就有戏。 */
  const FRIDGE_SEED = [
    {key:'spinach',  n:1, unit:T('1 把','1 bunch'),    days:3},  // shelf3 → 今天就该吃 🔴
    {key:'mushroom', n:1, unit:T('1 盒','1 box'),    days:3},  // shelf4 → 明天 🔴
    {key:'milk',     n:1, unit:T('剩 ~30%','~30% left'), days:6},  // shelf7 → 明天 🔴
    {key:'tomato',   n:3, unit:T('3 个','3 pcs'),    days:5},  // shelf7 → 2 天 🟡
    {key:'tofu',     n:1, unit:T('1 盒','1 box'),    days:2},  // shelf4 → 2 天 🟡
    {key:'chicken',  n:1, unit:T('1 块','1 piece'),    days:1},  // shelf3 → 2 天 🟡
    {key:'rice',     n:1, unit:T('剩一碗','1 bowl left'),  days:1},  // shelf3 → 2 天 🟡（剩饭）
    {key:'egg',      n:5, unit:T('5 个','5 pcs'),    days:4},  // shelf21 → 还久 🟢
    {key:'pepper',   n:2, unit:T('2 个','2 pcs'),    days:2},  // 🟢
    {key:'carrot',   n:2, unit:T('2 根','2 pcs'),    days:5},  // 🟢
    {key:'cucumber', n:2, unit:T('2 根','2 pcs'),    days:2},  // 🟢
    // 常备调料（折叠展示，不参与新鲜度）
    {key:'scallion', n:1, unit:T('一小把','a small bunch'),  days:3, staple:true},
    {key:'garlic',   n:1, unit:T('一头','1 head'),    days:6, staple:true},
    {key:'ginger',   n:1, unit:T('一块','1 knob'),    days:6, staple:true},
    {key:'oil',      n:1, unit:T('一瓶','1 bottle'),    days:8, staple:true},
    {key:'salt',     n:1, unit:T('一罐','1 jar'),    days:8, staple:true},
    {key:'soy',      n:1, unit:T('一瓶','1 bottle'),    days:8, staple:true},
    {key:'sugar',    n:1, unit:T('一罐','1 jar'),    days:8, staple:true},
    {key:'vinegar',  n:1, unit:T('一瓶','1 bottle'),    days:8, staple:true},
  ];

  /* ───────── 今晚引擎菜谱（原 ollie，need 引用 ING 的 key） ───────── */
  const RECIPES = [
    { name:T('番茄炒蛋','Tomato & Egg Stir-fry'), emoji:'🍅', minutes:10, need:['tomato','egg','oil','salt','scallion'],
      blurb:T('国民下饭菜，酸甜软嫩，三两下出锅。','The national comfort dish — sweet, tangy, silky, done in minutes.'),
      steps:[T('鸡蛋打散，热油炒成块盛出','Beat the eggs, scramble in hot oil until just set, remove'),
             T('番茄切块下锅炒出汁','Cut tomatoes into chunks and fry until juicy'),
             T('倒回鸡蛋，加盐翻匀，撒葱花','Return the eggs, season with salt, toss and top with scallion')] },
    { name:T('西红柿鸡蛋面','Tomato Egg Noodle Soup'), emoji:'🍜', minutes:15, need:['tomato','egg','noodle','oil','salt'],
      blurb:T('一碗连汤带面，番茄炒蛋的汤版。','Noodles and broth in one bowl — the soupy cousin of tomato and egg.'),
      steps:[T('番茄炒出红汁，加水煮开','Fry tomatoes until they release their juices, add water and boil'),
             T('打入蛋花，加盐调味','Swirl in the beaten egg, season with salt'),
             T('另锅煮面，浇上番茄蛋汤','Cook noodles separately, ladle the tomato-egg soup on top')] },
    { name:T('蛋炒饭','Egg Fried Rice'), emoji:'🍚', minutes:12, need:['rice','egg','scallion','oil','salt'],
      blurb:T('剩饭救星，粒粒分明带蛋香。','Leftover-rice hero — every grain distinct and eggy.'),
      steps:[T('鸡蛋炒散，盛出备用','Scramble the eggs and set aside'),
             T('米饭下锅炒散，回蛋同炒','Fry the rice, breaking it up, then return the eggs'),
             T('加盐、撒葱花，翻匀出锅','Season with salt, finish with scallion, toss and serve')] },
    { name:T('青椒土豆丝','Shredded Potato with Green Pepper'), emoji:'🥔', minutes:15, need:['potato','pepper','oil','salt','vinegar'],
      blurb:T('清爽脆口，加点醋更开胃。','Crisp and refreshing — a splash of vinegar wakes it up.'),
      steps:[T('土豆切丝泡水去淀粉，青椒切丝','Shred the potato and soak off the starch; shred the pepper'),
             T('热油爆炒土豆丝至断生','Stir-fry the potato over high heat until just tender'),
             T('加青椒、盐、少许醋，快炒出锅','Add pepper, salt and a touch of vinegar, toss quickly and serve')] },
    { name:T('醋溜土豆丝','Hot & Sour Shredded Potato'), emoji:'🥔', minutes:12, need:['potato','oil','salt','vinegar','chili'],
      blurb:T('酸辣脆爽，最下饭的一盘。','Tangy, spicy, crunchy — the ultimate rice companion.'),
      steps:[T('土豆切细丝泡水沥干','Shred the potato finely, soak and drain'),
             T('热油下干辣椒，倒土豆丝快炒','Sizzle dried chilies in hot oil, add the potato and stir-fry fast'),
             T('沿锅边淋醋，加盐翻匀','Splash vinegar down the side of the wok, season and toss')] },
    { name:T('黄瓜拌虾','Shrimp & Cucumber Salad'), emoji:'🦐', minutes:12, need:['cucumber','shrimp','garlic','salt','vinegar'],
      blurb:T('白灼虾配脆黄瓜，清爽不腻。','Poached shrimp with crisp cucumber — light and clean.'),
      steps:[T('虾焯水剥壳，黄瓜拍碎','Blanch and peel the shrimp; smash the cucumber'),
             T('蒜末、盐、醋调汁','Whisk garlic, salt and vinegar into a dressing'),
             T('和虾、黄瓜拌匀','Toss with the shrimp and cucumber')] },
    { name:T('蒜蓉炒白菜','Garlic Stir-fried Cabbage'), emoji:'🥬', minutes:10, need:['cabbage','garlic','oil','salt'],
      blurb:T('清甜爽口，蒜香十足。','Sweet, crunchy and full of garlic aroma.'),
      steps:[T('白菜切片，蒜切末','Slice the cabbage, mince the garlic'),
             T('热油爆香蒜末','Sizzle the garlic in hot oil until fragrant'),
             T('下白菜大火快炒，加盐出锅','Add cabbage, stir-fry on high heat, season and serve')] },
    { name:T('香菇滑鸡','Braised Chicken with Shiitake'), emoji:'🍗', minutes:20, need:['chicken','mushroom','ginger','soy','oil'],
      blurb:T('鸡肉滑嫩，香菇吸饱汤汁。','Silky chicken with shiitake soaking up all the sauce.'),
      steps:[T('鸡肉切块，香菇切片，姜切片','Cut chicken into chunks, slice the shiitake and ginger'),
             T('热油爆姜，下鸡肉炒变色','Sizzle the ginger, add chicken and fry until it turns pale'),
             T('加香菇、生抽，焖煮入味','Add shiitake and soy sauce, braise until flavorful')] },
    { name:T('青椒炒肉','Pork & Pepper Stir-fry'), emoji:'🥩', minutes:15, need:['pork','pepper','garlic','soy','oil'],
      blurb:T('家常硬菜，咸香下饭。','A homestyle classic — savory and made for rice.'),
      steps:[T('猪肉切片，青椒切块','Slice the pork, cut the pepper into pieces'),
             T('热油下肉片炒变色','Fry the pork in hot oil until it changes color'),
             T('加蒜、青椒、生抽翻炒出锅','Add garlic, pepper and soy sauce, toss and serve')] },
    { name:T('洋葱炒牛肉','Beef & Onion Stir-fry'), emoji:'🐄', minutes:18, need:['beef','onion','soy','oil','garlic'],
      blurb:T('牛肉嫩滑，洋葱回甜。','Tender beef, sweet caramelized onion.'),
      steps:[T('牛肉切片用生抽抓匀，洋葱切丝','Slice the beef and massage with soy sauce; slice the onion'),
             T('热油大火快炒牛肉盛出','Flash-fry the beef over high heat, remove'),
             T('炒洋葱至软，回牛肉翻匀','Fry the onion until soft, return the beef and toss')] },
    { name:T('麻婆豆腐','Mapo Tofu'), emoji:'🧈', minutes:18, need:['tofu','pork','chili','soy','garlic','scallion'],
      blurb:T('麻辣鲜烫，豆腐嫩到入口即化。','Numbing, spicy, blistering hot — tofu that melts in your mouth.'),
      steps:[T('豆腐切块焯水，肉末备好','Blanch the tofu cubes; get the ground pork ready'),
             T('炒香肉末、辣椒、蒜','Fry the pork with chili and garlic until fragrant'),
             T('下豆腐与生抽烧入味，撒葱花','Add tofu and soy sauce, simmer to absorb, top with scallion')] },
    { name:T('番茄牛腩汤','Tomato Beef Stew'), emoji:'🍲', minutes:25, need:['tomato','beef','onion','salt','ginger'],
      blurb:T('酸甜浓郁，连汤带肉都满足。','Rich and tangy-sweet — satisfying broth and meat in one pot.'),
      steps:[T('牛肉焯水，番茄洋葱切块','Blanch the beef; chunk the tomatoes and onion'),
             T('姜片爆香，下牛肉与番茄','Sizzle the ginger slices, add beef and tomatoes'),
             T('加水炖煮至软烂，加盐调味','Add water, simmer until tender, season with salt')] },
    { name:T('胡萝卜炒蛋','Carrot & Egg Scramble'), emoji:'🥕', minutes:10, need:['carrot','egg','oil','salt'],
      blurb:T('颜色好看，清甜营养。','Bright color, gentle sweetness, plenty of nutrition.'),
      steps:[T('胡萝卜切丝，鸡蛋打散','Shred the carrot, beat the eggs'),
             T('炒蛋盛出，炒软胡萝卜丝','Scramble the eggs and set aside; soften the carrot'),
             T('回蛋加盐翻匀出锅','Return the eggs, season with salt, toss and serve')] },
    { name:T('葱油拌面','Scallion Oil Noodles'), emoji:'🍜', minutes:12, need:['noodle','scallion','soy','oil','sugar'],
      blurb:T('葱香扑鼻，简单却让人上瘾。','Fragrant scallion oil — simple and addictive.'),
      steps:[T('葱段小火熬出葱油','Slowly render scallion segments into fragrant oil'),
             T('生抽加糖调成酱汁','Mix soy sauce and sugar into a dressing'),
             T('煮面拌入葱油与酱汁','Boil the noodles and toss with the scallion oil and sauce')] },
    { name:T('玉米炒虾仁','Shrimp & Corn Stir-fry'), emoji:'🌽', minutes:15, need:['corn','shrimp','oil','salt','scallion'],
      blurb:T('清甜弹牙，老少都爱。','Sweet, springy, loved by all ages.'),
      steps:[T('虾仁焯水，玉米粒备好','Blanch the shrimp; get the corn kernels ready'),
             T('热油下玉米炒香','Fry the corn in hot oil until fragrant'),
             T('加虾仁、盐快炒，撒葱花','Add shrimp and salt, stir-fry fast, finish with scallion')] },
    { name:T('家常煎豆腐','Pan-fried Tofu'), emoji:'🧈', minutes:15, need:['tofu','soy','oil','garlic','scallion'],
      blurb:T('外焦里嫩，浇汁咸香。','Crisp outside, silky inside, with a savory glaze.'),
      steps:[T('豆腐切片煎至两面金黄','Pan-fry tofu slices until golden on both sides'),
             T('蒜末爆香，加生抽调汁','Sizzle minced garlic, add soy sauce for the glaze'),
             T('浇在豆腐上，撒葱花','Pour over the tofu and top with scallion')] },
    { name:T('番茄豆腐汤','Tomato Tofu Soup'), emoji:'🍲', minutes:15, need:['tomato','tofu','egg','salt','scallion'],
      blurb:T('清爽暖胃，三样主料就成汤。','Light and warming — three ingredients make a soup.'),
      steps:[T('番茄炒出汁，加水煮开','Fry the tomatoes until juicy, add water and boil'),
             T('下豆腐块煮几分钟','Add tofu cubes and cook a few minutes'),
             T('淋蛋花，加盐撒葱花','Swirl in the egg, season with salt, top with scallion')] },
    { name:T('凉拌黄瓜','Smashed Cucumber Salad'), emoji:'🥒', minutes:8, need:['cucumber','garlic','salt','vinegar','oil'],
      blurb:T('拍一拍拌一拌，几分钟上桌。','Smash, toss, done — on the table in minutes.'),
      steps:[T('黄瓜拍碎切段','Smash the cucumber and cut into pieces'),
             T('蒜末、盐、醋、香油调汁','Mix garlic, salt, vinegar and sesame oil into a dressing'),
             T('拌匀腌几分钟即可','Toss and let it sit a few minutes')] },
  ];

  /* ───────── 一周引擎菜池（原 mealplan，name 制） ───────── */
  const OIL={name:T('食用油','Cooking oil'),cat:'调料'}, SALT={name:T('盐','Salt'),cat:'调料'}, SOY={name:T('生抽','Soy sauce'),cat:'调料'},
        GARLIC={name:T('蒜','Garlic'),cat:'调料'}, GINGER={name:T('姜','Ginger'),cat:'调料'}, SUGAR={name:T('糖','Sugar'),cat:'调料'},
        CHILI={name:T('辣椒','Chili'),cat:'调料'}, BPEP={name:T('黑胡椒','Black pepper'),cat:'调料'};
  const MEALS = [
    // 早餐
    { name:T('燕麦牛奶碗（配蓝莓）','Oatmeal Bowl with Blueberries'), meal:'早', goalFit:{减脂:2,增肌:1,均衡:2}, tags:['素','麸质','牛奶'],
      ingredients:[{name:T('燕麦片','Rolled oats'),cat:'主食'},{name:T('牛奶','Milk'),cat:'其他'},{name:T('蓝莓','Blueberries'),cat:'蔬菜'},{name:T('蜂蜜','Honey'),cat:'调料'}] },
    { name:T('水煮蛋 + 全麦吐司','Boiled Eggs & Whole-wheat Toast'), meal:'早', goalFit:{减脂:2,增肌:2,均衡:2}, tags:['素','麸质'],
      ingredients:[{name:T('鸡蛋','Egg'),cat:'肉蛋'},{name:T('全麦面包','Whole-wheat Bread'),cat:'主食'},SALT] },
    { name:T('豆浆油条','Soy Milk & Youtiao'), meal:'早', goalFit:{减脂:0,增肌:1,均衡:1}, tags:['素','麸质'],
      ingredients:[{name:T('黄豆','Soybeans'),cat:'其他'},{name:T('油条','Youtiao'),cat:'主食'},OIL] },
    { name:T('鸡胸三明治','Chicken Breast Sandwich'), meal:'早', goalFit:{减脂:2,增肌:2,均衡:1}, tags:['麸质'],
      ingredients:[{name:T('鸡胸肉','Chicken breast'),cat:'肉蛋'},{name:T('全麦面包','Whole-wheat Bread'),cat:'主食'},{name:T('生菜','Lettuce'),cat:'蔬菜'},{name:T('番茄','Tomato'),cat:'蔬菜'},SALT] },
    { name:T('蔬菜杂粮粥','Veggie Multigrain Congee'), meal:'早', goalFit:{减脂:2,增肌:0,均衡:2}, tags:['素'],
      ingredients:[{name:T('小米','Millet'),cat:'主食'},{name:T('南瓜','Pumpkin'),cat:'蔬菜'},{name:T('胡萝卜','Carrot'),cat:'蔬菜'},SALT] },
    { name:T('希腊酸奶坚果杯','Greek Yogurt Nut Cup'), meal:'早', goalFit:{减脂:1,增肌:2,均衡:1}, tags:['素','牛奶','坚果'],
      ingredients:[{name:T('酸奶','Yogurt'),cat:'其他'},{name:T('核桃','Walnuts'),cat:'其他'},{name:T('香蕉','Banana'),cat:'蔬菜'}] },
    { name:T('番茄鸡蛋面','Tomato Egg Noodles'), meal:'早', goalFit:{减脂:1,增肌:1,均衡:2}, tags:['素','麸质'],
      ingredients:[{name:T('面条','Noodles'),cat:'主食'},{name:T('番茄','Tomato'),cat:'蔬菜'},{name:T('鸡蛋','Egg'),cat:'肉蛋'},OIL,SALT] },
    { name:T('藜麦蔬菜碗','Quinoa Veggie Bowl'), meal:'早', goalFit:{减脂:2,增肌:1,均衡:2}, tags:['素'],
      ingredients:[{name:T('藜麦','Quinoa'),cat:'主食'},{name:T('牛油果','Avocado'),cat:'蔬菜'},{name:T('圣女果','Cherry tomatoes'),cat:'蔬菜'},{name:T('菠菜','Spinach'),cat:'蔬菜'},OIL,SALT] },
    { name:T('香蕉花生酱吐司','Banana Peanut Butter Toast'), meal:'早', goalFit:{减脂:0,增肌:2,均衡:1}, tags:['素','麸质','坚果'],
      ingredients:[{name:T('全麦面包','Whole-wheat Bread'),cat:'主食'},{name:T('花生酱','Peanut butter'),cat:'其他'},{name:T('香蕉','Banana'),cat:'蔬菜'}] },
    { name:T('蒸玉米 + 水煮蛋','Steamed Corn & Boiled Egg'), meal:'早', goalFit:{减脂:2,增肌:1,均衡:2}, tags:['素'],
      ingredients:[{name:T('玉米','Corn'),cat:'蔬菜'},{name:T('鸡蛋','Egg'),cat:'肉蛋'}] },
    { name:T('虾仁蔬菜煎蛋','Shrimp & Veggie Omelet'), meal:'早', goalFit:{减脂:2,增肌:2,均衡:1}, tags:['海鲜'],
      ingredients:[{name:T('虾仁','Shrimp'),cat:'肉蛋'},{name:T('鸡蛋','Egg'),cat:'肉蛋'},{name:T('西兰花','Broccoli'),cat:'蔬菜'},OIL,SALT] },
    { name:T('红薯 + 牛奶','Sweet Potato & Milk'), meal:'早', goalFit:{减脂:2,增肌:1,均衡:2}, tags:['素','牛奶'],
      ingredients:[{name:T('红薯','Sweet potato'),cat:'主食'},{name:T('牛奶','Milk'),cat:'其他'}] },
    // 午餐
    { name:T('香煎鸡胸 + 糙米饭','Seared Chicken Breast & Brown Rice'), meal:'午', goalFit:{减脂:2,增肌:2,均衡:2}, tags:[],
      ingredients:[{name:T('鸡胸肉','Chicken breast'),cat:'肉蛋'},{name:T('糙米','Brown rice'),cat:'主食'},{name:T('西兰花','Broccoli'),cat:'蔬菜'},OIL,SALT,BPEP] },
    { name:T('番茄牛腩饭','Tomato Beef Rice Bowl'), meal:'午', goalFit:{减脂:1,增肌:2,均衡:2}, tags:[],
      ingredients:[{name:T('牛肉','Beef'),cat:'肉蛋'},{name:T('番茄','Tomato'),cat:'蔬菜'},{name:T('米饭','Rice'),cat:'主食'},{name:T('洋葱','Onion'),cat:'蔬菜'},OIL,SALT,GINGER] },
    { name:T('麻婆豆腐盖饭','Mapo Tofu Rice Bowl'), meal:'午', goalFit:{减脂:1,增肌:1,均衡:2}, tags:['辣','素'],
      ingredients:[{name:T('豆腐','Tofu'),cat:'肉蛋'},{name:T('米饭','Rice'),cat:'主食'},CHILI,OIL,SOY,GARLIC] },
    { name:T('清蒸鲈鱼 + 米饭','Steamed Sea Bass & Rice'), meal:'午', goalFit:{减脂:2,增肌:2,均衡:2}, tags:['海鲜'],
      ingredients:[{name:T('鲈鱼','Sea bass'),cat:'肉蛋'},{name:T('米饭','Rice'),cat:'主食'},{name:T('葱','Scallion'),cat:'蔬菜'},GINGER,SOY,OIL] },
    { name:T('素炒时蔬 + 杂粮饭','Stir-fried Veggies & Multigrain Rice'), meal:'午', goalFit:{减脂:2,增肌:0,均衡:2}, tags:['素'],
      ingredients:[{name:T('青椒','Bell pepper'),cat:'蔬菜'},{name:T('胡萝卜','Carrot'),cat:'蔬菜'},{name:T('木耳','Wood ear'),cat:'蔬菜'},{name:T('糙米','Brown rice'),cat:'主食'},OIL,SALT,GARLIC] },
    { name:T('宫保鸡丁饭','Kung Pao Chicken Rice'), meal:'午', goalFit:{减脂:1,增肌:2,均衡:1}, tags:['辣','坚果'],
      ingredients:[{name:T('鸡腿肉','Chicken thigh'),cat:'肉蛋'},{name:T('米饭','Rice'),cat:'主食'},{name:T('花生','Peanuts'),cat:'其他'},{name:T('黄瓜','Cucumber'),cat:'蔬菜'},CHILI,SOY,OIL,SUGAR] },
    { name:T('牛肉藜麦沙拉','Beef Quinoa Salad'), meal:'午', goalFit:{减脂:2,增肌:2,均衡:1}, tags:[],
      ingredients:[{name:T('牛肉','Beef'),cat:'肉蛋'},{name:T('藜麦','Quinoa'),cat:'主食'},{name:T('生菜','Lettuce'),cat:'蔬菜'},{name:T('圣女果','Cherry tomatoes'),cat:'蔬菜'},OIL,SALT,BPEP] },
    { name:T('三文鱼牛油果饭','Salmon Avocado Rice Bowl'), meal:'午', goalFit:{减脂:2,增肌:2,均衡:2}, tags:['海鲜'],
      ingredients:[{name:T('三文鱼','Salmon'),cat:'肉蛋'},{name:T('牛油果','Avocado'),cat:'蔬菜'},{name:T('米饭','Rice'),cat:'主食'},SOY,OIL] },
    { name:T('西红柿鸡蛋盖饭','Tomato & Egg Rice Bowl'), meal:'午', goalFit:{减脂:1,增肌:1,均衡:2}, tags:['素'],
      ingredients:[{name:T('番茄','Tomato'),cat:'蔬菜'},{name:T('鸡蛋','Egg'),cat:'肉蛋'},{name:T('米饭','Rice'),cat:'主食'},OIL,SALT,SUGAR] },
    { name:T('香菇滑鸡饭','Chicken & Shiitake Rice'), meal:'午', goalFit:{减脂:1,增肌:2,均衡:2}, tags:[],
      ingredients:[{name:T('鸡腿肉','Chicken thigh'),cat:'肉蛋'},{name:T('香菇','Shiitake'),cat:'蔬菜'},{name:T('米饭','Rice'),cat:'主食'},GINGER,SOY,OIL] },
    { name:T('凉拌鸡丝荞麦面','Cold Soba with Shredded Chicken'), meal:'午', goalFit:{减脂:2,增肌:1,均衡:1}, tags:['辣'],
      ingredients:[{name:T('鸡胸肉','Chicken breast'),cat:'肉蛋'},{name:T('荞麦面','Soba noodles'),cat:'主食'},{name:T('黄瓜','Cucumber'),cat:'蔬菜'},CHILI,SOY,GARLIC] },
    { name:T('豆腐蔬菜杂烩饭','Tofu Veggie Rice Bowl'), meal:'午', goalFit:{减脂:2,增肌:1,均衡:2}, tags:['素'],
      ingredients:[{name:T('豆腐','Tofu'),cat:'肉蛋'},{name:T('西兰花','Broccoli'),cat:'蔬菜'},{name:T('胡萝卜','Carrot'),cat:'蔬菜'},{name:T('糙米','Brown rice'),cat:'主食'},OIL,SALT,SOY] },
    // 晚餐
    { name:T('白灼西兰花 + 蒸鸡胸','Blanched Broccoli & Steamed Chicken'), meal:'晚', goalFit:{减脂:2,增肌:2,均衡:1}, tags:[],
      ingredients:[{name:T('西兰花','Broccoli'),cat:'蔬菜'},{name:T('鸡胸肉','Chicken breast'),cat:'肉蛋'},OIL,SALT,GARLIC] },
    { name:T('番茄豆腐汤 + 杂粮饭','Tomato Tofu Soup & Multigrain Rice'), meal:'晚', goalFit:{减脂:2,增肌:1,均衡:2}, tags:['素'],
      ingredients:[{name:T('番茄','Tomato'),cat:'蔬菜'},{name:T('豆腐','Tofu'),cat:'肉蛋'},{name:T('糙米','Brown rice'),cat:'主食'},SALT,OIL] },
    { name:T('青椒炒牛肉 + 米饭','Pepper Beef Stir-fry & Rice'), meal:'晚', goalFit:{减脂:1,增肌:2,均衡:2}, tags:['辣'],
      ingredients:[{name:T('牛肉','Beef'),cat:'肉蛋'},{name:T('青椒','Bell pepper'),cat:'蔬菜'},{name:T('米饭','Rice'),cat:'主食'},CHILI,SOY,OIL,GARLIC] },
    { name:T('蒜蓉粉丝蒸虾','Garlic Vermicelli Steamed Shrimp'), meal:'晚', goalFit:{减脂:2,增肌:2,均衡:1}, tags:['海鲜'],
      ingredients:[{name:T('虾','Shrimp'),cat:'肉蛋'},{name:T('粉丝','Glass noodles'),cat:'主食'},GARLIC,OIL,SOY] },
    { name:T('手撕包菜 + 糙米饭','Hand-torn Cabbage & Brown Rice'), meal:'晚', goalFit:{减脂:2,增肌:0,均衡:2}, tags:['辣','素'],
      ingredients:[{name:T('圆白菜','Green Cabbage'),cat:'蔬菜'},{name:T('糙米','Brown rice'),cat:'主食'},CHILI,OIL,SALT,GARLIC] },
    { name:T('照烧鸡腿 + 蔬菜','Teriyaki Chicken & Veggies'), meal:'晚', goalFit:{减脂:1,增肌:2,均衡:2}, tags:[],
      ingredients:[{name:T('鸡腿肉','Chicken thigh'),cat:'肉蛋'},{name:T('西兰花','Broccoli'),cat:'蔬菜'},{name:T('米饭','Rice'),cat:'主食'},SOY,SUGAR,OIL,GINGER] },
    { name:T('冬瓜排骨汤 + 米饭','Winter Melon Rib Soup & Rice'), meal:'晚', goalFit:{减脂:1,增肌:1,均衡:2}, tags:[],
      ingredients:[{name:T('排骨','Pork ribs'),cat:'肉蛋'},{name:T('冬瓜','Winter melon'),cat:'蔬菜'},{name:T('米饭','Rice'),cat:'主食'},GINGER,SALT] },
    { name:T('清炒菠菜 + 蒸鱼','Sautéed Spinach & Steamed Fish'), meal:'晚', goalFit:{减脂:2,增肌:2,均衡:2}, tags:['海鲜'],
      ingredients:[{name:T('菠菜','Spinach'),cat:'蔬菜'},{name:T('鲈鱼','Sea bass'),cat:'肉蛋'},OIL,SALT,GINGER] },
    { name:T('蔬菜豆腐火锅','Veggie Tofu Hot Pot'), meal:'晚', goalFit:{减脂:2,增肌:1,均衡:2}, tags:['辣','素'],
      ingredients:[{name:T('豆腐','Tofu'),cat:'肉蛋'},{name:T('金针菇','Enoki'),cat:'蔬菜'},{name:T('生菜','Lettuce'),cat:'蔬菜'},{name:T('白菜','Cabbage'),cat:'蔬菜'},CHILI,SALT] },
    { name:T('香煎三文鱼 + 芦笋','Seared Salmon & Asparagus'), meal:'晚', goalFit:{减脂:2,增肌:2,均衡:1}, tags:['海鲜'],
      ingredients:[{name:T('三文鱼','Salmon'),cat:'肉蛋'},{name:T('芦笋','Asparagus'),cat:'蔬菜'},OIL,SALT,BPEP] },
    { name:T('土豆炖牛肉 + 米饭','Beef & Potato Stew with Rice'), meal:'晚', goalFit:{减脂:0,增肌:2,均衡:2}, tags:[],
      ingredients:[{name:T('牛肉','Beef'),cat:'肉蛋'},{name:T('土豆','Potato'),cat:'蔬菜'},{name:T('胡萝卜','Carrot'),cat:'蔬菜'},{name:T('米饭','Rice'),cat:'主食'},SOY,OIL,GINGER] },
    { name:T('蒜香口蘑炒蛋','Garlic Mushroom Scramble'), meal:'晚', goalFit:{减脂:2,增肌:1,均衡:2}, tags:['素'],
      ingredients:[{name:T('口蘑','Button mushrooms'),cat:'蔬菜'},{name:T('鸡蛋','Egg'),cat:'肉蛋'},{name:T('糙米','Brown rice'),cat:'主食'},GARLIC,OIL,SALT] },
  ];

  /* ───────── 灵感示例帖（含离线菜谱契约，未连 key 也能出真菜谱） ─────────
     recipe 字段同 dinner 引擎契约：is_food/dish_name/one_line/servings/time_minutes/
     difficulty/ingredients[{name,amount,emoji}]/steps[{title,detail,minutes,icon}]/source_snippet
     icon ∈ knife pan pot oven mix timer plate flame
     （text 为原帖长文，现无任何渲染路径，仅存档用——保持中文原文不译。） */
  const EXAMPLES = [
    { em:'🌶️', label:T('爆款探店帖','Viral food-stall post'),
      text:'家人们谁懂啊！！巷子深处这家苍蝇馆子的辣子鸡丁真的绝🌶️ 鸡腿肉切丁先用料酒生抽腌十分钟，下油锅炸到外壳金黄酥脆捞出，留底油把一大把干辣椒和花椒爆出香味，鸡丁回锅猛火颠两下，最后撒白芝麻和葱段，外酥里嫩越嚼越香，就着米饭我直接炫了两碗，下次还来！',
      recipe:{ is_food:true, dish_name:T('干香辣子鸡丁','Chongqing Chili Chicken'), one_line:T('外酥里嫩、越嚼越香的下饭神器','Crisp outside, tender inside — dangerously good with rice'), servings:2, time_minutes:25, difficulty:'medium',
        ingredients:[{name:T('鸡腿肉','Chicken thigh'),amount:'300g',emoji:'🍗'},{name:T('干辣椒','Dried Chili'),amount:T('一大把','a big handful'),emoji:'🌶️'},{name:T('花椒','Sichuan peppercorns'),amount:T('1 小勺','1 tsp'),emoji:'🫑'},{name:T('白芝麻','White sesame'),amount:T('适量','to taste'),emoji:'⚪'},{name:T('葱段','Scallion segments'),amount:T('2 根','2 stalks'),emoji:'🌿'},{name:T('料酒生抽','Cooking wine & Soy sauce'),amount:T('各 1 勺','1 tbsp each'),emoji:'🫙'}],
        steps:[{title:T('腌鸡丁','Marinate'),detail:T('鸡腿肉切丁，加料酒、生抽抓匀腌 10 分钟。','Dice the chicken thigh, massage with cooking wine and soy sauce, marinate 10 minutes.'),minutes:10,icon:'mix'},{title:T('炸至金黄','Fry until golden'),detail:T('下油锅中火炸到外壳金黄酥脆，捞出控油。','Deep-fry over medium heat until golden and crisp, then drain.'),minutes:6,icon:'pan'},{title:T('爆香','Bloom the aromatics'),detail:T('留底油，下干辣椒、花椒小火爆出香味。','In the remaining oil, toast the dried chilies and peppercorns over low heat.'),minutes:2,icon:'flame'},{title:T('回锅颠炒','Toss on high heat'),detail:T('鸡丁回锅猛火颠炒两下，让香味裹匀。','Return the chicken and toss hard over max heat to coat in the aroma.'),minutes:2,icon:'pan'},{title:T('装盘','Plate'),detail:T('撒白芝麻和葱段，出锅装盘。','Sprinkle white sesame and scallion, plate and serve.'),minutes:null,icon:'plate'}],
        source_snippet:T('巷子深处这家苍蝇馆子的辣子鸡丁真的绝','The chili chicken at that hole-in-the-wall down the alley is unreal') } },
    { em:'🥑', label:T('brunch 配文','Brunch caption'),
      text:'周末睡到自然醒的慵懒 brunch ☀️ 全麦面包烤到边缘微焦，牛油果用叉子压成泥挤一点青柠汁拌匀铺上去，再卧一颗溏心水波蛋，叉子一戳金黄的蛋液缓缓流下来，最后撒现磨黑胡椒、海盐和几粒红椒碎，配一杯冰美式，治愈一整周的班味。',
      recipe:{ is_food:true, dish_name:T('牛油果水波蛋吐司','Avocado Toast with Poached Egg'), one_line:T('戳破溏心、流心治愈的周末 brunch','A weekend brunch healed by one runny yolk'), servings:1, time_minutes:15, difficulty:'easy',
        ingredients:[{name:T('全麦面包','Whole-wheat Bread'),amount:T('2 片','2 slices'),emoji:'🍞'},{name:T('牛油果','Avocado'),amount:T('1 个','1'),emoji:'🥑'},{name:T('鸡蛋','Egg'),amount:T('1 个','1'),emoji:'🥚'},{name:T('青柠','Lime'),amount:T('几滴','a few drops'),emoji:'🍋'},{name:T('黑胡椒海盐','Black pepper & sea salt'),amount:T('适量','to taste'),emoji:'🧂'}],
        steps:[{title:T('烤面包','Toast the bread'),detail:T('全麦面包烤到边缘微焦。','Toast until the edges just char.'),minutes:3,icon:'oven'},{title:T('压牛油果泥','Mash the avocado'),detail:T('牛油果压成泥，挤青柠汁拌匀。','Mash the avocado with a squeeze of lime.'),minutes:2,icon:'mix'},{title:T('煮水波蛋','Poach the egg'),detail:T('水微沸打入鸡蛋，煮成溏心捞出。','Slide the egg into barely simmering water, poach until runny.'),minutes:3,icon:'pot'},{title:T('组装','Assemble'),detail:T('牛油果泥铺面包上，卧上水波蛋。','Spread the avocado on the toast, set the egg on top.'),minutes:null,icon:'plate'},{title:T('调味','Season'),detail:T('撒现磨黑胡椒、海盐和红椒碎。','Finish with cracked black pepper, sea salt and chili flakes.'),minutes:null,icon:'plate'}],
        source_snippet:T('卧一颗溏心水波蛋，叉子一戳金黄的蛋液缓缓流下来','a poached egg on top — one poke and the golden yolk slowly runs down') } },
    { em:'🍅', label:T('家常菜文案','Homestyle classic'),
      text:'妈妈的拿手番茄炒蛋🍅 三个番茄顶部划十字烫一下去皮切块，四个鸡蛋打散加一点盐，热油把蛋液炒到蓬松金黄先盛出来，锅里再放油下番茄中火炒出沙、加一小勺糖提鲜，倒回鸡蛋翻匀，出锅前撒一把葱花，酸甜开胃巨下饭，这辈子吃不腻。',
      recipe:{ is_food:true, dish_name:T('妈妈的番茄炒蛋',"Mom's Tomato & Egg"), one_line:T('酸甜开胃、这辈子吃不腻的家常味','Sweet, tangy and homey — you never get tired of it'), servings:2, time_minutes:12, difficulty:'easy',
        ingredients:[{name:T('番茄','Tomato'),amount:T('3 个','3'),emoji:'🍅'},{name:T('鸡蛋','Egg'),amount:T('4 个','4'),emoji:'🥚'},{name:T('葱花','Chopped Scallion'),amount:T('一把','a handful'),emoji:'🌿'},{name:T('糖','Sugar'),amount:T('1 小勺','1 tsp'),emoji:'🍯'},{name:T('盐','Salt'),amount:T('少许','a pinch'),emoji:'🧂'}],
        steps:[{title:T('备料','Prep'),detail:T('番茄划十字烫去皮切块，鸡蛋打散加盐。','Score, blanch and peel the tomatoes, cut into chunks; beat the eggs with salt.'),minutes:3,icon:'knife'},{title:T('炒蛋盛出','Scramble and remove'),detail:T('热油把蛋液炒到蓬松金黄，先盛出来。','Scramble the eggs in hot oil until fluffy and golden; set aside.'),minutes:2,icon:'pan'},{title:T('炒番茄','Cook the tomatoes'),detail:T('下番茄中火炒出沙，加一小勺糖提鲜。','Fry the tomatoes over medium heat until saucy; add a teaspoon of sugar.'),minutes:3,icon:'pan'},{title:T('合炒','Combine'),detail:T('倒回鸡蛋翻匀。','Return the eggs and toss to coat.'),minutes:2,icon:'pan'},{title:T('出锅','Serve'),detail:T('出锅前撒一把葱花。','Finish with a handful of scallion.'),minutes:null,icon:'plate'}],
        source_snippet:T('下番茄中火炒出沙、加一小勺糖提鲜，倒回鸡蛋翻匀','fry the tomatoes until saucy, a spoon of sugar to lift them, then fold the eggs back in') } },
    { em:'🌙', label:T('深夜放毒','Midnight cravings'),
      text:'深夜报复社会系列又来了🌙 煮一锅热腾腾的螺蛳粉，酸笋的味道直冲天灵盖，米粉煮到软弹捞进碗里，浇上熬足时间的螺蛳汤底，加腐竹、炸花生、青菜和一颗入味的卤蛋，再来一勺辣油，嗦一大口辣到脑门冒汗，爽到跺脚，减肥是明天的事！',
      recipe:{ is_food:true, dish_name:T('深夜螺蛳粉','Midnight Luosifen'), one_line:T('酸笋冲天灵盖、嗦到脑门冒汗','Funky bamboo shoots, slurp-till-you-sweat spicy'), servings:1, time_minutes:20, difficulty:'easy',
        ingredients:[{name:T('螺蛳粉','Luosifen kit'),amount:T('1 包','1 pack'),emoji:'🍜'},{name:T('酸笋','Pickled bamboo shoots'),amount:T('适量','to taste'),emoji:'🎋'},{name:T('腐竹','Bean curd sticks'),amount:T('几根','a few sticks'),emoji:'🟡'},{name:T('炸花生','Fried peanuts'),amount:T('一把','a handful'),emoji:'🥜'},{name:T('青菜','Leafy greens'),amount:T('一把','a handful'),emoji:'🥬'},{name:T('卤蛋','Braised egg'),amount:T('1 颗','1'),emoji:'🥚'}],
        steps:[{title:T('熬汤底','Make the broth'),detail:T('按包装把螺蛳汤底煮开，下酸笋。','Boil the luosifen broth per the pack, add the pickled bamboo shoots.'),minutes:6,icon:'pot'},{title:T('煮米粉','Cook the noodles'),detail:T('米粉煮到软弹，捞进碗里。','Boil the rice noodles until springy, transfer to a bowl.'),minutes:6,icon:'pot'},{title:T('码配菜','Add the toppings'),detail:T('腐竹、炸花生、青菜、卤蛋码上。','Arrange the bean curd sticks, fried peanuts, greens and braised egg.'),minutes:3,icon:'plate'},{title:T('浇汤','Pour the broth'),detail:T('浇上汤底，再来一勺辣油。','Ladle over the broth and add a spoonful of chili oil.'),minutes:null,icon:'flame'}],
        source_snippet:T('浇上熬足时间的螺蛳汤底，加腐竹、炸花生、青菜和一颗入味的卤蛋','ladle on the long-simmered broth, add bean curd sticks, fried peanuts, greens and a braised egg') } },
  ];

  return { ING, STAPLES, FRIDGE_SEED, RECIPES, MEALS, EXAMPLES };
})();
