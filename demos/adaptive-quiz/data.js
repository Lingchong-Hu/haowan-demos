/* adaptive-quiz 题库
   window.QUIZ = { 科目key: {name, emoji, bank:[{q,options,answer(下标),level 1~5}]} }
   每科目每个难度(1~5) ≥3 题，引擎按当前难度从对应桶里抽题。 */
(function(){
window.QUIZ = {

  common: { name:GG.T('常识','General Knowledge'), emoji:'🌍', bank:[
    // ---- level 1 ----
    {level:1, q:GG.T('一年有多少个月？','How many months are there in a year?'), options:[GG.T('10 个月','10 months'),GG.T('12 个月','12 months'),GG.T('14 个月','14 months'),GG.T('24 个月','24 months')], answer:1},
    {level:1, q:GG.T('太阳从哪个方向升起？','Which direction does the sun rise from?'), options:[GG.T('西边','The west'),GG.T('北边','The north'),GG.T('东边','The east'),GG.T('南边','The south')], answer:2},
    {level:1, q:GG.T('水在常温下是什么状态？','What state is water in at room temperature?'), options:[GG.T('固态','Solid'),GG.T('液态','Liquid'),GG.T('气态','Gas'),GG.T('等离子态','Plasma')], answer:1},
    {level:1, q:GG.T('一周有几天？','How many days are there in a week?'), options:[GG.T('五天','Five'),GG.T('六天','Six'),GG.T('七天','Seven'),GG.T('八天','Eight')], answer:2},
    // ---- level 2 ----
    {level:2, q:GG.T('中国的首都是哪座城市？','What is the capital city of China?'), options:[GG.T('上海','Shanghai'),GG.T('广州','Guangzhou'),GG.T('北京','Beijing'),GG.T('深圳','Shenzhen')], answer:2},
    {level:2, q:GG.T('彩虹通常有几种主要颜色？','How many main colors does a rainbow usually have?'), options:[GG.T('三种','Three'),GG.T('五种','Five'),GG.T('七种','Seven'),GG.T('九种','Nine')], answer:2},
    {level:2, q:GG.T('人体最大的器官是？','What is the largest organ of the human body?'), options:[GG.T('心脏','The heart'),GG.T('皮肤','The skin'),GG.T('肝脏','The liver'),GG.T('肺','The lungs')], answer:1},
    {level:2, q:GG.T('下列哪种动物是哺乳动物？','Which of these animals is a mammal?'), options:[GG.T('鲨鱼','Shark'),GG.T('鲸鱼','Whale'),GG.T('金枪鱼','Tuna'),GG.T('章鱼','Octopus')], answer:1},
    // ---- level 3 ----
    {level:3, q:GG.T('万里长城最早大规模修建是为了防御谁？','The Great Wall of China was first built at scale to defend against whom?'), options:[GG.T('倭寇','Japanese pirates'),GG.T('北方游牧民族','Northern nomadic peoples'),GG.T('欧洲军队','European armies'),GG.T('海盗','Sea pirates')], answer:1},
    {level:3, q:GG.T('珠穆朗玛峰位于哪两国交界？','Mount Everest sits on the border between which two countries?'), options:[GG.T('中国与印度','China and India'),GG.T('中国与尼泊尔','China and Nepal'),GG.T('印度与尼泊尔','India and Nepal'),GG.T('中国与不丹','China and Bhutan')], answer:1},
    {level:3, q:GG.T('光在真空中的传播速度约为？','Roughly how fast does light travel in a vacuum?'), options:[GG.T('每秒 3 万公里','30,000 km per second'),GG.T('每秒 30 万公里','300,000 km per second'),GG.T('每秒 300 万公里','3,000,000 km per second'),GG.T('每秒 3000 公里','3,000 km per second')], answer:1},
    {level:3, q:GG.T('下列哪位是《红楼梦》的作者？','Who is the author of "Dream of the Red Chamber"?'), options:[GG.T('罗贯中','Luo Guanzhong'),GG.T('吴承恩','Wu Cheng\'en'),GG.T('曹雪芹','Cao Xueqin'),GG.T('施耐庵','Shi Nai\'an')], answer:2},
    // ---- level 4 ----
    {level:4, q:GG.T('诺贝尔奖中没有设立下列哪个奖项？','Which of these prizes is NOT part of the Nobel Prize?'), options:[GG.T('物理学奖','Physics'),GG.T('数学奖','Mathematics'),GG.T('文学奖','Literature'),GG.T('和平奖','Peace')], answer:1},
    {level:4, q:GG.T('人体含量最多的化学元素（按质量）是？','By mass, which chemical element is most abundant in the human body?'), options:[GG.T('碳','Carbon'),GG.T('氢','Hydrogen'),GG.T('氧','Oxygen'),GG.T('氮','Nitrogen')], answer:2},
    {level:4, q:GG.T('下列哪条河流是世界上最长的？','Which of these rivers is the longest in the world?'), options:[GG.T('长江','The Yangtze'),GG.T('亚马孙河','The Amazon'),GG.T('尼罗河','The Nile'),GG.T('密西西比河','The Mississippi')], answer:2},
    {level:4, q:GG.T('“文艺复兴”最早兴起于哪个国家？','In which country did the Renaissance first emerge?'), options:[GG.T('法国','France'),GG.T('意大利','Italy'),GG.T('英国','England'),GG.T('德国','Germany')], answer:1},
    // ---- level 5 ----
    {level:5, q:GG.T('下列哪种气体在大气中占比最高？','Which gas makes up the largest share of the atmosphere?'), options:[GG.T('氧气','Oxygen'),GG.T('二氧化碳','Carbon dioxide'),GG.T('氮气','Nitrogen'),GG.T('氩气','Argon')], answer:2},
    {level:5, q:GG.T('人类基因组大约包含多少个蛋白质编码基因？','Roughly how many protein-coding genes does the human genome contain?'), options:[GG.T('约 2 千个','About 2,000'),GG.T('约 2 万个','About 20,000'),GG.T('约 20 万个','About 200,000'),GG.T('约 200 万个','About 2,000,000')], answer:1},
    {level:5, q:GG.T('下列哪位科学家提出了广义相对论？','Which scientist proposed the general theory of relativity?'), options:[GG.T('牛顿','Newton'),GG.T('爱因斯坦','Einstein'),GG.T('麦克斯韦','Maxwell'),GG.T('玻尔','Bohr')], answer:1},
    {level:5, q:GG.T('“熵增”是哪门学科的核心概念？','Increasing entropy is a core concept of which field?'), options:[GG.T('遗传学','Genetics'),GG.T('热力学','Thermodynamics'),GG.T('地质学','Geology'),GG.T('声学','Acoustics')], answer:1},
  ]},

  math: { name:GG.T('数学','Math'), emoji:'➗', bank:[
    // ---- level 1 ----
    {level:1, q:'7 + 5 = ?', options:['10','11','12','13'], answer:2},
    {level:1, q:'9 - 4 = ?', options:['3','4','5','6'], answer:2},
    {level:1, q:'3 × 2 = ?', options:['5','6','7','8'], answer:1},
    {level:1, q:'10 ÷ 2 = ?', options:['2','4','5','6'], answer:2},
    // ---- level 2 ----
    {level:2, q:'12 × 4 = ?', options:['40','44','48','52'], answer:2},
    {level:2, q:'56 ÷ 7 = ?', options:['6','7','8','9'], answer:2},
    {level:2, q:GG.T('一个三角形的内角和是多少度？','The interior angles of a triangle add up to how many degrees?'), options:['90','180','270','360'], answer:1},
    {level:2, q:GG.T('15 的一半是多少？','What is half of 15?'), options:['5','7.5','8','30'], answer:1},
    // ---- level 3 ----
    {level:3, q:GG.T('求解：2x + 6 = 14，x = ?','Solve: 2x + 6 = 14. x = ?'), options:['2','3','4','5'], answer:2},
    {level:3, q:GG.T('一个圆的半径为 5，其周长约为（π≈3.14）？','A circle has radius 5. Its circumference is roughly (π ≈ 3.14)?'), options:['15.7','31.4','78.5','25'], answer:1},
    {level:3, q:GG.T('25% 等于下列哪个分数？','Which fraction is equal to 25%?'), options:['1/2','1/3','1/4','1/5'], answer:2},
    {level:3, q:GG.T('2 的 5 次方等于？','What is 2 to the power of 5?'), options:['10','16','25','32'], answer:3},
    // ---- level 4 ----
    {level:4, q:GG.T('求 √144 = ?','√144 = ?'), options:['11','12','13','14'], answer:1},
    {level:4, q:GG.T('解方程 x² = 49，x 的正值为？','If x² = 49, the positive value of x is?'), options:['6','7','8','9'], answer:1},
    {level:4, q:GG.T('一件商品打八折后是 240 元，原价是？','After a 20% discount, an item sells for 240. What was the original price?'), options:['280','300','320','360'], answer:1},
    {level:4, q:GG.T('等差数列 3, 7, 11, 15 的第 6 项是？','What is the 6th term of the arithmetic sequence 3, 7, 11, 15, …?'), options:['19','21','23','25'], answer:2},
    // ---- level 5 ----
    {level:5, q:GG.T('函数 f(x)=x² 在 x=3 处的导数 f′(3) 为？','For f(x) = x², the derivative f′(3) equals?'), options:['3','6','9','12'], answer:1},
    {level:5, q:'log₂ 32 = ?', options:['4','5','6','16'], answer:1},
    {level:5, q:GG.T('从 5 个不同元素中任取 2 个的组合数 C(5,2) = ?','How many ways can you choose 2 items from 5 distinct ones — C(5,2) = ?'), options:['10','15','20','25'], answer:0},
    {level:5, q:GG.T('∫ 2x dx（不计常数）= ?','∫ 2x dx (constant omitted) = ?'), options:['x²','2x²','x','2'], answer:0},
  ]},

  english: { name:GG.T('英语','English'), emoji:'🔤', bank:[
    // ---- level 1 ----
    {level:1, q:GG.T('“苹果”的英文是？','What is the English word for “苹果”?'), options:['banana','apple','orange','grape'], answer:1},
    {level:1, q:GG.T('“Hello” 的中文意思是？','Which Chinese word means “Hello”?'), options:[GG.T('再见','zàijiàn'),GG.T('谢谢','xièxie'),GG.T('你好','nǐ hǎo'),GG.T('对不起','duìbuqǐ')], answer:2},
    {level:1, q:GG.T('数字 “three” 是几？','Which numeral does “three” stand for?'), options:['2','3','4','5'], answer:1},
    {level:1, q:GG.T('“cat” 指的是哪种动物？','A “cat” is which kind of animal?'), options:[GG.T('狗','A dog'),GG.T('猫','A cat'),GG.T('鸟','A bird'),GG.T('鱼','A fish')], answer:1},
    // ---- level 2 ----
    {level:2, q:GG.T('选出正确：I ___ a student.','Choose the correct form: I ___ a student.'), options:['am','is','are','be'], answer:0},
    {level:2, q:GG.T('“book” 的复数形式是？','What is the plural form of “book”?'), options:['books','bookes','books','booki'], answer:0},
    {level:2, q:GG.T('“happy” 的反义词是？','What is the opposite of “happy”?'), options:['big','sad','fast','new'], answer:1},
    {level:2, q:GG.T('选出正确：She ___ to school every day.','Choose the correct form: She ___ to school every day.'), options:['go','goes','going','gone'], answer:1},
    // ---- level 3 ----
    {level:3, q:GG.T('选出过去式：Yesterday I ___ a movie.','Choose the past tense: Yesterday I ___ a movie.'), options:['watch','watched','watches','watching'], answer:1},
    {level:3, q:GG.T('“important” 最接近的意思是？','Which is closest in meaning to “important”?'), options:[GG.T('有趣的','interesting'),GG.T('重要的','essential'),GG.T('危险的','dangerous'),GG.T('便宜的','cheap')], answer:1},
    {level:3, q:GG.T('选出正确：There ___ many people here.','Choose the correct form: There ___ many people here.'), options:['is','am','are','be'], answer:2},
    {level:3, q:GG.T('介词填空：I am good ___ math.','Fill in the preposition: I am good ___ math.'), options:['at','in','on','of'], answer:0},
    // ---- level 4 ----
    {level:4, q:GG.T('选出现在完成时：I ___ finished my homework.','Complete the present perfect: I ___ finished my homework.'), options:['have','has','had','having'], answer:0},
    {level:4, q:GG.T('“generous” 的意思最接近？','Which is closest in meaning to “generous”?'), options:[GG.T('吝啬的','stingy'),GG.T('慷慨的','giving'),GG.T('害羞的','shy'),GG.T('聪明的','clever')], answer:1},
    {level:4, q:GG.T('选出被动语态：The letter ___ by Tom.','Choose the passive voice: The letter ___ by Tom.'), options:['wrote','was written','writes','is writing'], answer:1},
    {level:4, q:GG.T('选出正确：If it rains, we ___ stay home.','Choose the correct form: If it rains, we ___ stay home.'), options:['will','would','were','have'], answer:0},
    // ---- level 5 ----
    {level:5, q:GG.T('“ubiquitous” 最接近的意思是？','Which is closest in meaning to “ubiquitous”?'), options:[GG.T('罕见的','rare'),GG.T('无处不在的','found everywhere'),GG.T('短暂的','short-lived'),GG.T('含糊的','vague')], answer:1},
    {level:5, q:GG.T('虚拟语气：If I ___ you, I would apologize.','Subjunctive mood: If I ___ you, I would apologize.'), options:['am','was','were','be'], answer:2},
    {level:5, q:GG.T('“meticulous” 形容一个人？','“Meticulous” describes a person who is…?'), options:[GG.T('粗心的','careless'),GG.T('一丝不苟的','painstakingly precise'),GG.T('懒惰的','lazy'),GG.T('傲慢的','arrogant')], answer:1},
    {level:5, q:GG.T('选出正确的非谓语：___ finished, he left the office.','Choose the correct non-finite form: ___ finished, he left the office.'), options:['Have','Having','Has','To have'], answer:1},
  ]},

  science: { name:GG.T('科学','Science'), emoji:'🔬', bank:[
    // ---- level 1 ----
    {level:1, q:GG.T('水的化学式是？','What is the chemical formula of water?'), options:['CO₂','H₂O','O₂','NaCl'], answer:1},
    {level:1, q:GG.T('我们呼吸时主要吸入哪种气体维持生命？','Which gas do we mainly breathe in to stay alive?'), options:[GG.T('氮气','Nitrogen'),GG.T('氧气','Oxygen'),GG.T('二氧化碳','Carbon dioxide'),GG.T('氢气','Hydrogen')], answer:1},
    {level:1, q:GG.T('植物主要靠什么器官进行光合作用？','Which organ do plants mainly use for photosynthesis?'), options:[GG.T('根','Roots'),GG.T('茎','Stems'),GG.T('叶','Leaves'),GG.T('花','Flowers')], answer:2},
    {level:1, q:GG.T('地球的天然卫星是？','What is Earth\'s natural satellite?'), options:[GG.T('太阳','The Sun'),GG.T('月球','The Moon'),GG.T('火星','Mars'),GG.T('金星','Venus')], answer:1},
    // ---- level 2 ----
    {level:2, q:GG.T('声音不能在下列哪种环境中传播？','Sound cannot travel through which of these?'), options:[GG.T('空气','Air'),GG.T('水','Water'),GG.T('钢铁','Steel'),GG.T('真空','A vacuum')], answer:3},
    {level:2, q:GG.T('下列哪个是固体变为气体的过程？','Which process turns a solid directly into a gas?'), options:[GG.T('融化','Melting'),GG.T('凝固','Freezing'),GG.T('升华','Sublimation'),GG.T('凝结','Condensation')], answer:2},
    {level:2, q:GG.T('人体血液运输氧气主要靠？','What mainly carries oxygen in human blood?'), options:[GG.T('白细胞','White blood cells'),GG.T('红细胞','Red blood cells'),GG.T('血小板','Platelets'),GG.T('血浆','Plasma')], answer:1},
    {level:2, q:GG.T('磁铁的同名磁极之间会？','What happens between like poles of two magnets?'), options:[GG.T('相互吸引','They attract'),GG.T('相互排斥','They repel'),GG.T('没有作用','Nothing happens'),GG.T('变成电','They turn into electricity')], answer:1},
    // ---- level 3 ----
    {level:3, q:GG.T('下列哪种是可再生能源？','Which of these is a renewable energy source?'), options:[GG.T('煤炭','Coal'),GG.T('石油','Oil'),GG.T('太阳能','Solar power'),GG.T('天然气','Natural gas')], answer:2},
    {level:3, q:GG.T('原子中带负电的粒子是？','Which particle in an atom carries a negative charge?'), options:[GG.T('质子','Proton'),GG.T('中子','Neutron'),GG.T('电子','Electron'),GG.T('光子','Photon')], answer:2},
    {level:3, q:GG.T('食物链中，绿色植物属于？','In a food chain, green plants are the…?'), options:[GG.T('消费者','Consumers'),GG.T('分解者','Decomposers'),GG.T('生产者','Producers'),GG.T('寄生者','Parasites')], answer:2},
    {level:3, q:GG.T('下列现象由光的折射引起的是？','Which of these is caused by the refraction of light?'), options:[GG.T('镜子成像','A mirror image'),GG.T('水中筷子看起来弯折','A chopstick looking bent in water'),GG.T('影子','Shadows'),GG.T('回声','Echoes')], answer:1},
    // ---- level 4 ----
    {level:4, q:GG.T('DNA 的中文全称是？','What does DNA stand for?'), options:[GG.T('核糖核酸','Ribonucleic acid'),GG.T('脱氧核糖核酸','Deoxyribonucleic acid'),GG.T('氨基酸','Amino acid'),GG.T('三磷酸腺苷','Adenosine triphosphate')], answer:1},
    {level:4, q:GG.T('牛顿第二定律描述的关系是？','Which equation expresses Newton\'s second law?'), options:['F = ma','E = mc²','V = IR','PV = nRT'], answer:0},
    {level:4, q:GG.T('下列哪种元素的原子序数是 6？','Which element has atomic number 6?'), options:[GG.T('氢','Hydrogen'),GG.T('氧','Oxygen'),GG.T('碳','Carbon'),GG.T('氮','Nitrogen')], answer:2},
    {level:4, q:GG.T('地震的强度通常用什么来衡量？','What is usually used to measure the strength of an earthquake?'), options:[GG.T('分贝','Decibels'),GG.T('里氏震级','The Richter scale'),GG.T('摄氏度','Degrees Celsius'),GG.T('帕斯卡','Pascals')], answer:1},
    // ---- level 5 ----
    {level:5, q:GG.T('光合作用的总反应把二氧化碳和水转化为？','Overall, photosynthesis converts carbon dioxide and water into…?'), options:[GG.T('蛋白质和氧气','Protein and oxygen'),GG.T('葡萄糖和氧气','Glucose and oxygen'),GG.T('脂肪和氢气','Fat and hydrogen'),GG.T('淀粉和氮气','Starch and nitrogen')], answer:1},
    {level:5, q:GG.T('下列哪种亚原子粒子不带电？','Which subatomic particle carries no electric charge?'), options:[GG.T('质子','Proton'),GG.T('电子','Electron'),GG.T('中子','Neutron'),GG.T('正电子','Positron')], answer:2},
    {level:5, q:GG.T('元素周期表中最活泼的非金属元素一般认为是？','Which is generally considered the most reactive non-metal in the periodic table?'), options:[GG.T('氧','Oxygen'),GG.T('氟','Fluorine'),GG.T('氯','Chlorine'),GG.T('氮','Nitrogen')], answer:1},
    {level:5, q:GG.T('根据相对论，下列哪个量随速度接近光速而显著增大？','According to relativity, which quantity increases dramatically as speed approaches the speed of light?'), options:[GG.T('静止质量','Rest mass'),GG.T('相对论质量/能量','Relativistic mass/energy'),GG.T('电荷','Electric charge'),GG.T('原子序数','Atomic number')], answer:1},
  ]},

};
})();
