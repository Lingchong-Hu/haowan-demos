/* matchmaker mock 数据
   QUESTIONS: 6 道单选，每题 {id, q, dim, options:[{key,label}]}
   CANDIDATES: 9 人，每人 {key, name, age, city, bio, tags, picks:{qid:optKey}}
   key 为语言无关稳定标识（保持中文原名），供匹配引擎做确定性扰动用，勿翻译。 */
(function(){

const QUESTIONS = [
  { id:'weekend', dim:GG.T('周末理想过法','Ideal weekend'), q:GG.T('一个空白的周末，你最想怎么过？','A totally free weekend — how would you love to spend it?'),
    options:[
      { key:'home',    label:GG.T('宅家做饭、追剧、什么都不安排','Stay in: cook, binge shows, zero plans') },
      { key:'outdoor', label:GG.T('进山徒步 / 骑行，出一身汗','Hit the trails — hike or ride, break a sweat') },
      { key:'city',    label:GG.T('逛展、市集、咖啡馆 city walk','Galleries, markets, a café-hopping city walk') },
      { key:'party',   label:GG.T('约一桌朋友热闹局，聊到深夜','A lively table of friends, talking till late') },
    ]},
  { id:'comm', dim:GG.T('沟通风格','Communication style'), q:GG.T('相处时你更看重哪种沟通？','What kind of communication matters most to you?'),
    options:[
      { key:'direct',  label:GG.T('有话直说，不绕弯子','Say it straight, no beating around the bush') },
      { key:'gentle',  label:GG.T('温和体贴，照顾对方情绪','Gentle and caring, mindful of each other’s feelings') },
      { key:'deep',    label:GG.T('喜欢聊深度话题、交换想法','Deep talks and trading ideas') },
      { key:'humor',   label:GG.T('插科打诨，能一起犯傻最重要','Banter and being silly together, above all') },
    ]},
  { id:'value', dim:GG.T('最看重的特质','Most valued trait'), q:GG.T('你最希望对方身上有的特质是？','Which trait do you most hope they have?'),
    options:[
      { key:'kind',    label:GG.T('善良、有同理心','Kind and empathetic') },
      { key:'ambition',label:GG.T('有事业心、对未来有规划','Driven, with a plan for the future') },
      { key:'curious', label:GG.T('好奇心强、一直在学新东西','Endlessly curious, always learning something new') },
      { key:'stable',  label:GG.T('情绪稳定、靠得住','Emotionally steady and dependable') },
    ]},
  { id:'deal', dim:GG.T('雷点','Dealbreaker'), q:GG.T('下面哪一条对你来说最难忍？','Which of these is hardest for you to put up with?'),
    options:[
      { key:'flaky',   label:GG.T('答应的事经常放鸽子','Constantly bailing on plans') },
      { key:'phone',   label:GG.T('见面一直低头玩手机','Glued to their phone when you’re together') },
      { key:'cold',    label:GG.T('冷暴力、不肯好好说话','The silent treatment instead of talking it out') },
      { key:'stingy',  label:GG.T('对人对事都很算计、抠门','Petty and penny-pinching with everyone') },
    ]},
  { id:'pace', dim:GG.T('想要的关系节奏','Relationship pace'), q:GG.T('对一段关系的节奏，你倾向？','What pace feels right for a relationship?'),
    options:[
      { key:'slow',    label:GG.T('慢慢来，先做朋友再说','Take it slow — friends first') },
      { key:'clear',   label:GG.T('确认感觉就尽快定下来','Once it feels right, make it official soon') },
      { key:'flow',    label:GG.T('顺其自然，不刻意推进','Let it flow, no forcing it') },
      { key:'serious', label:GG.T('奔着长期、认真的关系去','Looking for something long-term and serious') },
    ]},
  { id:'self', dim:GG.T('自我标签','Your vibe'), q:GG.T('哪个标签最像现在的你？','Which label sounds most like you right now?'),
    options:[
      { key:'foodie',  label:GG.T('资深吃货，厨房就是我的舞台','Certified foodie — the kitchen is my stage') },
      { key:'sporty',  label:GG.T('运动型选手，闲不下来','Sporty type who can’t sit still') },
      { key:'artsy',   label:GG.T('文艺青年，爱书影音和小众','Artsy soul — books, films, music and hidden gems') },
      { key:'maker',   label:GG.T('搞事型，总在折腾点新项目','Maker at heart, always cooking up a new project') },
    ]},
];

const CANDIDATES = [
  { key:'林小满', name:GG.T('林小满','Mia Lin'), age:28, city:GG.T('上海','Shanghai'), tags:[GG.T('宅家党','Homebody'),GG.T('会做饭','Great cook'),GG.T('慢热','Slow to warm up')],
    bio:GG.T('设计师，周末最大乐趣是研究一道新菜，把厨房折腾得满屋香味。','A designer whose favorite weekend joy is perfecting a new dish until the whole place smells amazing.'),
    picks:{ weekend:'home', comm:'gentle', value:'kind', deal:'cold', pace:'slow', self:'foodie' } },

  { key:'周野', name:GG.T('周野','Ryan Zhou'), age:31, city:GG.T('成都','Chengdu'), tags:[GG.T('山系','Mountain soul'),GG.T('早睡早起','Early bird'),GG.T('行动派','Doer')],
    bio:GG.T('户外向导，一有空就往山里钻；信奉"想到就去做"，不喜欢拖。','An outdoor guide who heads for the mountains every spare moment; lives by “think it, do it” and hates putting things off.'),
    picks:{ weekend:'outdoor', comm:'direct', value:'ambition', deal:'flaky', pace:'clear', self:'sporty' } },

  { key:'苏念', name:GG.T('苏念','Nina Su'), age:26, city:GG.T('杭州','Hangzhou'), tags:[GG.T('文艺','Artsy'),GG.T('逛展达人','Gallery regular'),GG.T('深聊','Deep talker')],
    bio:GG.T('独立书店店员，最近在读人类学；约会理想画面是逛完展坐下来聊很久。','Works at an indie bookstore and is deep into anthropology lately; her dream date is a gallery visit, then sitting down to talk for hours.'),
    picks:{ weekend:'city', comm:'deep', value:'curious', deal:'phone', pace:'slow', self:'artsy' } },

  { key:'陈嘉树', name:GG.T('陈嘉树','Jason Chen'), age:33, city:GG.T('深圳','Shenzhen'), tags:[GG.T('创业者','Founder'),GG.T('奔着长期','In it for the long haul'),GG.T('稳','Steady')],
    bio:GG.T('做一家小硬件公司，忙但条理清楚；找的是能一起认真过日子的人。','Runs a small hardware company — busy but organized; looking for someone to build a real life with, seriously.'),
    picks:{ weekend:'party', comm:'direct', value:'ambition', deal:'flaky', pace:'serious', self:'maker' } },

  { key:'何乐', name:GG.T('何乐','Leo He'), age:29, city:GG.T('北京','Beijing'), tags:[GG.T('段子手','Joke machine'),GG.T('热闹局','Life of the party'),GG.T('犯傻搭子','Partner in silliness')],
    bio:GG.T('广告公司文案，朋友里的气氛组；相信再烂的一天也能被一起傻笑治好。','An ad copywriter and the hype man of his friend group; believes even the worst day can be cured by laughing yourselves silly together.'),
    picks:{ weekend:'party', comm:'humor', value:'kind', deal:'cold', pace:'flow', self:'maker' } },

  { key:'乔安', name:GG.T('乔安','Joan Qiao'), age:30, city:GG.T('广州','Guangzhou'), tags:[GG.T('情绪稳定','Emotionally steady'),GG.T('靠得住','Dependable'),GG.T('温和','Gentle')],
    bio:GG.T('中学老师，性子稳，朋友都爱找她拿主意；不爱冷战，有事当面说清楚。','A high-school teacher, calm and steady — the friend everyone asks for advice; no cold wars, she talks things out face to face.'),
    picks:{ weekend:'home', comm:'gentle', value:'stable', deal:'cold', pace:'serious', self:'foodie' } },

  { key:'郑屿', name:GG.T('郑屿','Kai Zheng'), age:27, city:GG.T('厦门','Xiamen'), tags:[GG.T('骑行控','Cycling nut'),GG.T('好奇心','Curious mind'),GG.T('顺其自然','Goes with the flow')],
    bio:GG.T('自由摄影师，骑车环过岛；对什么都想试一试，关系上不爱用力推进。','A freelance photographer who once cycled around the whole island; wants to try a bit of everything, and never forces a relationship forward.'),
    picks:{ weekend:'outdoor', comm:'humor', value:'curious', deal:'phone', pace:'flow', self:'sporty' } },

  { key:'白桐', name:GG.T('白桐','Tong Bai'), age:32, city:GG.T('南京','Nanjing'), tags:[GG.T('深度爱好者','Deep diver'),GG.T('认真','Serious-minded'),GG.T('直球','Straight shooter')],
    bio:GG.T('高校研究员，喜欢把一件事钻研透；说话直来直去，确认了就想定下来。','A university researcher who loves digging into one thing until it truly clicks; speaks plainly, and once sure, wants to commit.'),
    picks:{ weekend:'city', comm:'direct', value:'curious', deal:'stingy', pace:'clear', self:'artsy' } },

  { key:'温柔', name:GG.T('温柔','Wendy Wen'), age:25, city:GG.T('重庆','Chongqing'), tags:[GG.T('吃货','Foodie'),GG.T('善良','Kindhearted'),GG.T('慢慢来','Takes it slow')],
    bio:GG.T('甜品师，手作店主理人；相信好关系是养出来的，喜欢先从朋友开始。','A pastry chef with her own little handmade dessert shop; believes good relationships are grown, and loves starting as friends.'),
    picks:{ weekend:'home', comm:'gentle', value:'kind', deal:'stingy', pace:'slow', self:'foodie' } },
];

window.MATCHMAKER = { QUESTIONS, CANDIDATES };
})();
