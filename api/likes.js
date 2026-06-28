/* ════════════════════════════════════════════════════════════════════════
   api/likes.js — 跨 IP 累计点赞（Vercel Serverless Function · Node 运行时）
   ────────────────────────────────────────────────────────────────────────
   存储：Upstash Redis（在 Vercel 后台 Storage → Marketplace 接入后会自动注入环境变量）。
   读取 env：KV_REST_API_URL / KV_REST_API_TOKEN（Vercel KV 命名）
            或 UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN（Upstash 原生命名）。

   数据结构（两个键）：
     Hash  "likes"        field = demo 的 slug  →  累计赞数
     Set   "lk:<iphash>"  成员 = 该访客已点赞过的 slug（用于「一个 IP 一票、可取消」+ 回填我赞过哪些）

   隐私：绝不存原始 IP，只存 sha256(salt + ip) 的前 16 位哈希。
   接口：
     GET  /api/likes              → { ok, counts:{slug:n,…}, mine:[slug,…] }
     POST /api/likes  {slug}      → 切换点赞，返回 { ok, slug, count, liked }
   未配置存储 → 503 {ok:false,error:'store-not-configured'}（前端据此优雅降级，不显示按钮）。
   ════════════════════════════════════════════════════════════════════════ */
'use strict';
const crypto = require('crypto');

const REDIS_URL =
  process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const REDIS_TOKEN =
  process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const SALT = process.env.LIKES_SALT || 'haowan-likes-v1';
// slug：小写字母/数字开头，后续可含连字符，最长 40 —— 防止往 Redis 灌垃圾键
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,39}$/;

function ipHash(req) {
  const xff = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const ip =
    xff ||
    req.headers['x-real-ip'] ||
    (req.socket && req.socket.remoteAddress) ||
    'unknown';
  return crypto.createHash('sha256').update(SALT + ip).digest('hex').slice(0, 16);
}

// Upstash REST pipeline：一次 POST 跑多条命令，返回 [{result|error}, …]
async function pipe(commands) {
  const res = await fetch(REDIS_URL.replace(/\/+$/, '') + '/pipeline', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + REDIS_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  });
  if (!res.ok) throw new Error('redis ' + res.status);
  return res.json();
}

// HGETALL 的扁平数组 ["slugA","3","slugB","5"] → {slugA:3, slugB:5}
function flatToCounts(arr) {
  const o = {};
  if (!Array.isArray(arr)) return o;
  for (let i = 0; i + 1 < arr.length; i += 2) {
    o[arr[i]] = parseInt(arr[i + 1], 10) || 0;
  }
  return o;
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch (e) { return {}; }
  }
  return await new Promise((resolve) => {
    let d = '';
    req.on('data', (c) => { d += c; if (d.length > 1e4) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(d || '{}')); } catch (e) { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  if (!REDIS_URL || !REDIS_TOKEN) {
    res.status(503).json({ ok: false, error: 'store-not-configured' });
    return;
  }

  try {
    const ih = ipHash(req);

    if (req.method === 'GET') {
      const out = await pipe([['HGETALL', 'likes'], ['SMEMBERS', 'lk:' + ih]]);
      const counts = flatToCounts(out[0] && out[0].result);
      const mine = (out[1] && out[1].result) || [];
      res.status(200).json({ ok: true, counts, mine });
      return;
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      const slug = String((body && body.slug) || '').trim();
      if (!SLUG_RE.test(slug)) {
        res.status(400).json({ ok: false, error: 'bad-slug' });
        return;
      }

      const member = await pipe([['SISMEMBER', 'lk:' + ih, slug]]);
      const alreadyLiked = !!(member[0] && member[0].result);

      const out = alreadyLiked
        ? await pipe([['SREM', 'lk:' + ih, slug], ['HINCRBY', 'likes', slug, -1]])
        : await pipe([['SADD', 'lk:' + ih, slug], ['HINCRBY', 'likes', slug, 1]]);

      let count =
        out[1] && typeof out[1].result === 'number' ? out[1].result : 0;
      if (count < 0) {
        await pipe([['HSET', 'likes', slug, '0']]);
        count = 0;
      }

      res.status(200).json({ ok: true, slug, count, liked: !alreadyLiked });
      return;
    }

    res.setHeader('Allow', 'GET, POST');
    res.status(405).json({ ok: false, error: 'method-not-allowed' });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'server-error' });
  }
};
