/* oboe 数据：章节原型 + 测验题模板。
   所有文案含 {topic} 占位，渲染时注入主题词 → 任意主题都能生成 ≥3 章、每章 ≥1 题。 */
(function(){
window.OBOE = {

  // 示例主题（首页 4 个 chip）
  SAMPLES: [
    GG.T('Python 编程','Python programming'),
    GG.T('咖啡冲煮','Coffee brewing'),
    GG.T('量子力学','Quantum mechanics'),
    GG.T('宋词鉴赏','Song dynasty poetry')
  ],

  // 一句话课程简介模板（按主题 hash 选一条）
  INTROS: [
    GG.T('从零到能上手，{topic} 的最短学习路径。',
         'The shortest path from zero to hands-on with {topic}.'),
    GG.T('用 5 章拆透 {topic}：先建直觉，再补细节，最后避坑。',
         '{topic} unpacked in 5 chapters: build intuition first, then fill in the details, then dodge the pitfalls.'),
    GG.T('为没有基础的你重排 {topic}：概念—实践—进阶一条龙。',
         '{topic} rearranged for complete beginners: concepts, practice, and next steps in one smooth track.'),
    GG.T('把 {topic} 切成可消化的小块，边学边测，学完就会用。',
         '{topic} sliced into digestible chunks — quiz yourself as you go, and finish ready to use it.')
  ],

  // 章节原型：每个原型有 标题模板 + 3 条要点模板（取 2~3 条）+ 该章可用的测验题型 key
  // quizKinds 指向下方 QUIZZES 里的题库，渲染时按主题 hash 挑题
  CHAPTERS: [
    {
      key:'intro',
      titleT:GG.T('第 {n} 章 · 走进 {topic}','Chapter {n} · Getting Started with {topic}'),
      points:[
        GG.T('{topic} 到底解决什么问题：先弄清它的目标与适用场景，再谈细节。',
             'What problem {topic} actually solves: get clear on its goals and use cases before diving into details.'),
        GG.T('建立全局地图：{topic} 的几大组成部分以及它们之间的关系。',
             'Build the big-picture map: the main building blocks of {topic} and how they fit together.'),
        GG.T('常见的初学误解：很多人一上来就钻进 {topic} 的细枝末节，方向反而走偏。',
             'A common beginner trap: diving straight into the fine details of {topic} and losing the plot.')
      ],
      quizKinds:['purpose','wrongFirst']
    },
    {
      key:'core',
      titleT:GG.T('第 {n} 章 · {topic} 的核心概念','Chapter {n} · Core Concepts of {topic}'),
      points:[
        GG.T('掌握 {topic} 中最关键的几个术语，它们是后面一切的地基。',
             'Master the handful of key terms in {topic} — they are the foundation for everything that follows.'),
        GG.T('理解 {topic} 的基本原理：知道"为什么这样"比死记"是什么"更耐用。',
             'Understand the principles behind {topic}: knowing "why it works" lasts far longer than memorizing "what it is."'),
        GG.T('区分 {topic} 里容易混淆的一对概念，是进阶的分水岭。',
             'Learning to tell apart the most easily confused pair of concepts in {topic} is the watershed on the way up.')
      ],
      quizKinds:['core','why']
    },
    {
      key:'practice',
      titleT:GG.T('第 {n} 章 · 动手实践 {topic}','Chapter {n} · Hands-On with {topic}'),
      points:[
        GG.T('用最小可行的方式跑通一次 {topic}：完整走一遍比看十遍都管用。',
             'Run through {topic} once in the smallest viable way: one full pass beats watching ten tutorials.'),
        GG.T('搭一个练习闭环：做 → 看结果 → 调整，让 {topic} 的反馈尽快回到你手里。',
             'Build a practice loop: do → check the result → adjust, so feedback on {topic} gets back to you fast.'),
        GG.T('记录你的练习过程，复盘时能快速定位 {topic} 哪一步出了问题。',
             'Keep a log of your practice so that on review you can quickly pinpoint which step of {topic} went wrong.')
      ],
      quizKinds:['practice','feedback']
    },
    {
      key:'pitfall',
      titleT:GG.T('第 {n} 章 · {topic} 的常见误区','Chapter {n} · Common Pitfalls in {topic}'),
      points:[
        GG.T('识别 {topic} 学习中最常见的"假性进步"，避免在原地打转。',
             'Spot the most common kind of "fake progress" in learning {topic} so you stop spinning in place.'),
        GG.T('警惕过度追求完美：在 {topic} 上，先完成再优化几乎总是更优解。',
             'Beware of perfectionism: with {topic}, finish-then-polish almost always beats perfect-on-the-first-try.'),
        GG.T('别被工具绑架：工具只是 {topic} 的手段，理解原理才是目的。',
             'Do not let tools take over: tools are just the means in {topic} — understanding the principles is the goal.')
      ],
      quizKinds:['pitfall','perfection']
    },
    {
      key:'advance',
      titleT:GG.T('第 {n} 章 · {topic} 进阶与迁移','Chapter {n} · Leveling Up and Transferring {topic}'),
      points:[
        GG.T('把 {topic} 与你已会的知识连起来，迁移能让学习速度翻倍。',
             'Connect {topic} to what you already know — transfer can double your learning speed.'),
        GG.T('主动给自己出难题：跳出舒适区，是 {topic} 从入门到精通的关键。',
             'Set yourself harder challenges: stepping out of your comfort zone is what takes {topic} from beginner to mastery.'),
        GG.T('规划下一步：找到 {topic} 领域的优质资料与社区，持续精进。',
             'Plan your next step: find quality resources and communities around {topic} and keep leveling up.')
      ],
      quizKinds:['transfer','next']
    }
  ],

  // 题库：每个 key 一组题，渲染时按主题 hash 选 1 道。题干/选项/解析均可注入 {topic}。
  // 每题：{ q, opts:[4], correct: index, why }
  QUIZZES: {
    purpose:[
      { q:GG.T('学习 {topic} 时，最该先弄清楚的是什么？',
               'When starting to learn {topic}, what should you figure out first?'),
        opts:[GG.T('它能解决什么问题、适用什么场景','What problems it solves and where it applies'),
              GG.T('所有术语的精确定义','The precise definition of every term'),
              GG.T('最高级的技巧','The most advanced techniques'),
              GG.T('它的发展历史细节','The fine details of its history')],
        correct:0, why:GG.T('先建立"为什么学 {topic}"的全局认知，细节才有挂靠点；一上来背定义容易迷失方向。',
                            'Build the big-picture sense of "why learn {topic}" first so the details have something to hang on; memorizing definitions up front is a fast way to get lost.') },
      { q:GG.T('对刚接触 {topic} 的人，下面哪种心态更有利？',
               'For someone new to {topic}, which mindset serves you best?'),
        opts:[GG.T('先求看懂全貌，允许细节暂时模糊','Aim to grasp the big picture first, letting details stay fuzzy for now'),
              GG.T('必须把每个概念 100% 搞懂再往下','Refuse to move on until every concept is 100% understood'),
              GG.T('直接挑战最难的部分','Jump straight to the hardest part'),
              GG.T('只看不练','Just read, never practice')],
        correct:0, why:GG.T('学习 {topic} 应先扫出全局地图，细节可以在后续章节回填，逐字钻牛角尖反而拖慢进度。',
                            'Sketch the full map of {topic} first — details can be backfilled in later chapters, while obsessing over every word only slows you down.') }
    ],
    wrongFirst:[
      { q:GG.T('初学 {topic} 最典型的弯路是？',
               'What is the most typical detour for beginners in {topic}?'),
        opts:[GG.T('一上来死抠细枝末节，丢了主线','Obsessing over minor details up front and losing the main thread'),
              GG.T('先理解整体框架','Understanding the overall framework first'),
              GG.T('动手做一个小例子','Building a small hands-on example'),
              GG.T('向有经验的人请教','Asking someone experienced for advice')],
        correct:0, why:GG.T('过早陷入 {topic} 的细节会让人只见树木不见森林，先抓主线再补细节才高效。',
                            'Sinking into the details of {topic} too early means seeing the trees but missing the forest; grab the main thread first, then backfill the details.') }
    ],
    core:[
      { q:GG.T('关于 {topic} 的核心概念，下面说法正确的是？',
               'Which statement about the core concepts of {topic} is correct?'),
        opts:[GG.T('核心术语是后续内容的地基，要优先吃透','Core terms are the foundation for everything that follows — master them first'),
              GG.T('术语不重要，跳过即可','Terminology does not matter — just skip it'),
              GG.T('概念越多越好，先全背下来','The more concepts the better — memorize them all up front'),
              GG.T('原理不用懂，会操作就行','No need to understand the principles as long as you can go through the motions')],
        correct:0, why:GG.T('{topic} 的关键术语和原理是地基，理解了它们，后面的实践与进阶才站得稳。',
                            'The key terms and principles of {topic} are the foundation; once you understand them, later practice and advanced work stand on solid ground.') }
    ],
    why:[
      { q:GG.T('理解 {topic} 的原理（"为什么"）相比只记结论，好处是？',
               'Compared with just memorizing conclusions, what is the benefit of understanding the "why" behind {topic}?'),
        opts:[GG.T('遇到新情况能推理、迁移，更耐用','You can reason through new situations and transfer — it lasts longer'),
              GG.T('花的时间一定更少','It always takes less time'),
              GG.T('可以不用练习','It lets you skip practicing'),
              GG.T('能跳过基础','It lets you skip the basics')],
        correct:0, why:GG.T('懂了 {topic} 的"为什么"，碰到没背过的新情况也能推导，这比死记硬背在真实问题上更顶用。',
                            'Once you understand the "why" of {topic}, you can work out new situations you never memorized — far more useful on real problems than rote learning.') }
    ],
    practice:[
      { q:GG.T('在 {topic} 的学习中，"动手做一遍"的价值主要在于？',
               'When learning {topic}, what is the main value of actually doing it once yourself?'),
        opts:[GG.T('暴露你以为懂其实没懂的盲区','It exposes the blind spots you thought you understood but did not'),
              GG.T('纯粹为了完成任务','Purely to check off a task'),
              GG.T('证明给别人看','To prove something to others'),
              GG.T('取代理解概念','To replace understanding the concepts')],
        correct:0, why:GG.T('亲手跑通一次 {topic}，会逼出阅读时被忽略的盲区，实践和理解是相互补强的。',
                            'Running through {topic} with your own hands forces out the blind spots that reading glosses over; practice and understanding reinforce each other.') }
    ],
    feedback:[
      { q:GG.T('练习 {topic} 时，怎样的反馈循环更高效？',
               'When practicing {topic}, which feedback loop is most effective?'),
        opts:[GG.T('做→看结果→快速调整，循环越短越好','Do → check the result → adjust quickly — the shorter the loop, the better'),
              GG.T('做完一大批再统一检查','Finish a big batch, then check everything at once'),
              GG.T('只做不看结果','Do the work but never look at the results'),
              GG.T('等别人来纠错','Wait for someone else to correct you')],
        correct:0, why:GG.T('缩短 {topic} 的"做—反馈—调整"循环，错误能尽早被发现和修正，学习曲线更陡。',
                            'Shortening the do–feedback–adjust loop in {topic} means mistakes get caught and fixed early, making your learning curve much steeper.') }
    ],
    pitfall:[
      { q:GG.T('下面哪种是 {topic} 学习中的"假性进步"？',
               'Which of these is "fake progress" when learning {topic}?'),
        opts:[GG.T('反复看教程却从不自己动手','Rewatching tutorials without ever trying it yourself'),
              GG.T('做完整理了一次错题','Reviewing the questions you got wrong'),
              GG.T('给自己出新题练','Making up new practice problems for yourself'),
              GG.T('向人讲解学到的内容','Explaining what you learned to someone else')],
        correct:0, why:GG.T('光看不练会带来"我好像懂了"的错觉，是 {topic} 里最常见的假性进步，输出和实践才算数。',
                            'Watching without doing creates the illusion of understanding — the most common fake progress in {topic}. Only output and practice count.') }
    ],
    perfection:[
      { q:GG.T('对于 {topic}，"先完成再优化"通常意味着？',
               'For {topic}, what does "finish first, then polish" usually mean?'),
        opts:[GG.T('先做出能用的版本，再逐步打磨','Ship a usable version first, then refine it step by step'),
              GG.T('一次就要做到完美','Get it perfect on the very first try'),
              GG.T('永远不优化','Never optimize at all'),
              GG.T('跳过基础直接优化','Skip the basics and jump straight to optimizing')],
        correct:0, why:GG.T('在 {topic} 上先拿出可用成果，能更早获得反馈；过度追求一次完美往往拖死进度。',
                            'Producing something usable in {topic} gets you feedback sooner; chasing first-try perfection usually grinds progress to a halt.') }
    ],
    transfer:[
      { q:GG.T('想加速掌握 {topic}，下面哪种做法最有效？',
               'To speed up mastering {topic}, which approach works best?'),
        opts:[GG.T('把它和你已掌握的知识建立联系','Connect it to knowledge you already have'),
              GG.T('把它当成完全孤立的新东西','Treat it as something completely new and isolated'),
              GG.T('只靠重复背诵','Rely on rote repetition alone'),
              GG.T('回避任何类比','Avoid analogies entirely')],
        correct:0, why:GG.T('把 {topic} 挂接到你已有的知识网络上，新内容更易理解和记住，迁移是高手的加速器。',
                            'Hooking {topic} into your existing knowledge network makes new material easier to understand and remember — transfer is the expert\'s accelerator.') }
    ],
    next:[
      { q:GG.T('学完 {topic} 的基础后，下一步最合理的是？',
               'After finishing the basics of {topic}, what is the most sensible next step?'),
        opts:[GG.T('主动找更难的真实问题来练，并加入相关社区','Seek out harder real-world problems to practice on, and join the community'),
              GG.T('立刻宣布精通','Immediately declare yourself an expert'),
              GG.T('停止学习','Stop learning'),
              GG.T('只重复已会的内容','Only repeat what you already know')],
        correct:0, why:GG.T('持续走出舒适区、用真实问题挑战自己，并借助 {topic} 的优质社区与资料，才能从入门走向精通。',
                            'Keep stepping outside your comfort zone, challenge yourself with real problems, and lean on quality communities and resources for {topic} — that is the road from beginner to mastery.') }
    ]
  }

};
})();
