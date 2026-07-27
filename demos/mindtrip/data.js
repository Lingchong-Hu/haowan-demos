/* mindtrip 数据：四个城市，每城一个 POI 库 + 一张抽象底图参数。
   POI: { id, name, en, type(美食/历史/自然/购物/亲子), x,y(0~100 相对地图坐标), hours, blurb }
   双语说明：name 保持中文（排程引擎的关键词正则、别名查表都吃中文，两种语言下行程一致），
   英文显示名放 en 字段；blurb 纯展示，用 GG.T 就地双语。type 是查表 key，恒为中文。
   底图 map: 用相对坐标(viewBox 0 0 100 60)画的几条形状——河流/公园/主干道，纯本地 SVG，无任何外部资源。
   坐标约定：x∈[6,94]，y∈[6,54]，避免贴边；让同类/邻近点在地图上成区块，便于按邻近度串行程。 */
window.MINDTRIP = {
  CITIES: {
    kyoto: {
      name: '京都', en: 'Kyoto',
      blurb: GG.T('千年古都，寺院与町屋之间慢慢走。','The thousand-year capital — drift slowly between temples and machiya townhouses.'),
      map: {
        // 河流（鸭川，自北向南斜穿）、两块公园、两条主干道
        rivers: [ 'M 58 4 C 54 18, 60 30, 52 44 S 48 58, 46 60' ],
        parks:  [ {cx:24, cy:18, rx:13, ry:9}, {cx:78, cy:42, rx:12, ry:8} ],
        roads:  [ 'M 4 30 H 96', 'M 40 4 V 58', 'M 8 50 L 90 12' ]
      },
      pois: [
        { id:'k1',  name:'锦市场',         en:'Nishiki Market',                   type:'美食', x:42, y:30, hours:'1.5h', blurb:GG.T('四百年“京都厨房”，边走边吃豆乳甜甜圈与玉子烧。','The 400-year-old "Kitchen of Kyoto" — graze on soy-milk donuts and tamagoyaki as you stroll.') },
        { id:'k2',  name:'伏见稻荷大社',   en:'Fushimi Inari Taisha',             type:'历史', x:60, y:50, hours:'2h',   blurb:GG.T('千本鸟居层层叠叠，红色隧道一直爬向山顶。','Thousands of vermilion torii gates stack into tunnels climbing all the way up the mountain.') },
        { id:'k3',  name:'清水寺',         en:'Kiyomizu-dera',                    type:'历史', x:74, y:40, hours:'1.5h', blurb:GG.T('悬空木舞台俯瞰市区，黄昏点灯最美。','A wooden stage juts over the city view — loveliest at the dusk illumination.') },
        { id:'k4',  name:'岚山竹林',       en:'Arashiyama Bamboo Grove',          type:'自然', x:14, y:14, hours:'1.5h', blurb:GG.T('高耸竹海风穿过沙沙作响，清晨人最少。','Towering bamboo rustles in the wind — come at dawn for the thinnest crowds.') },
        { id:'k5',  name:'天龙寺庭园',     en:'Tenryu-ji Garden',                 type:'自然', x:22, y:22, hours:'1h',   blurb:GG.T('借景岚山的池泉回游庭院，四季皆景。','A strolling pond garden that borrows Arashiyama as its backdrop — beautiful in every season.') },
        { id:'k6',  name:'金阁寺',         en:'Kinkaku-ji (Golden Pavilion)',     type:'历史', x:30, y:10, hours:'1h',   blurb:GG.T('金箔楼阁倒映镜湖，明信片同款。','The gold-leaf pavilion mirrored in its pond — straight off a postcard.') },
        { id:'k7',  name:'祇园花见小路',   en:'Gion Hanamikoji Street',           type:'历史', x:66, y:34, hours:'1h',   blurb:GG.T('石板老街町屋林立，傍晚偶遇艺伎。','Stone-paved lanes of old machiya houses — you may glimpse a geiko at dusk.') },
        { id:'k8',  name:'怀石料理·菊乃井', en:'Kaiseki at Kikunoi',               type:'美食', x:70, y:30, hours:'2h',   blurb:GG.T('米其林怀石，一道道呈上的季节之味。','Michelin-starred kaiseki — the season served one exquisite course at a time.') },
        { id:'k9',  name:'鸭川河畔散步',   en:'Kamo Riverside Walk',              type:'自然', x:52, y:36, hours:'1h',   blurb:GG.T('坐在河岸阶梯上，看夕阳与等距情侣。','Sit on the riverside steps and watch the sunset — and the evenly spaced couples.') },
        { id:'k10', name:'京都站伊势丹',   en:'Kyoto Station Isetan',             type:'购物', x:50, y:52, hours:'1.5h', blurb:GG.T('巨型车站综合体，手信抹茶点心一网打尽。','A mega station complex — matcha sweets and souvenirs all in one sweep.') },
        { id:'k11', name:'京都铁道博物馆', en:'Kyoto Railway Museum',             type:'亲子', x:38, y:48, hours:'2h',   blurb:GG.T('真车实物 + 蒸汽机车体验，大小孩都爱。','Real trains plus a steam-locomotive ride — a hit with kids of every age.') },
        { id:'k12', name:'西阵和服体验',   en:'Nishijin Kimono Experience',       type:'购物', x:34, y:26, hours:'1h',   blurb:GG.T('换上正统和服，走进老街拍一组照片。','Dress in a proper kimono and shoot a photo set in the old streets.') },
        { id:'k13', name:'二条城',         en:'Nijo Castle',                      type:'历史', x:36, y:20, hours:'1.5h', blurb:GG.T('德川幕府的京都居城，二之丸御殿的地板会「唱歌」防刺客。','The shogunate\'s Kyoto residence — the Ninomaru Palace\'s "nightingale floors" sing to foil assassins.') },
        { id:'k14', name:'京都御所',       en:'Kyoto Imperial Palace',            type:'历史', x:44, y:18, hours:'1h',   blurb:GG.T('天皇旧居，环以开阔的京都御苑，散步极舒展。','The former imperial residence, ringed by the wide-open Kyoto Gyoen — a wonderfully airy walk.') },
        { id:'k15', name:'哲学之道',       en:'Philosopher\'s Path',              type:'自然', x:72, y:20, hours:'1h',   blurb:GG.T('沿小渠的樱花步道，从银阁寺一路慢走到南禅寺。','A cherry-lined canal path — an easy amble from Ginkaku-ji down to Nanzen-ji.') },
        { id:'k16', name:'银阁寺',         en:'Ginkaku-ji (Silver Pavilion)',     type:'历史', x:78, y:18, hours:'1h',   blurb:GG.T('枯山水与苔庭的侘寂之美，比金阁更含蓄耐看。','Dry gardens and moss in wabi-sabi restraint — subtler and deeper than the Golden Pavilion.') },
        { id:'k17', name:'平安神宫',       en:'Heian Shrine',                     type:'历史', x:66, y:22, hours:'1h',   blurb:GG.T('朱红大鸟居与神苑池泉，气派而开阔。','A grand vermilion torii and pond gardens — stately and open.') },
        { id:'k18', name:'先斗町食街',     en:'Pontocho Alley',                   type:'美食', x:54, y:32, hours:'1.5h', blurb:GG.T('鸭川边的窄巷，灯笼亮起后居酒屋与川床料理飘香。','A narrow lane by the Kamo River — once the lanterns glow, izakaya and riverside dining perfume the air.') },
        { id:'k19', name:'京都漫画博物馆', en:'Kyoto Int\'l Manga Museum',        type:'亲子', x:40, y:22, hours:'1.5h', blurb:GG.T('五万册漫画随便翻，草坪上躺一下午，大小孩都赖着不走。','Fifty thousand manga to browse and a lawn to lie on — kids big and small refuse to leave.') },
        { id:'k20', name:'嵯峨野小火车',   en:'Sagano Scenic Railway',            type:'自然', x:10, y:20, hours:'1h',   blurb:GG.T('复古观光小火车沿保津峡而行，红叶季一票难求。','A retro sightseeing train along the Hozukyo gorge — tickets vanish in foliage season.') }
      ]
    },

    lisbon: {
      name: '里斯本', en: 'Lisbon',
      blurb: GG.T('七丘之城，电车叮当与海风一起爬坡。','City of seven hills — climb them with clanging trams and the sea breeze.'),
      map: {
        rivers: [ 'M 2 54 C 24 50, 40 56, 60 52 S 88 50, 98 53' ], // 特茹河沿南岸
        parks:  [ {cx:30, cy:16, rx:11, ry:8}, {cx:72, cy:22, rx:10, ry:8} ],
        roads:  [ 'M 6 40 L 92 24', 'M 20 6 V 50', 'M 60 6 L 70 52' ]
      },
      pois: [
        { id:'l1',  name:'贝伦塔',         en:'Belém Tower',                      type:'历史', x:12, y:46, hours:'1h',   blurb:GG.T('河口白色石塔，大航海时代的起点。','A white stone tower at the river mouth — where the Age of Discovery set sail.') },
        { id:'l2',  name:'贝伦蛋挞总店',   en:'Pastéis de Belém',                 type:'美食', x:18, y:42, hours:'0.5h', blurb:GG.T('1837 年配方，刚出炉撒肉桂趁热吃。','The 1837 recipe — eat them straight from the oven with a dusting of cinnamon.') },
        { id:'l3',  name:'热罗尼莫斯修道院', en:'Jerónimos Monastery',             type:'历史', x:16, y:38, hours:'1.5h', blurb:GG.T('曼努埃尔式雕花极尽繁复，世界遗产。','Manueline stone carving at its most extravagant — a World Heritage site.') },
        { id:'l4',  name:'圣若热城堡',     en:'São Jorge Castle',                 type:'历史', x:54, y:24, hours:'1.5h', blurb:GG.T('山顶古堡俯瞰全城红顶与河面。','A hilltop castle overlooking red rooftops and the river.') },
        { id:'l5',  name:'阿尔法玛老城',   en:'Alfama Old Town',                  type:'历史', x:60, y:30, hours:'1.5h', blurb:GG.T('迷宫小巷晾着衣服，法朵歌声飘出酒馆。','Laundry strung across maze-like lanes, fado drifting out of taverns.') },
        { id:'l6',  name:'28 路电车',      en:'Tram 28',                          type:'自然', x:46, y:28, hours:'1h',   blurb:GG.T('黄色老电车爬陡坡过窄巷，最佳城市观光。','The vintage yellow tram grinds up steep hills and squeezes through alleys — the best city tour there is.') },
        { id:'l7',  name:'时光市场',       en:'Time Out Market',                  type:'美食', x:40, y:40, hours:'1.5h', blurb:GG.T('老市场改造的美食广场，海鲜小吃集合。','An old market hall turned food court — Lisbon\'s seafood and snacks under one roof.') },
        { id:'l8',  name:'奥古斯塔凯旋门', en:'Rua Augusta Arch',                 type:'购物', x:48, y:38, hours:'1h',   blurb:GG.T('商业广场临河，登顶拱门看棋盘下城。','By the riverside square — climb the arch for a view down Baixa\'s grid.') },
        { id:'l9',  name:'圣胡斯塔升降机', en:'Santa Justa Lift',                 type:'历史', x:44, y:34, hours:'0.5h', blurb:GG.T('铁艺哥特升降梯，顶层观景台连接上下城。','A wrought-iron neo-Gothic elevator — its top deck links downtown and uptown.') },
        { id:'l10', name:'LX 工厂创意区',  en:'LX Factory',                       type:'购物', x:26, y:48, hours:'1.5h', blurb:GG.T('旧厂房变身设计店与咖啡馆，文青最爱。','Old factories reborn as design shops and cafes — a creative-crowd favorite.') },
        { id:'l11', name:'海洋水族馆',     en:'Lisbon Oceanarium',                type:'亲子', x:82, y:18, hours:'2h',   blurb:GG.T('欧洲最大水族馆之一，巨型环形大缸震撼。','One of Europe\'s largest aquariums — the giant central tank is breathtaking.') },
        { id:'l12', name:'爱德华七世公园', en:'Eduardo VII Park',                 type:'自然', x:70, y:14, hours:'1h',   blurb:GG.T('层叠绿毯花园，尽头眺望河与城。','Terraced green lawns rolling down to a view of river and city.') },
        { id:'l13', name:'商业广场',       en:'Praça do Comércio',                type:'历史', x:50, y:42, hours:'0.5h', blurb:GG.T('临河的黄边大广场，下城的门面与河运起点。','The grand yellow riverside square — Baixa\'s front door and old shipping gateway.') },
        { id:'l14', name:'法朵博物馆',     en:'Fado Museum',                      type:'历史', x:62, y:34, hours:'1h',   blurb:GG.T('听懂这座城的乡愁，葡萄牙国宝级民谣 Fado 的故事。','The story of fado, Portugal\'s treasured song — learn the saudade of this city.') },
        { id:'l15', name:'主教座堂',       en:'Lisbon Cathedral',                 type:'历史', x:56, y:32, hours:'0.5h', blurb:GG.T('罗曼式双塔老教堂，28 路黄电车从门前叮当驶过。','A twin-towered Romanesque church, with Tram 28 rattling right past its door.') },
        { id:'l16', name:'自由大道',       en:'Avenida da Liberdade',             type:'购物', x:58, y:22, hours:'1h',   blurb:GG.T('马赛克人行道上的奢侈品大街，林荫一路向上。','A luxury boulevard over mosaic pavements, tree-shaded all the way uphill.') },
        { id:'l17', name:'国家瓷砖博物馆', en:'National Tile Museum',             type:'亲子', x:86, y:26, hours:'1.5h', blurb:GG.T('五百年蓝白瓷砖 azulejo 的殿堂，附一圈修道院回廊。','Five centuries of blue-and-white azulejo tiles, wrapped around a convent cloister.') },
        { id:'l18', name:'粉红街',         en:'Pink Street',                      type:'美食', x:42, y:44, hours:'1h',   blurb:GG.T('白天平平、入夜变身，铺满粉色路面的酒吧美食街。','Plain by day, alive by night — bars and street food along the pink-painted road.') },
        { id:'l19', name:'罗西奥广场',     en:'Rossio Square',                    type:'历史', x:46, y:32, hours:'0.5h', blurb:GG.T('波浪纹石板广场，下城最热闹的露天会客厅。','Wave-patterned cobblestones — downtown\'s liveliest open-air living room.') },
        { id:'l20', name:'大耶稣像观景台', en:'Cristo Rei Viewpoint',             type:'自然', x:30, y:52, hours:'1h',   blurb:GG.T('渡河登上张臂耶稣像脚下，俯瞰大桥与红顶城。','Cross the river to the feet of the outstretched Christ statue — bridge and red rooftops below.') }
      ]
    },

    chiangmai: {
      name: '清迈', en: 'Chiang Mai',
      blurb: GG.T('泰北古城，慢节奏、寺庙与山间清新。','Northern Thailand\'s old city — slow days, temples, and crisp mountain air.'),
      map: {
        rivers: [ 'M 80 4 C 76 20, 82 34, 78 48 S 80 56, 82 60' ], // 滨河
        parks:  [ {cx:30, cy:30, rx:14, ry:11}, {cx:64, cy:14, rx:9, ry:7} ], // 古城方形区抽象成大块
        roads:  [ 'M 16 16 H 50 V 46 H 16 Z', 'M 4 30 H 96', 'M 50 4 V 56' ] // 古城护城河方框 + 干道
      },
      pois: [
        { id:'c1',  name:'契迪龙寺',       en:'Wat Chedi Luang',                  type:'历史', x:30, y:28, hours:'1h',   blurb:GG.T('古城核心的巨大残塔，黄昏剪影壮观。','The great ruined chedi at the old city\'s heart — a striking silhouette at dusk.') },
        { id:'c2',  name:'帕辛寺',         en:'Wat Phra Singh',                   type:'历史', x:20, y:24, hours:'1h',   blurb:GG.T('兰纳风格金顶大殿，香火鼎盛。','A gilded Lanna-style hall, alive with incense and devotion.') },
        { id:'c3',  name:'周日夜市',       en:'Sunday Night Market',              type:'美食', x:34, y:36, hours:'2h',   blurb:GG.T('横贯古城的步行夜市，小吃手作走到腿软。','A walking-street market across the old city — snacks and crafts until your legs give out.') },
        { id:'c4',  name:'宁曼路文创区',   en:'Nimman Road',                      type:'购物', x:14, y:14, hours:'1.5h', blurb:GG.T('设计咖啡馆与潮店扎堆，拍照打卡天堂。','Design cafes and indie shops packed together — a photo-op paradise.') },
        { id:'c5',  name:'素贴山双龙寺',   en:'Doi Suthep Temple',                type:'自然', x:8,  y:8,  hours:'2h',   blurb:GG.T('盘山而上的金塔寺，俯瞰整座清迈城。','A golden hilltop temple up winding mountain roads, overlooking all of Chiang Mai.') },
        { id:'c6',  name:'大象保护营',     en:'Elephant Sanctuary',               type:'亲子', x:6,  y:46, hours:'3h',   blurb:GG.T('无骑乘的友好象营，喂食洗澡近距离接触。','An ethical no-riding camp — feed and bathe the elephants up close.') },
        { id:'c7',  name:'瓦洛洛市场',     en:'Warorot Market',                   type:'美食', x:74, y:30, hours:'1h',   blurb:GG.T('本地人的菜市，泰北香肠与热带水果。','The locals\' market — northern Thai sausage and tropical fruit.') },
        { id:'c8',  name:'滨河餐厅区',     en:'Riverside Dining',                 type:'美食', x:80, y:40, hours:'1.5h', blurb:GG.T('河畔晚餐，灯火与水声佐一杯昌啤。','Dinner on the Ping River — lights and water sounds with a cold Chang beer.') },
        { id:'c9',  name:'丛林飞跃',       en:'Jungle Zipline',                   type:'自然', x:10, y:54, hours:'3h',   blurb:GG.T('雨林里的高空索道，肾上腺素拉满。','High ziplines through the rainforest — adrenaline maxed out.') },
        { id:'c10', name:'清迈夜间动物园', en:'Chiang Mai Night Safari',          type:'亲子', x:18, y:50, hours:'2.5h', blurb:GG.T('坐车夜游看长颈鹿斑马，孩子尖叫连连。','A night drive past giraffes and zebras — the kids squeal the whole way.') },
        { id:'c11', name:'手工艺村',       en:'Handicraft Villages',              type:'购物', x:88, y:22, hours:'1.5h', blurb:GG.T('伞画、银器、丝绸现场制作，可带走伴手礼。','Umbrella painting, silverwork and silk made before your eyes — take some home.') },
        { id:'c12', name:'古城护城河散步', en:'Old City Moat Walk',               type:'自然', x:50, y:30, hours:'0.5h', blurb:GG.T('沿方形护城河漫步，老城门与喷泉相伴。','Stroll the square moat, past old city gates and fountains.') },
        { id:'c13', name:'塔佩门',         en:'Tha Phae Gate',                    type:'历史', x:46, y:26, hours:'0.5h', blurb:GG.T('古城东大门的红砖墙，喂鸽子拍照的经典机位。','The old city\'s red-brick east gate — the classic pigeon-feeding photo spot.') },
        { id:'c14', name:'清曼寺',         en:'Wat Chiang Man',                   type:'历史', x:26, y:16, hours:'0.5h', blurb:GG.T('清迈最古老的寺庙，十五头石象驮塔，安静庄重。','Chiang Mai\'s oldest temple — fifteen stone elephants bear its chedi, quiet and solemn.') },
        { id:'c15', name:'盼道寺',         en:'Wat Phan Tao',                     type:'历史', x:22, y:34, hours:'0.5h', blurb:GG.T('全柚木的兰纳古殿，金红描漆低调而惊艳。','An all-teak Lanna hall — understated gold-on-red lacquer that quietly stuns.') },
        { id:'c16', name:'One Nimman 市集', en:'One Nimman',                      type:'购物', x:12, y:20, hours:'1.5h', blurb:GG.T('宁曼路文创广场，手作、甜品、拍照墙一站集齐。','Nimman\'s creative plaza — crafts, desserts and photo walls in one stop.') },
        { id:'c17', name:'宁曼山景咖啡',   en:'Nimman Mountain-view Coffee',      type:'美食', x:10, y:10, hours:'1h',   blurb:GG.T('第三波精品豆配山景落地窗，慢慢耗一个上午。','Third-wave beans and floor-to-ceiling mountain views — happily burn a whole morning.') },
        { id:'c18', name:'长康路夜市',     en:'Night Bazaar (Chang Klan Rd)',     type:'美食', x:78, y:26, hours:'1.5h', blurb:GG.T('老牌观光夜市，按摩、烤肉与现场乐队一条街。','The classic tourist night market — massages, grilled skewers and live bands down one street.') },
        { id:'c19', name:'蒲屏皇宫花园',   en:'Bhubing Palace Gardens',           type:'自然', x:6,  y:14, hours:'1h',   blurb:GG.T('素贴山上的皇家花园，凉季玫瑰与绣球开满坡。','Royal gardens on Doi Suthep — roses and hydrangeas blanket the slopes in the cool season.') },
        { id:'c20', name:'拉差帕邦银庙',   en:'Silver Temple (Wat Sri Suphan)',   type:'历史', x:28, y:44, hours:'0.5h', blurb:GG.T('纯银打造的银庙，灯光下流光溢彩，工艺惊人。','A temple sheathed in silver — dazzling under the lights, astonishing craftsmanship.') }
      ]
    },

    reykjavik: {
      name: '雷克雅未克', en: 'Reykjavik',
      blurb: GG.T('极北小城，冰火之间的清冷浪漫。','A tiny far-north capital — cool romance between ice and fire.'),
      map: {
        rivers: [ 'M 2 12 C 26 16, 50 8, 74 14 S 96 12, 98 14' ], // 北侧海岸线
        parks:  [ {cx:40, cy:38, rx:12, ry:9}, {cx:76, cy:30, rx:9, ry:7} ],
        roads:  [ 'M 6 22 H 94', 'M 30 12 V 56', 'M 60 14 L 50 56' ]
      },
      pois: [
        { id:'r1',  name:'哈尔格林姆教堂', en:'Hallgrimskirkja',                  type:'历史', x:42, y:30, hours:'1h',   blurb:GG.T('玄武岩造型的火箭式教堂，登顶望全城。','The rocket-shaped church inspired by basalt columns — ride to the top for the whole city.') },
        { id:'r2',  name:'太阳航海者雕塑', en:'Sun Voyager',                      type:'自然', x:54, y:16, hours:'0.5h', blurb:GG.T('海边银色维京船骨架，背靠雪山。','A silver Viking-ship skeleton by the sea, snowy peaks behind.') },
        { id:'r3',  name:'哈帕音乐厅',     en:'Harpa Concert Hall',               type:'历史', x:48, y:14, hours:'1h',   blurb:GG.T('蜂巢玻璃幕墙随光变色，港边地标。','A honeycomb glass facade that shifts color with the light — the harborfront landmark.') },
        { id:'r4',  name:'蓝湖温泉',       en:'Blue Lagoon',                      type:'自然', x:14, y:48, hours:'3h',   blurb:GG.T('乳蓝色地热温泉，敷火山泥泡到化掉。','Milky-blue geothermal waters — mask up with silica mud and melt away.') },
        { id:'r5',  name:'黄金圈间歇泉',   en:'Geysir (Golden Circle)',           type:'自然', x:84, y:46, hours:'2h',   blurb:GG.T('每几分钟喷涌一次的滚水柱，蔚为壮观。','A boiling column erupts every few minutes — spectacular.') },
        { id:'r6',  name:'黄金瀑布',       en:'Gullfoss Waterfall',               type:'自然', x:88, y:38, hours:'1.5h', blurb:GG.T('双层巨瀑轰鸣，水雾里常见彩虹。','A thundering two-tier cascade — rainbows live in the spray.') },
        { id:'r7',  name:'海鲜浓汤老店',   en:'Harborside Lobster Soup',          type:'美食', x:46, y:18, hours:'1h',   blurb:GG.T('港口边一碗热龙虾浓汤，驱散寒意。','A hot bowl of lobster soup by the harbor to chase off the cold.') },
        { id:'r8',  name:'羊肉热狗摊',     en:'Famous Lamb Hot Dog Stand',        type:'美食', x:50, y:22, hours:'0.5h', blurb:GG.T('传说中的国民热狗，全套酱料来一根。','The legendary national hot dog — order one with everything.') },
        { id:'r9',  name:'劳加维格购物街', en:'Laugavegur Shopping Street',       type:'购物', x:40, y:24, hours:'1.5h', blurb:GG.T('彩色房子里的设计小店与羊毛衫。','Design boutiques and lopapeysa wool sweaters in a row of colorful houses.') },
        { id:'r10', name:'鲸鱼观赏出海',   en:'Whale Watching Cruise',            type:'亲子', x:36, y:10, hours:'3h',   blurb:GG.T('出海寻座头鲸与海鹦，孩子目不转睛。','Sail out for humpbacks and puffins — the kids won\'t blink.') },
        { id:'r11', name:'冰川泻湖',       en:'Jökulsárlón Glacier Lagoon',       type:'自然', x:90, y:52, hours:'2.5h', blurb:GG.T('蓝白浮冰漂浮的泻湖，钻石沙滩相邻。','A lagoon of drifting blue-white icebergs, with Diamond Beach next door.') },
        { id:'r12', name:'珍珠楼旋转餐厅', en:'Perlan Revolving Restaurant',      type:'美食', x:60, y:40, hours:'1.5h', blurb:GG.T('热水罐改造的玻璃穹顶，旋转俯瞰雪城。','A glass dome atop old hot-water tanks, slowly turning above the snowy city.') },
        { id:'r13', name:'托宁湖',         en:'Tjörnin Pond',                     type:'自然', x:46, y:28, hours:'0.5h', blurb:GG.T('市政厅旁的天鹅湖，倒映彩色房子，黄昏散步刚好。','The swan pond by city hall, mirroring colorful houses — just right for a dusk stroll.') },
        { id:'r14', name:'冰岛国家博物馆', en:'National Museum of Iceland',       type:'历史', x:38, y:32, hours:'1.5h', blurb:GG.T('从维京定居到独立的千年故事，一馆讲透。','A thousand years from Viking settlement to independence, told in one museum.') },
        { id:'r15', name:'天空之湖温泉',   en:'Sky Lagoon',                       type:'自然', x:22, y:44, hours:'2.5h', blurb:GG.T('崖边无边地热泳池，泡着看大西洋落日。','A cliff-edge infinity geothermal pool — soak while the sun sets over the Atlantic.') },
        { id:'r16', name:'彩虹街',         en:'Rainbow Street',                   type:'购物', x:44, y:22, hours:'0.5h', blurb:GG.T('通往大教堂的彩虹路面，全城最上镜的打卡街。','The rainbow-painted road up to the church — the most photogenic street in town.') },
        { id:'r17', name:'辛格维利尔',     en:'Thingvellir National Park',        type:'历史', x:80, y:50, hours:'2h',   blurb:GG.T('黄金圈第一站，欧美板块裂缝中的千年古议会遗址。','First stop on the Golden Circle — a thousand-year-old parliament site in the rift between continents.') },
        { id:'r18', name:'海港鲸鱼馆',     en:'Whales of Iceland',                type:'亲子', x:40, y:14, hours:'1h',   blurb:GG.T('等比鲸类模型悬在头顶，孩子仰着头看呆。','Life-size whale models hang overhead — kids stare straight up, awestruck.') },
        { id:'r19', name:'维迪岛',         en:'Videy Island',                     type:'自然', x:30, y:8,  hours:'1.5h', blurb:GG.T('渡海到小岛看光之塔与艺术装置，海风极静。','Ferry to the little island for the Imagine Peace Tower and art installations — utterly calm sea air.') },
        { id:'r20', name:'火山熔岩展',     en:'Lava & Volcano Exhibition',        type:'亲子', x:48, y:20, hours:'1h',   blurb:GG.T('模拟火山喷发与地震，搞懂这片冰火之地怎么来的。','Simulated eruptions and quakes — understand how this land of ice and fire came to be.') }
      ]
    }
  }
};
