/* pet-vet 数据：每个症状 = 1~2 个澄清问题（每题 2~3 个选项）+ 依澄清答案分支的建议。
   关键点：必须先反问澄清，再给建议。不同症状 / 不同澄清答案 → 不同建议。

   结构：
   SPECIES   物种选项（可选）
   LEVELS    三级语气分级：home（在家护理）/ vet（建议就医）/ er（尽快急诊）
   SYMPTOMS  { key: { emoji, label, blurb, questions:[ {id,q,opts:[{v,label}]} ], rule(ans)->{level,advice} } }
             rule 收到所有澄清答案（id->v），返回命中的等级与一段建议文案。
   有的症状只需 1 个澄清问题就能给建议；有的会按第一个答案决定要不要追问第二个（见 needSecond）。
*/
(function(){

const SPECIES = [
  { v:'dog', label:'🐶 狗狗' },
  { v:'cat', label:'🐱 猫猫' },
  { v:'unknown', label:'🐾 不指定' }
];

const LEVELS = {
  home: { key:'home', name:'可在家观察护理', emoji:'🏠', short:'在家护理',
          color:'#2e8b57', soft:'rgba(46,139,87,.10)' },
  vet:  { key:'vet',  name:'建议尽快就医',   emoji:'🩺', short:'建议就医',
          color:'#c08a2a', soft:'rgba(192,138,42,.12)' },
  er:   { key:'er',   name:'尽快急诊',       emoji:'🚑', short:'尽快急诊',
          color:'#d24a3a', soft:'rgba(210,74,58,.12)' }
};

/* 小工具：把用户对某题选的选项 label 取出来，便于在建议里"引用用户的回答" */
function labelOf(sym, qid, v){
  const q = sym.questions.find(q=>q.id===qid);
  if(!q) return v;
  const o = q.opts.find(o=>o.v===v);
  return o ? o.label : v;
}

const SYMPTOMS = {
  vomit: {
    emoji:'🤮', label:'呕吐', blurb:'吐了食物 / 黄水 / 反复干呕',
    questions:[
      { id:'dur', q:'吐了多久了？', opts:[
        {v:'once', label:'就吐了一两次，刚开始'},
        {v:'day',  label:'已经一整天了'},
        {v:'multi', label:'不止一天，反复吐'} ]},
      { id:'spirit', q:'它现在精神状态怎么样？', opts:[
        {v:'ok',  label:'照常活泼、还想吃'},
        {v:'low', label:'有点蔫、没什么精神'},
        {v:'bad', label:'很虚弱 / 站不稳 / 不停吐'} ]}
    ],
    rule(ans){
      const dur = labelOf(this,'dur',ans.dur), sp = labelOf(this,'spirit',ans.spirit);
      const quote = `你说「${dur}、${sp}」`;
      if(ans.spirit==='bad' || ans.dur==='multi' && ans.spirit==='low')
        return { level:'er', advice:`${quote}——反复呕吐又没精神，容易引发脱水甚至更严重的问题，建议尽快带去急诊，路上可少量喂水但别强行喂食。` };
      if(ans.dur==='once' && ans.spirit==='ok')
        return { level:'home', advice:`${quote}——偶发一两次、精神食欲都在，多半是肠胃一时不适。可先禁食 6~8 小时、之后少量多次喂温水和易消化食物观察，若再次呕吐或变蔫再就医。` };
      return { level:'vet', advice:`${quote}——持续呕吐或开始没精神，建议尽快就医排查肠胃炎、误食或异物，先停食停水别硬喂。` };
    }
  },

  diarrhea: {
    emoji:'💩', label:'拉稀', blurb:'软便 / 水样便 / 次数变多',
    questions:[
      { id:'blood', q:'便便里有血或发黑吗？', opts:[
        {v:'no',   label:'没有，就是软 / 水样'},
        {v:'some', label:'带一点血丝 / 黏液'},
        {v:'black', label:'明显血便或发黑' }]},
      { id:'eat', q:'还正常吃东西、喝水吗？', opts:[
        {v:'yes', label:'照吃照喝，挺有精神'},
        {v:'less', label:'吃得少了一些'},
        {v:'no', label:'基本不吃不喝' }]}
    ],
    rule(ans){
      const bl = labelOf(this,'blood',ans.blood), ea = labelOf(this,'eat',ans.eat);
      const quote = `你说「${bl}、${ea}」`;
      if(ans.blood==='black' || ans.eat==='no')
        return { level:'er', advice:`${quote}——明显血便/发黑或完全不吃不喝，可能是急性肠炎、中毒或脱水，建议尽快急诊，最好带上便便样本给医生看。` };
      if(ans.blood==='no' && ans.eat==='yes')
        return { level:'home', advice:`${quote}——单纯软便、精神食欲都在，常见于吃坏肚子或换粮。可清淡饮食 1~2 天、保证饮水观察；若 48 小时不好转或出现血便再就医。` };
      return { level:'vet', advice:`${quote}——拉稀带血丝或食欲下降，建议近一两天内就医，查清是寄生虫、肠炎还是饮食问题。` };
    }
  },

  noteat: {
    emoji:'🍽️', label:'不吃东西', blurb:'食欲下降 / 拒食',
    questions:[
      { id:'span', q:'多久没好好吃了？', opts:[
        {v:'meal', label:'就这一两顿不太想吃'},
        {v:'day',  label:'差不多一天没怎么吃'},
        {v:'two', label:'超过两天几乎不吃' }]},
      { id:'other', q:'除了不吃，还有别的不对劲吗？', opts:[
        {v:'none', label:'其它都正常，就是挑'},
        {v:'tired', label:'同时变得很蔫 / 躲起来'},
        {v:'sign', label:'还伴呕吐 / 拉稀 / 发抖' }]}
    ],
    rule(ans){
      const sp = labelOf(this,'span',ans.span), ot = labelOf(this,'other',ans.other);
      const quote = `你说「${sp}、${ot}」`;
      if(ans.span==='two' || ans.other==='sign')
        return { level:'er', advice:`${quote}——长时间拒食或同时有呕吐拉稀发抖，尤其猫超过 1~2 天不吃可能伤肝，建议尽快就医检查。` };
      if(ans.span==='meal' && ans.other==='none')
        return { level:'home', advice:`${quote}——偶尔一两顿没胃口、其它正常，可能只是嘴叼或天气热。可换点适口食物、保证饮水，观察一天；若继续不吃或变蔫再就医。` };
      return { level:'vet', advice:`${quote}——食欲明显下降并开始没精神，建议尽快就医排查口腔、肠胃或全身性问题。` };
    }
  },

  scratch: {
    emoji:'🐾', label:'一直抓挠', blurb:'抓痒 / 蹭 / 啃咬皮肤',
    questions:[
      { id:'skin', q:'扒开毛看，皮肤是什么样？', opts:[
        {v:'fine', label:'看起来没破、没红'},
        {v:'red',  label:'有点红 / 掉毛 / 皮屑'},
        {v:'wound', label:'抓破流血或大片红肿' }]},
      { id:'flea', q:'最近做过体外驱虫吗？', opts:[
        {v:'yes', label:'最近做过，挺规律'},
        {v:'no',  label:'好久没做 / 没做过'} ]}
    ],
    rule(ans){
      const sk = labelOf(this,'skin',ans.skin), fl = labelOf(this,'flea',ans.flea);
      const quote = `你说「${sk}、${fl}」`;
      if(ans.skin==='wound')
        return { level:'vet', advice:`${quote}——已经抓破或大片红肿，容易继发感染，建议近期就医处理伤口；可先戴伊丽莎白圈防止继续抓。` };
      if(ans.skin==='fine' && ans.flea==='yes')
        return { level:'home', advice:`${quote}——皮肤没破又有规律驱虫，可能是季节性干燥或一时痒。可观察几天、留意有无加重，保持环境清洁即可。` };
      return { level:'vet', advice:`${quote}——皮肤发红掉毛或长期没驱虫，常见于跳蚤/螨虫或皮肤过敏，建议就医做皮肤检查并补上体外驱虫，别只擦人用药膏。` };
    }
  },

  cough: {
    emoji:'😮‍💨', label:'咳嗽', blurb:'干咳 / 喘 / 像卡东西',
    questions:[
      { id:'breath', q:'呼吸有没有费劲、舌头发紫？', opts:[
        {v:'no',  label:'呼吸顺畅，只是咳'},
        {v:'fast', label:'呼吸有点快 / 喘'},
        {v:'blue', label:'明显憋气 / 舌头发紫' }]},
      { id:'freq', q:'咳得有多频繁？', opts:[
        {v:'rare', label:'偶尔咳几声'},
        {v:'often', label:'一阵一阵反复咳'} ]}
    ],
    rule(ans){
      const br = labelOf(this,'breath',ans.breath), fq = labelOf(this,'freq',ans.freq);
      const quote = `你说「${br}、${fq}」`;
      if(ans.breath==='blue')
        return { level:'er', advice:`${quote}——出现憋气或舌头/牙龈发紫，是缺氧的急症信号，立刻去急诊，路上保持安静、别让它剧烈活动。` };
      if(ans.breath==='no' && ans.freq==='rare')
        return { level:'home', advice:`${quote}——只是偶尔干咳、呼吸顺畅，可能是喝水呛到或一点刺激。可保持空气湿润、避开烟尘观察一两天；若变频繁或开始喘再就医。` };
      return { level:'vet', advice:`${quote}——反复咳嗽或呼吸变快，建议尽快就医排查气管、心脏或传染性呼吸道问题，别拖。` };
    }
  }
};

window.PETVET = { SPECIES, LEVELS, SYMPTOMS };
})();
