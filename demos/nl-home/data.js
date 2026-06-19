/* nl-home 数据：LISTINGS = 本地 mock 房源库，供「一句话找房」按解析出的约束过滤 + 排序。
   字段：id, title, city, beds(室,int), price(总价/万,int), ageYears(房龄/年,int),
         area(建面/㎡,int), tags:[软约束标签], blurb(一句话卖点)
   设计：city/beds/price/ageYears 跨度要大，确保硬约束过滤可见效果。
   常用标签：地铁/学区/南北通透/带阳台/精装/低楼层/高楼层/小区新/拎包入住 */
window.NLHOME = {
  CITIES: ['杭州','上海','成都','北京','深圳','武汉'],
  TAG_VOCAB: ['地铁','学区','南北通透','带阳台','精装','低楼层','高楼层','小区新','拎包入住'],
  LISTINGS: [
    { id:'h1',  title:'西湖区·翠苑次新三房',     city:'杭州', beds:3, price:285, ageYears:4,  area:98,  tags:['地铁','南北通透','精装','小区新'],          blurb:'地铁2号线200米，南北通透，开发商精装未住。' },
    { id:'h2',  title:'拱墅区·运河边小两房',     city:'杭州', beds:2, price:198, ageYears:3,  area:72,  tags:['地铁','带阳台','精装','拎包入住'],          blurb:'临河小户型，精装拎包入住，单身/小两口首选。' },
    { id:'h3',  title:'滨江区·江景大平层',       city:'杭州', beds:4, price:520, ageYears:2,  area:168, tags:['高楼层','南北通透','精装','小区新'],        blurb:'一线江景大平层，全屋豪华精装，改善天花板。' },
    { id:'h4',  title:'余杭区·未来科技城三房',   city:'杭州', beds:3, price:260, ageYears:1,  area:89,  tags:['地铁','学区','带阳台','小区新'],            blurb:'次新纯新房，挨着地铁与名校，码农通勤友好。' },
    { id:'h5',  title:'萧山区·老小区紧凑两房',   city:'杭州', beds:2, price:135, ageYears:18, area:68,  tags:['学区','低楼层'],                          blurb:'老牌学区房，总价低门槛，适合落户占学位。' },

    { id:'h6',  title:'浦东·联洋次新三房',       city:'上海', beds:3, price:880, ageYears:5,  area:110, tags:['地铁','学区','南北通透','精装'],            blurb:'内中环之间次新房，地铁口+对口名校。' },
    { id:'h7',  title:'闵行·莘庄通勤两房',       city:'上海', beds:2, price:430, ageYears:8,  area:78,  tags:['地铁','带阳台'],                          blurb:'三轨交汇，通勤怪兽的性价比两房。' },
    { id:'h8',  title:'杨浦·五角场小三房',       city:'上海', beds:3, price:560, ageYears:12, area:92,  tags:['地铁','学区','南北通透'],                  blurb:'高校环抱，学区扎实，老破大但格局方正。' },

    { id:'h9',  title:'高新区·金融城纯新三房',   city:'成都', beds:3, price:230, ageYears:2,  area:96,  tags:['地铁','南北通透','精装','小区新'],          blurb:'成都顶级板块纯新房，地铁直达金融城。' },
    { id:'h10', title:'天府新区·公园纯新四房',   city:'成都', beds:4, price:340, ageYears:1,  area:128, tags:['学区','带阳台','精装','小区新'],            blurb:'公园旁纯新大四房，改善家庭舒适之选。' },
    { id:'h11', title:'武侯区·地铁口小两房',     city:'成都', beds:2, price:115, ageYears:6,  area:66,  tags:['地铁','拎包入住'],                        blurb:'低总价上车盘，地铁口拎包入住。' },

    { id:'h12', title:'朝阳·望京次新两房',       city:'北京', beds:2, price:680, ageYears:5,  area:80,  tags:['地铁','精装','高楼层'],                    blurb:'望京核心次新房，互联网人通勤天选。' },
    { id:'h13', title:'海淀·学区老三房',         city:'北京', beds:3, price:1180,ageYears:25, area:88,  tags:['学区','低楼层'],                          blurb:'顶级学区老破小，为了那张入场券。' },
    { id:'h14', title:'大兴·新宫新盘三房',       city:'北京', beds:3, price:520, ageYears:2,  area:99,  tags:['地铁','南北通透','带阳台','小区新'],        blurb:'城南次新南北通透，总价相对友好的三房。' },

    { id:'h15', title:'南山·科技园小三房',       city:'深圳', beds:3, price:760, ageYears:7,  area:84,  tags:['地铁','学区','精装'],                      blurb:'紧邻科技园，程序员步行上班的精装三房。' },
    { id:'h16', title:'武昌·光谷次新两房',       city:'武汉', beds:2, price:140, ageYears:4,  area:74,  tags:['地铁','带阳台','小区新'],                  blurb:'光谷次新两房，低总价高性价比通勤盘。' }
  ]
};
