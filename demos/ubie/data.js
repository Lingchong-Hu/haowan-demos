/* data.js — ubie 症状自助分诊 mock 决策数据。
   结构：FLOWS[主诉] = { name, emoji, blurb, questions:[ Q ] }
   （FLOWS/DEPT 的中文 key 是语言无关的内部标识（查表 + 分享链接状态），不翻译；
     展示名走 name 字段，双语由 GG.T 提供。）
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
      key:'emergency', name:GG.T('尽快线下就医 / 急诊','Seek in-person care now / ER'), short:GG.T('急诊','ER'),
      color:'#d8503f', soft:'rgba(216,80,63,.10)', emoji:'🚑',
      advice:GG.T('你的回答里出现了需要立刻处理的「红旗」信号。建议立即前往最近医院急诊，或拨打急救电话；途中尽量有人陪同，记录症状起始时间与变化。',
        'Your answers include a “red flag” that needs immediate attention. Go to the nearest emergency room now, or call emergency services; have someone accompany you if possible, and note when symptoms started and how they change.')
    },
    telehealth: {
      key:'telehealth', name:GG.T('建议尽快远程问诊','See a doctor via telehealth soon'), short:GG.T('远程','Telehealth'),
      color:'#d98a1f', soft:'rgba(217,138,31,.12)', emoji:'💬',
      advice:GG.T('症状达到了应当让医生评估的程度，但暂无紧急危险信号。建议 24 小时内做一次在线问诊或预约门诊，并持续观察是否加重；若突然恶化按急诊处理。',
        'Your symptoms warrant a doctor’s evaluation, but there are no urgent danger signs right now. Book a telehealth visit or clinic appointment within 24 hours and keep watching for worsening; treat any sudden deterioration as an emergency.')
    },
    selfcare: {
      key:'selfcare', name:GG.T('可先在家自护观察','Self-care at home for now'), short:GG.T('自护','Self-care'),
      color:'#2e9e7b', soft:'rgba(46,158,123,.12)', emoji:'🏠',
      advice:GG.T('目前症状较轻，多数可在家休息观察。注意补水、规律作息、对症缓解；如 2–3 天无改善、反复或出现新的红旗症状，再升级为问诊或就医。',
        'Your symptoms look mild; most cases can be watched at home with rest. Stay hydrated, keep a regular routine, and relieve symptoms as needed; if there is no improvement in 2–3 days, symptoms keep recurring, or new red-flag symptoms appear, step up to a telehealth visit or in-person care.')
    }
  },
  // 总分阈值（无红旗时）：>=THRESH.tele → 远程；否则自护
  THRESH: { tele: 3 },

  // ＋1：每个主诉建议挂号的科室（routing 导诊，非诊断）。emergency 级直接走急诊。
  DEPT: {
    '头痛':  { primary:GG.T('神经内科','Neurology'), alt:GG.T('内科 / 疼痛科','Internal medicine / Pain clinic'), emergency:GG.T('急诊科（必要时神经内科会诊）','ER (neurology consult if needed)') },
    '腹痛':  { primary:GG.T('消化内科','Gastroenterology'), alt:GG.T('普外科','General surgery'),        emergency:GG.T('急诊外科','ER (surgical)') },
    '发热':  { primary:GG.T('发热门诊 / 感染科','Fever clinic / Infectious diseases'), alt:GG.T('内科','Internal medicine'), emergency:GG.T('急诊科','Emergency department (ER)') },
    '咳嗽':  { primary:GG.T('呼吸内科','Pulmonology'), alt:GG.T('内科','Internal medicine'),          emergency:GG.T('急诊科','Emergency department (ER)') },
    '胸痛':  { primary:GG.T('心血管内科','Cardiology'), alt:GG.T('呼吸内科','Pulmonology'),    emergency:GG.T('急诊科 / 胸痛中心','ER / Chest pain center') },
    '喉咙痛':{ primary:GG.T('耳鼻喉科','ENT (Otolaryngology)'), alt:GG.T('内科','Internal medicine'),          emergency:GG.T('急诊科','Emergency department (ER)') }
  },

  FLOWS: {
    '头痛': {
      name:GG.T('头痛','Headache'),
      emoji:'🤕', blurb:GG.T('头部疼痛、胀痛或搏动痛','Aching, pressure, or throbbing head pain'),
      questions:[
        { id:'h_sudden', q:GG.T('是不是几秒内突然炸裂般剧痛，是你这辈子最痛的一次头痛？','Did it explode within seconds — the worst headache of your life?'), severity:5, redFlag:true },
        { id:'h_neuro', q:GG.T('伴随说话含糊、单侧肢体无力或面部歪斜吗？','Any slurred speech, weakness on one side of the body, or facial drooping?'), severity:5, redFlag:true },
        { id:'h_stiff', q:GG.T('有发热并且脖子发硬、低头很困难吗？','Do you have a fever with a stiff neck that makes it hard to lower your head?'), severity:5, redFlag:true },
        { id:'h_now',  q:GG.T('现在头还在痛吗？','Is your head still hurting right now?'), severity:1 },
        { id:'h_bad',  q:GG.T('痛得影响正常工作 / 生活吗？','Is the pain bad enough to interfere with work or daily life?'), severity:2, onlyIfYes:'h_now' },
        { id:'h_vomit',q:GG.T('伴随恶心或呕吐吗？','Is it accompanied by nausea or vomiting?'), severity:2, onlyIfYes:'h_bad' },
        { id:'h_vision',q:GG.T('看东西有重影、闪光或视野缺一块吗？','Any double vision, flashing lights, or a missing patch in your vision?'), severity:3, onlyIfYes:'h_bad' },
        { id:'h_recur',q:GG.T('最近一两周这种头痛反复出现吗？','Has this headache kept coming back over the past week or two?'), severity:1 },
        { id:'h_med',  q:GG.T('吃了常用止痛药后完全没缓解吗？','Did your usual painkiller bring no relief at all?'), severity:2, onlyIfYes:'h_recur' }
      ]
    },
    '腹痛': {
      name:GG.T('腹痛','Abdominal pain'),
      emoji:'🤢', blurb:GG.T('肚子疼痛、绞痛或胀痛','Stomach ache, cramping, or bloating pain'),
      questions:[
        { id:'a_rigid', q:GG.T('肚子硬得像木板、一碰就剧痛，几乎不敢动吗？','Is your belly board-rigid and so tender you can barely move or bear any touch?'), severity:5, redFlag:true },
        { id:'a_blood', q:GG.T('呕血，或解出黑色柏油样 / 鲜血便吗？','Have you vomited blood, or passed black tarry stools or bloody stools?'), severity:5, redFlag:true },
        { id:'a_faint', q:GG.T('伴随头晕眼黑、冒冷汗甚至快晕倒吗？','Any dizziness, vision blacking out, cold sweats, or feeling about to faint?'), severity:5, redFlag:true },
        { id:'a_now',   q:GG.T('现在还在痛吗？','Is it still hurting right now?'), severity:1 },
        { id:'a_rlq',   q:GG.T('痛主要集中在右下腹吗？','Is the pain mainly in your right lower abdomen?'), severity:2, onlyIfYes:'a_now' },
        { id:'a_move',  q:GG.T('走路、咳嗽或按压时这块明显更痛吗？','Does walking, coughing, or pressing on it make that spot clearly more painful?'), severity:3, onlyIfYes:'a_rlq' },
        { id:'a_fever', q:GG.T('同时有发热吗？','Do you also have a fever?'), severity:2, onlyIfYes:'a_now' },
        { id:'a_vomit', q:GG.T('反复呕吐、吃不下喝不下吗？','Repeated vomiting — unable to keep food or fluids down?'), severity:2 },
        { id:'a_diar',  q:GG.T('有腹泻吗？','Do you have diarrhea?'), severity:1 },
        { id:'a_dehy',  q:GG.T('腹泻同时口干、尿少、明显乏力吗？','Along with the diarrhea, do you have a dry mouth, little urine, or marked fatigue?'), severity:2, onlyIfYes:'a_diar' }
      ]
    },
    '发热': {
      name:GG.T('发热','Fever'),
      emoji:'🌡️', blurb:GG.T('体温升高、忽冷忽热','Raised temperature, chills and sweats'),
      questions:[
        { id:'f_rash',  q:GG.T('皮肤出现按压不褪色的瘀点 / 紫斑吗？','Do you have skin spots or purple patches that do not fade when pressed?'), severity:5, redFlag:true },
        { id:'f_breath',q:GG.T('高热同时呼吸急促、嘴唇发紫吗？','High fever with rapid breathing or bluish lips?'), severity:5, redFlag:true },
        { id:'f_conf',  q:GG.T('出现意识模糊、叫不太醒或抽搐吗？','Any confusion, being hard to wake, or seizures?'), severity:5, redFlag:true },
        { id:'f_high',  q:GG.T('体温有没有到 39℃ 以上？','Has your temperature reached 39°C (102.2°F) or above?'), severity:2 },
        { id:'f_long',  q:GG.T('已经持续发热超过 3 天了吗？','Has the fever lasted more than 3 days?'), severity:2 },
        { id:'f_stiff', q:GG.T('伴随剧烈头痛和脖子发硬吗？','Is it accompanied by a severe headache and a stiff neck?'), severity:3, onlyIfYes:'f_high' },
        { id:'f_drink', q:GG.T('还能正常喝水、精神尚可吗？','Can you still drink normally and stay reasonably alert?'), severity:0, yesLabel:GG.T('能','Yes'), noLabel:GG.T('不能','No') },
        { id:'f_weak',  q:GG.T('是不是几乎吃不下、整天昏沉乏力？','Are you barely able to eat, drowsy and exhausted all day?'), severity:2, onlyIfYes:'f_drink', invertParent:true }
      ]
    },
    '咳嗽': {
      name:GG.T('咳嗽','Cough'),
      emoji:'😷', blurb:GG.T('干咳或有痰、咳个不停','Dry or phlegmy, nonstop coughing'),
      questions:[
        { id:'c_breath',q:GG.T('静坐时也喘不上气、呼吸很费力吗？','Are you short of breath even sitting still, struggling to breathe?'), severity:5, redFlag:true },
        { id:'c_blood', q:GG.T('咳出明显鲜血吗？','Are you coughing up visible fresh blood?'), severity:5, redFlag:true },
        { id:'c_chest', q:GG.T('咳嗽时胸口压榨样剧痛吗？','Crushing chest pain when you cough?'), severity:4, redFlag:true },
        { id:'c_fever', q:GG.T('伴随发热吗？','Do you also have a fever?'), severity:2 },
        { id:'c_phlegm',q:GG.T('咳黄绿色浓痰吗？','Coughing up thick yellow-green phlegm?'), severity:2, onlyIfYes:'c_fever' },
        { id:'c_long',  q:GG.T('已经咳超过 2 周了吗？','Has the cough lasted more than 2 weeks?'), severity:2 },
        { id:'c_night', q:GG.T('夜里咳到睡不着或被憋醒吗？','Does it keep you from sleeping or wake you up gasping at night?'), severity:2, onlyIfYes:'c_long' },
        { id:'c_wheeze',q:GG.T('呼吸时有明显哮鸣 / 喘息声吗？','Clear wheezing or whistling sounds when you breathe?'), severity:3 }
      ]
    },
    '胸痛': {
      name:GG.T('胸痛','Chest pain'),
      emoji:'💓', blurb:GG.T('胸口疼痛、压迫或闷胀','Chest pain, pressure, or tightness'),
      questions:[
        { id:'p_crush', q:GG.T('胸口压榨样剧痛，向左肩、手臂或下巴放射吗？','Crushing chest pain radiating to your left shoulder, arm, or jaw?'), severity:5, redFlag:true },
        { id:'p_sweat', q:GG.T('同时大汗淋漓、恶心或有濒死感吗？','Along with drenching sweats, nausea, or a sense of impending doom?'), severity:5, redFlag:true },
        { id:'p_dysp',  q:GG.T('伴随严重呼吸困难或快晕倒吗？','With severe shortness of breath or feeling about to faint?'), severity:5, redFlag:true },
        { id:'p_now',   q:GG.T('现在胸口还在痛吗？','Is your chest still hurting right now?'), severity:1 },
        { id:'p_exert', q:GG.T('是在活动 / 用力时加重、休息后减轻吗？','Does it worsen with activity or exertion and ease with rest?'), severity:3, onlyIfYes:'p_now' },
        { id:'p_dur',   q:GG.T('这次持续超过 15 分钟了吗？','Has this episode lasted more than 15 minutes?'), severity:2, onlyIfYes:'p_exert' },
        { id:'p_breathe',q:GG.T('深呼吸或按压胸壁时疼痛会变化吗？','Does the pain change with deep breaths or pressing on your chest wall?'), severity:1 },
        { id:'p_palp',  q:GG.T('伴随心慌、心跳明显乱跳吗？','With palpitations or a clearly irregular heartbeat?'), severity:2 }
      ]
    },
    '喉咙痛': {
      name:GG.T('喉咙痛','Sore throat'),
      emoji:'🦠', blurb:GG.T('咽喉肿痛、吞咽不适','Swollen, painful throat; discomfort swallowing'),
      questions:[
        { id:'t_breath',q:GG.T('喉咙肿到呼吸困难、说话含混或流口水咽不下吗？','Is your throat so swollen you have trouble breathing, muffled speech, or drooling because you cannot swallow?'), severity:5, redFlag:true },
        { id:'t_swell', q:GG.T('脖子或脸明显肿胀、张不开嘴吗？','Obvious neck or facial swelling, or trouble opening your mouth?'), severity:4, redFlag:true },
        { id:'t_swallow',q:GG.T('痛到几乎无法吞咽，连水都喝不下吗？','So painful you can hardly swallow — not even water?'), severity:3 },
        { id:'t_fever', q:GG.T('伴随发热吗？','Do you also have a fever?'), severity:2 },
        { id:'t_pus',   q:GG.T('扁桃体上有白色脓点 / 脓苔吗？','White pus spots or coating on your tonsils?'), severity:2, onlyIfYes:'t_fever' },
        { id:'t_node',  q:GG.T('下巴 / 颈部淋巴结肿大压痛吗？','Tender, swollen lymph nodes under your jaw or in your neck?'), severity:1, onlyIfYes:'t_fever' },
        { id:'t_long',  q:GG.T('已经痛超过一周还没好吗？','Has it hurt for more than a week without getting better?'), severity:1 }
      ]
    }
  }
};
})();
