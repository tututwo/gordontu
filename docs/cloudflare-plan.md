# 迁到 Cloudflare，作品挂到 gordontu.com/<分类>/<slug>/live/ —— 实施计划

> **状态：四个阶段都已完成（2026-10-02）。** Voronoi Studies 和另外 7 个作品都在 gordontu.com 的 `/<分类>/<slug>/live/` 上，8 个 Worker 都接了 Workers Builds（push 到 main 就部署），旧的 vercel.app 都 308 过来；两个客户项目不搬。为什么这样搭见 ADR-0010。 计划写于 2026-09-28，"现状"一节的数据是当天查的。
>
> **路径：** 作品挂在它项目页的下一层，`/<分类>/<slug>/live/`（分类和 slug 都取自 project.js）。项目页 `/<分类>/<slug>` 是有文字的那一页，留给搜索引擎和 AI 读、引用；作品本身大多是一张 canvas，放在 `/live/`。这样每个项目只有一个名字，没有在线版的项目也有完整的网址。
> 分四个阶段做，每个阶段都可以单独验证、单独回滚。阶段四必须等阶段三完成。

## 执行记录（2026-10-02）

和下面的计划不一样的地方：

- **视频的 Range 请求**：Workers 的静态文件不支持 Range，`Range: bytes=0-1` 也回 200 和整个文件，Safari 因此不放 `<video>`。所以 `*.mp4` 先进 Worker（`wrangler.jsonc` 的 `run_worker_first`），由 `worker.js` 调 `src/lib/server/range.js` 切出 206。adapter-cloudflare 会把自己的 Worker 写到它读到的 wrangler 配置的 `main`，会盖掉 `worker.js`，所以 `svelte.config.js` 让它读一个空的 `wrangler.sveltekit.jsonc`，用默认路径 `.svelte-kit/cloudflare/_worker.js`。
- **主站用 Route，不用 Custom Domain**：Custom Domain 不能覆盖手动建的 A 记录（错误码 100117）。先删记录会留一段空档，解析器会把"没有记录"缓存 30 分钟（SOA minimum 1800）。所以用 Route `gordontu.com/*`，再把 `@` 原有的两条 A 记录原地切成代理（橙云）。记录里仍是 Vercel 的 IP，但请求到不了那里，Worker 先回应。阶段四不受影响：Route 按最具体的匹配，`gordontu.com/<分类>/<slug>/live*` 会先于 `gordontu.com/*`。
- **workers.dev 关了**：配置里有 `routes` 时 wrangler 默认关掉 workers.dev。验证直接在 gordontu.com 上做。
- **和 Vercel 对齐的设置**：HSTS（`max-age=63072000`）写在根目录的 `_headers`（adapter-cloudflare 7 要求放根目录，不是 `static/`）。最低 TLS 1.2。Browser Cache TTL 从默认 4 小时改成 Respect Existing Headers，免得盖掉页面的 `max-age=0`。
- **www**：两条 A 记录切成代理，加了 Redirect Rule（www → 根域名，301，保留路径和查询参数）。
- **Bot Fight Mode** 建 zone 时就开着，没动。它会在每页末尾插一段 JS 检测脚本（一个隐藏的 1×1 iframe），snapdom 遇到 iframe 会跳过，不影响 Peel。
- **自动部署**：Workers Builds 接上了 `tututwo/gordontu`，push 到 `main` 就构建并 `npx wrangler deploy`，和原来的 Vercel 一样。本机的 npm 11.6.2 写的 lockfile 缺顶层的 `@emnapi/runtime`、`@emnapi/core`（wrangler → sharp 的 wasm 版要用），新一点的 npm（构建镜像的 10.9.2、最新的 11.21.0）跑 `npm ci` 会直接报错；补好的 lockfile 下次被 11.6.2 `npm install` 又会改回去。所以跟 Vercel 一样用 `npm install`：Settings → Builds 里加了 Build variable `SKIP_DEPENDENCY_INSTALL=1`，Build command 是 `npm install && npm run build`。这两项只在后台，不在 repo 里。分支的预览构建关了（没开 Preview URL，建了也看不到）。别在本机直接 `wrangler deploy`：本机 `static/` 里有没进 git 的文件（比如演示视频的素材），会被一起传上去公开。
- **Vercel 的主站项目**设了 Ignored Build Step `exit 0`，push 不再构建。最后一次生产部署（8142060，和 Cloudflare 上的同一个 commit）留给还在用旧 DNS 的访客和回滚。

