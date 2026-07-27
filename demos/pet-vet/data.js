/* pet-vet 数据 —— AI 兽医病历助手（Scribe）。
   一段问诊速记 → SOAP 病历 + 鉴别诊断 + 给主人的出院医嘱 + 费用预估。
   CASES：预置病例，既是首屏示例、也是「未连 key」时的离线兜底；结构与 AI 返回 JSON 完全对齐。
   连 key 后，任意速记交给真实模型生成同一结构。

   doc 结构（CASES 每项 / AI 返回都用它）：
     signalment {species,breed,sex,age,weight,bcs}
     urgency    'er' | 'today' | 'routine'
     soap       {s,o,a,p}                              主诉病史 / 客观检查 / 评估 / 计划
     differentials [{dx,like('高'|'中'|'低'),why,test}]  鉴别诊断（按可能性降序，仅提示非确诊）
     discharge  {summary, care[], meds[], recheck, redflags[]}  给主人的大白话出院医嘱
     estimate   [{item, low, high}]                    费用预估区间（元）
*/
(function(){

const LIKE = {
  '高': { color:'#d24a3a', soft:'rgba(210,74,58,.12)', pct:90 },
  '中': { color:'#c08a2a', soft:'rgba(192,138,42,.12)', pct:56 },
  '低': { color:'#3a7bd5', soft:'rgba(58,123,213,.12)', pct:26 }
};

const URGENCY = {
  er:      { key:'er',      label:GG.T('急诊处理','Emergency care'), emoji:'🚑', color:'#d24a3a', soft:'rgba(210,74,58,.12)', note:GG.T('存在危及生命的风险信号，需即刻处置','Life-threatening risk signals present — treat immediately') },
  today:   { key:'today',   label:GG.T('当日就诊','Same-day visit'), emoji:'🩺', color:'#c08a2a', soft:'rgba(192,138,42,.12)', note:GG.T('建议今日内检查处理，别拖','Should be examined and treated today — do not wait') },
  routine: { key:'routine', label:GG.T('常规 / 择期','Routine / elective'), emoji:'🗓', color:'#2e8b57', soft:'rgba(46,139,87,.12)', note:GG.T('可常规预约，按计划随访','Can be scheduled routinely, with planned follow-up') }
};

const CASES = [
  {
    id:'vomit-dog', chip:GG.T('🐕 呕吐 · 金毛','🐕 Vomiting · Golden'), kind:GG.T('急腹症','Acute abdomen'),
    raw:GG.T('金毛/8岁/公绝育。呕吐3天今天加重，吐黄水泡沫，今天一口没吃、没精神。T39.8 HR120，肚子前面一按就疼、绷得紧。体重32.4，有没有乱吃东西不确定。',
             'Golden Retriever / 8 y / MN. Vomiting for 3 days, worse today — yellow foamy fluid. Ate nothing today, lethargic. T 39.8, HR 120; cranial abdomen painful and tense on palpation. BW 32.4. Unsure about dietary indiscretion.'),
    signalment:{ species:GG.T('犬','Canine'), breed:GG.T('金毛寻回犬','Golden Retriever'), sex:GG.T('公 · 已绝育','Male · neutered'), age:GG.T('8 岁','8 y'), weight:'32.4 kg', bcs:'5/9' },
    urgency:'er',
    soap:{
      s:GG.T('8 岁公性已绝育金毛犬。主人诉呕吐 3 天、频率渐增且今日加重，呕吐物由食物转为黄色泡沫样；今日完全拒食、饮水减少、精神沉郁。误食史不详。',
             '8-year-old male neutered Golden Retriever. Owner reports 3 days of vomiting with increasing frequency, acutely worse today; vomitus progressed from food to yellow foam. Complete anorexia today, reduced water intake, depressed mentation. History of dietary indiscretion unknown.'),
      o:GG.T('T 39.8℃(↑)，HR 120 bpm，RR 28/min；可视黏膜略干、CRT<2s。腹部前段触诊紧张、有明显疼痛反应。BW 32.4 kg，BCS 5/9。',
             'T 39.8 °C (↑), HR 120 bpm, RR 28/min; mucous membranes slightly tacky, CRT <2 s. Cranial abdomen tense on palpation with a marked pain response. BW 32.4 kg, BCS 5/9.'),
      a:GG.T('急性呕吐伴前腹痛、发热、拒食。首要怀疑急性胰腺炎，需排除胃肠道异物 / 梗阻与急性胃肠炎。',
             'Acute vomiting with cranial abdominal pain, fever and anorexia. Acute pancreatitis is the primary suspicion; rule out GI foreign body / obstruction and acute gastroenteritis.'),
      p:GG.T('血常规 + 生化（含 cPL / 胰酶）+ 腹部 X 光，必要时腹部超声。先行止吐（马罗匹坦）、静脉补液纠正脱水、禁食观察。依检查结果调整治疗，48h 内复评。',
             'CBC + chemistry (incl. cPL / pancreatic enzymes) + abdominal radiographs; abdominal ultrasound if indicated. Start antiemetic (maropitant), IV fluids to correct dehydration, NPO and monitor. Adjust therapy per results; re-evaluate within 48 h.')
    },
    differentials:[
      { dx:GG.T('急性胰腺炎','Acute pancreatitis'),                like:'高', why:GG.T('前腹疼痛 + 呕吐 + 发热，中老年犬高发','Cranial abdominal pain + vomiting + fever; common in middle-aged and older dogs'), test:GG.T('cPL / 胰酶、腹部超声','cPL / pancreatic enzymes, abdominal ultrasound') },
      { dx:GG.T('胃肠道异物 / 梗阻','GI foreign body / obstruction'), like:'中', why:GG.T('呕吐渐进性加重、完全拒食','Progressively worsening vomiting with complete anorexia'), test:GG.T('腹部 X 光 ± 钡餐造影','Abdominal radiographs ± barium study') },
      { dx:GG.T('急性胃肠炎','Acute gastroenteritis'),              like:'中', why:GG.T('呕吐黄沫常见，但本例发热腹痛程度偏重','Yellow foamy vomit is common, but fever and abdominal pain are unusually marked here'), test:GG.T('血常规、粪便检查','CBC, fecal examination') },
      { dx:GG.T('肝胆 / 全身性疾病','Hepatobiliary / systemic disease'), like:'低', why:GG.T('需生化进一步排查肝肾胰功能','Chemistry needed to further screen hepatic, renal and pancreatic function'), test:GG.T('生化全项','Full chemistry panel') }
    ],
    discharge:{
      summary:GG.T('今天豆豆的情况偏急，我们怀疑是胰腺或肠胃的急性问题，已经先打了止吐针、挂了补液，正在等血液和影像检查结果。',
                   'Doudou is in a fairly acute state today — we suspect an acute pancreatic or GI problem. An anti-nausea injection and IV fluids have already been started, and we are waiting on blood work and imaging results.'),
      care:[GG.T('今晚先禁食，只给少量清水，别喂任何食物','Withhold food tonight; offer only small amounts of water — no food of any kind'),
            GG.T('明早起若不再吐，喂处方易消化粮、少量多次','If there is no more vomiting by tomorrow morning, feed a highly digestible prescription diet in small, frequent meals'),
            GG.T('让它安静休息，记下呕吐次数和精神状态','Let him rest quietly; keep a log of vomiting episodes and energy level')],
      meds:[GG.T('马罗匹坦止吐针：已注射第 1 针，之后每日 1 次、连用 3 天（按医嘱）','Maropitant anti-nausea injection: first dose given; then once daily for 3 days (as directed)')],
      recheck:GG.T('48 小时内带检查结果回诊复评','Recheck within 48 hours with the test results for re-evaluation'),
      redflags:[GG.T('喝水也马上吐、一天吐 5 次以上','Vomits right after drinking water, or vomits more than 5 times a day'),
                GG.T('肚子明显鼓胀，或一碰就痛得尖叫','Visibly bloated belly, or cries out in pain when touched'),
                GG.T('牙龈发白、瘫软站不起来','Pale gums, collapse, or unable to stand')]
    },
    estimate:[
      { item:GG.T('诊疗 / 挂号','Exam / consultation'),            low:50,  high:80 },
      { item:GG.T('血常规 + 生化（含胰酶）','CBC + chemistry (incl. pancreatic enzymes)'),  low:300, high:520 },
      { item:GG.T('腹部 X 光（2 张）','Abdominal radiographs (2 views)'),       low:200, high:350 },
      { item:GG.T('腹部超声','Abdominal ultrasound'),              low:260, high:420 },
      { item:GG.T('止吐 + 静脉补液（当日）','Antiemetic + IV fluids (same day)'),  low:160, high:300 }
    ]
  },

  {
    id:'urinary-cat', chip:GG.T('🐈 尿闭 · 公猫','🐈 Blocked · Male cat'), kind:GG.T('泌尿急症','Urinary emergency'),
    raw:GG.T('公猫3岁英短，今天一直往猫砂盆跑、蹲很久尿不出来、一直叫，老舔下面，碰肚子很凶。昨天开始就没怎么吃了。',
             'Male cat, 3 y, British Shorthair. Keeps running to the litter box today, squats for a long time without producing urine, cries constantly, keeps licking his rear, gets aggressive when the belly is touched. Barely eaten since yesterday.'),
    signalment:{ species:GG.T('猫','Feline'), breed:GG.T('英国短毛','British Shorthair'), sex:GG.T('公 · 已绝育','Male · neutered'), age:GG.T('3 岁','3 y'), weight:'5.6 kg', bcs:'6/9' },
    urgency:'er',
    soap:{
      s:GG.T('3 岁公性已绝育英短。主人诉今日频繁进出猫砂盆、努责排尿但尿量极少 / 无尿，伴持续鸣叫、频繁舔舐会阴；昨起食欲下降。',
             '3-year-old male neutered British Shorthair. Owner reports frequent trips to the litter box today, straining to urinate with minimal to no urine, continuous vocalizing and frequent perineal licking; decreased appetite since yesterday.'),
      o:GG.T('精神沉郁；膀胱触诊高度充盈、紧张、明显疼痛、不易排空，下腹紧张。BW 5.6 kg，BCS 6/9。临床高度提示尿道阻塞。',
             'Depressed. Bladder markedly distended, firm and painful on palpation, cannot be expressed; caudal abdomen tense. BW 5.6 kg, BCS 6/9. Clinical picture highly suggestive of urethral obstruction.'),
      a:GG.T('高度怀疑公猫尿道阻塞（FLUTD / 尿闭）——属泌尿急症，可继发高钾血症与急性肾损伤，危及生命。',
             'High suspicion of urethral obstruction in a male cat (FLUTD / blocked cat) — a urologic emergency that can lead to secondary hyperkalemia and acute kidney injury; life-threatening.'),
      p:GG.T('即刻评估生化（K⁺ / BUN / CREA）+ 血气、腹部 X 光查结石。镇静下导尿解除阻塞、留置导尿管、静脉补液纠正电解质，住院监护。',
             'Immediate chemistry (K⁺ / BUN / CREA) + blood gas; abdominal radiographs to screen for uroliths. Sedated urethral catheterization to relieve the obstruction, indwelling urinary catheter, IV fluids to correct electrolytes; hospitalize and monitor.')
    },
    differentials:[
      { dx:GG.T('尿道阻塞（尿闭）','Urethral obstruction (blocked cat)'),     like:'高', why:GG.T('公猫努责无尿 + 膀胱充盈疼痛，典型急症','Male cat straining without urine + distended painful bladder — a classic emergency'), test:GG.T('生化 K⁺、腹部 X 光、导尿试探','Chemistry K⁺, abdominal radiographs, trial catheterization') },
      { dx:GG.T('特发性膀胱炎（FIC）','Feline idiopathic cystitis (FIC)'),  like:'中', why:GG.T('年轻公猫高发、常与应激相关','Common in young male cats, often stress-related'), test:GG.T('尿检，排除阻塞后诊断','Urinalysis; diagnose once obstruction is excluded') },
      { dx:GG.T('膀胱 / 尿道结石','Bladder / urethral stones'),      like:'中', why:GG.T('可造成阻塞，需影像确认','Can cause obstruction; confirm with imaging'), test:GG.T('腹部 X 光 / 超声','Abdominal radiographs / ultrasound') },
      { dx:GG.T('单纯尿路感染','Uncomplicated urinary tract infection'),        like:'低', why:GG.T('青年公猫单纯感染相对少见','Uncomplicated infection is relatively uncommon in young male cats'), test:GG.T('尿液镜检 + 培养','Urine sediment exam + culture') }
    ],
    discharge:{
      summary:GG.T('糖豆是公猫尿道堵住了，这是会要命的急症，我们已经给它通了尿、留了尿管，正在住院补液监护。下面是接它回家后的注意事项。',
                   'Tangdou had a urethral blockage — a life-threatening emergency in male cats. We have relieved the obstruction, placed a urinary catheter, and he is hospitalized on IV fluids under monitoring. Here is what to watch for once he comes home.'),
      care:[GG.T('严格喂泌尿处方湿粮，让它多喝水（多放水碗 / 流动水）是关键','Feed a urinary prescription wet diet strictly; getting him to drink more (multiple water bowls / a water fountain) is key'),
            GG.T('保持猫砂盆干净、减少环境应激','Keep the litter box clean and minimize household stress'),
            GG.T('每天观察排尿量和是否顺畅','Check urine volume and ease of urination every day')],
      meds:[GG.T('解痉 / 止痛药：按医嘱给','Antispasmodic / pain medication: give as directed'),
            GG.T('泌尿处方粮：长期吃，别再喂普通干粮','Urinary prescription diet: long term — no more regular dry food')],
      recheck:GG.T('拔尿管后 3–5 天复查尿液，之后定期随访防复发','Recheck urinalysis 3–5 days after catheter removal, then regular follow-ups to prevent recurrence'),
      redflags:[GG.T('又出现蹲盆尿不出、努责鸣叫','Squatting in the box again without producing urine, straining and crying'),
                GG.T('呕吐、不吃、瘫软（可能高钾或肾损伤）','Vomiting, not eating, or collapse (possible hyperkalemia or kidney injury)'),
                GG.T('肚子鼓胀','Bloated, distended belly')]
    },
    estimate:[
      { item:GG.T('急诊诊疗 + 评估','Emergency exam + assessment'),          low:80,  high:150 },
      { item:GG.T('生化（电解质 / 肾值）+ 血气','Chemistry (electrolytes / renal values) + blood gas'), low:280, high:480 },
      { item:GG.T('腹部 X 光','Abdominal radiographs'),               low:180, high:320 },
      { item:GG.T('镇静 + 导尿 + 留置尿管','Sedation + catheterization + indwelling catheter'),    low:400, high:800 },
      { item:GG.T('住院 + 静脉补液（每日）','Hospitalization + IV fluids (per day)'),    low:300, high:600 }
    ]
  },

  {
    id:'skin-dog', chip:GG.T('🐩 瘙痒 · 法斗','🐩 Itchy · Frenchie'), kind:GG.T('慢性皮肤','Chronic skin'),
    raw:GG.T('法斗2岁母绝育，最近一个月一直挠、舔爪子、蹭脸，腋下和肚皮发红、有点掉毛但没破。体外驱虫上个月做的。感觉换季就犯。',
             'French Bulldog, 2 y, spayed female. Constant scratching for the past month — licking her paws, rubbing her face; armpits and belly red, some hair loss but no open sores. Flea/tick prevention done last month. Seems to flare when the seasons change.'),
    signalment:{ species:GG.T('犬','Canine'), breed:GG.T('法国斗牛犬','French Bulldog'), sex:GG.T('母 · 已绝育','Female · spayed'), age:GG.T('2 岁','2 y'), weight:'11.2 kg', bcs:'5/9' },
    urgency:'routine',
    soap:{
      s:GG.T('2 岁母性已绝育法斗。主人诉近 1 月持续瘙痒、舔咬足部、蹭脸；腋下及腹部皮肤发红、轻度脱毛、无破溃。规律体外驱虫（上月）。有季节性发作倾向。',
             '2-year-old spayed female French Bulldog. Owner reports 1 month of persistent pruritus, paw licking/chewing and face rubbing; erythema of the axillae and ventral abdomen with mild alopecia, no ulceration. On regular ectoparasite prevention (last month). Apparent seasonal pattern.'),
      o:GG.T('腋下、腹股沟、足背可见红斑，轻度自损性脱毛；指间略潮红。未见明显跳蚤 / 螨虫迹象，无脓疱、无渗出。',
             'Erythema over the axillae, groin and dorsal paws with mild self-induced alopecia; interdigital skin mildly inflamed. No obvious fleas / mites; no pustules, no exudate.'),
      a:GG.T('慢性瘙痒、皮损分布符合犬特应性皮炎（CAD）。需与跳蚤过敏、食物过敏及继发感染（马拉色菌 / 细菌）鉴别。',
             'Chronic pruritus with a lesion distribution consistent with canine atopic dermatitis (CAD). Differentiate from flea allergy, food allergy and secondary infection (Malassezia / bacterial).'),
      p:GG.T('皮肤刮片 + 胶带镜检排寄生虫 / 马拉色菌。控痒（奥拉替尼类）、必要时短期抗感染。建议 8 周食物排除试验，并加强长效驱虫。',
             'Skin scrape + tape cytology to rule out parasites / Malassezia. Pruritus control (oclacitinib class); short course of anti-infective therapy if indicated. Recommend an 8-week elimination diet trial and reinforce long-acting parasite prevention.')
    },
    differentials:[
      { dx:GG.T('犬特应性皮炎（CAD）','Canine atopic dermatitis (CAD)'),     like:'高', why:GG.T('年轻、季节性、典型分布（足 / 腋 / 腹 / 面）','Young dog, seasonal, classic distribution (paws / axillae / ventrum / face)'), test:GG.T('临床诊断 + 排除法，必要时过敏原检测','Clinical diagnosis by exclusion; allergen testing if needed') },
      { dx:GG.T('马拉色菌 / 细菌继发感染','Malassezia / bacterial secondary infection'), like:'中', why:GG.T('瘙痒 + 潮红常继发酵母或细菌','Pruritus + erythema often develop secondary yeast or bacterial infection'), test:GG.T('胶带镜检、皮肤细胞学','Tape impression, skin cytology') },
      { dx:GG.T('食物过敏','Food allergy'),              like:'中', why:GG.T('非季节性瘙痒需排除','Non-seasonal pruritus must be excluded'), test:GG.T('8 周食物排除试验','8-week elimination diet trial') },
      { dx:GG.T('跳蚤过敏性皮炎','Flea allergy dermatitis'),         like:'低', why:GG.T('有规律驱虫，可能性降低但不能完全排除','On regular prevention — less likely but not fully excluded'), test:GG.T('跳蚤梳查、驱虫回顾','Flea combing, prevention history review') }
    ],
    discharge:{
      summary:GG.T('多多的皮肤问题更像是过敏体质（特应性皮炎），不是一次能根治、但能控制得很好。今天先做了镜检、开了止痒药，接下来要配合排查。',
                   "Duoduo's skin problem looks most like an allergic condition (atopic dermatitis) — not something cured in one visit, but very manageable. We did cytology today and started an anti-itch medication; the next step is a structured workup."),
      care:[GG.T('按医嘱给止痒药，别自己停药','Give the anti-itch medication as directed — do not stop it on your own'),
            GG.T('戴软圈或穿衣，防止它继续舔咬足部','Use a soft cone or clothing to keep her from licking and chewing her paws'),
            GG.T('每天给瘙痒程度打个分（0–10），复诊时看趋势','Score her itching daily (0–10) so we can review the trend at rechecks')],
      meds:[GG.T('止痒药（奥拉替尼类）：每日按体重给','Anti-itch medication (oclacitinib class): daily, dosed by body weight'),
            GG.T('药浴 / 外用：按周使用','Medicated bath / topicals: weekly as directed')],
      recheck:GG.T('2–3 周复诊看控痒效果；若安排食物试验，满 8 周再评估','Recheck in 2–3 weeks to assess itch control; if a diet trial is started, reassess after the full 8 weeks'),
      redflags:[GG.T('皮肤出现脓疱、流脓、明显异味（继发感染）','Pustules, oozing or a strong odor from the skin (secondary infection)'),
                GG.T('大面积抓破出血','Large areas scratched open and bleeding'),
                GG.T('突然肿脸、呼吸急促（急性过敏）','Sudden facial swelling or labored breathing (acute allergic reaction)')]
    },
    estimate:[
      { item:GG.T('皮肤科诊疗','Dermatology consultation'),          low:60,  high:120 },
      { item:GG.T('皮肤刮片 + 细胞学镜检','Skin scrape + cytology'), low:120, high:240 },
      { item:GG.T('止痒药（首月）','Anti-itch medication (first month)'),       low:200, high:420 },
      { item:GG.T('药浴 / 外用产品','Medicated bath / topical products'),      low:80,  high:180 },
      { item:GG.T('（可选）过敏原检测','(Optional) allergen testing'),    low:600, high:1200 }
    ]
  },

  {
    id:'senior-cat', chip:GG.T('🐱 消瘦 · 老猫','🐱 Weight loss · Senior cat'), kind:GG.T('老年内科','Senior medicine'),
    raw:GG.T('13岁老猫母绝育，最近两三个月瘦了好多，特别能喝水、猫砂盆老是湿一大坨，吃得不少但还掉秤，有时叫得多、有点焦躁。',
             '13-year-old spayed female cat. Lost a lot of weight over the past 2–3 months, drinks a huge amount of water, litter box always has big soaked clumps. Eats plenty but still losing weight; sometimes yowls a lot and seems restless.'),
    signalment:{ species:GG.T('猫','Feline'), breed:GG.T('家养短毛','Domestic Shorthair'), sex:GG.T('母 · 已绝育','Female · spayed'), age:GG.T('13 岁','13 y'), weight:'3.2 kg', bcs:'3/9' },
    urgency:'today',
    soap:{
      s:GG.T('13 岁母性已绝育家猫。主人诉近 2–3 月进行性体重下降，食欲正常甚至增加（多食），明显多饮多尿（PU/PD），偶发夜嚎与躁动。',
             '13-year-old spayed female domestic cat. Owner reports progressive weight loss over the past 2–3 months with normal to increased appetite (polyphagia), marked polyuria/polydipsia (PU/PD), and occasional night yowling and restlessness.'),
      o:GG.T('消瘦，BW 3.2 kg、BCS 3/9；被毛略乱。颈部可疑甲状腺结节感（待确认），心率偏快。脱水不明显。',
             'Thin, BW 3.2 kg, BCS 3/9; coat slightly unkempt. Possible palpable thyroid nodule in the neck (to be confirmed); heart rate elevated. No obvious dehydration.'),
      a:GG.T('老年猫「多食 + 消瘦 + PU/PD」：首要排查甲状腺机能亢进，同时评估慢性肾病（CKD）与糖尿病（三者可并存）。',
             'Senior cat with polyphagia + weight loss + PU/PD: hyperthyroidism is the top rule-out, while also evaluating chronic kidney disease (CKD) and diabetes mellitus (all three can coexist).'),
      p:GG.T('生化全项 + 血清 T4、尿比重 / 尿检、血压。依结果区分甲亢 / CKD / DM 并分别处理；甲亢可药物（甲巯咪唑）或处方粮起始。',
             'Full chemistry + serum T4, urine specific gravity / urinalysis, blood pressure. Differentiate hyperthyroidism / CKD / DM by results and treat each accordingly; hyperthyroidism can start with medication (methimazole) or a prescription diet.')
    },
    differentials:[
      { dx:GG.T('甲状腺机能亢进','Hyperthyroidism'),        like:'高', why:GG.T('老年猫多食却消瘦 + PU/PD + 躁动，最典型','Senior cat eating well yet losing weight + PU/PD + restlessness — the most classic picture'), test:GG.T('血清 T4（必要时 fT4）','Serum T4 (fT4 if needed)') },
      { dx:GG.T('慢性肾病（CKD）','Chronic kidney disease (CKD)'),       like:'中', why:GG.T('老年猫高发，PU/PD 常见，可与甲亢并存','Very common in senior cats; PU/PD typical; can coexist with hyperthyroidism'), test:GG.T('生化 BUN/CREA/SDMA、尿比重','Chemistry BUN/CREA/SDMA, urine specific gravity') },
      { dx:GG.T('糖尿病','Diabetes mellitus'),               like:'中', why:GG.T('多饮多尿 + 体重下降需排除','PU/PD + weight loss must be excluded'), test:GG.T('血糖 + 果糖胺、尿糖','Blood glucose + fructosamine, urine glucose') },
      { dx:GG.T('消化道淋巴瘤 / 吸收不良','GI lymphoma / malabsorption'), like:'低', why:GG.T('食欲好却仍消瘦的少见病因','A less common cause of weight loss despite a good appetite'), test:GG.T('腹部超声，必要时活检','Abdominal ultrasound; biopsy if indicated') }
    ],
    discharge:{
      summary:GG.T('咪咪这个年纪「能吃还掉秤、又特别能喝水」最常见的原因是甲状腺亢进，但要一起查肾和血糖——老猫常常不止一个问题。今天先安排抽血。',
                   'At Mimi\'s age, "eating well but losing weight and drinking lots of water" is most often hyperthyroidism — but we also need to check her kidneys and blood sugar, since senior cats often have more than one problem. Blood work is scheduled today.'),
      care:[GG.T('保证随时有干净饮水，记录每天饮水量和体重','Keep fresh water available at all times; log her daily water intake and body weight'),
            GG.T('按它的食欲准备易吸收的食物','Offer easily digestible food according to her appetite'),
            GG.T('如可行，收集一次新鲜尿样带来','If possible, collect a fresh urine sample and bring it in')],
      meds:[GG.T('（待检查后）若确诊甲亢，起始甲巯咪唑或处方粮（按医嘱）','(Pending results) if hyperthyroidism is confirmed, start methimazole or a prescription diet (as directed)')],
      recheck:GG.T('抽血结果出来即沟通方案；用药后 2–4 周复查 T4 与肾值','We will discuss the plan as soon as blood results are back; recheck T4 and renal values 2–4 weeks after starting medication'),
      redflags:[GG.T('完全不吃、呕吐、迅速虚弱','Stops eating entirely, vomiting, or rapidly weakening'),
                GG.T('呼吸急促、张口呼吸（甲亢可累及心脏）','Rapid or open-mouth breathing (hyperthyroidism can affect the heart)'),
                GG.T('大量饮水却仍脱水、尿不出','Drinking heavily yet still dehydrated, or unable to urinate')]
    },
    estimate:[
      { item:GG.T('老年猫诊疗','Senior cat consultation'),         low:60,  high:120 },
      { item:GG.T('生化全项 + 电解质','Full chemistry + electrolytes'),   low:300, high:520 },
      { item:GG.T('血清 T4','Serum T4'),           low:150, high:300 },
      { item:GG.T('尿检 + 尿比重','Urinalysis + urine specific gravity'),      low:80,  high:180 },
      { item:GG.T('血压测量','Blood pressure measurement'),          low:60,  high:140 }
    ]
  }
];

window.PETVET = { LIKE, URGENCY, CASES };
})();
