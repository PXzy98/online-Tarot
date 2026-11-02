# 静观 Still Tarot

一个永久免费、无需登录、多语言、纯静态部署的塔罗占卜网站。

- 规格总览：[docs/spec/00-README.md](docs/spec/00-README.md)
- 决策记录：[docs/spec/DECISIONS.md](docs/spec/DECISIONS.md)
- 阶段任务单：[docs/spec/phases/](docs/spec/phases/)

## 当前进度

| 阶段 | 状态 |
|---|---|
| P1 基础工程 | ✅ 完成：多语言路由、布局、设计 Token、静态导出、测试框架、CI、部署配置 |
| P2 核心引擎 | 未开始 |
| P3 占卜交互 | 未开始 |
| P4 解读引擎 | 未开始 |
| P5 内容页面 | 未开始 |
| P6 质量与部署 | 未开始 |
| C 内容线 | 未开始 |

目前除首页外，其余页面都是“正在建设中”的空壳。

## 本地开发

需要 Node.js ≥ 22.18（脚本直接用 Node 运行 TypeScript）和 pnpm 10。

```bash
pnpm install
```

```bash
pnpm dev
```

打开 http://localhost:3000/zh/ 。开发模式下根路径 `/` 也会自动跳转到合适的语言。

## 常用命令

| 命令 | 作用 |
|---|---|
| `pnpm typecheck` | TypeScript 检查 |
| `pnpm lint` | ESLint（含架构边界、禁止 `dangerouslySetInnerHTML`） |
| `pnpm test` | 单元测试（Vitest） |
| `pnpm build` | 静态导出到 `out/` |
| `pnpm verify:export` | 检查导出产物；`VERIFY_STRICT=1` 时空壳页面也算失败 |
| `pnpm serve:out` | 用模拟 Cloudflare 行为的本地服务器预览 `out/`（http://localhost:4173） |
| `pnpm e2e` | Playwright 端到端测试（需先 `pnpm build`） |
| `pnpm check` | 依次运行以上全部检查 |

首次在本机运行 E2E 前，需要安装浏览器：

```bash
pnpm exec playwright install chromium
```

## 目录

```
app/(root)/        根路径 "/" 的语言分流页（独立根布局）
app/[locale]/      各语言页面（主根布局）
app/global-not-found.tsx  双语 404
components/        UI 组件（layout / ui / …）
i18n/              语言配置（唯一来源）与 next-intl 设置
messages/          界面文案，每种语言一个 JSON，键必须完全一致
lib/               与 UI 无关的逻辑（i18n 路径、站点配置、后续的塔罗引擎）
scripts/           verify-export、serve-out 等脚本
tests/unit|e2e/    测试
public/_headers    安全头与缓存头（Cloudflare 读取）
wrangler.jsonc     Cloudflare 部署配置
```

## 部署（Cloudflare，免费计划）

产物是纯静态的 `out/` 目录，部署到 Cloudflare Workers Static Assets，除域名外不产生费用。

### 手动部署

```bash
pnpm build
```

```bash
pnpm exec wrangler login
```

```bash
pnpm exec wrangler deploy
```

### 通过 GitHub Actions 自动部署

`.github/workflows/ci.yml` 在每次推送和 PR 时运行全部检查；推送到 `main` 时，如果满足以下条件就会自动部署：

1. 在仓库 Settings → Secrets and variables → Actions 中添加 Secret：
   - `CLOUDFLARE_API_TOKEN`：Cloudflare 中创建的 API Token（模板 “Edit Cloudflare Workers”）
   - `CLOUDFLARE_ACCOUNT_ID`：Cloudflare 账户 ID
2. 添加 Variable：`DEPLOY_ENABLED` = `true`
3. 可选 Variable：`SITE_URL` = 正式网址（例如 `https://example.com`），用于 canonical 和 hreflang

### 绑定域名

在 Cloudflare 控制台中为 Worker `still-tarot` 添加自定义域名。中国大陆用户访问 `*.workers.dev` 通常不稳定，建议绑定自有域名（D-010）。

### 其他静态托管

`out/` 也可以直接部署到 Cloudflare Pages、GitHub Pages、Netlify 等。需要把 `out/404.html` 配置为 404 页面，并让托管方支持 `_headers`（或手动配置等效的响应头）。

## 站点配置

可替换的模块（牌面包、赞助、统计、安全提示）集中在 `lib/site/site.config.ts`。

- **赞助**：把支付宝收款码图片放到 `public/donate/`，并在 `donation.providers` 中填入支付宝和 Patreon 信息。未配置时，页脚和导航中不会出现赞助入口。
- **统计**：默认关闭。

## 新增语言

1. 在 `i18n/config.ts` 中添加一项。
2. 新建 `messages/{code}.json`，键与现有文件完全一致（单元测试会检查）。
3. 后续阶段还需要补充对应语言的卡牌内容、短语库和安全提示资源，见 `docs/spec/06-CONTENT-PIPELINE.md` §7。
