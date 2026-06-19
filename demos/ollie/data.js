/* ollie — 冰箱出菜谱 数据。
   INGREDIENTS：分类 + 每项 {key,label,emoji}（key 唯一，RECIPES.need 引用它）。
   RECIPES：每道 {name,emoji,need:[ingredient key...],steps,minutes,blurb}。
   设计原则：need 尽量克制（2~5 样），覆盖常见家常组合，保证勾常见食材就有 0 缺料的菜。 */
window.OLLIE = (function(){

  const INGREDIENTS = [
    { cat:'蔬菜', items:[
      { key:'tomato',   label:'番茄',   emoji:'🍅' },
      { key:'potato',   label:'土豆',   emoji:'🥔' },
      { key:'onion',    label:'洋葱',   emoji:'🧅' },
      { key:'scallion', label:'葱',     emoji:'🌿' },
      { key:'garlic',   label:'蒜',     emoji:'🧄' },
      { key:'ginger',   label:'姜',     emoji:'🫚' },
      { key:'pepper',   label:'青椒',   emoji:'🫑' },
      { key:'cucumber', label:'黄瓜',   emoji:'🥒' },
      { key:'cabbage',  label:'白菜',   emoji:'🥬' },
      { key:'mushroom', label:'香菇',   emoji:'🍄' },
      { key:'carrot',   label:'胡萝卜', emoji:'🥕' },
      { key:'corn',     label:'玉米',   emoji:'🌽' },
    ]},
    { cat:'蛋白', items:[
      { key:'egg',      label:'鸡蛋',   emoji:'🥚' },
      { key:'chicken',  label:'鸡肉',   emoji:'🍗' },
      { key:'pork',     label:'猪肉',   emoji:'🥩' },
      { key:'beef',     label:'牛肉',   emoji:'🐄' },
      { key:'shrimp',   label:'虾',     emoji:'🦐' },
      { key:'tofu',     label:'豆腐',   emoji:'🧈' },
    ]},
    { cat:'主食', items:[
      { key:'rice',     label:'米饭',   emoji:'🍚' },
      { key:'noodle',   label:'面条',   emoji:'🍜' },
      { key:'flour',    label:'面粉',   emoji:'🌾' },
      { key:'bread',    label:'面包',   emoji:'🍞' },
    ]},
    { cat:'调料', items:[
      { key:'soy',      label:'生抽',   emoji:'🫙' },
      { key:'salt',     label:'盐',     emoji:'🧂' },
      { key:'oil',      label:'食用油', emoji:'🛢️' },
      { key:'sugar',    label:'糖',     emoji:'🍯' },
      { key:'vinegar',  label:'醋',     emoji:'🍶' },
      { key:'chili',    label:'辣椒',   emoji:'🌶️' },
    ]},
  ];

  const RECIPES = [
    { name:'番茄炒蛋', emoji:'🍅', minutes:10,
      need:['tomato','egg','oil','salt','scallion'],
      blurb:'国民下饭菜，酸甜软嫩，三两下出锅。',
      steps:['鸡蛋打散，热油炒成块盛出','番茄切块下锅炒出汁','倒回鸡蛋，加盐翻匀，撒葱花'] },

    { name:'西红柿鸡蛋面', emoji:'🍜', minutes:15,
      need:['tomato','egg','noodle','oil','salt'],
      blurb:'一碗连汤带面，番茄炒蛋的汤版。',
      steps:['番茄炒出红汁，加水煮开','打入蛋花，加盐调味','另锅煮面，浇上番茄蛋汤'] },

    { name:'蛋炒饭', emoji:'🍚', minutes:12,
      need:['rice','egg','scallion','oil','salt'],
      blurb:'剩饭救星，粒粒分明带蛋香。',
      steps:['鸡蛋炒散，盛出备用','米饭下锅炒散，回蛋同炒','加盐、撒葱花，翻匀出锅'] },

    { name:'青椒土豆丝', emoji:'🥔', minutes:15,
      need:['potato','pepper','oil','salt','vinegar'],
      blurb:'清爽脆口，加点醋更开胃。',
      steps:['土豆切丝泡水去淀粉，青椒切丝','热油爆炒土豆丝至断生','加青椒、盐、少许醋，快炒出锅'] },

    { name:'醋溜土豆丝', emoji:'🥔', minutes:12,
      need:['potato','oil','salt','vinegar','chili'],
      blurb:'酸辣脆爽，最下饭的一盘。',
      steps:['土豆切细丝泡水沥干','热油下干辣椒，倒土豆丝快炒','沿锅边淋醋，加盐翻匀'] },

    { name:'黄瓜拌虾', emoji:'🦐', minutes:12,
      need:['cucumber','shrimp','garlic','salt','vinegar'],
      blurb:'白灼虾配脆黄瓜，清爽不腻。',
      steps:['虾焯水剥壳，黄瓜拍碎','蒜末、盐、醋调汁','和虾、黄瓜拌匀'] },

    { name:'蒜蓉炒白菜', emoji:'🥬', minutes:10,
      need:['cabbage','garlic','oil','salt'],
      blurb:'清甜爽口，蒜香十足。',
      steps:['白菜切片，蒜切末','热油爆香蒜末','下白菜大火快炒，加盐出锅'] },

    { name:'香菇滑鸡', emoji:'🍗', minutes:20,
      need:['chicken','mushroom','ginger','soy','oil'],
      blurb:'鸡肉滑嫩，香菇吸饱汤汁。',
      steps:['鸡肉切块，香菇切片，姜切片','热油爆姜，下鸡肉炒变色','加香菇、生抽，焖煮入味'] },

    { name:'青椒炒肉', emoji:'🥩', minutes:15,
      need:['pork','pepper','garlic','soy','oil'],
      blurb:'家常硬菜，咸香下饭。',
      steps:['猪肉切片，青椒切块','热油下肉片炒变色','加蒜、青椒、生抽翻炒出锅'] },

    { name:'洋葱炒牛肉', emoji:'🐄', minutes:18,
      need:['beef','onion','soy','oil','garlic'],
      blurb:'牛肉嫩滑，洋葱回甜。',
      steps:['牛肉切片用生抽抓匀，洋葱切丝','热油大火快炒牛肉盛出','炒洋葱至软，回牛肉翻匀'] },

    { name:'麻婆豆腐', emoji:'🧈', minutes:18,
      need:['tofu','pork','chili','soy','garlic','scallion'],
      blurb:'麻辣鲜烫，豆腐嫩到入口即化。',
      steps:['豆腐切块焯水，肉末备好','炒香肉末、辣椒、蒜','下豆腐与生抽烧入味，撒葱花'] },

    { name:'番茄牛腩汤', emoji:'🍲', minutes:25,
      need:['tomato','beef','onion','salt','ginger'],
      blurb:'酸甜浓郁，连汤带肉都满足。',
      steps:['牛肉焯水，番茄洋葱切块','姜片爆香，下牛肉与番茄','加水炖煮至软烂，加盐调味'] },

    { name:'胡萝卜炒蛋', emoji:'🥕', minutes:10,
      need:['carrot','egg','oil','salt'],
      blurb:'颜色好看，清甜营养。',
      steps:['胡萝卜切丝，鸡蛋打散','炒蛋盛出，炒软胡萝卜丝','回蛋加盐翻匀出锅'] },

    { name:'葱油拌面', emoji:'🍜', minutes:12,
      need:['noodle','scallion','soy','oil','sugar'],
      blurb:'葱香扑鼻，简单却让人上瘾。',
      steps:['葱段小火熬出葱油','生抽加糖调成酱汁','煮面拌入葱油与酱汁'] },

    { name:'玉米炒虾仁', emoji:'🌽', minutes:15,
      need:['corn','shrimp','oil','salt','scallion'],
      blurb:'清甜弹牙，老少都爱。',
      steps:['虾仁焯水，玉米粒备好','热油下玉米炒香','加虾仁、盐快炒，撒葱花'] },

    { name:'家常煎豆腐', emoji:'🧈', minutes:15,
      need:['tofu','soy','oil','garlic','scallion'],
      blurb:'外焦里嫩，浇汁咸香。',
      steps:['豆腐切片煎至两面金黄','蒜末爆香，加生抽调汁','浇在豆腐上，撒葱花'] },

    { name:'番茄豆腐汤', emoji:'🍲', minutes:15,
      need:['tomato','tofu','egg','salt','scallion'],
      blurb:'清爽暖胃，三样主料就成汤。',
      steps:['番茄炒出汁，加水煮开','下豆腐块煮几分钟','淋蛋花，加盐撒葱花'] },

    { name:'凉拌黄瓜', emoji:'🥒', minutes:8,
      need:['cucumber','garlic','salt','vinegar','oil'],
      blurb:'拍一拍拌一拌，几分钟上桌。',
      steps:['黄瓜拍碎切段','蒜末、盐、醋、香油调汁','拌匀腌几分钟即可'] },
  ];

  return { INGREDIENTS, RECIPES };
})();
