/* ════════════════════════════════════════════════════════════════════════
   Cloudflare Worker — 跨 IP 累计点赞后端（替代 Vercel 函数）
   ────────────────────────────────────────────────────────────────────────
   为什么是 Cloudflare：正式站 lingchonghu.com 在 GitHub Pages（纯静态，跑不了函数），
   前端要跨域调一个「国内国外都尽量连得上」的端点。Cloudflare 国外稳、国内尽力而为。

   部署（全在 Cloudflare 仪表盘，不用装命令行）见同目录 README.md。
   绑定一个 KV namespace，变量名必须叫 LIKES（env.LIKES）。

   接口：
     OPTIONS                      → CORS 预检 204
     GET   /                      → { ok, counts:{slug:n,…}, mine:[slug,…] }
     POST  /  body {slug}         → 切换点赞，返回 { ok, slug, count, liked }

   KV 数据结构：
     c:<slug>            value=赞数；并把赞数写进该 key 的 list metadata
                         → GET 只需一次 list 就能拿全量计数，免 N+1 次 get
     m:<iphash>:<slug>   该访客已赞标记（一个 IP 一票、可取消）
   隐私：只存 sha256(salt+ip) 的前 16 位哈希，不存原始 IP。
   一致性：KV 最终一致（跨边缘最多 ~60s 同步延迟）、同 slug 并发点赞偶尔少记一次——
           对点赞计数无所谓，换来零运维 + 免费。
   ════════════════════════════════════════════════════════════════════════ */
const SALT = 'haowan-likes-v1';
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,39}$/;

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

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors() });
    if (!env.LIKES) return json({ ok: false, error: 'kv-not-bound' }, 503);

    try {
      const ih = await ipHash(request);

      if (request.method === 'GET') {
        // 全量计数：一次（或几次分页）list，从 metadata 直接拿数，免逐个 get
        const counts = {};
        let cursor;
        do {
          const r = await env.LIKES.list({ prefix: 'c:', cursor });
          for (const k of r.keys) {
            const meta = k.metadata && typeof k.metadata.n === 'number' ? k.metadata.n : null;
            counts[k.name.slice(2)] =
              meta != null ? meta : parseInt(await env.LIKES.get(k.name), 10) || 0;
          }
          cursor = r.list_complete ? null : r.cursor;
        } while (cursor);

        // 本访客赞过哪些
        const mine = [];
        const mp = 'm:' + ih + ':';
        let c2;
        do {
          const r = await env.LIKES.list({ prefix: mp, cursor: c2 });
          for (const k of r.keys) mine.push(k.name.slice(mp.length));
          c2 = r.list_complete ? null : r.cursor;
        } while (c2);

        return json({ ok: true, counts, mine });
      }

      if (request.method === 'POST') {
        let body = {};
        try { body = await request.json(); } catch (e) {}
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

      return json({ ok: false, error: 'method-not-allowed' }, 405);
    } catch (e) {
      return json({ ok: false, error: 'server-error' }, 500);
    }
  },
};
