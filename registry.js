/* registry.js — 唯一菜单事实源。画廊首页据此渲染卡片。
   status: 'live' 已建可玩 | 'soon' 即将上线（卡片置灰）
   disclaimer:true → 涉医/法/财，结果区强制免责声明 */
window.DEMOS = [
  // 产业, slug, 标题, 一句话, emoji, accent
  { slug:'whips',        industry:'汽车', title:'汽车版 Tinder',   tagline:'左右滑学口味 → 精配 3 台车', emoji:'🚗', accent:'#e8543f', status:'live' },
  { slug:'carsnap',      industry:'汽车', title:'答题荐车',         tagline:'答几问 → 懂你的那台车',      emoji:'🔑', accent:'#d9772b', status:'live' },
  { slug:'style-dna',    industry:'时尚', title:'自拍色彩诊断',     tagline:'一张自拍 → 色彩季型 + 配色板', emoji:'🎨', accent:'#c2569b', status:'live' },
  { slug:'alta',         industry:'时尚', title:'场合穿搭',         tagline:'衣橱 + 场合 → 整套搭配',      emoji:'👗', accent:'#9b5cc2', status:'live' },
  { slug:'origin',       industry:'金融', title:'财务体检',         tagline:'答题 → 财务健康分 + 下一步',   emoji:'📊', accent:'#2e9e7b', status:'live', disclaimer:true },
  { slug:'robo-core',    industry:'金融', title:'智能配置',         tagline:'风险问卷 → 资产饼图 + 增长曲线', emoji:'📈', accent:'#1f9e8f', status:'live', disclaimer:true },
  { slug:'oboe',         industry:'教育', title:'秒变一门课',       tagline:'输入主题 → 结构化迷你课程',    emoji:'📚', accent:'#3a7bd5', status:'live' },
  { slug:'adaptive-quiz',industry:'教育', title:'自适应测验',       tagline:'答题 → 难度自适应 + 预测分',   emoji:'🧠', accent:'#5a6fd5', status:'live' },
  { slug:'final-round',  industry:'招聘', title:'模拟面试',         tagline:'选岗 → AI 出题 → 即时反馈',    emoji:'🎤', accent:'#3d6fe0', status:'live' },
  { slug:'clause-risk',  industry:'法律', title:'合同风险高亮',     tagline:'贴条款 → 标红 + 大白话 + 改写', emoji:'⚖️', accent:'#7a6cf0', status:'live', disclaimer:true },
  { slug:'ubie',         industry:'医疗', title:'症状自助分诊',     tagline:'描述症状 → 追问 → 分级建议',   emoji:'🩺', accent:'#1f9bb3', status:'live', disclaimer:true },
  { slug:'nl-home',      industry:'房产', title:'一句话找房',       tagline:'描述梦想的家 → 匹配房源',     emoji:'🏠', accent:'#2f8fd4', status:'live' },
  { slug:'mindtrip',     industry:'旅行', title:'行程 + 地图',      tagline:'答偏好 → 逐时行程 + 地图标点', emoji:'🗺️', accent:'#0fa3a3', status:'live' },
  { slug:'ollie',        industry:'餐饮', title:'冰箱出菜谱',       tagline:'勾选食材 → 现在能做的菜',     emoji:'🍳', accent:'#e0922b', status:'live' },
  { slug:'mealplan',     industry:'餐饮', title:'7 天饮食计划',     tagline:'问卷 → 周计划 + 购物清单',    emoji:'🥗', accent:'#5aaa2b', status:'live' },
  { slug:'dinner',       industry:'餐饮', title:'今天吃什么',       tagline:'贴一段美食帖 → AI 现做图文菜谱', emoji:'🍲', accent:'#e0651f', status:'live' },
  { slug:'insure-need',  industry:'保险', title:'该买多少保',       tagline:'答生活问题 → 保额/险种建议',  emoji:'🛡️', accent:'#2b7fae', status:'live', disclaimer:true },
  { slug:'matchmaker',   industry:'约会', title:'对话式精配',       tagline:'只给你一个人 + 可追溯理由',    emoji:'💞', accent:'#e0577f', status:'live' },
  { slug:'pet-health',   industry:'宠物', title:'宠物拍照自检',     tagline:'拍眼/皮肤 → 健康分 + 观察项',  emoji:'🐾', accent:'#c98a2b', status:'live', disclaimer:true },
  { slug:'pet-vet',      industry:'宠物', title:'AI 兽医',         tagline:'会反问澄清再给建议',          emoji:'🐶', accent:'#b07a3a', status:'live', disclaimer:true },
  { slug:'baby-cry',     industry:'母婴', title:'哭声翻译',         tagline:'录哭声 → 原因概率 + 安抚',     emoji:'👶', accent:'#e08aa0', status:'live', disclaimer:true },
  { slug:'coddle',       industry:'母婴', title:'按月龄育儿指引',   tagline:'随口记录 → 个性化指引',       emoji:'🍼', accent:'#d77a98', status:'live', disclaimer:true },
  { slug:'gamma',        industry:'办公', title:'一句话变 Deck',    tagline:'输入主题 → 整套排版 deck',    emoji:'🖼️', accent:'#6a5cf0', status:'live' },
  { slug:'notebooklm',   industry:'创作', title:'喂资料替你消化',   tagline:'上传资料 → 学习指南/问答',    emoji:'📓', accent:'#4a6fe0', status:'live' },
  { slug:'mood-journal', industry:'心理', title:'心情日记',         tagline:'写心情 → 情绪曲线 + 词云',     emoji:'🌤️', accent:'#7a8fd4', status:'live', disclaimer:true },
  { slug:'unmask',       industry:'游戏', title:'不被看穿',         tagline:'剪刀石头布 · 别被想懂你的 AI 看穿', emoji:'🎭', accent:'#6457e8', status:'live' },
];
