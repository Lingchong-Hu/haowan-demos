/* ════════════════════════════════════════════════════════════════════════
   Cloudflare Worker — 点赞 + 访问统计 + 需求留言（v2）
   ────────────────────────────────────────────────────────────────────────
   为什么是 Cloudflare：正式站 lingchonghu.com 在 GitHub Pages（纯静态，跑不了函数），
   前端要跨域调一个「国内国外都尽量连得上」的端点。Cloudflare 国外稳、国内尽力而为。

   部署（全在 Cloudflare 仪表盘，不用装命令行）见同目录 README.md。
   绑定：
     · KV namespace，变量名必须叫 LIKES（env.LIKES）——v2 的统计/留言复用同一个 KV。
     · Secret 变量 ADMIN_KEY（env.ADMIN_KEY）——你自己看数据用的口令，不设则 /admin 关闭。

   接口：
     OPTIONS  *                         → CORS 预检 204
     GET   /                            → { ok, counts:{slug:n,…}, mine:[slug,…] }   （点赞，原样）
     POST  /            {slug}          → 切换点赞，返回 { ok, slug, count, liked }  （点赞，原样）
     POST  /hit         {slug, ev}      → 访问/交互计数 +1；ev ∈ view | open
     POST  /feedback    {slug, text, contact?} → 存一条留言（陌生人写的需求/想法）
     GET   /admin?key=ADMIN_KEY         → { likes, hits, feedback } 全量数据（仅自己看）

   KV 数据结构：
     c:<slug>                value=赞数；赞数同时写进 metadata → GET / 一次 list 拿全量
     m:<iphash>:<slug>       该访客已赞标记（一个 IP 一票、可取消）
     h:<日期>:<slug>:<ev>    当日该页某事件计数（日期为 UTC+8 的 YYYY-MM-DD）
                             ev：view=打开页面  open=点开留言面板  fb=提交了留言
     f:<毫秒时间戳13位>-<rand> value=留言 JSON {slug,text,contact,t,ih}；metadata {slug,t}
     fr:<日期>:<iphash>      当日该 IP 已留言条数（限 5 条/天，TTL 2 天自动清）
   隐私：只存 sha256(salt+ip) 的前 16 位哈希，不存原始 IP。
   一致性：KV 最终一致，并发计数偶尔少记一次——对访问统计无所谓，换来零运维 + 免费。
   配额注意：免费版 KV 每天 1000 次写。每个 view/like/留言 ≈ 1-2 次写，现阶段流量足够；
             哪天真爆量了再上 Durable Objects / 采样。
   ════════════════════════════════════════════════════════════════════════ */
const SALT = 'haowan-likes-v1';
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,39}$/;
const HIT_EVENTS = ['view', 'open'];
const FEEDBACK_PER_DAY = 5;      // 每 IP 每天最多留言条数
const TEXT_MAX = 1000;
const CONTACT_MAX = 120;