回滚（几秒生效）：在 Workers & Pages → gordontu → Domains & Routes 删掉 Route `gordontu.com/*`，请求会经 Cloudflare 代理回到 Vercel（SSL 模式 full，Vercel 上的域名还在）。

还没做的收尾：`*` 通配和 `_domainconnect` 两条记录还指向 Vercel（Vercel DNS 自带的，Cloudflare 导入时照搬了）。等删 Vercel 项目时一起删掉，再把 `@` 和 `www` 的 A 记录内容改成 `192.0.2.0`。

## 目标

```
gordontu.com/                        主站（这个 repo，SvelteKit）
gordontu.com/maps/erhai-moon              Erhai Moon 的项目页（主站）
gordontu.com/maps/erhai-moon/live/        erhai-diorama 仓库自己构建、自己部署
gordontu.com/maps/foldable-map/live/      foldable-map 仓库
…
```

每个子项目还是独立的 repo，独立部署。主站 repo 里不放它们的代码。

## 架构：一个域名，多个 Worker

```
                 Cloudflare 上的 gordontu.com zone
gordontu.com/… ─┬─ /maps/erhai-moon/live*    → Worker「erhai-diorama」 只有静态文件
                ├─ /maps/foldable-map/live*  → Worker「foldable-map」  只有静态文件
                └─ 其他所有路径               → Worker「gordontu」     预渲染页面 + /api/contact
```

- 主站用 **Custom Domain** 绑在 `gordontu.com` 上，Worker 本身就是源站。
- 每个子项目用 **Route** 绑在 `gordontu.com/<分类>/<slug>/live`* 上。Route 按最具体的匹配，所以 `/<分类>/<slug>/live` 的请求直接交给子项目的 Worker，主站不经手；项目页 `/<分类>/<slug>` 仍由主站回应。
- 子项目的 Worker 只有静态文件，没有脚本。Workers 的静态文件请求在免费版里也不计次数、不限量，流量也不收费。主站 Worker 只有在请求 `/api/contact` 或者 404 的时候才会运行。



### project.js 在这里的角色

主站对子项目只需要知道一件事：链接地址。所以 `src/lib/project/project.js` 只改 `projectLink`，不加字段，也不加路由表：

```diff
-		projectLink: "https://erhai-diorama.vercel.app/?zhongqiu",
+		projectLink: "https://gordontu.com/maps/erhai-moon/live/",
```

（`?zhongqiu` 现在已经不起作用了：erhai-diorama 的 origin/main 在 c082d8b 里把中秋美术设成了默认，所以改链接时顺手去掉。）

"子项目挂在哪段路径"写在子项目自己的 `wrangler.jsonc` 里，因为子项目构建的时候本来就必须知道自己的 base 路径（见阶段四）。以后每加一个子项目，主站只要改一行链接。

- 链接写完整地址类似于 `https://gordontu.com/maps/erhai-moon/live/`，不写 `/maps/erhai-moon/live/`。这样在本地 `npm run dev` 和预览部署里点开，也会去到线上的作品，而这两个环境本身都没有作品。
- 这些链接已经带了 `target="_blank" rel="external"`（见 `PostcardGallery.svelte`）。SvelteKit 的客户端路由会放行它们。预渲染爬虫看到 `rel` 里有 `external` 也会跳过（`@sveltejs/kit/src/core/postbuild/crawl.js`），所以不会去渲染 `/…/live/`。



### 为什么不用 project.js 在主站里做转发

另一种做法是在主站的 `hooks.server.js` 里读 project.js，把 `/…/live/*` 转发到各自的 `*.vercel.app`。不选它，原因有三个：

- 子项目的每一个请求都要经过主站 Worker。一个 three.js 页面要加载 JS、贴图、模型，几十个请求，很快就会用完免费版每天 10 万次的额度。
- 文件还是从 Vercel 发出去，省不下流量，而省流量正是迁移的理由。
- 多绕一跳，更慢。



## 现状（2026-09-28 核实）



### 域名和 DNS

