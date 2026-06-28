# 点赞后端 · Cloudflare Worker 部署（全程在浏览器仪表盘，不用装命令行）

正式站 `lingchonghu.com` 在 GitHub Pages（纯静态、跑不了后端），所以点赞计数放在这个
Cloudflare Worker 上，前端跨域调用它。Cloudflare 国外稳、国内尽力而为（免费版在大陆可能
被限速，和 GitHub Pages 主站一个量级）。

## 一次性部署（约 5 分钟）

1. 注册 / 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)。
2. 左侧 **Workers & Pages** → **Create** → **Create Worker** → 起个名（如 `haowan-likes`）→ Deploy。
3. 进这个 Worker → **Edit code**，把 `worker.js` 的全部内容粘进去 → **Deploy**。
4. 建存储：左侧 **Storage & Databases → KV** → **Create a namespace**，名字随便（如 `haowan_likes`）。
5. 回到 Worker → **Settings → Bindings**（旧版叫 Variables）→ **Add → KV namespace**：
   - **Variable name** 必须填 **`LIKES`**（代码里用 `env.LIKES`，名字错就不工作）
   - **KV namespace** 选第 4 步建的那个 → 保存。
6. 复制这个 Worker 的访问地址，形如 `https://haowan-likes.<你的子域>.workers.dev`。
7. 打开 `展示门户/assets/likes.js`，把顶部
   ```js
   var LIKES_API = '';
   ```
   改成你第 6 步的地址：
   ```js
   var LIKES_API = 'https://haowan-likes.xxx.workers.dev';
   ```
   提交并 `git push origin main`。GitHub Pages 重建后，每张卡右下角就会出现点赞，跨设备/IP 累计。

## 自检
- 浏览器直接打开 `https://haowan-likes.xxx.workers.dev/` 应返回 `{"ok":true,"counts":{...},"mine":[...]}`。
- 若返回 `{"ok":false,"error":"kv-not-bound"}`：第 5 步的绑定变量名不是 `LIKES`，改对即可。

## 可选 · 让国内更稳一点
`*.workers.dev` 域名在大陆常被墙。若想好一些：把一个子域（如 `like.lingchonghu.com`）托管到
Cloudflare，给 Worker 配一个 **Custom Domain / Route** 指到它，再把 `LIKES_API` 换成该子域。
仍不保证（免费版无中国节点），但通常比 `workers.dev` 略好。

## 免费额度
KV 免费：读 10 万次/天、写 1000 次/天、存储 1GB。每次点赞 = 1~2 次写。对个人展示站绰绰有余。