function cors(extra) {
  return Object.assign(
    {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
    extra || {}
  );
}
function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: cors({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }),
  });
}
async function ipHash(req) {
  const ip =
    req.headers.get('cf-connecting-ip') ||
    (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
    'unknown';
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(SALT + ip));
  return [...new Uint8Array(buf)]
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
/* 日期按 UTC+8（国内访客为主）分桶 */
function today() {
  return new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);
}
async function readBody(request) {
  // 前端用 text/plain 发 JSON（免 CORS 预检、省一次往返），所以不看 Content-Type 直接 parse
  try { return JSON.parse(await request.text()) || {}; } catch (e) { return {}; }
}
/* 计数 key +1（读-改-写，最终一致，偶尔少记可接受） */
async function bump(env, key) {
  const n = (parseInt(await env.LIKES.get(key), 10) || 0) + 1;
  await env.LIKES.put(key, String(n), { metadata: { n } });
}
/* 按前缀 list 全量 key（带分页） */
async function listAll(env, prefix) {
  const keys = [];
  let cursor;
  do {
    const r = await env.LIKES.list({ prefix, cursor });
    keys.push(...r.keys);
    cursor = r.list_complete ? null : r.cursor;
  } while (cursor);
  return keys;
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors() });
    if (!env.LIKES) return json({ ok: false, error: 'kv-not-bound' }, 503);

    const path = new URL(request.url).pathname.replace(/\/+$/, '') || '/';

    try {
      /* ─────────── 访问统计：POST /hit {slug, ev} ─────────── */
      if (path === '/hit' && request.method === 'POST') {
        const body = await readBody(request);
        const slug = String(body.slug || '').trim();
        const ev = String(body.ev || '').trim();
        if (!SLUG_RE.test(slug) || !HIT_EVENTS.includes(ev))
          return json({ ok: false, error: 'bad-input' }, 400);
        await bump(env, 'h:' + today() + ':' + slug + ':' + ev);
        return json({ ok: true });
      }

      /* ─────────── 需求留言：POST /feedback {slug, text, contact?} ─────────── */
      if (path === '/feedback' && request.method === 'POST') {
        const body = await readBody(request);
        const slug = String(body.slug || '').trim();
        const text = String(body.text || '').trim().slice(0, TEXT_MAX);
        const contact = String(body.contact || '').trim().slice(0, CONTACT_MAX);
        if (!SLUG_RE.test(slug)) return json({ ok: false, error: 'bad-slug' }, 400);
        if (text.length < 2) return json({ ok: false, error: 'text-too-short' }, 400);

        const ih = await ipHash(request);
        const d = today();
        const frKey = 'fr:' + d + ':' + ih;
        const used = parseInt(await env.LIKES.get(frKey), 10) || 0;
        if (used >= FEEDBACK_PER_DAY) return json({ ok: false, error: 'rate-limited' }, 429);
        await env.LIKES.put(frKey, String(used + 1), { expirationTtl: 172800 });

        const t = Date.now();
        const key = 'f:' + String(t).padStart(13, '0') + '-' + Math.floor(Math.random() * 1e4);
        await env.LIKES.put(key, JSON.stringify({ slug, text, contact, t, ih }), {
          metadata: { slug, t },
        });
        await bump(env, 'h:' + d + ':' + slug + ':fb');
        return json({ ok: true });
      }

      /* ─────────── 后台读数：GET /admin?key=ADMIN_KEY ─────────── */
      if (path === '/admin' && request.method === 'GET') {
        if (!env.ADMIN_KEY) return json({ ok: false, error: 'admin-key-not-set' }, 503);
        const key = new URL(request.url).searchParams.get('key') || '';
        if (key !== env.ADMIN_KEY) return json({ ok: false, error: 'forbidden' }, 403);

        // 点赞总数
        const likes = {};
        for (const k of await listAll(env, 'c:')) {
          likes[k.name.slice(2)] =
            k.metadata && typeof k.metadata.n === 'number'
              ? k.metadata.n
              : parseInt(await env.LIKES.get(k.name), 10) || 0;
        }

        // 访问统计：{ '2026-07-13': { probe: { view: 12, open: 3, fb: 1 } } }
        const hits = {};
        for (const k of await listAll(env, 'h:')) {
          const [, d, slug, ev] = k.name.split(':');
          const n =
            k.metadata && typeof k.metadata.n === 'number'
              ? k.metadata.n
              : parseInt(await env.LIKES.get(k.name), 10) || 0;
          ((hits[d] = hits[d] || {})[slug] = hits[d][slug] || {})[ev] = n;
        }

        // 留言：key 按时间戳升序，取最近 300 条（值里有正文，逐条 get，仅后台用）
        const fKeys = (await listAll(env, 'f:')).slice(-300);
        const feedback = [];
        for (const k of fKeys.reverse()) {
          try { feedback.push(JSON.parse(await env.LIKES.get(k.name))); } catch (e) {}
        }

        return json({ ok: true, likes, hits, feedback });
      }

      /* ─────────── 点赞（原有接口，路径 / ，行为不变） ─────────── */
      if (path === '/') {
        const ih = await ipHash(request);

        if (request.method === 'GET') {
          // 全量计数：一次（或几次分页）list，从 metadata 直接拿数，免逐个 get
          const counts = {};
          for (const k of await listAll(env, 'c:')) {
            const meta = k.metadata && typeof k.metadata.n === 'number' ? k.metadata.n : null;
            counts[k.name.slice(2)] =
              meta != null ? meta : parseInt(await env.LIKES.get(k.name), 10) || 0;
          }

          // 本访客赞过哪些
          const mine = [];
          const mp = 'm:' + ih + ':';
          for (const k of await listAll(env, mp)) mine.push(k.name.slice(mp.length));

          return json({ ok: true, counts, mine });
        }

        if (request.method === 'POST') {
          const body = await readBody(request);
          const slug = String((body && body.slug) || '').trim();
          if (!SLUG_RE.test(slug)) return json({ ok: false, error: 'bad-slug' }, 400);

          const mkey = 'm:' + ih + ':' + slug;
          const ckey = 'c:' + slug;
          const alreadyLiked = (await env.LIKES.get(mkey)) != null;
          let n = parseInt(await env.LIKES.get(ckey), 10) || 0;

          if (alreadyLiked) {
            n = Math.max(0, n - 1);
            await env.LIKES.delete(mkey);
          } else {
            n = n + 1;
            await env.LIKES.put(mkey, '1');
          }
          await env.LIKES.put(ckey, String(n), { metadata: { n } });

          return json({ ok: true, slug, count: n, liked: !alreadyLiked });
        }
      }

      return json({ ok: false, error: 'not-found' }, 404);
    } catch (e) {
      return json({ ok: false, error: 'server-error' }, 500);
    }
  },
};
