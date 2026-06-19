/* matchmaker mock 数据
   QUESTIONS: 6 道单选，每题 {id, q, dim, options:[{key,label}]}
   CANDIDATES: 9 人，每人 {name, age, city, bio, tags, picks:{qid:optKey}} */
(function(){

const QUESTIONS = [
  { id:'weekend', dim:'周末理想过法', q:'一个空白的周末，你最想怎么过？',
    options:[
      { key:'home',    label:'宅家做饭、追剧、什么都不安排' },
      { key:'outdoor', label:'进山徒步 / 骑行，出一身汗' },
      { key:'city',    label:'逛展、市集、咖啡馆 city walk' },
      { key:'party',   label:'约一桌朋友热闹局，聊到深夜' },
    ]},
  { id:'comm', dim:'沟通风格', q:'相处时你更看重哪种沟通？',
    options:[
      { key:'direct',  label:'有话直说，不绕弯子' },
      { key:'gentle',  label:'温和体贴，照顾对方情绪' },
      { key:'deep',    label:'喜欢聊深度话题、交换想法' },
      { key:'humor',   label:'插科打诨，能一起犯傻最重要' },
    ]},
  { id:'value', dim:'最看重的特质', q:'你最希望对方身上有的特质是？',
    options:[
      { key:'kind',    label:'善良、有同理心' },
      { key:'ambition',label:'有事业心、对未来有规划' },
      { key:'curious', label:'好奇心强、一直在学新东西' },
      { key:'stable',  label:'情绪稳定、靠得住' },
    ]},
  { id:'deal', dim:'雷点', q:'下面哪一条对你来说最难忍？',
    options:[
      { key:'flaky',   label:'答应的事经常放鸽子' },
      { key:'phone',   label:'见面一直低头玩手机' },
      { key:'cold',    label:'冷暴力、不肯好好说话' },
      { key:'stingy',  label:'对人对事都很算计、抠门' },
    ]},
  { id:'pace', dim:'想要的关系节奏', q:'对一段关系的节奏，你倾向？',
    options:[
      { key:'slow',    label:'慢慢来，先做朋友再说' },
      { key:'clear',   label:'确认感觉就尽快定下来' },
      { key:'flow',    label:'顺其自然，不刻意推进' },
      { key:'serious', label:'奔着长期、认真的关系去' },
    ]},
  { id:'self', dim:'自我标签', q:'哪个标签最像现在的你？',
    options:[
      { key:'foodie',  label:'资深吃货，厨房就是我的舞台' },
      { key:'sporty',  label:'运动型选手，闲不下来' },
      { key:'artsy',   label:'文艺青年，爱书影音和小众' },
      { key:'maker',   label:'搞事型，总在折腾点新项目' },
    ]},
];

const CANDIDATES = [
  { name:'林小满', age:28, city:'上海', tags:['宅家党','会做饭','慢热'],
    bio:'设计师，周末最大乐趣是研究一道新菜，把厨房折腾得满屋香味。',
    picks:{ weekend:'home', comm:'gentle', value:'kind', deal:'cold', pace:'slow', self:'foodie' } },

  { name:'周野', age:31, city:'成都', tags:['山系','早睡早起','行动派'],
    bio:'户外向导，一有空就往山里钻；信奉"想到就去做"，不喜欢拖。',
    picks:{ weekend:'outdoor', comm:'direct', value:'ambition', deal:'flaky', pace:'clear', self:'sporty' } },

  { name:'苏念', age:26, city:'杭州', tags:['文艺','逛展达人','深聊'],
    bio:'独立书店店员，最近在读人类学；约会理想画面是逛完展坐下来聊很久。',
    picks:{ weekend:'city', comm:'deep', value:'curious', deal:'phone', pace:'slow', self:'artsy' } },

  { name:'陈嘉树', age:33, city:'深圳', tags:['创业者','奔着长期','稳'],
    bio:'做一家小硬件公司，忙但条理清楚；找的是能一起认真过日子的人。',
    picks:{ weekend:'party', comm:'direct', value:'ambition', deal:'flaky', pace:'serious', self:'maker' } },

  { name:'何乐', age:29, city:'北京', tags:['段子手','热闹局','犯傻搭子'],
    bio:'广告公司文案，朋友里的气氛组；相信再烂的一天也能被一起傻笑治好。',
    picks:{ weekend:'party', comm:'humor', value:'kind', deal:'cold', pace:'flow', self:'maker' } },

  { name:'乔安', age:30, city:'广州', tags:['情绪稳定','靠得住','温和'],
    bio:'中学老师，性子稳，朋友都爱找她拿主意；不爱冷战，有事当面说清楚。',
    picks:{ weekend:'home', comm:'gentle', value:'stable', deal:'cold', pace:'serious', self:'foodie' } },

  { name:'郑屿', age:27, city:'厦门', tags:['骑行控','好奇心','顺其自然'],
    bio:'自由摄影师，骑车环过岛；对什么都想试一试，关系上不爱用力推进。',
    picks:{ weekend:'outdoor', comm:'humor', value:'curious', deal:'phone', pace:'flow', self:'sporty' } },

  { name:'白桐', age:32, city:'南京', tags:['深度爱好者','认真','直球'],
    bio:'高校研究员，喜欢把一件事钻研透；说话直来直去，确认了就想定下来。',
    picks:{ weekend:'city', comm:'direct', value:'curious', deal:'stingy', pace:'clear', self:'artsy' } },

  { name:'温柔', age:25, city:'重庆', tags:['吃货','善良','慢慢来'],
    bio:'甜品师，手作店主理人；相信好关系是养出来的，喜欢先从朋友开始。',
    picks:{ weekend:'home', comm:'gentle', value:'kind', deal:'stingy', pace:'slow', self:'foodie' } },
];

window.MATCHMAKER = { QUESTIONS, CANDIDATES };
})();