- 注册商是 Name.com，DNS 托管在 Vercel DNS（`ns1/ns2.vercel-dns.com`）。
- 没开 DNSSEC（查不到 DS 记录），所以换 nameserver 前不用先关它。
- 主站和 gordontu.com 这个域名不在 `gordontus-projects` 团队里，而 10 个子项目都在这个团队。也就是说它们在另一个 Vercel 账号下。阶段一要去那个账号的 Domains → gordontu.com 页面，对照完整的 DNS 记录。
- 能查到的记录：


| 类型  | 名称                  | 值                                                        | 用途                           |
| --- | ------------------- | -------------------------------------------------------- | ---------------------------- |
| A   | `@`                 | `64.29.17.1`、`64.29.17.65`                               | Vercel（主站）                   |
| A   | `www`               | `64.29.17.1`、`64.29.17.65`                               | Vercel，307 跳到 `gordontu.com` |
| TXT | `resend._domainkey` | `p=MIGfMA0G…`（DKIM 公钥，很长，原样复制）                           | Resend 签名                    |
| MX  | `send`              | `feedback-smtp.us-east-1.amazonses.com`，优先级 10           | Resend 退信                    |
| TXT | `send`              | `v=spf1 include:amazonses.com ~all`                      | Resend SPF                   |
| CAA | `@`                 | `0 issue "pki.goog"`、`"sectigo.com"`、`"letsencrypt.org"` | 允许签证书的 CA                    |


根域没有 MX（域名本身不收邮件），也没有 DMARC 记录。

### 主站代码里和平台有关的地方

- `svelte.config.js` 用的是 `adapter-auto`。没有 `vercel.json`，也没有 `@vercel/*` 包。PostHog 直接连 `us.i.posthog.com`，不受影响。
- 唯一的服务端代码是 `src/routes/api/contact/+server.js`，用 `$env/dynamic/private` 读密钥，用 `fetch` 调 Resend，在 Workers 上可以直接运行。注释里有 "a Vercel function"、"Vercel's logs"、"Vercel's firewall" 这几处措辞需要改。
- 发件地址是 `contact@gordontu.com`（`src/lib/contact.js`），所以上表里 Resend 的三条记录一条都不能丢。
- `static/` 里 git 跟踪的文件最大 2.9 MB，远低于 Cloudflare 单文件 25 MiB 的上限。但本地还有两个被 gitignore 的原片：`erhai-zhongqiu-1080p.mp4`（26 MB）和 `erhai-zhongqiu-3x4.mp4`（34 MB）。Workers Builds 从 git 构建，拿不到它们，所以没问题；但如果**在本机执行** `wrangler deploy`**，会因为它们超过上限而失败**。需要从本机部署时，先把这两个原片移出 `static/`。



### 子项目

见阶段四的清单。

## 阶段一：DNS 搬到 Cloudflare（网站仍由 Vercel 提供）

这一步只换 DNS 托管，网站和邮件都不动。

1. 在 Cloudflare 选 Add a domain → `gordontu.com` → Free 计划。它会自动扫描现有的 DNS 记录。
2. 对照上表和 Vercel 里的完整列表逐条核对，缺的手动补上：
  - Resend 的三条（`resend._domainkey` TXT、`send` MX、`send` TXT）原样复制。
  - 三条 CAA 保留。它们已经允许 Let's Encrypt 和 Google Trust Services，Cloudflare 的证书就是这两家签的。
  - `@` 和 `www` 的 A 记录继续指向 Vercel，代理状态设成 **DNS only（灰云）**。这个阶段网站还在 Vercel 上，证书也由 Vercel 续期。
  - Vercel 自己用的记录（比如 `_vercel` 开头的 TXT）不用复制。
3. 提前改好几个设置。它们要等阶段三切换以后才会生效，但现在改好，免得到时候忘：
  - Security → Settings → **Email Address Obfuscation：关**。Cloudflare 默认打开它。它会把 HTML 里的 `tugordon@outlook.com` 改写成 `[email protected]`，再插一段解码脚本。这样 contact 页上的邮箱和复制按钮都会失效，Svelte hydrate 时 DOM 也会对不上。
  - SSL/TLS → Edge Certificates → **Always Use HTTPS：开**。Vercel 原来会自动把 http 跳到 https。
  - 确认 Rocket Loader 是关着的。
4. 到 Name.com 把 nameserver 换成 Cloudflare 分配的那两个。
5. 等 Cloudflare 把这个 zone 显示为 Active，一般几分钟到几小时。

