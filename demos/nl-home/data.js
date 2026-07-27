/* nl-home 数据：LISTINGS = 本地 mock 房源库，供「一句话找房」按解析出的约束过滤 + 排序。
   字段：id, title, city, beds(室,int), price(总价/万,int), ageYears(房龄/年,int),
         area(建面/㎡,int), tags:[软约束标签], blurb(一句话卖点)
   设计：city/beds/price/ageYears 跨度要大，确保硬约束过滤可见效果。
   常用标签：地铁/学区/南北通透/带阳台/精装/低楼层/高楼层/小区新/拎包入住
   双语：用户可见字符串用 GG.T(中文,English) 包装（app.js 先于本文件加载）；
   city/tags 的 GG.T 取值同时是匹配用的规范值，须与 nl-home.js 里的
   CITY_WORDS/TAG_RULES/NL_TAGS 逐字一致。 */
window.NLHOME = {
  CITIES: [GG.T('杭州','Hangzhou'),GG.T('上海','Shanghai'),GG.T('成都','Chengdu'),GG.T('北京','Beijing'),GG.T('深圳','Shenzhen'),GG.T('武汉','Wuhan')],
  TAG_VOCAB: [GG.T('地铁','Near metro'),GG.T('学区','School district'),GG.T('南北通透','North-south facing'),GG.T('带阳台','Balcony'),GG.T('精装','Renovated'),GG.T('低楼层','Low floor'),GG.T('高楼层','High floor'),GG.T('小区新','Newer community'),GG.T('拎包入住','Move-in ready')],
  LISTINGS: [
    { id:'h1',  title:GG.T('西湖区·翠苑次新三房','Xihu · Cuiyuan nearly-new 3-bed'), city:GG.T('杭州','Hangzhou'), beds:3, price:285, ageYears:4,  area:98,
      tags:[GG.T('地铁','Near metro'),GG.T('南北通透','North-south facing'),GG.T('精装','Renovated'),GG.T('小区新','Newer community')],
      blurb:GG.T('地铁2号线200米，南北通透，开发商精装未住。','200 m to Metro Line 2, north-south layout, developer-renovated and never lived in.') },
    { id:'h2',  title:GG.T('拱墅区·运河边小两房','Gongshu · Canal-side compact 2-bed'), city:GG.T('杭州','Hangzhou'), beds:2, price:198, ageYears:3,  area:72,
      tags:[GG.T('地铁','Near metro'),GG.T('带阳台','Balcony'),GG.T('精装','Renovated'),GG.T('拎包入住','Move-in ready')],
      blurb:GG.T('临河小户型，精装拎包入住，单身/小两口首选。','Compact riverside home, renovated and move-in ready — first pick for singles and couples.') },
    { id:'h3',  title:GG.T('滨江区·江景大平层','Binjiang · Riverview grand flat'), city:GG.T('杭州','Hangzhou'), beds:4, price:520, ageYears:2,  area:168,
      tags:[GG.T('高楼层','High floor'),GG.T('南北通透','North-south facing'),GG.T('精装','Renovated'),GG.T('小区新','Newer community')],
      blurb:GG.T('一线江景大平层，全屋豪华精装，改善天花板。','Front-row river views, luxury full renovation — the ceiling of move-up homes.') },
    { id:'h4',  title:GG.T('余杭区·未来科技城三房','Yuhang · Future Sci-Tech City 3-bed'), city:GG.T('杭州','Hangzhou'), beds:3, price:260, ageYears:1,  area:89,
      tags:[GG.T('地铁','Near metro'),GG.T('学区','School district'),GG.T('带阳台','Balcony'),GG.T('小区新','Newer community')],
      blurb:GG.T('次新纯新房，挨着地铁与名校，码农通勤友好。','Nearly-new build next to the metro and top schools — commuter-friendly for tech workers.') },
    { id:'h5',  title:GG.T('萧山区·老小区紧凑两房','Xiaoshan · Older-estate compact 2-bed'), city:GG.T('杭州','Hangzhou'), beds:2, price:135, ageYears:18, area:68,
      tags:[GG.T('学区','School district'),GG.T('低楼层','Low floor')],
      blurb:GG.T('老牌学区房，总价低门槛，适合落户占学位。','Long-established school-district home with a low entry price — good for securing a school place.') },

    { id:'h6',  title:GG.T('浦东·联洋次新三房','Pudong · Lianyang nearly-new 3-bed'), city:GG.T('上海','Shanghai'), beds:3, price:880, ageYears:5,  area:110,
      tags:[GG.T('地铁','Near metro'),GG.T('学区','School district'),GG.T('南北通透','North-south facing'),GG.T('精装','Renovated')],
      blurb:GG.T('内中环之间次新房，地铁口+对口名校。','Nearly-new home between the inner and middle rings — metro at the door plus a zoned top school.') },
    { id:'h7',  title:GG.T('闵行·莘庄通勤两房','Minhang · Xinzhuang commuter 2-bed'), city:GG.T('上海','Shanghai'), beds:2, price:430, ageYears:8,  area:78,
      tags:[GG.T('地铁','Near metro'),GG.T('带阳台','Balcony')],
      blurb:GG.T('三轨交汇，通勤怪兽的性价比两房。','Three metro lines converge here — the value 2-bed for super-commuters.') },
    { id:'h8',  title:GG.T('杨浦·五角场小三房','Yangpu · Wujiaochang compact 3-bed'), city:GG.T('上海','Shanghai'), beds:3, price:560, ageYears:12, area:92,
      tags:[GG.T('地铁','Near metro'),GG.T('学区','School district'),GG.T('南北通透','North-south facing')],
      blurb:GG.T('高校环抱，学区扎实，老破大但格局方正。','Ringed by universities with a solid school district; dated but squarely laid out.') },

    { id:'h9',  title:GG.T('高新区·金融城纯新三房','Hi-tech Zone · Financial City brand-new 3-bed'), city:GG.T('成都','Chengdu'), beds:3, price:230, ageYears:2,  area:96,
      tags:[GG.T('地铁','Near metro'),GG.T('南北通透','North-south facing'),GG.T('精装','Renovated'),GG.T('小区新','Newer community')],
      blurb:GG.T('成都顶级板块纯新房，地铁直达金融城。','Brand-new home in Chengdu’s top district, metro straight to the Financial City.') },
    { id:'h10', title:GG.T('天府新区·公园纯新四房','Tianfu New Area · Parkside brand-new 4-bed'), city:GG.T('成都','Chengdu'), beds:4, price:340, ageYears:1,  area:128,
      tags:[GG.T('学区','School district'),GG.T('带阳台','Balcony'),GG.T('精装','Renovated'),GG.T('小区新','Newer community')],
      blurb:GG.T('公园旁纯新大四房，改善家庭舒适之选。','Brand-new spacious 4-bed beside the park — a comfortable move-up choice for families.') },
    { id:'h11', title:GG.T('武侯区·地铁口小两房','Wuhou · Metro-gate compact 2-bed'), city:GG.T('成都','Chengdu'), beds:2, price:115, ageYears:6,  area:66,
      tags:[GG.T('地铁','Near metro'),GG.T('拎包入住','Move-in ready')],
      blurb:GG.T('低总价上车盘，地铁口拎包入住。','Low-price starter home, move-in ready right at the metro exit.') },
    { id:'h17', title:GG.T('高新区·中德英伦次新三房','Hi-tech Zone · Zhongde Yinglun nearly-new 3-bed'), city:GG.T('成都','Chengdu'), beds:3, price:268, ageYears:2,  area:99,
      tags:[GG.T('地铁','Near metro'),GG.T('南北通透','North-south facing'),GG.T('精装','Renovated'),GG.T('小区新','Newer community')],
      blurb:GG.T('同板块次新三房，比金融城便宜些，预算稍抬一点就够得着。','Nearly-new 3-bed in the same district, cheaper than Financial City — within reach with a small budget bump.') },

    { id:'h12', title:GG.T('朝阳·望京次新两房','Chaoyang · Wangjing nearly-new 2-bed'), city:GG.T('北京','Beijing'), beds:2, price:680, ageYears:5,  area:80,
      tags:[GG.T('地铁','Near metro'),GG.T('精装','Renovated'),GG.T('高楼层','High floor')],
      blurb:GG.T('望京核心次新房，互联网人通勤天选。','Core Wangjing nearly-new home — a natural fit for internet-industry commuters.') },
    { id:'h13', title:GG.T('海淀·学区老三房','Haidian · School-district vintage 3-bed'), city:GG.T('北京','Beijing'), beds:3, price:1180,ageYears:25, area:88,
      tags:[GG.T('学区','School district'),GG.T('低楼层','Low floor')],
      blurb:GG.T('顶级学区老破小，为了那张入场券。','Top-tier school district, old and cramped — all for that admission ticket.') },
    { id:'h14', title:GG.T('大兴·新宫新盘三房','Daxing · Xingong new-build 3-bed'), city:GG.T('北京','Beijing'), beds:3, price:520, ageYears:2,  area:99,
      tags:[GG.T('地铁','Near metro'),GG.T('南北通透','North-south facing'),GG.T('带阳台','Balcony'),GG.T('小区新','Newer community')],
      blurb:GG.T('城南次新南北通透，总价相对友好的三房。','Nearly-new north-south 3-bed in the south of the city at a relatively friendly price.') },

    { id:'h15', title:GG.T('南山·科技园小三房','Nanshan · Tech Park compact 3-bed'), city:GG.T('深圳','Shenzhen'), beds:3, price:760, ageYears:7,  area:84,
      tags:[GG.T('地铁','Near metro'),GG.T('学区','School district'),GG.T('精装','Renovated')],
      blurb:GG.T('紧邻科技园，程序员步行上班的精装三房。','Right by the Tech Park — a renovated 3-bed programmers can walk to work from.') },
    { id:'h16', title:GG.T('武昌·光谷次新两房','Wuchang · Optics Valley nearly-new 2-bed'), city:GG.T('武汉','Wuhan'), beds:2, price:140, ageYears:4,  area:74,
      tags:[GG.T('地铁','Near metro'),GG.T('带阳台','Balcony'),GG.T('小区新','Newer community')],
      blurb:GG.T('光谷次新两房，低总价高性价比通勤盘。','Nearly-new 2-bed in Optics Valley — low price, high value for commuters.') }
  ]
};
