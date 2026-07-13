# 点赞后端 · Cloudflare Worker 部署（自定义域名版 · 国内可用）

正式站 `lingchonghu.com` 在 GitHub Pages（纯静态、跑不了后端），点赞计数放这个 Cloudflare
Worker 上，前端跨域调用。

⚠️ **`*.workers.dev` 默认域名在中国大陆被墙**（DNS 污染 + SNI 阻断，实测北京/深圳等 5 地全失败）。
所以**必须用自定义域名**，国内才打得开。Cloudflare 的网络本身在国内可达，被墙的只是 `workers.dev`
这个共享域名（被大量代理滥用而连坐）。

本项目用的域名：**`interantai.com`**（闲置、无邮箱、零风险，专给这个 API 用），子域 **`api.interantai.com`**。
> 绝不要用 `iterant-ai.com`（跑着 Google Workspace 工作邮箱）或 `lingchonghu.com`（主站）——别动它们的 DNS。

---

## A. 把 interantai.com 接入 Cloudflare（改 nameserver）

1. 注册 / 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)。
2. **Add a domain** → 输入 `interantai.com` → 选 **Free** 计划 → Continue。
3. Cloudflare 扫描现有 DNS 记录（这域名闲置、基本没记录）→ Continue。
4. Cloudflare 给你 **两条 nameserver**，形如 `xxx.ns.cloudflare.com` / `yyy.ns.cloudflare.com`，记下来。
5. 回 **Porkbun** → `interantai.com` 那行点 **NS**（或 Details → Edit Nameservers）→ 删掉 Porkbun 默认 NS，
   填入 Cloudflare 那两条 → 保存。
6. 回 Cloudflare 点 **Check nameservers**。生效要等几分钟~几小时（Porkbun 通常很快），Active 后会发邮件。

## B. 部署 Worker

7. 左侧 **Workers & Pages** → **Create** → **Create Worker** → 命名 `haowan-likes` → Deploy。
8. 进该 Worker → **Edit code**，把 `worker.js` 全部内容粘进去 → **Deploy**。
9. 建存储：**Storage & Databases → KV** → **Create a namespace**（名字如 `haowan_likes`）。
10. Worker → **Settings → Bindings** → **Add → KV namespace**：
    - **Variable name** 必须填 **`LIKES`**（代码用 `env.LIKES`，名字错就不工作）
    - **KV namespace** 选第 9 步建的 → 保存。

## C. 给 Worker 绑自定义域名

11. Worker → **Settings → Domains & Routes**（或 Triggers → Custom Domains）→ **Add → Custom domain** →
    输入 **`api.interantai.com`** → Add。Cloudflare 会自动建好这个子域的 DNS 记录并签发 SSL（约 1-2 分钟）。

## D. 前端已接好

12. `assets/likes.js` 顶部的 `LIKES_API` 已设为 `https://api.interantai.com`（已 push）。
    所以上面 A~C 配完，GitHub Pages 上的点赞会**自动出现**，无需再改代码。
    （想换子域名就改这一行 + push。）

## 自检
- 浏览器开 `https://api.interantai.com/` 应返回 `{"ok":true,"counts":{},"mine":[]}`。
- 返回 `{"ok":false,"error":"kv-not-bound"}` → 第 10 步绑定变量名不是 `LIKES`，改对。
- 打不开 / SSL 报错 → 多半是 nameserver 还没生效（A 步），或自定义域名 SSL 还在签发，等几分钟。

## 一致性 & 额度
KV 最终一致（跨边缘最多 ~60s 同步）、同 slug 并发点赞偶尔少记一次——对点赞计数无所谓。
免费额度：读 10 万/天、写 1000/天、1GB。每次点赞/访问/留言 = 1~2 次写，现阶段绰绰有余。
免费版无中国大陆节点，国内请求绕到海外节点 → 能开、慢几百毫秒，对点赞无感。

---

## E. 升级到 v2（访问统计 + 需求留言）——已部署过 v1 的照这里做

v2 在原点赞接口之外新增三个接口（`POST /hit` 访问计数、`POST /feedback` 收留言、
`GET /admin` 自己看数据），复用同一个 KV，**不用建新存储**。前端 `assets/feedback.js`
会给全站（含所有 demo、思考页）挂访问统计 + 右下角「留下想法」留言按钮。

13. Cloudflare → Workers & Pages → `haowan-likes` → **Edit code**，
    把新版 `worker.js` 全部内容粘进去覆盖 → **Deploy**。（旧点赞数据不受影响。）
14. 设后台口令：该 Worker → **Settings → Variables and Secrets → Add**：
    - Type 选 **Secret**，Variable name 填 **`ADMIN_KEY`**，Value 自己编一串（如 20 位随机字符，
      记到密码管理器）→ Deploy。不设的话留言/统计照常收，只是 `/admin` 打不开。
15. 静态站正常重新发布（feedback.js + 各页面的一行引用已在仓库里）。

### v2 自检
- `https://api.interantai.com/admin?key=你的ADMIN_KEY` 应返回 `{"ok":true,"likes":…,"hits":…,"feedback":[…]}`。
- 返回 `admin-key-not-set` → 第 14 步没做；`forbidden` → key 打错。
- 随便开一个线上 demo，右下角应出现「💬 留下想法」；提交一条，再刷 `/admin` 应能看到。

### 平时怎么看数据
开 `tools/数据后台.html`（本地预览时走 mock，看线上就填 API 地址 + ADMIN_KEY）：
留言列表、每日每页 view/open/fb、点赞排行，一页全有。
看数节奏建议：每天扫一眼留言（有联系方式的 48h 内回），每周看一次 view→fb 的转化漏斗——
view 大 fb 小 = 卡转化（demo 里的问法/位置要调），view 本身小 = 卡流量（该去发渠道帖了）。