验证：

```bash
dig +short NS gordontu.com
```

```bash
dig +short TXT resend._domainkey.gordontu.com
```

```bash
dig +short MX send.gordontu.com
```

```bash
curl -sI https://gordontu.com | grep -i '^server'
```

NS 应该变成 `*.ns.cloudflare.com`，Resend 的记录和原来一样，`server` 仍然是 Vercel。再从线上 contact 页发一条测试消息，确认能收到；Resend 后台里这个域名应该仍是 Verified。

回滚：在 Name.com 把 nameserver 改回 `ns1/ns2.vercel-dns.com`。Vercel 那边的记录没删，还在。

## 阶段二：主站部署到 Workers（先只在 workers.dev 上测）

这个 repo 里的改动，放在一个 commit 里：

1. 换依赖：
  ```bash
   npm uninstall @sveltejs/adapter-auto
  ```
2. `svelte.config.js`（`paths: { relative: false }` 不动）：
  ```diff
   -import adapter from '@sveltejs/adapter-auto';
   +import adapter from '@sveltejs/adapter-cloudflare';
  ```
3. 新建 `wrangler.jsonc`：
  ```jsonc
   {
   	"$schema": "./node_modules/wrangler/config-schema.json",
   	"name": "gordontu",
   	"main": ".svelte-kit/cloudflare/_worker.js",
   	"compatibility_date": "2026-09-28",
   	"compatibility_flags": ["nodejs_als"],
   	"assets": { "binding": "ASSETS", "directory": ".svelte-kit/cloudflare" },
   	// contact 路由的 console.log（honeypot 计数、Resend 报错）靠它才能在后台 Logs 里查到
   	"observability": { "enabled": true }
   }
  ```
   这里先不写 `routes`，等阶段三再加，免得第一次部署就把域名切过去。
4. `.gitignore` 里加上 `.wrangler/` 和 `.dev.vars*`。
5. 改 `src/routes/api/contact/+server.js` 里的三处注释：Vercel function 改成 Cloudflare Worker，Vercel's logs 改成 Workers Logs，Vercel's firewall 改成 Cloudflare 的 rate limiting rule。逻辑不动。

Cloudflare 后台：

1. Workers & Pages → Create application → Import a repository → `tututwo/gordontu`。Worker 名字必须和 `wrangler.jsonc` 里的 `name` 一样（`gordontu`），否则构建会失败。Build command 填 `npm run build`，Deploy command 用默认的 `npx wrangler deploy`，生产分支选 `main`。构建环境默认是 Node 24，满足 `package.json` 的要求。
2. 在 Worker → Settings → Variables and Secrets 里添加 secret `RESEND_API_KEY`，值从 Vercel 主站项目的环境变量里复制，也可以用 `npx wrangler secret put RESEND_API_KEY`。**这个 secret 不会自动从 Vercel 带过来**，漏了的话表单会返回 "The form is not set up yet."。

在 `https://gordontu.<你的子域>.workers.dev` 上逐项验证。这时 gordontu.com 还在 Vercel 上，不受影响：

- [ ] 首页、`/about`、`/projects`、`/writing`、`/contact` 都返回 200，在任意一页刷新也是 200。
- [ ] 画廊的深链接（`/maps`、`/maps/erhai-moon`、`/all/<slug>`）直接打开正常。
- [ ] 随便输一个不存在的路径，显示站内的 404 页。
- [ ] Project card 的视频在 Safari 和 iPhone 上能播放。Safari 要求服务器支持 Range 请求，下面这条命令要返回 `206`：
  ```bash
  curl -sI -H 'Range: bytes=0-1' https://gordontu.<你的子域>.workers.dev/projects-optimized/Maps/foldable-map/foldable-map-card.mp4
  ```

- [ ] `/_app/immutable/` 下的文件带 `Cache-Control: public, immutable, max-age=31536000`。如果没有，在项目根目录放一个 `_headers`：
  ```
  /_app/immutable/*
    Cache-Control: public, immutable, max-age=31536000
  ```

- [ ] 在 contact 表单真的发一封信，确认收到，后台 Logs 里也能看到这次请求。
- [ ] 页面切换的 Peel、画廊、首页的动画都和 Vercel 上一样。

