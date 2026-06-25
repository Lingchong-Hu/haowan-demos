/* ════════════════════════════════════════════════════════════════════════
   app.js — 对话外壳 + 高价值场景引擎
   ────────────────────────────────────────────────────────────────────────
   设计取舍（给运营商看的，不是只会重答入住前已发的 FAQ）：
   · 四个「只有 AI 能干、预发文案干不了」的主场景 → 确定性触发，现场不翻车，离线也能演：
       ① 加住/晚退 upsell（查实时房态 → 报价卡 → 收款链接）   —— 把咨询变收入
       ② 入住中故障分诊 → 排障 → 开工单 + 派 on-call           —— 省成本、保评分
       ③ 情境本地管家（看天气/带娃/订位，会帮你办）            —— 撑高端溢价
       ④ 例外的体面人工移交（涉钱/政策/安全 → 带上下文转人工）  —— 守信任
   · 自由对话（其余问题）走真实模型；连不上时退回预置兜底（基础信息按「补发」话术，不当卖点）。
   · 卡片/收款/工单/转人工均为「演示数据」（已在对话顶部标注），生产环境对接 PMS/Stripe/工单系统。
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const C = window.YUE_CONFIG;
  const KEY_LS = 'saltwater_anthropic_key';

  const $ = (s) => document.querySelector(s);
  const thread = $('#thread');
  const input = $('#input');
  const sendBtn = $('#send');
  const engineTag = $('#engineTag');

  $('#villaName').textContent = C.BRAND.name;
  $('#villaTag').textContent = C.BRAND.tagline;
  $('#crest').textContent = C.BRAND.monogram;
  document.title = C.BRAND.name + ' · Villa Concierge';

  const history = [];
  let proxyAvailable = null;
  let busy = false;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const scrollEnd = () => { thread.scrollTop = thread.scrollHeight; };
  function el(tag, cls, txt) { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  /* ---------------- 渲染基元 ---------------- */
  function bubble(role, text, opts) {
    opts = opts || {};
    const msg = el('div', 'msg ' + (role === 'user' ? 'user' : 'bot'));
    if (role !== 'user') { const av = el('div', 'avatar', C.BRAND.monogram); msg.appendChild(av); }
    const b = el('div', 'bubble' + (opts.escalation ? ' escalation' : '') + (opts.think ? ' think' : ''));
    b.textContent = text;
    msg.appendChild(b); thread.appendChild(msg); scrollEnd();
    return b;
  }
  function showTyping() {
    const msg = el('div', 'msg bot typing');
    msg.innerHTML = '<div class="avatar">' + C.BRAND.monogram + '</div><div class="bubble"><span class="d"></span><span class="d"></span><span class="d"></span></div>';
    thread.appendChild(msg); scrollEnd();
    return msg;
  }
  function sysEvent(text) { const e = el('div', 'sysevent', text); thread.appendChild(e); scrollEnd(); return e; }
  function sysCard(spec) {
    const msg = el('div', 'msg bot');
    msg.appendChild(el('div', 'avatar', C.BRAND.monogram));
    const card = el('div', 'syscard');
    card.appendChild(el('div', 'sc-h', spec.tag));
    card.appendChild(el('div', 'sc-t', spec.title));
    if (spec.desc) card.appendChild(el('div', 'sc-d', spec.desc));
    if (spec.price) { const row = el('div', 'sc-row'); row.appendChild(el('span', 'price', spec.price)); if (spec.note) row.appendChild(el('span', 'sc-note', spec.note)); card.appendChild(row); }
    if (spec.button) { const btn = el('button', 'sc-btn', spec.button.label); btn.type = 'button'; btn.addEventListener('click', () => { if (!btn.disabled) spec.button.onClick(btn); }); card.appendChild(btn); }
    msg.appendChild(card); thread.appendChild(msg); scrollEnd();
    return card;
  }
  async function botSay(text, opts) {
    opts = opts || {};
    const tp = showTyping(); await wait(opts.delay != null ? opts.delay : 720); tp.remove();
    const b = bubble('bot', text, opts);
    history.push({ role: 'assistant', content: text });
    return b;
  }
  async function botCard(spec, opts) {
    opts = opts || {};
    const tp = showTyping(); await wait(opts.delay != null ? opts.delay : 760); tp.remove();
    return sysCard(spec);
  }
  function setEngine(kind) {
    engineTag.className = 'engine' + (kind ? ' ' + kind : '');
    engineTag.textContent = kind === 'live' ? 'Live · AI concierge' : kind === 'local' ? 'Offline mode · preset answers' : '';
  }

  /* ════════════════ 意图识别（命中即走确定性主场景）════════════════ */
  function detectScenario(t) {
    const lang = /[一-鿿]/.test(t) && !/[぀-ヿ가-힯]/.test(t) ? 'zh' : 'en';
    // ④ 例外移交（涉钱/政策/安全）优先
    if (/(退款|退钱|退.{0,5}钱|退一晚|refund|投诉|complain|不满意|赔偿|compensat|damage|弄坏|cancel\s+(my\s+)?(booking|reservation)|取消预订|取消订单|dispute|乱收费|多收钱?|overcharg|wrong charge|聚会|派对|party|办活动|超员|加人|more guests|extra guest|smok|抽烟|吸烟)/i.test(t))
      return { type: 'escalate', lang };
    // ② 故障分诊
    if (/(坏了|不工作|不制热|不制冷|没热水|不出热水|没有热水|没网|断网|连不上网|打不开|broken|not working|won'?t\s+(turn on|start|heat|work)|no hot water|no wi-?fi|isn'?t working|doesn'?t work|out of order|stopped working|加热.*(坏|不热|没))/i.test(t)) {
      const device = /(wifi|网|wi-?fi)/i.test(t) ? 'wifi' : /(热水|hot water)/i.test(t) ? 'hotwater' : /(空调|aircon|a\/?c|air ?con|暖气|制冷|制热|heating|cooling)/i.test(t) ? 'aircon' : 'pool';
      return { type: 'maintenance', device, lang };
    }
    // ① 加住 / 晚退 upsell
    if (/(加住|多住|再住|多一晚|另一晚|多订一晚|续住|extra night|one more night|stay (an )?(extra|another)|extend (our|my) stay|stay longer|提前入住|early check ?-?in|晚退|延退|晚点退|late check ?-?out|later checkout)/i.test(t)) {
      const sub = /(晚退|延退|晚点退|late check|later checkout)/i.test(t) ? 'late' : 'night';
      return { type: 'upsell', sub, lang };
    }
    // ③ 情境本地管家
    if (/(下雨|雨天|带娃|带孩子|带小孩|今天.*(去哪|干嘛|玩|做什么)|what (can we|to) do|things to do|rain|raining|订位|订餐|订桌|book.*(table|dinner|restaurant|us)|reserve.*(table|restaurant)|帮.*订)/i.test(t)) {
      const sub = /(订位|订餐|订桌|book.*(table|dinner|restaurant)|reserve)/i.test(t) ? 'book' : 'todo';
      return { type: 'concierge', sub, lang };
    }
    return null;
  }

  async function playScenario(s) {
    if (s.type === 'upsell') return playUpsell(s.sub, s.lang);
    if (s.type === 'maintenance') return playMaintenance(s.device, s.lang);
    if (s.type === 'concierge') return playConcierge(s.sub, s.lang);
    if (s.type === 'escalate') return playEscalate(s.lang);
  }

  /* ① 加住 / 晚退 ——————————————————————————————— */
  async function playUpsell(sub, lang) {
    setEngine('live');
    if (sub === 'late') {
      await botSay(lang === 'zh' ? '让我看看明天的排房…' : "Let me check tomorrow's turnover…", { think: true, delay: 600 });
      botCard({
        tag: lang === 'zh' ? '🗓 排房 · GUESTY' : '🗓 SCHEDULE · GUESTY',
        title: lang === 'zh' ? '晚退至 13:00 可安排' : 'Late checkout to 1:00 PM available',
        desc: lang === 'zh' ? '超出 11:00 免费时段 2 小时 · 清洁可顺延' : '2 hrs beyond the free 11 AM window · cleaning can shift',
        price: 'A$90', note: lang === 'zh' ? '已含清洁加班' : 'incl. cleaning',
        button: {
          label: lang === 'zh' ? '确认并发送收款链接 →' : 'Confirm & send payment link →',
          onClick: (btn) => { btn.disabled = true; btn.textContent = lang === 'zh' ? '已确认 ✓' : 'Confirmed ✓'; sysEvent(lang === 'zh' ? '✅ 晚退 13:00 已确认 · 收款链接已发送 · 清洁排班自动顺延' : '✅ 1 PM checkout confirmed · payment link sent · cleaning auto-rescheduled'); }
        }
      }, { delay: 780 });
      return;
    }
    await botSay(lang === 'zh' ? '好的，让我查一下日历房态…' : 'Of course — let me check the live calendar…', { think: true, delay: 600 });
    botCard({
      tag: lang === 'zh' ? '🗓 实时房态 · GUESTY' : '🗓 LIVE AVAILABILITY · GUESTY',
      title: lang === 'zh' ? '周日 6/22 可订' : 'Sun 22 Jun is open',
      desc: lang === 'zh' ? '续住 1 晚 · 含清洁与税费' : '1 extra night · cleaning & taxes incl.',
      price: '+A$420', note: lang === 'zh' ? '房东直订价' : 'direct rate',
      button: {
        label: lang === 'zh' ? '发送安全收款链接 →' : 'Send secure payment link →',
        onClick: (btn) => { btn.disabled = true; btn.textContent = lang === 'zh' ? '链接已发送 ✓' : 'Link sent ✓'; sysEvent(lang === 'zh' ? '✅ 收款链接已发送 · 付款后日历自动锁房，无需您操作' : '✅ Payment link sent · the calendar locks automatically once paid'); }
      }
    }, { delay: 800 });
  }

  /* ② 故障分诊 ——————————————————————————————— */
  async function playMaintenance(device, lang) {
    setEngine('live');
    const STEP = {
      pool: { zh: '抱歉给您添麻烦了。先帮您试一步：走廊面板把 POOL 调到 28°，约 30 分钟回温。', en: 'So sorry about that. Quick first step: on the hallway panel set POOL to 28° — it should warm up in ~30 min.' },
      wifi: { zh: '抱歉！先试一下：把电视柜下的路由器断电 10 秒再插上，约 1 分钟恢复。', en: 'So sorry! Quick try: unplug the router under the TV console for 10 sec, then back in — ~1 min to recover.' },
      aircon: { zh: '抱歉！走廊控制面板长按 MODE 2 秒重置，再选 AUTO，应能恢复。', en: 'So sorry! Hold MODE for 2 sec on the hallway panel to reset, then choose AUTO.' },
      hotwater: { zh: '抱歉！热水开关在洗衣房，把绿色开关拨到 ON，等几分钟即可。', en: 'So sorry! The hot-water switch is in the laundry — flip the green switch to ON and give it a few minutes.' },
    }[device];
    await botSay(lang === 'zh' ? STEP.zh : STEP.en, { delay: 700 });
    await botSay(lang === 'zh' ? '如果还是不行，我直接帮您派师傅，不用您等。' : "If it's still not right, I'll send a technician straight away — no waiting.", { delay: 900 });
    await wait(500);
    sysEvent(lang === 'zh' ? '🔧 工单 #4821 已建 · on-call「Liam」已通知 · ETA 30 分钟' : '🔧 Ticket #4821 created · on-call "Liam" notified · ETA 30 min');
    await botSay(lang === 'zh' ? '已为您安排师傅 Liam，30 分钟内联系您。我会盯到修好。' : "I've arranged Liam to come within 30 minutes — I'll see it through to fixed.", { delay: 800 });
  }

  /* ③ 情境本地管家 ——————————————————————————————— */
  async function playConcierge(sub, lang) {
    setEngine('live');
    if (sub === 'book') {
      await botSay(lang === 'zh' ? '今晚 7 点 4 位——我推荐 Light Years（西班牙小馆，氛围好）。要我帮您订位吗？' : "For 7pm, party of 4, I'd suggest Light Years (Spanish, lovely room). Want me to book it?", { delay: 700 });
      botCard({
        tag: lang === 'zh' ? '📞 订位' : '📞 RESERVATION',
        title: lang === 'zh' ? 'Light Years · 今晚 19:00' : 'Light Years · tonight 7:00 PM',
        desc: lang === 'zh' ? '4 位 · 步行 8 分钟' : '4 guests · 8-min walk',
        button: {
          label: lang === 'zh' ? '帮我订位 →' : 'Book my table →',
          onClick: (btn) => { btn.disabled = true; btn.textContent = lang === 'zh' ? '已提交 ✓' : 'Requested ✓'; sysEvent(lang === 'zh' ? '📞 已向 Light Years 提交 19:00 / 4 位订位 · 确认后通知您' : "📞 Requested 7:00 PM / 4 at Light Years · I'll confirm shortly"); }
        }
      }, { delay: 760 });
      return;
    }
    await botSay(lang === 'zh' ? '看了下今天 Byron 的天气——午后有阵雨 🌧' : "Just checked today's Byron weather — showers this afternoon 🌧", { think: true, delay: 600 });
    await botSay(lang === 'zh'
      ? '带小朋友又怕下雨，给您三个有遮挡的：① Cape Byron 灯塔展厅 + 观鲸窗 ② Crystal Castle 水晶城堡（遮雨长廊）③ 回程到 Bayleaf Cafe 喝热可可。'
      : 'With kids and rain, three covered picks: ① Cape Byron Lighthouse exhibits + whale-watch window ② Crystal Castle (covered walkways) ③ hot cocoa at Bayleaf Cafe on the way back.', { delay: 950 });
    botCard({
      tag: lang === 'zh' ? '🎟 当地体验' : '🎟 LOCAL EXPERIENCE',
      title: lang === 'zh' ? 'Crystal Castle 家庭票' : 'Crystal Castle family pass',
      desc: lang === 'zh' ? '2 大 2 小 · 今日可入' : '2 adults + 2 kids · today',
      price: 'A$78',
      button: {
        label: lang === 'zh' ? '帮我订好 →' : 'Book it for me →',
        onClick: (btn) => { btn.disabled = true; btn.textContent = lang === 'zh' ? '已提交 ✓' : 'Requested ✓'; sysEvent(lang === 'zh' ? '🎟 家庭票预订已提交 · 确认后发到您 WhatsApp' : '🎟 Family pass requested · confirmation to your WhatsApp shortly'); }
      }
    }, { delay: 820 });
  }

  /* ④ 例外人工移交 ——————————————————————————————— */
  async function playEscalate(lang) {
    setEngine('live');
    await botSay(lang === 'zh'
      ? '这个需要房东确认，我不会擅自处理——已把您的订单和情况整理好，转交我们团队的 Mia 了。'
      : "This one needs the host's sign-off, so I won't action it myself — I've passed your booking and the details to Mia on our team.", { escalation: true, delay: 750 });
    await wait(450);
    sysEvent(lang === 'zh'
      ? '👤 已转交 Mia（房管）· 附对话摘要 + 订单 + 建议方案 · 客人已收到「团队已接手」'
      : '👤 Handed to Mia (property manager) · with chat summary + booking + suggested resolution · guest told "the team\'s on it"');
    await botSay(lang === 'zh' ? 'Mia 会尽快回复您，通常 10 分钟内。还有别的我能马上帮您的吗？' : 'Mia will reply shortly, usually within 10 minutes. Anything else I can help with right now?', { delay: 800 });
  }

  /* ════════════════ 自由对话：模型 → BYOK → 预置兜底 ════════════════ */
  async function getReply(userText) {
    history.push({ role: 'user', content: userText });
    if (proxyAvailable !== false) {
      try {
        const r = await fetch('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: history }) });
        if (r.ok) { const j = await r.json(); if (j && j.text) { proxyAvailable = true; setEngine('live'); return commit(j.text); } }
        else { proxyAvailable = false; }
      } catch (_) { proxyAvailable = false; }
    }
    const key = getKey();
    if (key) {
      try {
        const r = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true', 'content-type': 'application/json' },
          body: JSON.stringify({ model: C.MODEL, max_tokens: 1000, system: C.SYSTEM_PROMPT, messages: history }),
        });
        if (r.ok) { const data = await r.json(); const text = (data.content && data.content[0] && data.content[0].text) || ''; if (text) { setEngine('live'); return commit(text); } }
      } catch (_) { /* fall through */ }
    }
    setEngine('local');
    const fb = localFallback(userText);
    return commit(fb.text, fb.escalation);
  }
  function commit(text, escalation) { history.push({ role: 'assistant', content: text }); return { text, escalation: !!escalation }; }

  /* ---------------- 预置兜底（基础信息按「补发」话术）---------------- */
  function detectLang(t) {
    if (/[぀-ヿ]/.test(t)) return 'ja';
    if (/[가-힯]/.test(t)) return 'ko';
    if (/[一-鿿]/.test(t)) return 'zh';
    return 'en';
  }
  const FALLBACK_DEFAULT = {
    en: 'I want to get this exactly right for you — let me confirm with the host and come back to you shortly.',
    zh: '为了给您准确的答复，我帮您向房东确认一下，稍后回复您。',
    ja: '正確にお答えするため、オーナーに確認のうえ追ってご連絡いたします。',
    ko: '정확히 안내드리기 위해 호스트에게 확인 후 다시 연락드리겠습니다.',
  };
  // 入住前已发的信息 → 当「补发」答；其余正常答
  const FAQ = [
    { k: /(wi-?fi|ワイファイ|와이파이|网络|无线|密码|パスワード|비밀번호|password)/i, en: 'Your check-in pack has the details — here\'s the WiFi again: network "SaltwaterHouse", password byronbay2026.', zh: '入住包里有，这里再发您一次：WiFi 名称 “SaltwaterHouse”，密码 byronbay2026。' },
    { k: /(check-?in|门锁|进门|smart lock|入住|チェックイン|체크인|door code|access)/i, en: 'I sent your arrival pack to your email — re-sharing: check-in from 3 PM, self check-in via smart lock, code arrives on arrival day.', zh: '入住信息已发到您邮箱，这里再说一次：下午 3 点起入住，智能门锁自助，门锁密码抵达当天发您。' },
    { k: /(check-?out|退房|チェックアウト|체크아웃|when.*(leave|check))/i, en: 'From your booking confirmation: check-out is 10 AM, free late checkout to 11 AM if available. Need it later? Just ask.', zh: '订单确认里有：退房 10:00，如有空房可免费延到 11:00。想更晚？跟我说一声即可。' },
    { k: /(bin|rubbish|trash|garbage|recycl|垃圾|回收)/i, en: 'From the house guide: general waste Tuesday, recycling (yellow lid) Wednesday — bins out the night before.', zh: '房屋指南里有：一般垃圾周二、可回收（黄盖）周三，前一晚放到门外。' },
    { k: /(pool|spa|プール|수영장|泳池|游泳|温泉)/i, en: 'The heated pool & spa are open 7am–10pm — no glass near the water, and please keep an eye on the little ones.', zh: '恒温泳池和 spa 每天 7:00–22:00 开放，泳池边请勿用玻璃器皿，小朋友需有人看护。' },
    { k: /(park|停车|车位|driveway)/i, en: 'Free parking for 2 cars in the driveway.', zh: '车道可免费停 2 辆车。' },
    { k: /(beach|海滩|沙滩|tallow|ocean|海边)/i, en: 'Tallow Beach is a lovely 5-minute walk via the private path from the house.', zh: '沿别墅私人小径步行约 5 分钟即到 Tallow 海滩。' },
    { k: /(emergency|紧急|急救|危险|救命)/i, en: 'For any emergency dial 000 (Australia). For anything else, message me here and I\'ll reach the host.', zh: '紧急情况请拨 000（澳洲急救）。其它事在这里留言，我帮您联系房东。' },
  ];
  function localFallback(text) {
    const lang = detectLang(text);
    const pick = (o) => o[lang] || o.en;
    const hits = FAQ.filter((f) => f.k.test(text)).map(pick);
    if (hits.length) return { text: hits.join(' '), escalation: false };
    return { text: pick(FALLBACK_DEFAULT), escalation: false };
  }

  /* ---------------- 发送流程 ---------------- */
  async function send(text) {
    text = (text || '').trim();
    if (!text || busy) return;
    busy = true; sendBtn.disabled = true; input.value = '';
    bubble('user', text);
    const scenario = detectScenario(text);
    try {
      if (scenario) { history.push({ role: 'user', content: text }); await playScenario(scenario); }
      else { const tp = showTyping(); const reply = await getReply(text); tp.remove(); bubble('bot', reply.text, { escalation: reply.escalation }); }
    } catch (e) {
      const fb = localFallback(text); setEngine('local'); bubble('bot', fb.text, { escalation: fb.escalation });
    } finally { busy = false; sendBtn.disabled = false; input.focus(); }
  }

  /* ---------------- 快捷提问：直达四个主场景 ---------------- */
  const CHIPS = [
    { label: '多住一晚 · Extra night', q: '我们想周日再住一晚，可以吗？' },
    { label: '泳池加热坏了 · Heater', q: '泳池加热好像坏了' },
    { label: '下雨带娃去哪 · Rainy day', q: '下雨天带小孩今天能去哪？' },
    { label: '退我一晚钱 · Refund', q: '能退我一晚的钱吗？' },
  ];
  const chipsBox = $('#chips');
  CHIPS.forEach((c) => { const b = el('button', 'chip', c.label); b.type = 'button'; b.addEventListener('click', () => send(c.q)); chipsBox.appendChild(b); });

  /* ---------------- BYOK 面板 ---------------- */
  function getKey() { try { return localStorage.getItem(KEY_LS) || ''; } catch (_) { return ''; } }
  function setKey(v) { try { v ? localStorage.setItem(KEY_LS, v) : localStorage.removeItem(KEY_LS); } catch (_) {} }
  let keyPanel = null;
  $('#gear').addEventListener('click', () => {
    if (keyPanel) { keyPanel.remove(); keyPanel = null; return; }
    keyPanel = el('div', 'keypanel');
    keyPanel.innerHTML = '<p>本地试用：填入你自己的 Anthropic API key（仅存本机浏览器，用于直连）。正式部署请在 Vercel 配置 ANTHROPIC_API_KEY。</p>' +
      '<div class="row"><input type="password" placeholder="sk-ant-…" id="keyInput" /><button id="keySave">保存</button>' + (getKey() ? '<button class="clear" id="keyClear">清除</button>' : '') + '</div>';
    const composer = $('#composer'); composer.parentNode.insertBefore(keyPanel, composer);
    const ki = keyPanel.querySelector('#keyInput'); ki.value = getKey(); ki.focus();
    keyPanel.querySelector('#keySave').addEventListener('click', () => { setKey(ki.value.trim()); proxyAvailable = null; keyPanel.remove(); keyPanel = null; });
    const kc = keyPanel.querySelector('#keyClear'); if (kc) kc.addEventListener('click', () => { setKey(''); keyPanel.remove(); keyPanel = null; });
  });

  /* ---------------- 启动 ---------------- */
  $('#composer').addEventListener('submit', (e) => { e.preventDefault(); send(input.value); });
  bubble('bot', C.BRAND.welcome);
  thread.appendChild(el('div', 'demo-note', '● 演示数据 · 房态 / 收款 / 工单 / 转人工 均为模拟'));
  scrollEnd();
  input.focus();
})();
