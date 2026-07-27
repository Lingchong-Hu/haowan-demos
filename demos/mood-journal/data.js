/* mood-journal 数据：情感词典 + 停用词 + 示例记录。纯离线。
   注：词典在中文词后追加了英文同义词（不是替换），保证中英文输入都能被分析；
   negatorsEn / intensEn / stopEn 是英文专用辅助表，键名不译。 */
window.MOOD = {
  // 正面词（权重 +1），强正面（+2）
  pos: ['开心','快乐','高兴','幸福','满足','愉快','轻松','放松','舒服','安心','踏实',
        '感激','感动','温暖','治愈','希望','期待','兴奋','惊喜','成就','骄傲','自豪',
        '喜欢','热爱','美好','顺利','进步','收获','充实','平静','安稳','可爱','甜',
        '笑','阳光','元气','满血','给力','棒','赞','值得','幸运','被爱','陪伴',
        // 英文同义词（追加，勿删中文）
        'happy','glad','joy','joyful','cheerful','grateful','thankful','relaxed','calm',
        'peaceful','content','satisfied','proud','excited','hopeful','hope','warm','loved',
        'love','fun','great','good','nice','sweet','cozy','healing','healed','comfort',
        'comfortable','refreshed','energized','accomplished','fulfilled','rested','relieved',
        'relief','smile','laugh','sunny','lucky','blessed','safe','grounded'],
  posStrong: ['超开心','太幸福','特别满足','非常感动','无比治愈','狂喜','激动','热泪盈眶',
        'overjoyed','ecstatic','thrilled','amazing','wonderful','fantastic','over the moon','deeply moved'],
  // 负面词（-1），强负面（-2）
  neg: ['难过','伤心','失落','沮丧','低落','烦','烦躁','焦虑','紧张','害怕','担心',
        '不安','疲惫','累','倦','空虚','孤独','寂寞','委屈','无力','无助','迷茫','纠结',
        '后悔','内疚','自责','失望','无聊','压抑','憋','堵','糟','差','烂','痛','哭',
        '生气','愤怒','恼火','崩溃','想哭','撑不住','喘不过气','睡不着','心累',
        // 英文同义词（追加，勿删中文）
        'sad','unhappy','upset','anxious','anxiety','nervous','worried','tense','afraid',
        'scared','fear','uneasy','tired','exhausted','weary','drained','empty','lonely',
        'helpless','hopeless','confused','regret','guilty','ashamed','disappointed','bored',
        'depressed','gloomy','awful','terrible','horrible','bad','miserable','hurt','cry',
        'crying','cried','angry','furious','annoyed','irritated','frustrated','sleepless',
        'restless','numb','panic','pain','stress','stressed','stressful','stuck','lost'],
  negStrong: ['极度焦虑','非常崩溃','特别难过','彻底失望','痛不欲生','一团糟','撑不下去',
        'devastated','heartbroken','overwhelmed','falling apart','breaking down','panic attack',
        'burned out','burnt out'],
  // 否定词：翻转其后情感
  negators: ['不','没','没有','无','别','未','非','毫无','并不','并未','谈不上'],
  // 英文否定词（仅用于英文关键词的上下文判断）
  negatorsEn: ['not',"n't",'n’t','never','hardly','barely','no '],
  // 程度词（放大）
  intens: ['很','非常','特别','超','太','极','十分','格外','尤其','相当','好','真的'],
  // 英文程度词（仅用于英文关键词的上下文判断）
  intensEn: ['very','really','so ','super','extremely','incredibly','deeply','truly','quite','pretty '],
  // 触发场景/对象词（词云优先放大，体现"触发词"）
  triggers: ['工作','加班','项目','deadline','ddl','会议','老板','同事','客户','面试',
             '考试','作业','论文','学习','成绩','复习','通勤','地铁','堵车','天气','下雨',
             '睡眠','失眠','熬夜','身体','生病','钱','房租','家人','父母','朋友','恋人',
             '对象','吵架','分手','独处','周末','假期','旅行','运动','跑步','美食','咖啡',
             '游戏','电影','音乐','宠物','猫','狗',
             // 英文触发词（追加，勿删中文）
             'work','overtime','project','meeting','boss','coworker','client','interview',
             'exam','homework','thesis','study','grades','commute','subway','traffic',
             'weather','rain','sleep','insomnia','sick','money','family','parents','friend',
             'partner','argument','breakup','weekend','holiday','travel','workout','run',
             'food','lunch','coffee','game','movie','music','pet','cat','dog'],
  // 停用词（不进词云）
  stop: ['的','了','着','和','与','是','在','我','你','他','她','它','们','这','那',
         '就','都','也','还','又','要','会','能','把','被','给','让','向','从','对',
         '吗','呢','吧','啊','呀','嘛','哦','嗯','啦','今天','昨天','一','很','非常',
         '特别','感觉','觉得','有点','一点','一些','点','下','上','里','中','个','些',
         '什么','怎么','为什么','但是','可是','不过','因为','所以','如果','虽然','而且',
         '自己','现在','已经','一直','总是','好像','可能','应该','只是','真的','其实'],
  // 英文停用词（仅用于英文分词，不进词云）
  stopEn: ['the','and','but','for','with','was','were','are','you','your','all','out','not',
           'have','has','had','this','that','then','than','they','them','there','here','what',
           'when','how','why','who','she','him','her','his','its','our','from','into','onto',
           'over','under','about','after','before','again','still','just','very','really',
           'quite','some','much','more','most','also','been','being','did','does','doing',
           'get','got','getting','went','going','goes','come','came','feel','felt','feeling',
           'feels','like','liked','today','yesterday','tonight','day','days','bit','little',
           'lot','can','could','will','would','should','might','must','one','two','now',
           'even','ever','only','back','off','while','because','since','though','maybe',
           'around','through','myself','thing','things','something','anything','time'],
  // 一键填入的示例记录（≥4 条，能直接出曲线 + 词云）
  samples: [
    GG.T('今天加班到很晚，项目 deadline 压着，特别焦虑，心累。',
         'Worked overtime till late again — the project deadline is pressing, and I feel anxious and drained.'),
    GG.T('早上下雨通勤堵车，会议又被老板批评，有点低落。',
         'Rainy commute and heavy traffic this morning, then my boss criticized me in the meeting. Feeling a bit sad.'),
    GG.T('中午和朋友吃了顿美食，聊了很久，感觉被治愈了，开心。',
         'Had a great lunch with a friend and we talked for a long time — felt healed and happy.'),
    GG.T('晚上跑了步，睡眠应该会好一点，身体轻松了不少，挺满足。',
         'Went for a run tonight. My body feels relaxed, and sleep should come easier. Feeling satisfied.'),
    GG.T('周末和家人在家陪猫，独处也很安心，温暖又踏实。',
         'Spent the weekend at home with family and the cat. Time alone felt safe, warm, and grounded.')
  ],
  // 情绪 → 天气（呼应 🌤️ 品牌；分数从高到低取第一个 min 命中）
  weather: [
    { min:80, icon:'☀️',  word:GG.T('晴','Sunny')            },
    { min:66, icon:'🌤️', word:GG.T('多云转晴','Clearing up') },
    { min:52, icon:'⛅',  word:GG.T('多云','Cloudy')          },
    { min:38, icon:'🌥️', word:GG.T('阴','Overcast')          },
    { min:22, icon:'🌧️', word:GG.T('小雨','Light rain')      },
    { min:0,  icon:'⛈️', word:GG.T('雷阵雨','Thunderstorm')  },
  ],
  // 写完立刻「被接住」的一句话（按情绪档随机取一句，纯本地、非诊断）
  empathy: {
    vlow:  [GG.T('这一条挺沉的。能把它写出来，已经很不容易了。',
                 'That was a heavy one. Writing it down at all took real courage.'),
            GG.T('我看见你了。今天，辛苦你了。',
                 'I see you. You made it through today — that counts.')],
    low:   [GG.T('听起来有点累。先停一下，喝口水，也好。',
                 'Sounds like you are a bit worn out. It is okay to pause and take a sip of water.'),
            GG.T('这种感觉是真实的，不用急着把它赶走。',
                 'What you are feeling is real. No need to rush it away.')],
    mid:   [GG.T('平平的一天，也值得被好好记下来。',
                 'An ordinary day still deserves to be written down.'),
            GG.T('把它放在这儿，慢慢就看清自己了。',
                 'Leave it here — bit by bit, you will see yourself more clearly.')],
    high:  [GG.T('感觉到一点光亮了，真好。',
                 'A little light coming through — that is lovely.'),
            GG.T('这份轻松，记得多留一会儿。',
                 'Let this ease stay with you a little longer.')],
    vhigh: [GG.T('这份开心，值得多回味几遍。',
                 'This joy is worth savoring a few more times.'),
            GG.T('把这一刻收好，以后翻出来还能暖到自己。',
                 'Tuck this moment away — it can warm you again someday.')],
  },
  // 看完整体后的收尾安慰（按平均情绪档取）
  closing: {
    low: GG.T('不管这几天是什么颜色，你都认真记下来了——这本身就是在好好照顾自己。',
              'Whatever color these days have been, you took the time to write them down — that in itself is taking good care of yourself.'),
    mid: GG.T('情绪本来就会起起落落。你愿意停下来看看它，已经走在更稳的路上了。',
              'Feelings naturally rise and fall. By pausing to look at them, you are already on steadier ground.'),
    high:GG.T('把好天气也记下来，是给未来的自己留的光。继续这样对自己好一点。',
              'Writing down the good weather too leaves a little light for your future self. Keep being this kind to yourself.'),
  },
};