回滚：不需要，线上仍是 Vercel。

## 阶段三：把 gordontu.com 切到 Worker

1. 在 Cloudflare DNS 里删掉 `@` 指向 Vercel 的两条 A 记录。
2. 紧接着在 `wrangler.jsonc` 里加上下面这段并 push（也可以在 Worker → Settings → Domains & Routes → Add → Custom Domain 里手动加）。Cloudflare 会自动创建 DNS 记录和证书。第 1 步和第 2 步之间，网站会断一两分钟。
  ```jsonc
   "routes": [{ "pattern": "gordontu.com", "custom_domain": true }]
  ```
3. 处理 `www`：把它的两条 A 记录换成一条**代理（橙云）**的 `AAAA www 100::`，然后在 Rules → Redirect Rules 用 "Redirect from WWW to root" 模板，301 跳到 `https://gordontu.com`，保留路径和查询参数。

验证：

```bash
curl -sI https://gordontu.com | grep -i '^server'
```

```bash
curl -sI https://www.gordontu.com/about | grep -iE '^HTTP|^location'
```

```bash
curl -s https://gordontu.com/contact | grep -c 'email-protection'
```

`server` 应该变成 `cloudflare`；www 返回 301，跳到 `https://gordontu.com/about`；最后一条输出 `0`，说明邮箱没有被 Cloudflare 改写。然后在正式域名上把阶段二的清单再过一遍，再发一封 contact 测试信。

回滚（几分钟内生效）：删掉 Custom Domain，把 `@` 的两条 A 记录（`64.29.17.1`、`64.29.17.65`，灰云）加回来。所以 Vercel 上的主站项目先保留一两周。

## 阶段四：作品挂到 /<分类>/<slug>/live/（一个一个来）

前提是阶段三已经完成：Route 只对橙云的主机名生效，而阶段三的 Custom Domain 已经建好了这条记录。

### 通用做法（以 Vite 项目为例，在子项目自己的 repo 里做）

1. **base 路径和输出目录**，改 `vite.config.js`：
  ```js
   export default defineConfig({
   	base: '/maps/erhai-moon/live/',
   	build: { outDir: 'dist/maps/erhai-moon/live' }
   	// …原有配置
   });
  ```
   输出目录也要多套一层，是因为 Cloudflare 按完整的请求路径去 assets 目录里找文件，Route 不会把 `/maps/erhai-moon/live` 这段前缀去掉。请求 `/maps/erhai-moon/live/assets/index-abc.js` 时，文件必须在 `dist/maps/erhai-moon/live/assets/index-abc.js`。另一种做法是写一个小 Worker 先去掉前缀再取文件，但那样每个请求都要运行脚本、都要计次数；多套一层目录不用写代码，请求也全部免费。
2. **改掉所有写死的根路径**。凡是以 `/` 开头、指向项目自己 `public/` 目录的地址，比如 `'/models/koi.glb'`、`fetch('/data.json')`、`<img src="/…">`，都改成：
  ```js
   `${import.meta.env.BASE_URL}models/koi.glb`
  ```
   也可以改用 Vite 的 import（`import url from './koi.glb?url'`）。`index.html` 里由 Vite 处理的 `<script>` 和 `<link>` 不用管。每个项目具体要改哪些，见下面的清单。
3. **新建** `wrangler.jsonc`。子项目只有静态文件，所以没有 `main`：
  ```jsonc
   {
   	"$schema": "./node_modules/wrangler/config-schema.json",
   	"name": "erhai-diorama",
   	"compatibility_date": "2026-09-28",
   	"assets": { "directory": "./dist" },
   	"routes": [{ "pattern": "gordontu.com/maps/erhai-moon/live*", "zone_name": "gordontu.com" }]
   }
  ```
  - 不带斜杠的 `/maps/erhai-moon/live` 会自动跳到带斜杠的 `/maps/erhai-moon/live/`，这是默认的 `html_handling: "auto-trailing-slash"` 做的。
  - 不要设 `not_found_handling: "single-page-application"`。它回退的是 assets 根目录下的 `/index.html`，而我们的 `index.html` 在 `<分类>/<slug>/live/` 里面。这些项目都是单页的可视化，本来也用不到它。
