/* alta — 衣橱单品 + 场合定义。全离线、衣物用 emoji。
   WARDROBE: {key,label,emoji,slot,formality 1~5,warmth 1~3,styleTags[],colors[]}
     slot ∈ 上装/下装/外套/鞋/配饰
     formality 1=极休闲 5=极正式；warmth 1=薄 3=厚
   OCCASIONS: {key,label,emoji, want:{form:[lo,hi], styleTags:[偏好], needOuter, sporty, warmthBias}} */
window.ALTA = (function(){

const WARDROBE = [
  /* ---------- 上装 ---------- */
  {key:'tee_white',  label:'白色基础 T 恤', emoji:'👕', slot:'上装', formality:2, warmth:1, styleTags:['基础','清爽','百搭'], colors:['白']},
  {key:'tee_print',  label:'印花 T 恤',     emoji:'👕', slot:'上装', formality:1, warmth:1, styleTags:['街头','活力','休闲'], colors:['杂']},
  {key:'shirt_ox',   label:'白衬衫',         emoji:'👔', slot:'上装', formality:4, warmth:1, styleTags:['正式','干练','极简'], colors:['白']},
  {key:'shirt_silk', label:'真丝衬衫',       emoji:'👚', slot:'上装', formality:4, warmth:1, styleTags:['优雅','约会','精致'], colors:['香槟']},
  {key:'knit',       label:'针织毛衫',       emoji:'🧶', slot:'上装', formality:3, warmth:2, styleTags:['温柔','通勤','文艺'], colors:['燕麦']},
  {key:'hoodie',     label:'连帽卫衣',       emoji:'🧥', slot:'上装', formality:1, warmth:2, styleTags:['街头','运动','舒适'], colors:['灰']},
  {key:'dress_mini', label:'小黑裙',         emoji:'👗', slot:'上装', formality:4, warmth:1, styleTags:['约会','优雅','派对'], colors:['黑'], onepiece:true},
  {key:'dress_floral',label:'碎花连衣裙',    emoji:'👗', slot:'上装', formality:3, warmth:1, styleTags:['约会','甜美','出游'], colors:['花'], onepiece:true},
  {key:'polo',       label:'Polo 衫',        emoji:'👕', slot:'上装', formality:3, warmth:1, styleTags:['清爽','商务休闲','百搭'], colors:['藏青']},
  {key:'tank',       label:'运动背心',       emoji:'🎽', slot:'上装', formality:1, warmth:1, styleTags:['运动','活力'], colors:['黑']},

  /* ---------- 下装 ---------- */
  {key:'jeans',      label:'直筒牛仔裤',     emoji:'👖', slot:'下装', formality:2, warmth:2, styleTags:['百搭','休闲','街头'], colors:['蓝']},
  {key:'trousers',   label:'西裤',           emoji:'👖', slot:'下装', formality:5, warmth:2, styleTags:['正式','干练','商务'], colors:['黑']},
  {key:'chinos',     label:'卡其休闲裤',     emoji:'👖', slot:'下装', formality:3, warmth:2, styleTags:['商务休闲','百搭','清爽'], colors:['卡其']},
  {key:'skirt_aline',label:'A 字半裙',       emoji:'👗', slot:'下装', formality:3, warmth:1, styleTags:['优雅','约会','甜美'], colors:['米']},
  {key:'shorts',     label:'休闲短裤',       emoji:'🩳', slot:'下装', formality:1, warmth:1, styleTags:['出游','休闲','活力'], colors:['卡其']},
  {key:'leggings',   label:'运动紧身裤',     emoji:'🩳', slot:'下装', formality:1, warmth:1, styleTags:['运动','活力'], colors:['黑']},
  {key:'wide_pants', label:'阔腿裤',         emoji:'👖', slot:'下装', formality:3, warmth:2, styleTags:['文艺','优雅','通勤'], colors:['燕麦']},

  /* ---------- 外套 ---------- */
  {key:'blazer',     label:'西装外套',       emoji:'🧥', slot:'外套', formality:5, warmth:2, styleTags:['正式','干练','商务'], colors:['深灰']},
  {key:'trench',     label:'风衣',           emoji:'🧥', slot:'外套', formality:4, warmth:2, styleTags:['优雅','通勤','经典'], colors:['卡其']},
  {key:'denim_jkt',  label:'牛仔外套',       emoji:'🧥', slot:'外套', formality:2, warmth:2, styleTags:['街头','休闲','出游'], colors:['蓝']},
  {key:'cardigan',   label:'开衫',           emoji:'🧶', slot:'外套', formality:3, warmth:2, styleTags:['温柔','文艺','通勤'], colors:['燕麦']},
  {key:'puffer',     label:'轻薄羽绒服',     emoji:'🧥', slot:'外套', formality:2, warmth:3, styleTags:['保暖','出游','休闲'], colors:['黑']},

  /* ---------- 鞋 ---------- */
  {key:'loafers',    label:'乐福鞋',         emoji:'👞', slot:'鞋',  formality:4, warmth:1, styleTags:['正式','商务','经典'], colors:['棕']},
  {key:'heels',      label:'高跟鞋',         emoji:'👠', slot:'鞋',  formality:5, warmth:1, styleTags:['优雅','约会','派对'], colors:['黑']},
  {key:'sneakers',   label:'小白鞋',         emoji:'👟', slot:'鞋',  formality:2, warmth:1, styleTags:['百搭','清爽','休闲'], colors:['白']},
  {key:'running',    label:'跑鞋',           emoji:'👟', slot:'鞋',  formality:1, warmth:1, styleTags:['运动','活力'], colors:['黑']},
  {key:'boots',      label:'切尔西靴',       emoji:'🥾', slot:'鞋',  formality:3, warmth:2, styleTags:['街头','经典','出游'], colors:['棕']},
  {key:'sandals',    label:'凉鞋',           emoji:'🩴', slot:'鞋',  formality:1, warmth:1, styleTags:['出游','休闲','甜美'], colors:['棕']},

  /* ---------- 配饰 ---------- */
  {key:'watch',      label:'手表',           emoji:'⌚', slot:'配饰', formality:4, warmth:1, styleTags:['正式','商务','经典'], colors:['银']},
  {key:'tote',       label:'托特包',         emoji:'👜', slot:'配饰', formality:3, warmth:1, styleTags:['通勤','百搭','极简'], colors:['棕']},
  {key:'clutch',     label:'手拿包',         emoji:'👝', slot:'配饰', formality:5, warmth:1, styleTags:['约会','派对','优雅'], colors:['黑']},
  {key:'cap',        label:'棒球帽',         emoji:'🧢', slot:'配饰', formality:1, warmth:1, styleTags:['街头','运动','出游'], colors:['黑']},
  {key:'scarf',      label:'丝巾',           emoji:'🧣', slot:'配饰', formality:4, warmth:1, styleTags:['优雅','精致','经典'], colors:['花']},
  {key:'shades',     label:'墨镜',           emoji:'🕶️', slot:'配饰', formality:2, warmth:1, styleTags:['出游','街头','活力'], colors:['黑']},
];

/* 场合：want.form 是理想正式度区间；styleTags 是该场合加分的风格标签；
   needOuter 偏好有外套；sporty 偏好运动风；warmthBias 偏好更保暖 */
const OCCASIONS = [
  {key:'work',     label:'通勤',       emoji:'💼', want:{form:[3,4], styleTags:['通勤','商务休闲','干练','极简','百搭'], needOuter:0.5}},
  {key:'date',     label:'约会',       emoji:'💕', want:{form:[3,5], styleTags:['约会','优雅','甜美','精致','派对'], needOuter:0.2}},
  {key:'interview',label:'面试',       emoji:'🤝', want:{form:[4,5], styleTags:['正式','干练','商务','经典','极简'], needOuter:0.9}},
  {key:'sport',    label:'运动',       emoji:'🏃', want:{form:[1,2], styleTags:['运动','活力','舒适'], needOuter:0, sporty:1}},
  {key:'weekend',  label:'周末出游',   emoji:'🌳', want:{form:[1,3], styleTags:['出游','休闲','街头','活力','百搭'], needOuter:0.3}},
  {key:'wedding',  label:'婚礼宾客',   emoji:'💐', want:{form:[4,5], styleTags:['优雅','派对','精致','约会','经典'], needOuter:0.3}},
];

return {WARDROBE, OCCASIONS};
})();
