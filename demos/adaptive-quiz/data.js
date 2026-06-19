/* adaptive-quiz 题库
   window.QUIZ = { 科目key: {name, emoji, bank:[{q,options,answer(下标),level 1~5}]} }
   每科目每个难度(1~5) ≥3 题，引擎按当前难度从对应桶里抽题。 */
(function(){
window.QUIZ = {

  common: { name:'常识', emoji:'🌍', bank:[
    // ---- level 1 ----
    {level:1, q:'一年有多少个月？', options:['10 个月','12 个月','14 个月','24 个月'], answer:1},
    {level:1, q:'太阳从哪个方向升起？', options:['西边','北边','东边','南边'], answer:2},
    {level:1, q:'水在常温下是什么状态？', options:['固态','液态','气态','等离子态'], answer:1},
    {level:1, q:'一周有几天？', options:['五天','六天','七天','八天'], answer:2},
    // ---- level 2 ----
    {level:2, q:'中国的首都是哪座城市？', options:['上海','广州','北京','深圳'], answer:2},
    {level:2, q:'彩虹通常有几种主要颜色？', options:['三种','五种','七种','九种'], answer:2},
    {level:2, q:'人体最大的器官是？', options:['心脏','皮肤','肝脏','肺'], answer:1},
    {level:2, q:'下列哪种动物是哺乳动物？', options:['鲨鱼','鲸鱼','金枪鱼','章鱼'], answer:1},
    // ---- level 3 ----
    {level:3, q:'万里长城最早大规模修建是为了防御谁？', options:['倭寇','北方游牧民族','欧洲军队','海盗'], answer:1},
    {level:3, q:'珠穆朗玛峰位于哪两国交界？', options:['中国与印度','中国与尼泊尔','印度与尼泊尔','中国与不丹'], answer:1},
    {level:3, q:'光在真空中的传播速度约为？', options:['每秒 3 万公里','每秒 30 万公里','每秒 300 万公里','每秒 3000 公里'], answer:1},
    {level:3, q:'下列哪位是《红楼梦》的作者？', options:['罗贯中','吴承恩','曹雪芹','施耐庵'], answer:2},
    // ---- level 4 ----
    {level:4, q:'诺贝尔奖中没有设立下列哪个奖项？', options:['物理学奖','数学奖','文学奖','和平奖'], answer:1},
    {level:4, q:'人体含量最多的化学元素（按质量）是？', options:['碳','氢','氧','氮'], answer:2},
    {level:4, q:'下列哪条河流是世界上最长的？', options:['长江','亚马孙河','尼罗河','密西西比河'], answer:2},
    {level:4, q:'“文艺复兴”最早兴起于哪个国家？', options:['法国','意大利','英国','德国'], answer:1},
    // ---- level 5 ----
    {level:5, q:'下列哪种气体在大气中占比最高？', options:['氧气','二氧化碳','氮气','氩气'], answer:2},
    {level:5, q:'人类基因组大约包含多少个蛋白质编码基因？', options:['约 2 千个','约 2 万个','约 20 万个','约 200 万个'], answer:1},
    {level:5, q:'下列哪位科学家提出了广义相对论？', options:['牛顿','爱因斯坦','麦克斯韦','玻尔'], answer:1},
    {level:5, q:'“熵增”是哪门学科的核心概念？', options:['遗传学','热力学','地质学','声学'], answer:1},
  ]},

  math: { name:'数学', emoji:'➗', bank:[
    // ---- level 1 ----
    {level:1, q:'7 + 5 = ?', options:['10','11','12','13'], answer:2},
    {level:1, q:'9 - 4 = ?', options:['3','4','5','6'], answer:2},
    {level:1, q:'3 × 2 = ?', options:['5','6','7','8'], answer:1},
    {level:1, q:'10 ÷ 2 = ?', options:['2','4','5','6'], answer:2},
    // ---- level 2 ----
    {level:2, q:'12 × 4 = ?', options:['40','44','48','52'], answer:2},
    {level:2, q:'56 ÷ 7 = ?', options:['6','7','8','9'], answer:2},
    {level:2, q:'一个三角形的内角和是多少度？', options:['90','180','270','360'], answer:1},
    {level:2, q:'15 的一半是多少？', options:['5','7.5','8','30'], answer:1},
    // ---- level 3 ----
    {level:3, q:'求解：2x + 6 = 14，x = ?', options:['2','3','4','5'], answer:2},
    {level:3, q:'一个圆的半径为 5，其周长约为（π≈3.14）？', options:['15.7','31.4','78.5','25'], answer:1},
    {level:3, q:'25% 等于下列哪个分数？', options:['1/2','1/3','1/4','1/5'], answer:2},
    {level:3, q:'2 的 5 次方等于？', options:['10','16','25','32'], answer:3},
    // ---- level 4 ----
    {level:4, q:'求 √144 = ?', options:['11','12','13','14'], answer:1},
    {level:4, q:'解方程 x² = 49，x 的正值为？', options:['6','7','8','9'], answer:1},
    {level:4, q:'一件商品打八折后是 240 元，原价是？', options:['280','300','320','360'], answer:1},
    {level:4, q:'等差数列 3, 7, 11, 15 的第 6 项是？', options:['19','21','23','25'], answer:2},
    // ---- level 5 ----
    {level:5, q:'函数 f(x)=x² 在 x=3 处的导数 f′(3) 为？', options:['3','6','9','12'], answer:1},
    {level:5, q:'log₂ 32 = ?', options:['4','5','6','16'], answer:1},
    {level:5, q:'从 5 个不同元素中任取 2 个的组合数 C(5,2) = ?', options:['10','15','20','25'], answer:0},
    {level:5, q:'∫ 2x dx（不计常数）= ?', options:['x²','2x²','x','2'], answer:0},
  ]},

  english: { name:'英语', emoji:'🔤', bank:[
    // ---- level 1 ----
    {level:1, q:'“苹果”的英文是？', options:['banana','apple','orange','grape'], answer:1},
    {level:1, q:'“Hello” 的中文意思是？', options:['再见','谢谢','你好','对不起'], answer:2},
    {level:1, q:'数字 “three” 是几？', options:['2','3','4','5'], answer:1},
    {level:1, q:'“cat” 指的是哪种动物？', options:['狗','猫','鸟','鱼'], answer:1},
    // ---- level 2 ----
    {level:2, q:'选出正确：I ___ a student.', options:['am','is','are','be'], answer:0},
    {level:2, q:'“book” 的复数形式是？', options:['books','bookes','books','booki'], answer:0},
    {level:2, q:'“happy” 的反义词是？', options:['big','sad','fast','new'], answer:1},
    {level:2, q:'选出正确：She ___ to school every day.', options:['go','goes','going','gone'], answer:1},
    // ---- level 3 ----
    {level:3, q:'选出过去式：Yesterday I ___ a movie.', options:['watch','watched','watches','watching'], answer:1},
    {level:3, q:'“important” 最接近的意思是？', options:['有趣的','重要的','危险的','便宜的'], answer:1},
    {level:3, q:'选出正确：There ___ many people here.', options:['is','am','are','be'], answer:2},
    {level:3, q:'介词填空：I am good ___ math.', options:['at','in','on','of'], answer:0},
    // ---- level 4 ----
    {level:4, q:'选出现在完成时：I ___ finished my homework.', options:['have','has','had','having'], answer:0},
    {level:4, q:'“generous” 的意思最接近？', options:['吝啬的','慷慨的','害羞的','聪明的'], answer:1},
    {level:4, q:'选出被动语态：The letter ___ by Tom.', options:['wrote','was written','writes','is writing'], answer:1},
    {level:4, q:'选出正确：If it rains, we ___ stay home.', options:['will','would','were','have'], answer:0},
    // ---- level 5 ----
    {level:5, q:'“ubiquitous” 最接近的意思是？', options:['罕见的','无处不在的','短暂的','含糊的'], answer:1},
    {level:5, q:'虚拟语气：If I ___ you, I would apologize.', options:['am','was','were','be'], answer:2},
    {level:5, q:'“meticulous” 形容一个人？', options:['粗心的','一丝不苟的','懒惰的','傲慢的'], answer:1},
    {level:5, q:'选出正确的非谓语：___ finished, he left the office.', options:['Have','Having','Has','To have'], answer:1},
  ]},

  science: { name:'科学', emoji:'🔬', bank:[
    // ---- level 1 ----
    {level:1, q:'水的化学式是？', options:['CO₂','H₂O','O₂','NaCl'], answer:1},
    {level:1, q:'我们呼吸时主要吸入哪种气体维持生命？', options:['氮气','氧气','二氧化碳','氢气'], answer:1},
    {level:1, q:'植物主要靠什么器官进行光合作用？', options:['根','茎','叶','花'], answer:2},
    {level:1, q:'地球的天然卫星是？', options:['太阳','月球','火星','金星'], answer:1},
    // ---- level 2 ----
    {level:2, q:'声音不能在下列哪种环境中传播？', options:['空气','水','钢铁','真空'], answer:3},
    {level:2, q:'下列哪个是固体变为气体的过程？', options:['融化','凝固','升华','凝结'], answer:2},
    {level:2, q:'人体血液运输氧气主要靠？', options:['白细胞','红细胞','血小板','血浆'], answer:1},
    {level:2, q:'磁铁的同名磁极之间会？', options:['相互吸引','相互排斥','没有作用','变成电'], answer:1},
    // ---- level 3 ----
    {level:3, q:'下列哪种是可再生能源？', options:['煤炭','石油','太阳能','天然气'], answer:2},
    {level:3, q:'原子中带负电的粒子是？', options:['质子','中子','电子','光子'], answer:2},
    {level:3, q:'食物链中，绿色植物属于？', options:['消费者','分解者','生产者','寄生者'], answer:2},
    {level:3, q:'下列现象由光的折射引起的是？', options:['镜子成像','水中筷子看起来弯折','影子','回声'], answer:1},
    // ---- level 4 ----
    {level:4, q:'DNA 的中文全称是？', options:['核糖核酸','脱氧核糖核酸','氨基酸','三磷酸腺苷'], answer:1},
    {level:4, q:'牛顿第二定律描述的关系是？', options:['F = ma','E = mc²','V = IR','PV = nRT'], answer:0},
    {level:4, q:'下列哪种元素的原子序数是 6？', options:['氢','氧','碳','氮'], answer:2},
    {level:4, q:'地震的强度通常用什么来衡量？', options:['分贝','里氏震级','摄氏度','帕斯卡'], answer:1},
    // ---- level 5 ----
    {level:5, q:'光合作用的总反应把二氧化碳和水转化为？', options:['蛋白质和氧气','葡萄糖和氧气','脂肪和氢气','淀粉和氮气'], answer:1},
    {level:5, q:'下列哪种亚原子粒子不带电？', options:['质子','电子','中子','正电子'], answer:2},
    {level:5, q:'元素周期表中最活泼的非金属元素一般认为是？', options:['氧','氟','氯','氮'], answer:1},
    {level:5, q:'根据相对论，下列哪个量随速度接近光速而显著增大？', options:['静止质量','相对论质量/能量','电荷','原子序数'], answer:1},
  ]},

};
})();