4. `.gitignore` 加 `.wrangler/`，然后运行 `npm i -D wrangler`。
5. 在 Cloudflare 选 Import a repository → 这个仓库。Worker 名字和 `wrangler.jsonc` 里的 `name` 一致；Build command 填 `npm run build`，Deploy command 用 `npx wrangler deploy`；生产分支按项目定（见清单）。
6. 部署完成后 Route 就生效了。因为主站还没有链接指向它，可以直接在 `https://gordontu.com/maps/erhai-moon/live/` 上测：
  - 页面、模型、贴图、视频、字体都能加载，DevTools 的 Network 面板里没有 404。
  - 不带斜杠的地址会跳到带斜杠的。
  - 查询参数照常起作用（比如 voronoi 的 `?piece=`、erhai 的 `?seed=`）。
  - 在手机上也试一次，检查陀螺仪和触摸交互。
7. **主站这边**：在 `project.js` 里改这个项目的 `projectLink`（见上文），然后 push。
8. **旧地址**：`erhai-diorama.vercel.app` 可能已经被推特、简历等地方引用。在子项目 repo 里加一个 `vercel.json`，把 Vercel 上的整份站点跳到新地址：
  ```json
   {
   	"redirects": [
   		{ "source": "/(.*)", "destination": "https://gordontu.com/maps/erhai-moon/live/$1", "permanent": true }
   	]
   }
  ```
   用 `/(.*)`，不用 `/:path*`：Vercel 的 `/:path*` 不匹配根路径 `/`（Voronoi 试点时踩到过）。接了 git 的 Vercel 项目 push 之后就会生效。之后它还会继续从同一个 repo 构建，但构建出来的内容已经不重要，所有访问都会被跳走。black-whole、voronoi-butterfly、foldable-map 这三个在 Vercel 上看起来没有接 git（没有 `-git-` 开头的分支地址），如果 push 之后没有生效，就在本机运行一次 `vercel --prod`。
   加完后用下面这条命令确认，`location` 应该是 `https://gordontu.com/maps/erhai-moon/live/?seed=1`：



### 子项目清单（2026-09-28 查的本地仓库）

10 个项目都没有 api 目录、`vercel.json`、middleware、service worker、og:image 或 canonical，也都没用路由库。所以挂到子路径下，要处理的只有下面列出的这些。表格按工作量从小到大排列。


| 项目                          | 仓库（本地路径）                                                                 | 框架                         | 路径                          | 写死的根路径                |
| --------------------------- | ------------------------------------------------------------------------ | -------------------------- | --------------------------- | --------------------- |
| Voronoi Studies             | voronoi-butterfly（`~/Code/GENERATIVE_ART/voronoi-butterfly`）             | Vite 8 + React             | `/creative-code/voronoi-studies/live/`（已上线） | 0                     |
| Black Hole                  | black-hole（`~/Code/GENERATIVE_ART/black-whole`，2026-10-02 建的私有仓库）       | Vite 8 + React             | `/creative-code/black-hole/live/` | 0                     |
| Erhai Moon                  | erhai-diorama（`~/Code/erhai-diorama`）                                    | Vite 8 + React             | `/maps/erhai-moon/live/`    | 0                     |
| Presidential Margins        | vite-three（`~/Code/React/3D-election-map`）                               | Vite 8 + React             | `/data-visualization/presidential-margins-1868-2020/live/` | 0                     |
| Foldable Map                | foldable-map（`~/My_Journey/Map/foldable-map`）                            | Vite 8 + Svelte 5          | `/maps/foldable-map/live/`  | 0                     |
| Rain Relief                 | us-rain（`~/My_Journey/Map/US-rain`，应用在 `3d/`）                            | Vite 8 + React             | `/maps/rain-relief/live/`   | 0（已经是 `base: './'`）   |
| City Atlas         | fov（`~/My_Journey/Map/fov`）                                              | Vite 8 + React + TS        | `/maps/city-atlas/live/` | 代码 3 处，另有数据文件里的 149 个 |
| Interstate Traffic（原 Traveling Particles） | traveling-particles（`~/Code/React/practices-yuri/traveling-particles`）   | Vite 5 + React             | `/maps/interstate-traffic/live/` | 1 处，另有一个文件超过大小上限      |
| YPCCC Hazard Tool（Yale）     | ypccc-hazard-tool（`~/Code/React/ypccc-hazard-tool`）                      | Vite 6 + React             | 建议不搬                        | 0                     |
| Covid Dashboard（World Bank） | covid-dashboard（`~/Code/Svelte/ContractProjects/wb-china-covid-monitor`） | SvelteKit `1.0.0-next.499` | 建议不搬                        | 7                     |


