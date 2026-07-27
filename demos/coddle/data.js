/* coddle 数据 —— 双轨：
   👶 宝宝轨：观察类型 × 月龄段 → 完全不同的解读/指引（+ 发育里程碑正常范围 + 教学视频）
   🤱 妈妈轨：产后关注 × 产后阶段 → 个性化指引 + 就医红线 + 附近服务 + 教学视频
   签名核心：同一种情况，滑动「月龄 / 产后天数」→ 内容截然不同（onInput 即时重渲染）。
   细化原则：能写"具体怎么做"的，都用（括号）打出数字/步骤/频次。 */
(function(){

/* ════════════ 👶 宝宝轨 ════════════ */
/* 月龄分段：0-3 / 4-6 / 7-12 / 13-24 / 25-36（含下界、不含上界，36 归末段） */
const BANDS = [
  { id:'0-3',   label:GG.T('新生儿（0-3 月）','Newborn (0-3 mo)'),   lo:0,  hi:4  },
  { id:'4-6',   label:GG.T('婴儿早期（4-6 月）','Young infant (4-6 mo)'), lo:4,  hi:7  },
  { id:'7-12',  label:GG.T('婴儿后期（7-12 月）','Older infant (7-12 mo)'),lo:7,  hi:13 },
  { id:'13-24', label:GG.T('幼儿（13-24 月）','Toddler (13-24 mo)'),   lo:13, hi:25 },
  { id:'25-36', label:GG.T('学步后期（25-36 月）','Older toddler (25-36 mo)'),lo:25, hi:37 },
];
function bandOf(months){
  const m = Math.max(0, Math.min(36, months|0));
  return BANDS.find(b=> m>=b.lo && m<b.hi) || BANDS[BANDS.length-1];
}

/* 发育里程碑（仅发育类主题有；lo–hi = 多数宝宝达成的「正常窗口」，单位：月） */
const MILESTONES = {
  gross: [
    { key:'head',  label:GG.T('抬头稳','Steady head control'),     lo:2,  hi:4  },
    { key:'roll',  label:GG.T('翻身','Rolls over'),       lo:4,  hi:6  },
    { key:'sit',   label:GG.T('独坐','Sits alone'),       lo:6,  hi:9  },
    { key:'crawl', label:GG.T('爬行','Crawls'),       lo:7,  hi:10 },
    { key:'stand', label:GG.T('扶站扶走','Stands & cruises'),   lo:9,  hi:13 },
    { key:'walk',  label:GG.T('独立走','Walks alone'),     lo:12, hi:16 },
    { key:'run',   label:GG.T('会跑·双脚跳','Runs & jumps'), lo:18, hi:30 },
  ],
  lang: [
    { key:'coo',   label:GG.T('咕咕发声','Cooing'),   lo:1,  hi:4  },
    { key:'babble',label:GG.T('咿呀连音','Babbling'),   lo:4,  hi:8  },
    { key:'word',  label:GG.T('第一个词','First word'),   lo:9,  hi:14 },
    { key:'two',   label:GG.T('蹦双词短语','Two-word phrases'), lo:16, hi:24 },
    { key:'sent',  label:GG.T('说完整短句','Short sentences'), lo:24, hi:36 },
  ],
  emotion: [
    { key:'smile', label:GG.T('社会性微笑','Social smile'), lo:1,  hi:3  },
    { key:'wary',  label:GG.T('认生开始','Stranger wariness'),   lo:5,  hi:9  },
    { key:'sep',   label:GG.T('分离焦虑高峰','Separation anxiety peak'),lo:8,  hi:16 },
    { key:'par',   label:GG.T('平行游戏','Parallel play'),   lo:18, hi:30 },
    { key:'emp',   label:GG.T('共情·假装游戏','Empathy & pretend play'),lo:24, hi:36 },
  ],
};

/* 每个 TOPIC：type + emoji + 占位 + video（教学视频标题）+ byBand[bandId]={read,guide,tip}（+ milestones） */
const TOPICS = [
  {
    id:'night', label:GG.T('夜醒','Night waking'), emoji:'🌙', placeholder:GG.T('例：凌晨 3 点醒来哭闹，吃几口又睡','e.g. Woke crying at 3 a.m., nursed a little, drifted back off'),
    video:GG.T('哄睡 & 接觉：放下不哭的 3 步','Soothing & resettling: put baby down without tears in 3 steps'),
    byBand:{
      '0-3':{ read:GG.T('这个阶段夜醒几乎是“标配”——胃容量小、昼夜节律未建立，2-3 小时醒一次找奶很正常。','Night waking is practically standard now — a tiny stomach and no day-night rhythm yet mean waking every 2-3 hours to feed is completely normal.'),
              guide:GG.T('按需喂养、不强行拉长夜间间隔；白天多接触自然光（拉开窗帘、户外散步 10-20 分钟）帮助区分昼夜；醒来先轻拍、压低声光，区分“真饿”和“浅睡哼唧”（先等 1-2 分钟看会不会自己接觉）。','Feed on demand and never force longer night stretches. Get plenty of natural light by day (open the curtains, a 10-20 minute walk outside) to build the day-night rhythm. When baby stirs, pat gently with lights and voices low, and tell real hunger from light-sleep fussing (wait 1-2 minutes to see if they resettle on their own).'),
              tip:GG.T('此阶段不要做睡眠训练，先把白天的规律和喂养跟上。','Skip sleep training for now — get the daytime rhythm and feeding on track first.') },
      '4-6':{ read:GG.T('多数宝宝具备了睡整觉的生理条件，但 4 月龄前后常出现“睡眠倒退”，频繁夜醒可能是发育跳跃或学翻身闹的。','Most babies are now physically able to sleep longer stretches, but a sleep regression is common around 4 months — frequent waking may be a developmental leap or rolling practice.'),
              guide:GG.T('建立固定睡前流程（如“洗澡 → 喂奶 → 调暗灯光 → 放床”，全程 20-30 分钟、每天同一顺序）；尝试“半梦半醒时放下”，让他练习自己接觉；倒退期通常 1-2 周缓解。','Build a fixed bedtime routine (e.g. bath → feed → dim the lights → into the crib; 20-30 minutes, same order every day). Try putting baby down drowsy but awake to practice self-settling. Regressions usually ease within 1-2 weeks.'),
              tip:GG.T('白天保证充足的小睡，过度疲劳反而夜醒更多。','Protect daytime naps — an overtired baby actually wakes more at night.') },
      '7-12':{ read:GG.T('频繁夜醒更可能是“接觉能力”或分离焦虑、出牙、夜奶习惯，而非真饿；很多宝宝此时已能减夜奶。','Frequent waking now is more about resettling skills, separation anxiety, teething, or a night-feed habit than real hunger — many babies can cut night feeds by this point.'),
              guide:GG.T('逐步拉开“喂奶 → 入睡”的关联（先喂奶，中间隔开拍嗝/讲一句再放下）；逐次缩短或减量夜奶；白天多陪伴缓解分离焦虑。','Gradually uncouple feeding from falling asleep (feed first, then a burp or a quiet word before putting down). Shorten or reduce night feeds step by step. Extra daytime togetherness eases separation anxiety.'),
              tip:GG.T('出牙不适可短期影响睡眠，但持续多日的夜醒通常是习惯问题。','Teething can disturb sleep for a few nights, but waking that drags on for days is usually habit.') },
      '13-24':{ read:GG.T('夜醒常和分离焦虑、做梦、白天小睡过多/过少、或抗拒入睡有关，已较少是生理需求。','Night waking now tends to come from separation anxiety, dreams, too much or too little napping, or bedtime resistance — rarely a physical need.'),
              guide:GG.T('固定而简短的睡前仪式（如刷牙 → 绘本 1 本 → 关灯，控制在 15 分钟内）+ 安抚物（小毯/玩偶）；白天小睡控制在 1 次、且不晚于 15:30；半夜醒来少互动、少开灯。','Keep a short, fixed bedtime ritual (brush teeth → one picture book → lights out, within 15 minutes) plus a comfort object (small blanket or plush). Cap daytime sleep at one nap ending by 3:30 p.m. If they wake at night, keep interaction and light to a minimum.'),
              tip:GG.T('白天小睡太晚或太长，是这个阶段夜醒和闹觉的常见隐形原因。','A nap that runs too late or too long is the hidden culprit behind many night wakings at this age.') },
      '25-36':{ read:GG.T('这个年龄夜醒多与噩梦/夜惊、戒小睡过渡、如厕训练或要陪伴有关，纯生理夜醒已很少。','Waking at this age is mostly nightmares or night terrors, dropping the nap, potty training, or wanting company — purely physical waking is rare now.'),
              guide:GG.T('稳定作息与安抚物；噩梦后简短安慰（开一盏小夜灯、抱 1-2 分钟）再放回自己床；用“早起奖励小贴纸”建立“睡到天亮”的预期。','Keep the routine and comfort object steady. After a nightmare, comfort briefly (a nightlight, a 1-2 minute hug) then back to their own bed. Use a morning sticker reward to build the "slept till sunrise" expectation.'),
              tip:GG.T('区分噩梦（会醒、找你）和夜惊（看似醒实未醒），夜惊时不要强行唤醒。','Tell nightmares (child wakes and seeks you) from night terrors (looks awake but is not) — never force-wake a night terror.') },
    }
  },
  {
    id:'feed', label:GG.T('吃奶','Feeding'), emoji:'🍼', placeholder:GG.T('例：这顿吃得少，扭头不肯吃','e.g. Barely ate this feed, keeps turning away'),
    video:GG.T('正确衔乳 & 拍嗝姿势示范','Proper latch & burping positions, demonstrated'),
    byBand:{
      '0-3':{ read:GG.T('按需喂养期，吃吃停停、一天 8-12 次都正常；偶尔一顿少不必焦虑，看整体精神和尿量。','This is on-demand season — stop-and-start feeds, 8-12 times a day, all normal. One light feed is no cause for worry; watch overall mood and wet diapers instead.'),
              guide:GG.T('关注有效吞咽与衔乳姿势（嘴张大、含住大部分乳晕、下唇外翻）；每天 6 片以上湿尿布、体重稳步增长就是够吃；拒奶常因姿势/胀气/太困（喂前先拍嗝或竖抱安抚 5 分钟）。','Watch for effective swallowing and a good latch (mouth wide open, most of the areola in, lower lip flipped out). 6+ wet diapers a day plus steady weight gain means enough. Refusal is often position, gas, or overtiredness (burp or soothe upright for 5 minutes before feeding).'),
              tip:GG.T('频繁短时吃奶（簇状喂养）在傍晚很常见，不等于奶不够。','Frequent short evening feeds (cluster feeding) are very common — not a sign of low supply.') },
      '4-6':{ read:GG.T('宝宝更容易“分心吃奶”，会因为周围声音停下张望；奶量趋于稳定，单次效率提高。','Babies get easily distracted at feeds now, pausing to look around at every sound. Intake stabilizes and each feed gets more efficient.'),
              guide:GG.T('在安静、光线柔和处喂（必要时小睡前喂“迷糊奶”）；以奶为主，6 月龄前一般无需辅食；留意添加辅食的就绪信号（能竖头、对食物感兴趣、挺舌反射减弱）。','Feed somewhere quiet with soft light (a drowsy pre-nap feed if needed). Milk stays primary — no solids needed before about 6 months. Watch for readiness signs (steady head control, interest in food, fading tongue-thrust reflex).'),
              tip:GG.T('分心走神是发育正常表现，不代表厌奶或奶不够。','Getting distracted is normal development — not a nursing strike, not low supply.') },
      '7-12':{ read:GG.T('已添加辅食，奶量可能略降；吃得少常因辅食吃多了、出牙或对食物更感兴趣。','With solids on board, milk intake may dip a little. Eating less is often too many solids, teething, or simply finding food more interesting.'),
              guide:GG.T('保持“奶为主、辅食为辅”，循序加量与质地；固定就餐位置（餐椅）、让宝宝自主决定吃多少；出牙期可给凉的牙胶或冷藏软食。','Keep milk primary and solids secondary, stepping up amount and texture gradually. Feed in a fixed spot (high chair) and let baby decide how much. During teething, offer a chilled teether or cold soft foods.'),
              tip:GG.T('1 岁前奶仍是主要营养来源，辅食重在练习与尝味。','Before age 1, milk is still the main nutrition — solids are for practice and taste.') },
      '13-24':{ read:GG.T('可转为牛奶/配方并以三餐为主；这个阶段“挑食、吃饭少、突然不爱吃”非常普遍，食欲随长个波动大。','Time to move to cow\'s milk or formula with three meals as the base. Picky eating, small meals, and sudden food strikes are extremely common — appetite swings with growth.'),
              guide:GG.T('规律三餐两点（每餐间隔 2.5-3 小时）、限制饭前 1 小时零食和果汁；同一食物多次少量反复提供（可能要尝 10-15 次才接受）；家长定“供给什么”、孩子定“吃多少”。','Keep three meals plus two snacks (2.5-3 hours apart) and no snacks or juice in the hour before meals. Re-offer the same food in small amounts many times (acceptance can take 10-15 tries). Parents decide what is served; the child decides how much.'),
              tip:GG.T('用进食量评估请看一整周而不是单顿，单顿少很正常。','Judge intake over a whole week, not one meal — a single light meal is perfectly normal.') },
      '25-36':{ read:GG.T('自主意识强，吃饭“说了算”是常见的权力争夺；偏食、边吃边玩、要喂饭都很典型。','A strong little will turns mealtimes into a power struggle — picky eating, playing while eating, and demanding to be fed are all typical.'),
              guide:GG.T('固定餐时与餐桌规则（坐下吃、不追着喂、一餐不超过 20-30 分钟）、鼓励自己用勺；不追喂、不用零食贿赂；让孩子参与简单备餐（洗菜、摆盘）。','Fix mealtimes and table rules (sit to eat, no chase-feeding, meals capped at 20-30 minutes) and encourage the spoon. No chasing, no snack bribes. Invite them into simple prep (washing veggies, setting plates).'),
              tip:GG.T('把进食的“控制权”适度交给孩子，反而减少对抗、改善食欲。','Handing some mealtime control to your child actually reduces battles and improves appetite.') },
    }
  },
  {
    id:'solid', label:GG.T('辅食','Solids'), emoji:'🥄', placeholder:GG.T('例：第一次喂米糊，全吐出来了','e.g. First try of rice cereal — spat it all out'),
    video:GG.T('辅食质地进阶 & 防噎处理','Texture progression & choking prevention'),
    byBand:{
      '0-3':{ read:GG.T('这个月龄还不该加辅食——消化系统与吞咽协调都未就绪，过早添加增加过敏与呛咳风险。','Solids should not start yet — digestion and swallowing coordination are not ready, and starting early raises allergy and choking risks.'),
              guide:GG.T('此阶段纯母乳/配方即可，不喂米糊、果汁、白水；耐心等到接近 6 月龄、能竖头并对食物有兴趣再开始。','Breast milk or formula only for now — no cereal, juice, or water. Wait until close to 6 months, with steady head control and real interest in food.'),
              tip:GG.T('吐出勺子里的东西是“挺舌反射”，正是还没准备好的信号。','Pushing food off the spoon is the tongue-thrust reflex — exactly the sign baby is not ready yet.') },
      '4-6':{ read:GG.T('接近就绪窗口：能稳定竖头、对大人吃饭感兴趣、挺舌反射减弱，就可以开始尝试。','Approaching the readiness window: steady head control, fascination with your meals, and a fading tongue-thrust reflex mean you can start trying.'),
              guide:GG.T('从单一、细腻的食物起步（如高铁米粉调稀、菜泥），一次只加一种、连吃 2-3 天观察过敏（皮疹/腹泻/呕吐）；保持以奶为主，辅食是“尝”不是“饱”。','Start with a single smooth food (iron-fortified cereal thinned out, or a veggie purée), one new food at a time for 2-3 days while watching for allergy signs (rash, diarrhea, vomiting). Milk stays primary — solids are for tasting, not filling up.'),
              tip:GG.T('第一口吐出来很正常，是在适应新质地，多试几次别放弃。','Spitting out the first spoonful is completely normal — baby is adjusting to a new texture. Keep trying.') },
      '7-12':{ read:GG.T('进入快速进阶期，应从细腻过渡到带颗粒、再到手指食物，锻炼咀嚼与抓握。','The fast-progression phase: move from smooth to lumpy to finger foods, building chewing and grasping.'),
              guide:GG.T('质地循序进阶（细泥 → 带颗粒 → 手指食物，如蒸软的胡萝卜条）；尽早引入常见过敏原（鸡蛋、稀释花生酱、酸奶）；鼓励自主进食、允许弄脏。','Step up textures in order (smooth purée → lumpy → finger foods like soft-steamed carrot sticks). Introduce common allergens early (egg, thinned peanut butter, yogurt). Encourage self-feeding and let the mess happen.'),
              tip:GG.T('1 岁前不加盐、糖和蜂蜜；干呕是学吃块状食物的正常过程，别一干呕就退回泥糊。','No salt, sugar, or honey before age 1. Gagging is a normal part of learning lumps — do not retreat to purées at the first gag.') },
      '13-24':{ read:GG.T('应基本和家庭饮食接轨，以三餐为主、奶为辅；这个阶段开始出现明显的食物好恶。','Meals should roughly match the family table now — three meals as the base, milk on the side. Clear food likes and dislikes start showing.'),
              guide:GG.T('提供多样、软硬适中的家庭食物，切小防噎（葡萄/小番茄对半再切、坚果磨碎）；少盐少糖、不强迫；同一食材换做法反复尝试。','Offer varied family foods of manageable softness, cut small against choking (halve then quarter grapes and cherry tomatoes, grind nuts). Low salt, low sugar, no forcing. Re-try the same ingredient cooked different ways.'),
              tip:GG.T('坚果整粒、整颗葡萄、果冻等仍是噎呛高危，需切小或避免。','Whole nuts, whole grapes, and jelly cups remain high choking risks — cut small or skip.') },
      '25-36':{ read:GG.T('能吃绝大多数家庭食物，重点从“能不能吃”转向“好好吃、自己吃、不挑食”。','They can eat most family foods now — the focus shifts from "can they eat it" to eating well, self-feeding, and staying open to variety.'),
              guide:GG.T('鼓励自己用餐具、参与摆盘备餐；规律餐点、丰富颜色与口感；以身作则一起吃同样的食物（你吃什么，他更愿意吃什么）。','Encourage utensils and helping with plating and prep. Keep regular mealtimes rich in color and texture. Model it by eating the same food together — they eat what you eat.'),
              tip:GG.T('挑食在这个年龄是发展常态，持续温和地提供，避免做“短订餐厅”。','Picky eating is developmentally normal at this age. Keep offering gently, and avoid becoming a short-order cook.') },
    }
  },
  {
    id:'gross', label:GG.T('大运动','Gross motor'), emoji:'🤸', placeholder:GG.T('例：还不会翻身，有点担心','e.g. Not rolling over yet — a little worried'),
    milestones: MILESTONES.gross, video:GG.T('趴卧练习（tummy time）怎么做','How to do tummy time'),
    byBand:{
      '0-3':{ read:GG.T('核心任务是抬头与颈部控制；趴着时能短暂抬头、手脚开始更有力地蹬动。','The core task is head lifting and neck control — brief head raises during tummy time, with stronger arm and leg kicks.'),
              guide:GG.T('每天多次、清醒时做“趴卧练习 tummy time”（每次 1-2 分钟起、逐步加到每天累计 15-20 分钟，哭就缩短不取消）；多竖抱、少久坐摇椅。','Do tummy time several times a day while awake (start at 1-2 minutes, building to 15-20 minutes total daily; if baby cries, shorten it, never scrap it). More upright holding, less time parked in bouncers.'),
              tip:GG.T('趴卧是后续翻身、爬行的地基，哭闹时缩短时长而不是取消。','Tummy time is the foundation for rolling and crawling — when baby fusses, make it shorter, not gone.') },
      '4-6':{ read:GG.T('典型里程碑是翻身和靠坐；6 月龄前后很多宝宝能扶坐、伸手抓物。','Signature milestones are rolling over and supported sitting; around 6 months many babies sit with support and reach for objects.'),
              guide:GG.T('在地垫上自由活动、把玩具放在略远处（约一臂远）诱导够取与翻身；减少长时间抱睡或久放摇椅/婴儿椅限制活动。','Free play on a floor mat with toys placed slightly out of reach (about an arm away) to tempt reaching and rolling. Cut down on long held-asleep stretches and time strapped into bouncers and seats.'),
              tip:GG.T('会翻身后要警惕坠床，尿布台、床边时刻有手扶。','Once rolling starts, guard against falls — keep a hand on baby at the changing table and bed edge.') },
      '7-12':{ read:GG.T('独坐稳、开始爬、扶站到扶走（巡航）；接近 1 岁有的能独站或迈第一步。','Sitting steadily, starting to crawl, pulling to stand and cruising; near age 1 some can stand alone or take a first step.'),
              guide:GG.T('创造安全的地面探索空间、鼓励爬行（别用学步车）；做好家居防护（桌角包角、插座盖、楼梯口装护栏）。','Create a safe floor space for exploring and encourage crawling (skip the walker). Baby-proof the home (corner guards, outlet covers, stair gates).'),
              tip:GG.T('不建议用学步车，既不利发育也增加意外风险；多爬有益。','Walkers are not recommended — bad for development and an accident risk. More crawling is a win.') },
      '13-24':{ read:GG.T('从独走到走稳、能蹲、扶栏上楼梯、尝试跑和踢球；动作越来越大胆。','From first steps to steady walking, squatting, stairs with a rail, and trying to run and kick — movement gets bolder by the day.'),
              guide:GG.T('提供爬上爬下、推拉的安全机会（矮沙发、推行学步小车）；每天户外活动 1-2 小时；接受这个阶段的磕碰是探索的一部分。','Offer safe chances to climb and push-pull (a low sofa, a push wagon). Aim for 1-2 hours outdoors daily. Accept that bumps and tumbles are part of exploring at this stage.'),
              tip:GG.T('选防滑、合脚的鞋；室内仍要持续做防撞防坠护理。','Choose grippy, well-fitting shoes, and keep up the indoor padding and fall-proofing.') },
      '25-36':{ read:GG.T('能跑跳、双脚跳、踮脚走、独自上下楼梯、骑滑步车，平衡与协调明显进步。','Running, two-footed jumps, tiptoeing, stairs solo, riding a balance bike — balance and coordination take a clear leap.'),
              guide:GG.T('多安排跑跳、攀爬、球类（踢球、扔接球）等大动作游戏；引入需要协调的玩具（滑步车、平衡板）；保证每天充足户外。','Plan plenty of big-movement play — running, climbing, ball games (kicking, throw-and-catch). Bring in coordination toys (balance bike, wobble board). Keep daily outdoor time generous.'),
              tip:GG.T('此阶段更需要的是“放电”的空间和时间，而不是额外的训练课。','What this age needs most is room and time to burn energy — not extra training classes.') },
    }
  },
  {
    id:'emotion', label:GG.T('情绪','Emotions'), emoji:'😣', placeholder:GG.T('例：今天特别黏人，一放下就哭','e.g. Extra clingy today — cries the moment I put them down'),
    milestones: MILESTONES.emotion, video:GG.T('安抚崩溃宝宝：5S 安抚法','Calming a meltdown: the 5 S\'s method'),
    byBand:{
      '0-3':{ read:GG.T('哭是唯一的语言，黏人和频繁要抱是正常需求；这个阶段不存在“惯坏”。','Crying is baby\'s only language — clinginess and wanting to be held are real needs. There is no such thing as spoiling at this age.'),
              guide:GG.T('及时回应哭声、多肌肤接触和包裹安抚；傍晚易闹（肠绞痛/黄昏闹）可试“5S”（包裹襁褓、侧抱、嘘声、轻摇、吸吮）。','Respond to cries promptly, with plenty of skin-to-skin and swaddled comfort. For evening fussiness (colic / witching hour), try the 5 S\'s: swaddle, side hold, shush, sway, suck.'),
              tip:GG.T('回应越及时，安全感越稳，越早回应不会宠坏新生儿。','The quicker you respond, the more secure baby feels — early responding never spoils a newborn.') },
      '4-6':{ read:GG.T('开始有社会性微笑、能用表情和声音表达喜恶；陌生环境会有更明显的情绪反应。','Social smiles arrive, and baby voices likes and dislikes with faces and sounds; new places bring bigger emotional reactions.'),
              guide:GG.T('多面对面互动、模仿他的表情和发声；用平稳语气帮他“被看见”（如“你有点怕对不对”）；建立可预期的日常作息。','Do lots of face-to-face play, mirroring expressions and sounds. Use a calm voice to help baby feel seen ("that scared you a little, didn\'t it"). Keep daily routines predictable.'),
              tip:GG.T('此时的互动回应是情绪能力的“早教”，比任何玩具都重要。','This back-and-forth is early education for emotional skills — worth more than any toy.') },
      '7-12':{ read:GG.T('分离焦虑和认生达到高峰，一放下/你离开就大哭是发育正常的表现，说明依恋已建立。','Separation anxiety and stranger wariness peak — wailing the moment you leave or put them down is healthy development, proof attachment has formed.'),
              guide:GG.T('用躲猫猫游戏练习“你会回来”；离开时简短告别不偷溜（说“妈妈去厨房，马上回来”）；给固定看护人和安抚物，多给身体接触。','Play peekaboo to practice "you always come back". Say a short goodbye instead of sneaking out ("Mommy\'s going to the kitchen, back in a minute"). Keep caregivers and comfort objects consistent, with plenty of physical contact.'),
              tip:GG.T('黏人不是退步，是健康依恋的标志，强行“锻炼独立”会适得其反。','Clinginess is not a step backward — it is the mark of secure attachment. Forcing "independence training" backfires.') },
      '13-24':{ read:GG.T('进入情绪“大爆发”期：会因受挫、被打断、说不而崩溃发脾气，因为想法多过表达和自控能力。','Welcome to the meltdown era: frustration, interruptions, and hearing "no" all trigger outbursts, because ideas now outrun words and self-control.'),
              guide:GG.T('先共情命名情绪（“你很生气，因为积木倒了”）再立界限；保持冷静、给有限选择（“穿红的还是蓝的”）减少对抗；事后简单复盘。','Name the feeling first ("you\'re angry because the blocks fell"), then hold the limit. Stay calm and offer limited choices ("the red one or the blue one?") to defuse standoffs. Debrief simply afterward.'),
              tip:GG.T('发脾气是大脑发育的正常阶段，你的稳定比讲道理更能让他平静。','Tantrums are a normal stage of brain growth — your steadiness calms them faster than any reasoning.') },
      '25-36':{ read:GG.T('自我意识强、爱说“不/我自己来”，情绪更复杂，会嫉妒、害羞、也会共情他人。','A strong sense of self — lots of "no" and "I do it myself". Emotions get more complex: jealousy, shyness, and real empathy for others.'),
              guide:GG.T('继续命名情绪、教简单的平静方法（深呼吸“闻花香、吹蜡烛”、抱抱、数到 5）；多给选择权满足自主感；温和而一致地坚持界限。','Keep naming feelings and teach simple calm-down moves (breathe "smell the flower, blow the candle", a hug, count to 5). Offer choices to feed their independence. Hold limits gently and consistently.'),
              tip:GG.T('这个阶段重在“教情绪怎么处理”，而非压制情绪本身。','The job now is teaching how to handle feelings — not suppressing the feelings themselves.') },
    }
  },
  {
    id:'lang', label:GG.T('语言','Language'), emoji:'💬', placeholder:GG.T('例：还不怎么说话，只会咿呀','e.g. Not really talking yet, just babbling'),
    milestones: MILESTONES.lang, video:GG.T('亲子共读 & 对话式说话示范','Shared reading & conversational talk, demonstrated'),
    byBand:{
      '0-3':{ read:GG.T('用哭、咕咕声（cooing）和表情沟通，会被人声吸引、转向声源。','Baby communicates with cries, coos, and expressions, drawn to voices and turning toward sound.'),
              guide:GG.T('多对他说话、唱歌、回应他的发声，做“对话式”的你一句我一声；面对面、夸张口型、放慢语速有助关注。','Talk and sing to baby often, answering their sounds in a you-then-me "conversation". Face-to-face, exaggerated mouth shapes, and a slower pace hold their attention.'),
              tip:GG.T('此阶段“多跟他说话”就是最好的语言启蒙，内容不重要、互动最重要。','Simply talking to baby is the best language start now — the content matters little, the interaction matters most.') },
      '4-6':{ read:GG.T('进入咿呀学语（babbling），会发出连串辅音、对名字有反应、笑出声。','Babbling begins — strings of consonants, responding to their name, laughing out loud.'),
              guide:GG.T('重复并扩展他的发声、给日常动作配解说（“我们换尿布啦”“这是红苹果”）；每天读绘本（布书/洞洞书）、看图说物。','Repeat and expand their sounds, and narrate daily moments ("we\'re changing your diaper", "this is a red apple"). Read picture books daily (cloth or peekaboo books) and name what you see.'),
              tip:GG.T('回应式的“轮流发声”比单向播放音频更能促进语言。','Responsive turn-taking beats one-way audio playback for language growth.') },
      '7-12':{ read:GG.T('会发“爸爸妈妈”等音、懂简单指令和“不”、用手势（指、挥手）沟通，接近 1 岁可能蹦出第一个词。','Sounds like "mama" and "dada" arrive, plus simple commands and "no", and gestures (pointing, waving). The first word may pop out near age 1.'),
              guide:GG.T('把手势和词对应起来、命名他指的东西；玩点名游戏（“鼻子在哪”）；及时回应他的“沟通尝试”（他一指，你就说出来）。','Pair gestures with words and name whatever baby points at. Play naming games ("where\'s your nose?"). Answer every communication attempt — they point, you say the word.'),
              tip:GG.T('手势（指物、挥手、摆手）是语言的前奏，很重要，要积极回应。','Gestures (pointing, waving, head shaking) are the prelude to speech — they matter, so respond warmly.') },
      '13-24':{ read:GG.T('词汇快速增长，从几个词到两词短语（“要奶奶”）；理解远超表达，能听懂大量日常指令。','Vocabulary takes off, from a few words to two-word phrases ("want milk"). Understanding runs far ahead of speech — they follow lots of everyday instructions.'),
              guide:GG.T('扩展他的话（他说“车”，你说“红色的车开走了”）、多提开放式问题、每天屏幕时间尽量为 0；耐心等他表达、别抢答。','Expand what they say (they say "car", you say "the red car drove away"), ask open-ended questions, and keep daily screen time as close to zero as you can. Wait patiently for their words — no jumping in.'),
              tip:GG.T('18 月龄后若几乎不说词、不指物、不看人，建议找儿保医生评估。','If by 18 months there are almost no words, no pointing, and little eye contact, ask your pediatrician for an evaluation.') },
      '25-36':{ read:GG.T('进入“语言爆发”，会说短句、问“为什么”、用“我/你”、陌生人也能听懂大半。','The language explosion: short sentences, endless "why", using "I" and "you" — even strangers understand most of it.'),
              guide:GG.T('多对话、讲故事、复述一天经历；玩角色扮演和儿歌；纠正用“正确示范”而非指责（他说“我跑得快快”，你说“对，你跑得很快”）。','Converse a lot — tell stories and retell the day. Play pretend and sing rhymes. Correct by modeling, not scolding (they say "I runned fast", you say "yes, you ran so fast!").'),
              tip:GG.T('此阶段大量提问是好事，认真回应能极大扩展词汇和思维。','The flood of questions is a great sign — answering them properly stretches vocabulary and thinking enormously.') },
    }
  },
];

/* ════════════ 🤱 妈妈轨（产后护理）════════════ */
/* 产后阶段按「天」分段（妈妈恢复以周/天计，不是月） */
const MOM_STAGES = [
  { id:'w1',   label:GG.T('产后第 1 周','Postpartum week 1'),     lo:0,   hi:8   },
  { id:'w24',  label:GG.T('产后 2-4 周','Postpartum weeks 2-4'),     lo:8,   hi:29  },
  { id:'d42',  label:GG.T('满月 ~ 42 天','1 month to day 42'),    lo:29,  hi:43  },
  { id:'m3',   label:GG.T('产后 6 周 ~ 3 月','6 weeks to 3 months'), lo:43,  hi:91  },
  { id:'m6',   label:GG.T('产后 3 ~ 6 月','3 to 6 months postpartum'),   lo:91,  hi:181 },
];
function stageOf(days){
  const d = Math.max(0, Math.min(180, days|0));
  return MOM_STAGES.find(s=> d>=s.lo && d<s.hi) || MOM_STAGES[MOM_STAGES.length-1];
}

/* 妈妈轨主题：video + byStage[stageId]={read,guide,tip} + redflag（就医红线）+ needs（关联服务类目） */
const MOM_TOPICS = [
  {
    id:'milk', label:GG.T('母乳喂养','Breastfeeding'), emoji:'🤱', placeholder:GG.T('例：涨奶硬得像石头，宝宝含不住','e.g. Engorged rock-hard, baby can\'t latch'),
    video:GG.T('通乳手法 & 堵奶自救 3 步','Unblocking massage & 3-step clogged-duct self-help'), needs:['催乳'],
    redflag:GG.T('乳房红肿热痛伴发烧（像重感冒）/ 硬块持续不退 / 乳头破裂渗血——可能是乳腺炎，尽快就医或找泌乳顾问，多数情况仍可继续喂。','A red, hot, painful breast with fever (flu-like) / a lump that will not clear / cracked, bleeding nipples — possible mastitis. See a doctor or lactation consultant promptly; in most cases you can keep nursing.'),
    byStage:{
      'w1':{ read:GG.T('下奶通常在产后 2-5 天，这几天涨奶、硬胀很常见；初乳虽少，但完全够新生儿的小胃。','Milk usually comes in 2-5 days after birth, so engorgement and hard fullness are common right now. Colostrum looks scant but perfectly fills a newborn\'s tiny stomach.'),
             guide:GG.T('勤吸是关键——按需哺乳（24 小时 8-12 次）、两边轮换，含乳要含住大部分乳晕；胀痛时喂前热敷 3-5 分钟、喂后冷敷 10-15 分钟。','Frequent nursing is everything — feed on demand (8-12 times per 24 hours), alternate sides, and get a deep latch over most of the areola. For engorgement, warm compress 3-5 minutes before feeds and cold compress 10-15 minutes after.'),
             tip:GG.T('宝宝一天 6 片以上湿尿布，就说明吃够了，别被“奶少”焦虑带跑。','6+ wet diapers a day means baby is getting enough — do not let "low supply" anxiety take the wheel.') },
      'w24':{ read:GG.T('奶量进入供需调节，涨奶高峰也在这阵；堵奶、小白点、局部硬块开始出现。','Supply is settling into demand-driven rhythm, with engorgement peaking around now; clogged ducts, milk blebs, and local lumps start appearing.'),
             guide:GG.T('堵奶先排空：温热敷 + 从硬块向乳头方向轻推 + 让宝宝下巴对着硬块方向吸；别突然拉长喂奶间隔（超过 3-4 小时易堵）。','For clogs, drain first: warm compress + gentle strokes from the lump toward the nipple + point baby\'s chin at the lump while nursing. Do not suddenly stretch feed intervals (past 3-4 hours invites clogs).'),
             tip:GG.T('反复堵奶、越揉越痛时，找催乳师/泌乳顾问通常比自己硬扛快又少受罪。','For repeat clogs that hurt more the more you massage, a lactation consultant usually beats toughing it out — faster and far less painful.') },
      'd42':{ read:GG.T('多数妈妈泌乳趋稳，也摸到了喂养节奏；可以开始考虑背奶、储奶。','Most moms have steady supply and a feeding rhythm by now — a good time to think about pumping at work and building a stash.'),
             guide:GG.T('要复工提前 2-3 周练吸奶器、建奶库（每天固定时段挤 1-2 次冻存）；保证自己喝够水（每天约 2-2.5L）、吃够、睡够。','If returning to work, start pump practice 2-3 weeks ahead and build a freezer stash (1-2 extra sessions at fixed times daily). Keep yourself watered (about 2-2.5L a day), fed, and rested.'),
             tip:GG.T('奶量短期波动多和疲劳、月经、压力有关，别急着加配方。','Short-term supply dips usually trace to fatigue, your period, or stress — no need to rush to formula.') },
      'm3':{ read:GG.T('进入相对轻松的稳定期，也可能遇到“猛长期”——宝宝频繁要吃，像奶不够，其实正常。','A relatively easy, stable stretch — though growth spurts may hit, with baby feeding constantly as if supply dropped. It has not; this is normal.'),
             guide:GG.T('猛长期顺应需求多喂一两天（通常 2-3 天）就回稳；乳头皲裂可涂少量乳汁/羊脂膏并调整含乳；反复堵奶找泌乳顾问。','Ride out growth spurts by feeding on demand for a couple of days (usually 2-3) until things settle. For cracked nipples, apply a little breast milk or lanolin and fix the latch. For recurring clogs, see a lactation consultant.'),
             tip:GG.T('夜间泌乳素高，夜奶有助维持奶量，断夜奶不必太早。','Prolactin runs high at night, so night feeds help maintain supply — no rush to drop them.') },
      'm6':{ read:GG.T('宝宝加辅食后奶量可能略降；你也许开始考虑离乳，或继续亲喂。','With solids started, milk intake may dip slightly. You may be weighing weaning — or happily continuing. Both are fine.'),
             guide:GG.T('离乳循序渐进（每 3-5 天减 1 顿、从“最不重要的那顿”开始替换），避免突然断奶引发涨奶堵奶；继续喂同样很好。','Wean gradually (drop one feed every 3-5 days, starting with the least important one) — stopping cold invites engorgement and clogs. Continuing to nurse is every bit as good.'),
             tip:GG.T('世卫建议母乳可喂到 2 岁及以上——喂多久由你和宝宝决定，没有“该断”的死线。','The WHO supports breastfeeding to age 2 and beyond — how long is up to you and your baby. There is no deadline.') },
    }
  },
  {
    id:'lochia', label:GG.T('恶露·伤口','Lochia & wounds'), emoji:'🩹', placeholder:GG.T('例：恶露还是鲜红色，量好像变多了','e.g. Lochia still bright red, and it seems heavier'),
    video:GG.T('会阴 / 剖腹产伤口护理','Perineal / C-section wound care'), needs:['月子中心'],
    redflag:GG.T('恶露恶臭 / 排出拳头大血块 / 鲜红量大止不住 / 伤口红肿渗液发烧——立即就医。','Foul-smelling lochia / fist-sized clots / heavy bright-red bleeding that will not stop / an incision that is red, swollen, oozing, or feverish — seek care immediately.'),
    byStage:{
      'w1':{ read:GG.T('恶露最初几天量多、鲜红，可能带小血块；侧切或剖腹产伤口这几天最痛。','Lochia is heaviest and brightest red in the first days, possibly with small clots. Episiotomy or C-section wounds hurt most this week.'),
             guide:GG.T('勤换卫生巾（每 2-4 小时一次）、会阴温水冲洗、便后由前向后擦；剖腹产护好刀口、避免提重（不超过宝宝体重）；多躺、少久站。','Change pads often (every 2-4 hours), rinse the perineum with warm water, wipe front to back. Protect a C-section incision and lift nothing heavier than your baby. Rest lying down; limit long standing.'),
             tip:GG.T('偶有小血块正常，但出现大血块、像月经最大量还止不住，要就医。','The odd small clot is normal — but large clots, or heavier-than-heaviest-period bleeding that will not ease, mean see a doctor.') },
      'w24':{ read:GG.T('恶露应逐渐转为暗红、量减少；伤口疼痛明显缓解。','Lochia should be darkening and lightening in flow, with wound pain easing noticeably.'),
             guide:GG.T('继续保持清洁干燥；可下床温和走动（每天几次、每次 5-10 分钟）促进恢复，但避免增加腹压的动作（搬重物、用力排便）。','Keep everything clean and dry. Gentle walks help recovery (a few times daily, 5-10 minutes each) — but avoid anything that raises abdominal pressure (heavy lifting, straining).'),
             tip:GG.T('若恶露又变鲜红、量增多，常是活动过量的信号，该多休息。','If lochia turns bright red or heavier again, you have likely overdone it — that is your cue to rest more.') },
      'd42':{ read:GG.T('恶露多在 4-6 周转为淡黄、白色直至干净；产后 42 天复查是关键节点。','Lochia typically fades to yellow, then white, then clear by 4-6 weeks. The day-42 checkup is the key milestone.'),
             guide:GG.T('按时做 42 天复查（查子宫复旧、伤口愈合、盆底功能）；复查通过后再逐步恢复运动和同房。','Keep the 42-day checkup (uterine recovery, wound healing, pelvic floor). Resume exercise and intimacy step by step only after it clears you.'),
             tip:GG.T('别跳过 42 天复查——很多盆底、伤口问题要靠这一查才发现。','Do not skip the 42-day checkup — many pelvic floor and wound issues only surface there.') },
      'm3':{ read:GG.T('恶露通常已干净、伤口基本愈合；开始关注疤痕护理和更系统的恢复。','Lochia is usually done and wounds mostly healed — attention turns to scar care and more systematic recovery.'),
             guide:GG.T('剖腹产疤痕愈合后可做护理（硅胶贴/轻柔按摩）；同房注意避孕（哺乳也可能排卵，别只靠哺乳避孕）。','Once a C-section scar has closed, start scar care (silicone strips / gentle massage). Use contraception when resuming intimacy — ovulation can return while breastfeeding, so do not rely on nursing alone.'),
             tip:GG.T('伤口处摸到硬结、持续刺痛或反复渗液，要回医院看。','A hard knot, persistent stabbing pain, or repeated oozing at the wound means go back to the hospital.') },
      'm6':{ read:GG.T('身体大体恢复，重点转向体能和盆底/腹直肌的长期修复。','The body has largely recovered; focus shifts to fitness and long-term pelvic floor / ab repair.'),
             guide:GG.T('循序增加运动强度（先快走、再慢跑）；持续漏尿、腰背痛、腹部分离明显的，做专业评估。','Build exercise intensity gradually (brisk walking first, then easy jogging). For persistent leaking, back pain, or clear ab separation, get a professional assessment.'),
             tip:GG.T('恢复因人而异，剖腹产和多胎妈妈往往更慢，别和别人比进度。','Recovery pace varies — C-section and multiple-birth moms often need longer. Do not measure against anyone else.') },
    }
  },
  {
    id:'mood', label:GG.T('情绪·心理','Mood & mind'), emoji:'💗', placeholder:GG.T('例：忍不住想哭，又觉得自己不该这样','e.g. Can\'t stop crying, then feel bad for crying'),
    video:GG.T('产后情绪自我照顾 & 呼吸放松','Postpartum emotional self-care & breathing'), needs:['心理'],
    redflag:GG.T('持续低落超过两周 / 对宝宝失去兴趣 / 出现伤害自己或宝宝的念头——请立即联系家人并就医，或拨打 12320 卫生热线、当地心理援助热线。','Low mood lasting over two weeks / losing interest in your baby / thoughts of harming yourself or the baby — contact family and seek medical help immediately, or call the 12320 health hotline or your local mental health helpline.'),
    byStage:{
      'w1':{ read:GG.T('产后 3-4 天，约八成妈妈会经历“婴儿忧郁”——爱哭、易怒、情绪起伏，这是激素骤变，正常。','Around day 3-4, some 80% of moms hit the "baby blues" — teary, irritable, up and down. It is the hormone crash, and it is normal.'),
             guide:GG.T('允许自己哭和脆弱；把照护和家务尽量分出去（明确告诉家人“我需要你做 X”），优先补觉；每天和伴侣/家人说一次真实感受。','Let yourself cry and be fragile. Hand off care and chores wherever possible (tell family plainly, "I need you to do X") and put sleep first. Share how you really feel with your partner or family once a day.'),
             tip:GG.T('婴儿忧郁通常两周内自行缓解，你不是“矫情”，更不是不爱孩子。','Baby blues usually lift within two weeks. You are not being dramatic, and you certainly do not love your baby any less.') },
      'w24':{ read:GG.T('若两周后情绪仍持续低落、麻木、对什么都提不起劲，可能是产后抑郁的信号，不是软弱。','If low mood, numbness, or flatness persists past two weeks, it may signal postpartum depression — an illness, not weakness.'),
             guide:GG.T('主动求助：告诉家人你需要支持、预约医生评估（可做 EPDS 情绪量表）；别独自硬扛、别自责；每天争取一点户外光照和走动。','Reach out: tell family you need support and book a doctor\'s assessment (the EPDS mood scale can help). No toughing it out alone, no self-blame. Get a little outdoor light and walking every day.'),
             tip:GG.T('产后抑郁约每 7 位妈妈就有 1 位，它是病、能治，越早干预越好。','Postpartum depression affects about 1 in 7 moms. It is an illness, it is treatable, and earlier is better.') },
      'd42':{ read:GG.T('42 天复查也可以聊情绪——很多医院会做情绪筛查（如 EPDS 量表）。','The 42-day checkup is for your mood too — many hospitals screen for it (e.g. the EPDS scale).'),
             guide:GG.T('如实和医生说你的状态（别报喜不报忧）；用好“睡眠 + 运动 + 社交支持”三个保护因素（哪怕每天 15 分钟独处或散步）。','Tell the doctor honestly how you are (no brave face). Lean on the three protective factors — sleep, movement, and social support — even 15 minutes of alone time or a walk daily.'),
             tip:GG.T('感到与宝宝难以亲近、或反复出现伤害自己/宝宝的念头，要立刻就医或求助。','If bonding feels hard, or thoughts of harming yourself or the baby keep returning, seek help immediately.') },
      'm3':{ read:GG.T('回归日常后，孤独感、身份转变的迷茫、与伴侣的摩擦，都可能影响情绪。','Back in the everyday grind, loneliness, the identity shift, and friction with your partner can all wear on your mood.'),
             guide:GG.T('保留一点“只属于自己”的时间（每天 20-30 分钟做喜欢的事）；加入妈妈社群减少孤立；情绪持续影响生活就预约心理咨询。','Keep a slice of time that is only yours (20-30 minutes a day on something you enjoy). Join a moms\' group to break the isolation. If mood keeps disrupting life, book counseling.'),
             tip:GG.T('照顾好你自己，才是对宝宝最好的照顾——这不是口号，是事实。','Taking care of yourself is the best care you can give your baby — not a slogan, a fact.') },
      'm6':{ read:GG.T('多数妈妈情绪趋稳，但产后抑郁也可能晚发或迁延，值得持续关注。','Most moms level out by now, but postpartum depression can start late or linger — worth keeping an eye on.'),
             guide:GG.T('若长期低落、失眠、焦虑影响生活，别等“自己好”，找专业帮助（心理咨询/精神科都可以）；继续维持运动和社交。','If persistent low mood, insomnia, or anxiety disrupts life, do not wait to "get over it" — find professional help (counseling or psychiatry both work). Keep up movement and social contact.'),
             tip:GG.T('情绪求助和发烧看病一样，是正常的医疗行为，没什么好羞耻。','Seeking help for your mood is normal medical care, exactly like seeing a doctor for a fever. Nothing to be ashamed of.') },
    }
  },
  {
    id:'repair', label:GG.T('身体修复','Body recovery'), emoji:'🧘', placeholder:GG.T('例：打喷嚏会漏尿，肚子还松松的','e.g. Leak when I sneeze, belly still soft'),
    video:GG.T('凯格尔 & 腹直肌自测演示','Kegels & diastasis recti self-check demo'), needs:['产后修复'],
    redflag:GG.T('持续漏尿 / 明显下坠感 / 腹直肌分离长期不愈 / 同房疼痛——做专业盆底与腹直肌评估。','Persistent leaking / a clear dragging, falling-out feeling / ab separation that will not close / painful intimacy — get a professional pelvic floor and diastasis assessment.'),
    byStage:{
      'w1':{ read:GG.T('第一周以休息和子宫复旧为主，身体还很虚，不是练腹、塑形的时候。','Week one is for rest and uterine recovery — the body is depleted, and it is no time for ab work or shaping.'),
             guide:GG.T('能做的只是轻柔的腹式呼吸（吸气鼓肚、呼气慢慢收紧，每天几组）和脚踝活动（勾脚、绕环防血栓）；高强度修复都往后放。','All you need is gentle belly breathing (inhale to expand, exhale to slowly draw in, a few sets daily) and ankle moves (flexes and circles against clots). Everything intense waits.'),
             tip:GG.T('这周的“修复”，就是好好躺、好好吃、好好睡。','This week, "recovery" means lying down well, eating well, and sleeping well.') },
      'w24':{ read:GG.T('可以开始最温和的盆底肌收缩（凯格尔），但腹直肌、核心训练仍要等。','You can begin the gentlest pelvic floor squeezes (Kegels), but ab and core training still wait.'),
             guide:GG.T('凯格尔：平躺，像“憋尿/忍屁”般收紧盆底肌，收 5 秒、松 5 秒，每天 3 组、每组 10 次；避免仰卧起坐、平板支撑等增加腹压的动作。','Kegels: lying flat, tighten as if holding in urine, squeeze 5 seconds, release 5 seconds — 3 sets of 10 daily. Avoid sit-ups, planks, and anything that raises abdominal pressure.'),
             tip:GG.T('漏尿、下坠感是盆底受损信号，越早温和训练越好。','Leaking or a dragging feeling signals pelvic floor strain — the earlier the gentle training, the better.') },
      'd42':{ read:GG.T('42 天复查后，医生评估通过才适合逐步开始系统的产后修复。','Systematic recovery work should start only after the 42-day checkup and a doctor\'s all-clear.'),
             guide:GG.T('先测盆底肌肌力和腹直肌分离程度（仰卧抬头，摸肚脐上下能放进几根手指）；再按结果选凯格尔/电刺激/核心训练，别跳步。','First measure pelvic floor strength and ab separation (lying down, head lifted, count finger-widths at the midline above and below the navel). Then pick Kegels / e-stim / core work to match. No skipping steps.'),
             tip:GG.T('腹直肌分离超过两指，先别练卷腹，否则越练越鼓。','If the gap is over two finger-widths, hold off on crunches — they can bulge it worse.') },
      'm3':{ read:GG.T('进入修复黄金期，盆底、核心、体态都可以更系统地练。','The golden window for recovery — pelvic floor, core, and posture can all be trained more systematically now.'),
             guide:GG.T('循序渐进：盆底 → 核心（死虫式、臀桥）→ 有氧；漏尿、腰痛、分离超过两指不改善的，找专业评估。','Progress in order: pelvic floor → core (dead bug, glute bridge) → cardio. For leaking, back pain, or a stubborn gap over two fingers, get assessed professionally.'),
             tip:GG.T('专业评估能避免“瞎练”——很多动作做错反而加重问题。','A professional assessment prevents training blind — plenty of moves done wrong make things worse.') },
      'm6':{ read:GG.T('身体多已具备较好运动能力，重点是长期体态和核心稳定。','Most bodies are ready for real exercise again — the focus now is long-term posture and core stability.'),
             guide:GG.T('恢复常规锻炼，继续巩固盆底和核心；高强度跑跳前先确认盆底已恢复（跳跃/咳嗽不漏尿）。','Return to regular workouts while consolidating pelvic floor and core. Before high-impact running or jumping, confirm the pelvic floor is ready (no leaks when jumping or coughing).'),
             tip:GG.T('恢复没有统一时间表，关键是循序和正确，而不是快。','There is no universal timeline — what matters is gradual and correct, not fast.') },
    }
  },
  {
    id:'confine', label:GG.T('月子·饮食','Confinement & diet'), emoji:'🍲', placeholder:GG.T('例：婆婆不让我洗头，好难受','e.g. My mother-in-law won\'t let me wash my hair — miserable'),
    video:GG.T('科学坐月子 & 月子餐示范','Evidence-based confinement & recovery meals'), needs:['月子餐','月子中心'],
    redflag:GG.T('伤口/乳房问题伴发烧、持续严重便秘或剧烈腹痛——就医，而不是硬扛或一味忌口。','Wound or breast trouble with fever, severe lasting constipation, or intense abdominal pain — see a doctor. Do not tough it out or just cut foods.'),
    byStage:{
      'w1':{ read:GG.T('坐月子 ≠ 捂月子。不能洗澡洗头、不能下床、不能吹风，多是旧观念，反而增加感染和血栓风险。','Confinement is not sealing yourself in. "No showers, no getting up, no fresh air" are mostly old rules that actually raise infection and clot risks.'),
             guide:GG.T('可以温水擦浴/淋浴（剖腹产护好伤口、只淋浴不盆浴）、室温 24-26℃ 舒适即可、适度下床走动；饮食清淡好消化（少油、足量蔬菜和蛋白）。','Warm sponge baths or showers are fine (protect a C-section incision; shower, no soaking). Keep the room a comfortable 24-26°C and move around moderately. Eat light and digestible (less oil, plenty of vegetables and protein).'),
             tip:GG.T('科学坐月子的核心是清洁、休息、营养均衡，不是一动不动地“熬”。','Evidence-based confinement means hygiene, rest, and balanced nutrition — not lying motionless to endure it.') },
      'w24':{ read:GG.T('食欲恢复，但便秘、口味变化、家人“大补”安排可能带来困扰。','Appetite returns, but constipation, changed tastes, and the family\'s "mega-nourishing" menus can all be a headache.'),
             guide:GG.T('多喝水、多吃蔬果粗粮防便秘（必要时遵医嘱用乳果糖）；蛋白质要够（每天鱼禽蛋瘦肉 + 奶），但不必顿顿浓汤大油（浓汤主要是油，营养在肉里）。','Plenty of water, fruit, veg, and whole grains against constipation (lactulose per your doctor if needed). Get enough protein (fish, poultry, eggs, lean meat plus dairy daily) — but skip the endless oily broths (the soup is mostly oil; the nutrition is in the meat).'),
             tip:GG.T('哺乳每天约多需 500 大卡，均衡比“猛补”更重要。','Nursing needs only about 500 extra calories a day — balance beats binge-nourishing.') },
      'd42':{ read:GG.T('月子接近尾声，可以逐步回归正常作息和更丰富的饮食。','Confinement is winding down — time to ease back into normal rhythms and a wider menu.'),
             guide:GG.T('保持均衡饮食支撑泌乳和恢复；在月子中心可和营养师对接后续食谱；逐步回归正常作息。','Keep meals balanced to support milk and recovery. At a care center, sync with the dietitian on next-stage menus. Gradually restore a normal schedule.'),
             tip:GG.T('别靠猛进补来“补元气”，均衡 + 睡眠才是恢复关键。','Do not "restore vitality" by force-feeding tonics — balance plus sleep is what actually heals.') },
      'm3':{ read:GG.T('饮食基本回归常态，关注点是营养支撑哺乳和体力。','Eating is mostly back to normal; the focus is fueling breastfeeding and stamina.'),
             guide:GG.T('保证铁、钙、蛋白、水分（哺乳每天约多需 500 大卡）；想恢复体重靠均衡饮食 + 温和运动，别在哺乳期严格节食。','Cover iron, calcium, protein, and fluids (about 500 extra calories daily while nursing). For weight, rely on balanced meals plus gentle exercise — never strict dieting while breastfeeding.'),
             tip:GG.T('哺乳期过度节食会影响奶量和精力，得不偿失。','Crash dieting while nursing drains both supply and energy — a bad trade.') },
      'm6':{ read:GG.T('已无需“月子”限制，进入长期健康管理阶段。','No more confinement rules — this is long-term health management now.'),
             guide:GG.T('规律三餐、营养充足，配合修复运动逐步找回状态。','Regular meals, solid nutrition, and steady recovery workouts to find your form again.'),
             tip:GG.T('你的健康习惯，会潜移默化成为宝宝将来的饮食习惯。','Your health habits quietly become your baby\'s future eating habits.') },
    }
  },
  {
    id:'rest', label:GG.T('休息·睡眠','Rest & sleep'), emoji:'😴', placeholder:GG.T('例：宝宝一夜醒五次，我快撑不住了','e.g. Baby woke five times last night — I\'m at my limit'),
    video:GG.T('碎片补觉 & 夜班分工法','Nap stacking & splitting the night shift'), needs:['月嫂'],
    redflag:GG.T('长期严重失眠 + 情绪持续低落 / 白天无法正常运转——可能与产后抑郁相关，建议就医。','Severe long-term insomnia plus persistent low mood, or being unable to function by day — possibly linked to postpartum depression; see a doctor.'),
    byStage:{
      'w1':{ read:GG.T('新生儿 2-3 小时醒一次，妈妈睡眠被切得很碎，极度疲惫是这周的常态。','A newborn wakes every 2-3 hours, slicing your sleep to shreds — utter exhaustion is the norm this week.'),
             guide:GG.T('“宝宝睡你也睡”（白天跟着补觉）；夜间和家人轮班、把瓶喂/拍嗝/换尿布分出去；主动降低家务标准（外卖、家政都行）。','"Sleep when the baby sleeps" (nap along by day). Split nights with family — hand off bottle feeds, burping, and changes. Lower the housework bar on purpose (takeout and cleaners are allowed).'),
             tip:GG.T('睡眠剥夺会放大情绪问题，补觉是产后头等大事，不是偷懒。','Sleep deprivation amplifies every emotion. Catching up on sleep is the top postpartum job, not laziness.') },
      'w24':{ read:GG.T('涨奶、夜奶、宝宝睡眠倒退，妈妈依然难睡整觉，疲劳累积。','Engorgement, night feeds, and baby\'s sleep regressions keep full nights out of reach; fatigue stacks up.'),
             guide:GG.T('和伴侣明确分工夜班（如“前半夜你、后半夜我”）；白天抓碎觉；请月嫂/家人接手一两个夜晚，让你睡个整觉（哪怕一周一次）。','Agree on clear night shifts with your partner ("you take the first half, I take the second"). Grab fragments of sleep by day. Have a night nanny or family cover a night or two so you sleep through (even once a week).'),
             tip:GG.T('哪怕一晚不被打扰的睡眠，也能显著改善情绪和泌乳。','Even one uninterrupted night measurably lifts both mood and milk supply.') },
      'd42':{ read:GG.T('随宝宝逐渐并觉，妈妈睡眠可能略改善，但仍需有人分担。','As baby consolidates sleep, yours may improve a little — but you still need backup.'),
             guide:GG.T('帮宝宝建立固定睡前流程，间接帮你规律作息；继续保留补觉机会（别用宝宝睡着的时间全拿去做家务）。','Build baby a fixed bedtime routine — it regularizes your schedule too. Protect your nap windows (do not spend every baby nap on chores).'),
             tip:GG.T('别等“撑不住”才求助，提前安排好支持系统。','Do not wait until you break to ask for help — set up your support system in advance.') },
      'm3':{ read:GG.T('部分宝宝夜间睡得更长，妈妈睡眠质量上升，但个体差异大。','Some babies sleep longer stretches now and your sleep quality climbs — but the range is huge.'),
             guide:GG.T('固定自己的入睡时间；睡前 1 小时少刷手机、调暗灯光；白天适度活动有助夜间睡眠。','Fix your own bedtime. Less phone and dimmer lights in the hour before bed. Moderate daytime activity helps night sleep.'),
             tip:GG.T('你的睡眠也值得被“优先”，不是只有宝宝的睡眠重要。','Your sleep deserves priority too — it is not only baby\'s sleep that matters.') },
      'm6':{ read:GG.T('多数家庭进入更可预期的作息，妈妈有机会系统补回睡眠。','Most families reach a more predictable rhythm — a real chance to repay your sleep debt.'),
             guide:GG.T('继续和伴侣分担夜醒；若长期失眠、入睡困难，留意是否与情绪相关，必要时就医。','Keep sharing night wakings with your partner. If insomnia or trouble falling asleep persists, watch for a mood link and see a doctor if needed.'),
             tip:GG.T('长期睡不好又情绪低落，值得一起和医生聊聊。','Long-term bad sleep plus low mood is worth raising with a doctor together.') },
    }
  },
];

/* ════════════ 🏪 附近服务（演示商家，按类目）════════════ */
const SERVICES = [
  { cat:'催乳',     name:GG.T('暖月 · 上门催乳通乳','WarmMoon · Home Lactation Care'), blurb:GG.T('持证催乳师上门，堵奶/涨奶/少奶处理','Certified lactation massage at home — clogs, engorgement, low supply'), dist:'2.3km', price:GG.T('¥198/次起','From ¥198/visit'), rating:4.9 },
  { cat:'催乳',     name:GG.T('乳此安心 母乳指导','LatchEase Breastfeeding Support'),   blurb:GG.T('泌乳顾问 1v1，含乳姿势 + 背奶规划','1-on-1 lactation consultant — latch coaching + back-to-work plan'), dist:'4.1km', price:GG.T('¥260/次','¥260/visit'),  rating:4.8 },
  { cat:'月子中心', name:GG.T('禧月会所 月子中心','Blissful Moon Postpartum Retreat'),   blurb:GG.T('母婴 24h 护理 + 产后餐 + 医生查房','24h mother-baby care + recovery meals + doctor rounds'), dist:'5.6km', price:GG.T('¥3.8 万 / 26 天起','From ¥38k / 26 days'), rating:4.7 },
  { cat:'月子中心', name:GG.T('安然母婴照护中心','Serenity Mother & Baby Care'),     blurb:GG.T('一对一月嫂式照护，房型可选','One-on-one nanny-style care, choice of rooms'),       dist:'7.2km', price:GG.T('¥2.9 万 / 月起','From ¥29k / month'),   rating:4.6 },
  { cat:'产后修复', name:GG.T('盈姿 产后修复中心','GraceForm Postnatal Recovery'),   blurb:GG.T('盆底肌 / 腹直肌 / 骨盆 评估 + 修复','Pelvic floor / diastasis / pelvis — assessment + repair'), dist:'3.4km', price:GG.T('首次评估 ¥99','First assessment ¥99'), rating:4.8 },
  { cat:'产后修复', name:GG.T('复元产康','Revive Postnatal Care'),           blurb:GG.T('仪器 + 手法，漏尿/腰痛/体态调理','Devices + hands-on therapy for leaks, back pain, posture'),  dist:'6.0km', price:GG.T('课程 ¥1800 起','Programs from ¥1,800'), rating:4.6 },
  { cat:'月嫂',     name:GG.T('金牌月嫂 · 家家母婴','Gold-Star Nannies · HomeCare'), blurb:GG.T('持证月嫂/育儿嫂，可面试可试工','Certified maternity & childcare nannies — interview and trial welcome'),   dist:GG.T('同城上门','Citywide home visits'), price:GG.T('¥1.2 万 / 月起','From ¥12k / month'), rating:4.7 },
  { cat:'月嫂',     name:GG.T('夜间陪护 · 安睡管家','Night Care · SleepKeeper'), blurb:GG.T('只上夜班，帮你睡个整觉','Nights only — so you finally sleep through'),         dist:GG.T('同城上门','Citywide home visits'), price:GG.T('¥400 / 晚','¥400 / night'), rating:4.8 },
  { cat:'月子餐',   name:GG.T('膳月 月子餐配送','NourishMoon Meal Delivery'),     blurb:GG.T('营养师配餐，每日三餐两点到家','Dietitian-planned — three meals + two snacks to your door daily'),   dist:GG.T('配送 3km 内','Delivers within 3km'), price:GG.T('¥168 / 天','¥168 / day'), rating:4.7 },
  { cat:'月子餐',   name:GG.T('暖食 分阶段月子餐','WarmBites Staged Recovery Meals'),   blurb:GG.T('按周分阶段，少油不齁','Staged by week — light on oil, never heavy'),           dist:GG.T('配送 5km 内','Delivers within 5km'), price:GG.T('¥4980 / 28 天','¥4,980 / 28 days'), rating:4.6 },
  { cat:'心理',     name:GG.T('微光 心理咨询(母婴向)','Glimmer Counseling (Maternal)'), blurb:GG.T('产后情绪 / 关系咨询，可线上','Postpartum mood & relationship counseling, online available'),     dist:GG.T('线上 + 4.5km','Online + 4.5km'), price:GG.T('首次体验 ¥99','First session ¥99'), rating:4.9 },
  { cat:'心理',     name:GG.T('妈妈互助小组','New Moms Support Circle'),         blurb:GG.T('同城新手妈妈线下 + 线上互助','Local new-mom peer support, in person + online'),     dist:GG.T('每周线上','Weekly online'), price:GG.T('免费','Free'), rating:4.8 },
];
function servicesFor(cats){
  const set = new Set(cats||[]);
  return SERVICES.filter(s=> set.has(s.cat));
}

/* ════════════ 💗 共情语料（写了备注 → 先「被接住」再给干货）════════════ */
const EMPATHY = {
  // 宝宝轨
  night:   [GG.T('夜里一次次被吵醒、又要哄睡，真的很熬——你已经做得很好了。','Pulled awake again and again, then soothing them back down — it is grueling. You are already doing so well.')],
  feed:    [GG.T('宝宝不肯好好吃，当妈的最揪心；先深呼吸，我们一起看怎么回事。','Nothing knots a parent\'s stomach like a baby refusing to eat. Take a breath — let\'s look at this together.')],
  solid:   [GG.T('加辅食手忙脚乱、弄得一地狼藉都正常，你在很用心地尝试。','Starting solids is chaos and mess for everyone — and you are trying so thoughtfully.')],
  gross:   [GG.T('看着别家娃会了自家还没，难免着急——发育有它自己的节奏。','Watching other babies do what yours has not yet is hard not to sweat — development keeps its own schedule.')],
  emotion: [GG.T('宝宝闹脾气、黏人，你既心疼又疲惫，这种复杂的感受很真实。','A fussy, clingy baby leaves you aching and exhausted at once — that tangle of feelings is real.')],
  lang:    [GG.T('担心说话晚是很多家长的心事，你愿意留意就是好事。','Worrying about late talking weighs on many parents — noticing it at all means you are paying attention.')],
  // 妈妈轨
  milk:    [GG.T('喂奶这条路不容易，疼、累、还焦虑——你愿意坚持，已经很了不起。','Breastfeeding is a hard road — painful, tiring, anxious. That you keep going is remarkable.')],
  lochia:  [GG.T('身体还在恢复，疼痛和不适都需要被认真对待，别忍着。','Your body is still healing. Pain and discomfort deserve to be taken seriously — do not just endure.')],
  mood:    [GG.T('你愿意把这种感受说出来，本身就很勇敢——你的情绪值得被认真对待。','Saying how you feel out loud takes real courage — your feelings deserve to be taken seriously.')],
  repair:  [GG.T('身体的变化会让人失落，这很正常；恢复需要时间，你不必着急。','The changes in your body can feel like loss, and that is normal. Healing takes time — no need to rush.')],
  confine: [GG.T('月子里被各种规矩裹着、还得照顾自己和宝宝，确实又委屈又累。','Wrapped in confinement rules while caring for yourself and a newborn — of course you feel wronged and worn out.')],
  rest:    [GG.T('睡不够的日子真的会把人耗空——你需要的休息，同样重要。','Days without enough sleep truly hollow a person out — the rest you need matters just as much.')],
};
function empathyFor(id){ const a = EMPATHY[id]; return a && a.length ? a[0] : GG.T('我在听，我们一起想办法。','I\'m listening. Let\'s work this out together.'); }

window.CODDLE = { TOPICS, BANDS, bandOf, MILESTONES, MOM_TOPICS, MOM_STAGES, stageOf, SERVICES, servicesFor, EMPATHY, empathyFor };
})();
