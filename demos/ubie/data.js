/* data.js — ubie 症状自助分诊 mock 决策数据。
   结构：FLOWS[主诉] = { emoji, blurb, questions:[ Q ] }
   Q = {
     id,                  // 唯一标识
     q,                   // 题面（yes/no）
     severity,            // 答 yes 累加的分值
     redFlag:true,        // 答 yes → 直接判定急诊级（红旗）
     onlyIfYes:'某题id',  // 仅当该父题答 yes 时才出现（分支）
     yesLabel/noLabel     // 可选，自定义按钮文案
   }
   引擎按顺序遍历 questions：基础题(无 onlyIfYes)一定问；
   带 onlyIfYes 的题，仅当其父题已被答 yes 时才插入提问 → 形成分支。
*/
(function(){
window.UBIE = {
  // 三级分诊定义（颜色 / 标题 / 通用行动建议）
  LEVELS: {
    emergency: {
      key:'emergency', name:'尽快线下就医 / 急诊', short:'急诊',
      color:'#d8503f', soft:'rgba(216,80,63,.10)', emoji:'🚑',
      advice:'你的回答里出现了需要立刻处理的「红旗」信号。建议立即前往最近医院急诊，或拨打急救电话；途中尽量有人陪同，记录症状起始时间与变化。'
    },
    telehealth: {
      key:'telehealth', name:'建议尽快远程问诊', short:'远程',
      color:'#d98a1f', soft:'rgba(217,138,31,.12)', emoji:'💬',
      advice:'症状达到了应当让医生评估的程度，但暂无紧急危险信号。建议 24 小时内做一次在线问诊或预约门诊，并持续观察是否加重；若突然恶化按急诊处理。'
    },
    selfcare: {
      key:'selfcare', name:'可先在家自护观察', short:'自护',
      color:'#2e9e7b', soft:'rgba(46,158,123,.12)', emoji:'🏠',
      advice:'目前症状较轻，多数可在家休息观察。注意补水、规律作息、对症缓解；如 2–3 天无改善、反复或出现新的红旗症状，再升级为问诊或就医。'
    }
  },
  // 总分阈值（无红旗时）：>=THRESH.tele → 远程；否则自护
  THRESH: { tele: 3 },

  // ＋1：每个主诉建议挂号的科室（routing 导诊，非诊断）。emergency 级直接走急诊。
  DEPT: {
    '头痛':  { primary:'神经内科', alt:'内科 / 疼痛科', emergency:'急诊科（必要时神经内科会诊）' },
    '腹痛':  { primary:'消化内科', alt:'普外科',        emergency:'急诊外科' },
    '发热':  { primary:'发热门诊 / 感染科', alt:'内科', emergency:'急诊科' },
    '咳嗽':  { primary:'呼吸内科', alt:'内科',          emergency:'急诊科' },
    '胸痛':  { primary:'心血管内科', alt:'呼吸内科',    emergency:'急诊科 / 胸痛中心' },
    '喉咙痛':{ primary:'耳鼻喉科', alt:'内科',          emergency:'急诊科' }
  },

  FLOWS: {
    '头痛': {
      emoji:'🤕', blurb:'头部疼痛、胀痛或搏动痛',
      questions:[
        { id:'h_sudden', q:'是不是几秒内突然炸裂般剧痛，是你这辈子最痛的一次头痛？', severity:5, redFlag:true },
        { id:'h_neuro', q:'伴随说话含糊、单侧肢体无力或面部歪斜吗？', severity:5, redFlag:true },
        { id:'h_stiff', q:'有发热并且脖子发硬、低头很困难吗？', severity:5, redFlag:true },
        { id:'h_now',  q:'现在头还在痛吗？', severity:1 },
        { id:'h_bad',  q:'痛得影响正常工作 / 生活吗？', severity:2, onlyIfYes:'h_now' },
        { id:'h_vomit',q:'伴随恶心或呕吐吗？', severity:2, onlyIfYes:'h_bad' },
        { id:'h_vision',q:'看东西有重影、闪光或视野缺一块吗？', severity:3, onlyIfYes:'h_bad' },
        { id:'h_recur',q:'最近一两周这种头痛反复出现吗？', severity:1 },
        { id:'h_med',  q:'吃了常用止痛药后完全没缓解吗？', severity:2, onlyIfYes:'h_recur' }
      ]
    },
    '腹痛': {
      emoji:'🤢', blurb:'肚子疼痛、绞痛或胀痛',
      questions:[
        { id:'a_rigid', q:'肚子硬得像木板、一碰就剧痛，几乎不敢动吗？', severity:5, redFlag:true },
        { id:'a_blood', q:'呕血，或解出黑色柏油样 / 鲜血便吗？', severity:5, redFlag:true },
        { id:'a_faint', q:'伴随头晕眼黑、冒冷汗甚至快晕倒吗？', severity:5, redFlag:true },
        { id:'a_now',   q:'现在还在痛吗？', severity:1 },
        { id:'a_rlq',   q:'痛主要集中在右下腹吗？', severity:2, onlyIfYes:'a_now' },
        { id:'a_move',  q:'走路、咳嗽或按压时这块明显更痛吗？', severity:3, onlyIfYes:'a_rlq' },
        { id:'a_fever', q:'同时有发热吗？', severity:2, onlyIfYes:'a_now' },
        { id:'a_vomit', q:'反复呕吐、吃不下喝不下吗？', severity:2 },
        { id:'a_diar',  q:'有腹泻吗？', severity:1 },
        { id:'a_dehy',  q:'腹泻同时口干、尿少、明显乏力吗？', severity:2, onlyIfYes:'a_diar' }
      ]
    },
    '发热': {
      emoji:'🌡️', blurb:'体温升高、忽冷忽热',
      questions:[
        { id:'f_rash',  q:'皮肤出现按压不褪色的瘀点 / 紫斑吗？', severity:5, redFlag:true },
        { id:'f_breath',q:'高热同时呼吸急促、嘴唇发紫吗？', severity:5, redFlag:true },
        { id:'f_conf',  q:'出现意识模糊、叫不太醒或抽搐吗？', severity:5, redFlag:true },
        { id:'f_high',  q:'体温有没有到 39℃ 以上？', severity:2 },
        { id:'f_long',  q:'已经持续发热超过 3 天了吗？', severity:2 },
        { id:'f_stiff', q:'伴随剧烈头痛和脖子发硬吗？', severity:3, onlyIfYes:'f_high' },
        { id:'f_drink', q:'还能正常喝水、精神尚可吗？', severity:0, yesLabel:'能', noLabel:'不能' },
        { id:'f_weak',  q:'是不是几乎吃不下、整天昏沉乏力？', severity:2, onlyIfYes:'f_drink', invertParent:true }
      ]
    },
    '咳嗽': {
      emoji:'😷', blurb:'干咳或有痰、咳个不停',
      questions:[
        { id:'c_breath',q:'静坐时也喘不上气、呼吸很费力吗？', severity:5, redFlag:true },
        { id:'c_blood', q:'咳出明显鲜血吗？', severity:5, redFlag:true },
        { id:'c_chest', q:'咳嗽时胸口压榨样剧痛吗？', severity:4, redFlag:true },
        { id:'c_fever', q:'伴随发热吗？', severity:2 },
        { id:'c_phlegm',q:'咳黄绿色浓痰吗？', severity:2, onlyIfYes:'c_fever' },
        { id:'c_long',  q:'已经咳超过 2 周了吗？', severity:2 },
        { id:'c_night', q:'夜里咳到睡不着或被憋醒吗？', severity:2, onlyIfYes:'c_long' },
        { id:'c_wheeze',q:'呼吸时有明显哮鸣 / 喘息声吗？', severity:3 }
      ]
    },
    '胸痛': {
      emoji:'💓', blurb:'胸口疼痛、压迫或闷胀',
      questions:[
        { id:'p_crush', q:'胸口压榨样剧痛，向左肩、手臂或下巴放射吗？', severity:5, redFlag:true },
        { id:'p_sweat', q:'同时大汗淋漓、恶心或有濒死感吗？', severity:5, redFlag:true },
        { id:'p_dysp',  q:'伴随严重呼吸困难或快晕倒吗？', severity:5, redFlag:true },
        { id:'p_now',   q:'现在胸口还在痛吗？', severity:1 },
        { id:'p_exert', q:'是在活动 / 用力时加重、休息后减轻吗？', severity:3, onlyIfYes:'p_now' },
        { id:'p_dur',   q:'这次持续超过 15 分钟了吗？', severity:2, onlyIfYes:'p_exert' },
        { id:'p_breathe',q:'深呼吸或按压胸壁时疼痛会变化吗？', severity:1 },
        { id:'p_palp',  q:'伴随心慌、心跳明显乱跳吗？', severity:2 }
      ]
    },
    '喉咙痛': {
      emoji:'🦠', blurb:'咽喉肿痛、吞咽不适',
      questions:[
        { id:'t_breath',q:'喉咙肿到呼吸困难、说话含混或流口水咽不下吗？', severity:5, redFlag:true },
        { id:'t_swell', q:'脖子或脸明显肿胀、张不开嘴吗？', severity:4, redFlag:true },
        { id:'t_swallow',q:'痛到几乎无法吞咽，连水都喝不下吗？', severity:3 },
        { id:'t_fever', q:'伴随发热吗？', severity:2 },
        { id:'t_pus',   q:'扁桃体上有白色脓点 / 脓苔吗？', severity:2, onlyIfYes:'t_fever' },
        { id:'t_node',  q:'下巴 / 颈部淋巴结肿大压痛吗？', severity:1, onlyIfYes:'t_fever' },
        { id:'t_long',  q:'已经痛超过一周还没好吗？', severity:1 }
      ]
    }
  }
};
})();