"写死的根路径"为 0 的项目，代码里已经用 `import.meta.env.BASE_URL` 拼资源地址了。它们只要做通用做法里的第 1、3、4、5 步。

各项目要额外注意的：

- **Voronoi Studies**：2026-10-02 已上线，`vercel.json` 把 voronoi-butterfly.vercel.app 整站 308 到新地址。目前是在本机 `npx wrangler deploy` 部署的，还没接 Workers Builds（见第 5 步）。当初选它做试点的原因：它在 GitHub 上，没有写死的根路径，也没有环境变量。`?piece=` 用 `history.replaceState` 只改查询参数，挂在子路径下不受影响。
- **Black Hole**：代码不用改，但这个目录不是 git 仓库，之前是用 Vercel CLI 部署的。有两个选择：先建一个 GitHub 仓库再接 Workers Builds；或者在本机 `npx wrangler deploy`，以后每次改动都手动部署。构建命令是 `tsc --noEmit && vite build`。路径用项目的 slug `black-hole`，不沿用拼错的仓库名。
- **Erhai Moon**：所有资源都用 `BASE_URL`，只需要改 base 和输出目录。生产分支用 `main`，`zhongqiu` 分支已经不需要了。本地的 `main` 比 origin/main 落后 7 个 commit，但 Workers Builds 从 GitHub 构建，不受影响。
- **Presidential Margins**：资源都用 `BASE_URL`。本地有 8 个文件的改动还没提交，另外有一个未跟踪的 `public/county-names.json`，改过的 `ElectionScene.jsx` 会用到它。Workers Builds 从 GitHub 构建，所以要先决定这些改动要不要提交，否则上线的是旧版本。
- **Foldable Map**：
  - 资源都用 `BASE_URL`。
  - `VITE_MAPBOX_TOKEN` 在构建时就写进代码，所以要放在 Workers Builds 的 **Build variables**（Settings → Build）里，而不是 Worker 运行时的 secret。
  - 如果在 Mapbox 后台给这个 token 限制过网址，要把 `https://gordontu.com` 加进去。没有 token 时地图会悄悄退回 USGS/OSM 底图，不会报错，所以上线后要亲眼确认用的是 Mapbox 样式。
  - 手机模型（`.usdc`）内部的贴图路径看不到，上线后确认贴图都加载了。
- **Rain Relief**：
  - 应用在仓库的 `3d/` 子目录里。Workers Builds 的 Root directory 填 `3d`，`wrangler.jsonc` 也放在 `3d/` 里。
  - `3d/vite.config.js` 已经是 `base: './'`，`data.js` 读 `meta.json`、`data.txt` 也用的是相对路径，所以 base 不用改，只改 `build.outDir`。相对 base 要求网址以 `/` 结尾，Cloudflare 自动补斜杠正好满足。
  - 仓库根目录的 Python 管线只在本地跑，它的产物 `data.txt` 已经提交。
- **City Atlas**：要改代码。
  - `src/CitywideScene.tsx:277-278` 写死了 `'/data/sf/manifest.json'` 和 `'/data/sf/overview.json'`。
  - `:158` 读取的瓦片地址来自 `public/data/sf/manifest.json`，里面 149 个地址都是 `/data/sf/tiles/…` 这样的根路径。这个文件由 `scripts/fetch-citywide-data.mjs:291、295` 生成，重新跑 `npm run data:refresh:citywide` 还会生成根路径。
  - 改动最小的办法是在代码里统一加前缀，数据文件和生成脚本都不动：
    ```ts
    const asset = (path: string) => import.meta.env.BASE_URL + path.replace(/^\//, '');
    // json(asset('/data/sf/manifest.json'))、json(asset('/data/sf/overview.json'))、json(asset(tile.url))
    ```
  - `public/` 共 87 MB、152 个文件，最大的 9.1 MB，都在限制之内。
