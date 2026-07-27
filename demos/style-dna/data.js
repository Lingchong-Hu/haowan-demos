/* style-dna 数据：样图参数（本地 canvas 现画，无需外部图片）+ 颜色中文名库 + 季型文案 + 妆造库 */
window.STYLEDNA = {
  // 三张本地生成的「样图」——参数不同→主色不同→配色板不同（满足换图变色）
  SAMPLES: [
    { key:'warm', label:GG.T('暖调','Warm'), tag:GG.T('暖调样片','Warm sample'), bg:'#f3e7d2', hair:'#5a3a22', skin:'#e7b48a', top:'#c4622e' },
    { key:'cool', label:GG.T('冷浅','Cool Light'), tag:GG.T('冷浅样片','Cool Light sample'), bg:'#e1e8f0', hair:'#4a4a55', skin:'#e9c4b0', top:'#7fb5c9' },
    { key:'deep', label:GG.T('冷艳','Cool Deep'), tag:GG.T('冷艳样片','Cool Deep sample'), bg:'#9aa3b3', hair:'#16161c', skin:'#f0c89e', top:'#10316b' },
  ],
  // 颜色 → 中文名（取最近）
  NAMES: [
    ['#f5e6d3',GG.T('奶杏','Cream Apricot')],['#e8c39e',GG.T('暖杏','Warm Apricot')],['#d99a6c',GG.T('焦糖','Caramel')],['#b5651d',GG.T('赤陶','Terracotta')],['#8b4513',GG.T('栗棕','Chestnut Brown')],
    ['#f7d9d9',GG.T('藕粉','Powder Pink')],['#e89ab0',GG.T('胭脂粉','Rouge Pink')],['#c2406a',GG.T('玫红','Rose Red')],['#8b1e3f',GG.T('酒红','Wine Red')],['#5c1a2b',GG.T('勃艮第','Burgundy')],
    ['#fff1b8',GG.T('鹅黄','Butter Yellow')],['#ffd54a',GG.T('明黄','Bright Yellow')],['#e0a020',GG.T('金盏黄','Marigold')],['#b8860b',GG.T('暗金','Antique Gold')],
    ['#d7e8c0',GG.T('嫩芽绿','Spring Bud')],['#8bbf6a',GG.T('草木绿','Greenery')],['#3b7d4f',GG.T('松绿','Pine Green')],['#1f5c45',GG.T('墨绿','Forest Green')],
    ['#cfe8ec',GG.T('薄雾蓝','Misty Blue')],['#7fb5c9',GG.T('雾霾蓝','Dusty Blue')],['#3a7ca5',GG.T('钴蓝','Cobalt Blue')],['#1f3a5c',GG.T('藏青','Navy')],
    ['#e3dcef',GG.T('丁香紫','Lilac')],['#b39ddb',GG.T('薰衣草','Lavender')],['#7e57c2',GG.T('葡萄紫','Grape')],['#4a2e6b',GG.T('茄紫','Aubergine')],
    ['#f0f0ec',GG.T('云白','Cloud White')],['#cfcfc8',GG.T('燕麦灰','Oatmeal')],['#8a8a86',GG.T('岩灰','Stone Gray')],['#3a3a3e',GG.T('炭黑','Charcoal')],
    ['#f2a07a',GG.T('蜜桃','Peach')],['#e85a3f',GG.T('珊瑚红','Coral')],['#0fa3a3',GG.T('孔雀绿','Peacock Teal')],['#2e9e7b',GG.T('薄荷绿','Mint Green')],
  ],
  // 四季型基础文案（warm/cool × light/deep）
  SEASONS: {
    'warm-light': { name:GG.T('暖春型','Warm Spring'), vibe:GG.T('明媚 · 温暖 · 清透','Radiant · Warm · Clear'), advice:GG.T('适合金调、嫩绿、蜜桃这类「带阳光」的浅暖色；避开发灰、发暗的冷色。','Best in light warm shades with built-in sunshine — golden tones, fresh greens, peach; avoid grayed-out, darkened cool colors.') },
    'warm-deep':  { name:GG.T('暖秋型','Warm Autumn'), vibe:GG.T('醇厚 · 大地感 · 复古','Rich · Earthy · Vintage'), advice:GG.T('适合焦糖、橄榄、砖红这类浓郁暖色；避开荧光色与冷调粉。','Best in rich warm shades like caramel, olive, and brick red; avoid neons and cool-toned pinks.') },
    'cool-light': { name:GG.T('冷夏型','Cool Summer'), vibe:GG.T('柔和 · 雾感 · 温柔','Soft · Misty · Gentle'), advice:GG.T('适合薰衣草、雾霾蓝、藕粉这类低饱和冷色；避开明黄与橘红。','Best in muted cool shades like lavender, dusty blue, and powder pink; avoid bright yellow and orange-red.') },
    'cool-deep':  { name:GG.T('冷冬型','Cool Winter'), vibe:GG.T('高对比 · 清冷 · 利落','High-contrast · Icy · Sharp'), advice:GG.T('适合宝石蓝、酒红、纯黑白这类高对比冷色；避开浑浊的大地色。','Best in high-contrast cool shades like sapphire blue, wine red, and pure black & white; avoid muddy earth tones.') },
  },
  // 妆造库：每个季型对应「色彩人格」+ 共鸣钩子 + 可直接抄作业的色号 / 该留该扔
  // best/worst 用于「戴对色 vs 戴错色」对比；色号都是好记的中文名 + hex。
  BEAUTY: {
    'warm-light': {
      persona:GG.T('阳光蜜桃','Sunlit Peach'), hook:GG.T('你天生带光——浅一点、亮一点、暖一点，气色直接亮一个度。','You are born glowing — go lighter, brighter, warmer, and your complexion instantly lifts a level.'),
      best:{ n:GG.T('蜜桃珊瑚','Peach Coral'), hex:'#f4805e' }, worst:{ n:GG.T('冷调灰蓝','Cool Gray-Blue'), hex:'#6b7f99' },
      lip:{ n:GG.T('蜜桃珊瑚','Peach Coral'), hex:'#f4805e' }, lip2:{ n:GG.T('奶橘','Milky Tangerine'), hex:'#ec9b6e' },
      blush:{ n:GG.T('杏桃','Apricot'), hex:'#f3a07a' }, metal:GG.T('香槟金 / 玫瑰金','Champagne Gold / Rose Gold'),
      hair:{ n:GG.T('蜜糖棕','Honey Brown'), hex:'#8a5a2b' },
      keep:[GG.T('焦糖','Caramel'),GG.T('奶杏','Cream Apricot'),GG.T('嫩芽绿','Spring Bud'),GG.T('蜜桃','Peach'),GG.T('金盏黄','Marigold')], toss:[GG.T('纯黑','Pure Black'),GG.T('冷玫粉','Cool Rose Pink'),GG.T('灰蓝','Gray-Blue')],
    },
    'warm-deep': {
      persona:GG.T('醇金大地','Golden Earth'), hook:GG.T('你压得住浓色——颜色越厚重，你越有故事感、越高级。','You can carry rich, saturated color — the deeper the shade, the more depth and polish you project.'),
      best:{ n:GG.T('赤陶砖红','Terracotta Brick'), hex:'#b14a32' }, worst:{ n:GG.T('荧光冷粉','Neon Cool Pink'), hex:'#ff5fa2' },
      lip:{ n:GG.T('砖红','Brick Red'), hex:'#a8442f' }, lip2:{ n:GG.T('枫糖棕','Maple Brown'), hex:'#8a4a30' },
      blush:{ n:GG.T('焦糖','Caramel'), hex:'#c47a4e' }, metal:GG.T('古铜金 / 黄金','Bronze / Yellow Gold'),
      hair:{ n:GG.T('红棕','Auburn'), hex:'#6e3a22' },
      keep:[GG.T('焦糖','Caramel'),GG.T('橄榄绿','Olive Green'),GG.T('墨绿','Forest Green'),GG.T('砖红','Brick Red'),GG.T('暗金','Antique Gold')], toss:[GG.T('荧光色','Neon Colors'),GG.T('冷调粉','Cool Pinks'),GG.T('冷白','Cool White')],
    },
    'cool-light': {
      persona:GG.T('雾感温柔','Soft Mist'), hook:GG.T('你适合一切「蒙了层雾」的柔色——低饱和，才显你的高级温柔。','Muted, misted-over softs are made for you — low saturation is what reveals your refined gentleness.'),
      best:{ n:GG.T('薰衣草紫','Lavender'), hex:'#b39ddb' }, worst:{ n:GG.T('高饱和橘红','Saturated Orange-Red'), hex:'#e0501f' },
      lip:{ n:GG.T('豆沙玫','Dusty Rose'), hex:'#c16b7e' }, lip2:{ n:GG.T('藕粉','Powder Pink'), hex:'#d98fa0' },
      blush:{ n:GG.T('藕粉','Powder Pink'), hex:'#e3a3b0' }, metal:GG.T('银 / 玫瑰金','Silver / Rose Gold'),
      hair:{ n:GG.T('冷棕','Cool Brown'), hex:'#564a52' },
      keep:[GG.T('薰衣草','Lavender'),GG.T('雾霾蓝','Dusty Blue'),GG.T('藕粉','Powder Pink'),GG.T('燕麦灰','Oatmeal'),GG.T('薄雾蓝','Misty Blue')], toss:[GG.T('明黄','Bright Yellow'),GG.T('橘红','Orange-Red'),GG.T('暖金','Warm Gold')],
    },
    'cool-deep': {
      persona:GG.T('高对比清冷','High-Contrast Cool'), hook:GG.T('你扛得住最纯、最艳的色——黑、白、正红，就是你的主场。','You can handle the purest, boldest colors — black, white, and true red are your home turf.'),
      best:{ n:GG.T('宝石蓝','Sapphire Blue'), hex:'#244a8f' }, worst:{ n:GG.T('浑浊大地色','Muddy Earth Tone'), hex:'#9a7a52' },
      lip:{ n:GG.T('正红','True Red'), hex:'#cf1f3f' }, lip2:{ n:GG.T('莓果','Berry'), hex:'#9e1f4a' },
      blush:{ n:GG.T('玫红','Rose Red'), hex:'#c2406a' }, metal:GG.T('银 / 白金','Silver / Platinum'),
      hair:{ n:GG.T('蓝黑','Blue-Black'), hex:'#16161c' },
      keep:[GG.T('宝石蓝','Sapphire Blue'),GG.T('酒红','Wine Red'),GG.T('纯黑白','Pure Black & White'),GG.T('玫红','Rose Red'),GG.T('藏青','Navy')], toss:[GG.T('大地色','Earth Tones'),GG.T('暖橘','Warm Orange'),GG.T('奶油色','Cream Tones')],
    },
  },
};