- **Traveling Particles**：
  - `static/simplified_SVG.svg` 有 31.7 MiB，超过单文件 25 MiB 的上限，会直接导致部署失败。它和 `interstate.svg`（3.5 MB）、`filtered_cj_hh.svg`（3.2 MB）都没有被代码用到，只是因为放在 public 目录里才被打包进去。把这三个文件移出 `static/`，比如移到仓库里的 `source/`。
  - `src/Highways.jsx:7` 的 `fetch("/traffic.json")` 改成 `fetch(`${import.meta.env.BASE_URL}traffic.json`)`。
  - 它的 Vite 配置是 `root: 'src'`、`publicDir: '../static'`、`outDir: '../dist'`，所以输出目录要写成 `'../dist/creative-code/traveling-particles/live'`。`wrangler.jsonc` 放在仓库根目录，`assets.directory` 仍然是 `./dist`。
  - 它开了 sourcemap，`.map` 文件也会公开。介意的话可以关掉。
- **YPCCC Hazard Tool**（建议不搬）：这是客户在用的工具，Yale 那边可能已经引用了现在的链接。如果要搬，注意 `vite.config.ts:10-15`：不在 Vercel 上构建时，base 默认会变成一个 Google Cloud Storage 的地址。必须在 Build variables 里设 `VITE_ASSET_BASE_URL=/maps/ypccc-hazard-tool/live/`。
- **Covid Dashboard**（建议不搬）：
  - 用的是 SvelteKit 1.0 正式版之前的 `1.0.0-next.499` 和对应的 `adapter-auto`，这个版本的 adapter 不支持 Workers。
  - 代码里有 7 处 `/pngs/…` 根路径，还有 2 处相对路径要求网址以 `/` 结尾。
  - 要搬的话得先升级 SvelteKit，或者换成 `adapter-static` 并设 `paths.base`，工作量比其他项目大得多。
  - 本地有两个副本：`~/Code/Svelte/ContractProjects/wb-china-covid-monitor` 是当前的（`yuqi-newFlightData` 分支，和 origin/main 是同一个 commit）；`~/Code/Svelte/ContractProjects/covid-dashboard` 是旧的，不要用。



### 顺序

1. 用 **Voronoi Studies** 做试点，把整套流程走完：Route、多套一层的输出目录、project.js 的链接、旧地址跳转，全部确认没问题再往下做。
2. 接着做 Erhai Moon、Presidential Margins（先处理没提交的改动）、Black Hole（先决定建仓库还是在本机部署）。
3. 然后是 Foldable Map（Mapbox token）和 Rain Relief（Root directory 填 `3d`）。
4. 最后是 City Atlas（改 3 处代码）和 Traveling Particles（移走大文件，改 1 处代码）。
5. 两个客户项目不搬，链接保持原样。



## 收尾（全部稳定一两周以后）

- 在另一个 Vercel 账号里删掉主站项目和 gordontu.com 域名。子项目在 Vercel 上的项目保留，只负责旧地址跳转。
- 可选：在子项目的 `wrangler.jsonc` 里加 `"workers_dev": false`，关掉 `*.workers.dev` 这个重复的地址。
- 把这份计划的状态改成"已完成"。



## 需要你决定的

1. ~~每个子项目的路径名~~ 已定（2026-10-02）：`/<分类>/<slug>/live/`，分类和 slug 取自 project.js。路径一旦定下就不要再改，因为它同时写在子项目的 base、输出目录、Route 和 project.js 四个地方；改分类名或 slug 时，作品要跟着重新构建、改 Route，并给旧地址加跳转。
2. ~~两个客户项目~~ 已定（2026-10-02）：不搬，链接保持原样。
3. ~~Black Hole~~ 已定：建了私有仓库 `tututwo/black-hole`，和其他作品一样 push 就部署。
4. ~~Presidential Margins 本地没提交的改动~~ 已定：先搬现在线上的版本；Codex 的改版仍未提交，等 Gordon 自己决定何时上线（push 后会自动部署）。
5. **什么时候做**。现在不急。阶段一到三和阶段四可以分开做，但阶段四必须在阶段三之后。



## 大概要多久

- 阶段一：操作 30 分钟，然后等 DNS 生效。
- 阶段二：1–2 小时，大部分时间花在验证清单上。
- 阶段三：15 分钟。
- 阶段四：只改配置的项目每个 20–30 分钟，大部分时间花在验证上；City Atlas 和 Traveling Particles 各 1 小时左右。

