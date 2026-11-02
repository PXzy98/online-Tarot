# 02 · 架构

## 1. 技术栈

| 类型 | 选择 | 备注 |
|---|---|---|
| 框架 | Next.js（App Router），`output: 'export'` | 纯静态导出 |
| 语言 | TypeScript strict | 加上 `noUncheckedIndexedAccess` |
| 样式 | Tailwind CSS v4 + shadcn/ui | 设计 Token 用 CSS 变量定义 |
| 图标 | lucide-react | 按需导入 |
| 动画 | motion（Motion for React） | 只在交互页面加载 |
| 多语言 | next-intl（静态渲染模式，不使用 middleware） | 只承载 UI 文案；卡牌内容另有加载器（§5） |
| 校验 | zod（客户端使用 `zod/mini`） | 用于存储、导入和内容 Schema |
| 内容源格式 | YAML（仅在构建时解析） | 写作友好，构建时编译成 JSON |
| 单元测试 | Vitest + fast-check | 属性测试用于引擎 |
| E2E | Playwright + @axe-core/playwright | |
| 包管理 | pnpm | |
| 部署 | Cloudflare（Workers Static Assets，或 Pages） | 见 §9 |

不使用：数据库、ORM、Redis、BaaS、认证服务、支付 SDK、独立后端、常驻容器。

> 版本：P1 时安装当时的最新稳定版并锁定。下文提到的 API 如果因版本变化而不同，以官方文档为准，并在 DECISIONS.md 中记录调整。

## 2. 静态导出约束（P1 必须逐条验证）

- `next.config`：`output: 'export'`、`trailingSlash: true`、`images: { unoptimized: true }`。
- 不能使用：middleware、依赖请求的 Route Handler、Server Actions、`cookies()` / `headers()`、ISR。
- 使用 `useSearchParams` 的组件必须包在 `<Suspense>` 中（结果页 `?id=`）。
- 动态段一律提供 `generateStaticParams`：`[locale]`、`[locale]/cards/[slug]`。
- `sitemap.ts`、`robots.ts` 作为静态元数据路由输出。OG 图优先尝试 `opengraph-image.tsx` 静态生成；如果在 export 模式下不可行，就改用构建脚本（satori + resvg）预生成 PNG。
- 404：确认 export 产物中有 `404.html`，并在托管端配置 404 回退。

## 3. 多语言架构

### 3.1 路由

```
app/
├── (root)/            # 独立根布局：只放语言分流页 "/"
│   ├── layout.tsx     # <html lang="en"> 极简布局
│   └── page.tsx       # 客户端分流 + <noscript> 语言链接 + hreflang
└── [locale]/          # 主根布局：<html lang={htmlLang(locale)}>
    ├── layout.tsx
    ├── page.tsx
    ├── reading/…  cards/…  daily/  history/  guide/  about/  privacy/  support/  spreads/
    └── not-found.tsx
```

- 使用 route group 实现两个根布局，这是 App Router 支持的写法。
- URL 段：`zh`（简体中文，`<html lang="zh-Hans">`）和 `en`。将来新增如 `zh-hant`、`ja` 时，只需在配置中加一项。
- 卡牌 slug 在各语言之间**相同**，用英文（`/zh/cards/the-fool/`），便于做语言之间的对应链接和 hreflang。

### 3.2 单一配置源

```ts
// i18n/config.ts
export const locales = [
  { code: 'zh', htmlLang: 'zh-Hans', label: '中文',    ogLocale: 'zh_CN' },
  { code: 'en', htmlLang: 'en',      label: 'English', ogLocale: 'en_US' },
] as const;
export const defaultLocale = 'zh';
```

新增语言需要的步骤：在这里加一项 + `messages/{code}.json` + `content/**/{code}/` 下的全部内容 + 安全资源配置。测试会校验各语言之间的**键完全对齐**。

### 3.3 语言切换

- Header 中的切换器把**当前路径**映射到目标语言的同一路径，并保留查询参数（结果页的 `?id=` 也会保留）。
- 选择结果写入偏好（`prefs.locale`），根路径分流时优先使用。
- **占卜数据与语言无关**：记录中只存 ID（牌、位置、牌阵、类型），文本在渲染时按当前语言生成。所以占卜进行到一半切换语言，进度不会丢失；历史记录也会以当前语言显示。

## 4. 模块划分

```
lib/
├── tarot/                # 纯 TS，禁止依赖 React / DOM
│   ├── types.ts
│   ├── deck.ts           # 78 张牌的身份数据（ID、编号、花色、元素），由代码生成，不来自内容文件
│   ├── random.ts         # RandomSource 接口、crypto 实现、可设种子的实现、无偏 randomInt
│   ├── shuffle.ts        # Fisher–Yates
│   ├── reading.ts        # 创建牌局、选牌、状态机（纯 reducer）
│   ├── spreads.ts        # 牌阵定义（数据）
│   └── validators.ts
├── interpret/            # 解读引擎（见 04），纯 TS
├── content/              # 内容 Schema（zod）、加载器（构建期 / 运行期）
├── storage/              # 版本化本地存储服务
├── safety/               # 问题文本的本地安全检查（可替换）
├── share/                # 文本摘要、分享图（Canvas）、AI 提示词导出
└── site/                 # site.config.ts：牌面包、赞助、统计、安全资源等可替换配置
components/ { layout, tarot, reading, cards, ui }
hooks/
content/                  # 内容源（见 06）
scripts/                  # content:build、content:check、images:build 等
```

依赖方向：`components → hooks → lib/*`；`lib/tarot` 和 `lib/interpret` 不依赖任何 UI。用 ESLint `no-restricted-imports` 强制执行这一点。

## 5. 卡牌内容的加载（避免客户端体积膨胀）

完整内容约为每种语言 20–25 万字符，不能全部打进客户端包。

| 数据 | 体积 | 去向 |
|---|---|---|
| 卡牌索引：ID、slug、名称（各语言）、花色、编号、关键词 | 小 | 打包进客户端（百科搜索和选牌需要） |
| 单张牌完整内容（某种语言） | 中 | 构建时输出为 `public/data/{locale}/cards/{id}.json`，结果页**只请求抽中的牌** |
| 引擎短语库（某种语言） | 小–中 | `public/data/{locale}/engine.json`，结果页按需请求 |
| 卡牌详情页 | — | SSG，内容直接写进 HTML，不经过客户端 JS |

运行期加载器 `loadCardContent(locale, id)` 带内存缓存，失败时显示可重试的错误状态。JSON 文件名带内容哈希，或通过 `_headers` 设置合理的缓存时间。

## 6. 随机与牌局模型

```ts
interface RandomSource { nextUint32(): number }
const cryptoSource: RandomSource;            // crypto.getRandomValues，按批缓冲
function seededSource(seed: string): RandomSource;   // 测试和文案变体选择用（如 sfc32）
function randomInt(src: RandomSource, maxExclusive: number): number; // 拒绝采样，无偏
function shuffle<T>(items: readonly T[], src: RandomSource): T[];    // Fisher–Yates，返回新数组
```

**牌局（DeckState）在“确认洗牌”的那一刻一次性确定**：

```ts
type DeckState = {
  order: CardId[];                 // 洗好的 78 张顺序
  orientations: Record<CardId, 'upright' | 'reversed'>; // 同时确定（仅正位模式下全为 upright）
};
```

- 用户在选牌阶段点击的是 `order` 中的**下标**。每张牌落入每个位置的概率均等，用户的选择不会引入偏差。
- 动画、渲染次数和点击速度都不参与计算。
- 不存在任何影响结果的隐藏“运势分”。

## 7. 占卜状态机

纯 reducer（不引入 XState）：

```
idle → configuring → shuffling → selecting → revealing → completed
```

| 事件 | 允许的状态 | 效果 |
|---|---|---|
| `CONFIGURE` | idle / configuring | 设置类型、问题、牌阵 |
| `START_SHUFFLE` | configuring | **生成 DeckState**（唯一一处产生随机结果的地方） |
| `SHUFFLE_DONE` / `SKIP` | shuffling | → selecting |
| `PICK(index)` | selecting | 未选过的下标才会放进下一个空位 |
| `UNPICK(position)` | selecting | 在开始翻牌前可以撤回 |
| `AUTO_PICK` | selecting | 随机补齐剩余位置（无障碍和快捷入口） |
| `REVEAL` | selecting 且位置已填满 | → revealing |
| `REVEAL_DONE` / `SKIP` | revealing | → completed，写入历史草稿 |
| `BACK` | configuring / selecting | 只能回到配置阶段；从 selecting 返回时**提示会重新洗牌** |
| `RESET` | 任意 | 用户主动开始新占卜 |

非法事件直接忽略，并在开发模式下打日志。连续快速点击由 reducer 的幂等性加上 UI 层的锁共同防护。

## 8. 本地存储

- 统一的 `StorageService`：键名前缀 `still:`，每个值包在信封里 `{ schemaVersion, data }`，读取时用 zod 校验，并按版本迁移。
- 只要遇到损坏、版本未知或卡牌 ID 非法，就回退到安全的默认值，并在需要时给出可理解的提示，绝不崩溃。
- 存储不可用（隐私模式、被禁用、超出配额）时降级为内存存储，并在界面上说明“本次不会保存”。

| 键 | 内容 | 位置 |
|---|---|---|
| `still:prefs` | locale、reducedMotion（system/on/off）、reversals、saveQuestionByDefault | localStorage |
| `still:draft` | 进行中的占卜（状态、DeckState、已选位置），刷新后恢复 | localStorage |
| `still:question` | 当前占卜的问题文本（默认不持久） | **sessionStorage** |
| `still:history` | 已完成的记录，最多 200 条，超出时删除最旧的并提示 | localStorage（将来需要时可迁移到 IndexedDB） |
| `still:daily` | `{ date: 'YYYY-MM-DD', cardId, orientation }` | localStorage |

记录结构：

```ts
type ReadingRecord = {
  id: string;            // crypto.randomUUID()
  createdAt: string;     // ISO
  spreadId: SpreadId;
  category: Category;
  draws: Draw[];
  deckPackId: string;
  engineVersion: string;
  question?: string;     // 只有用户勾选“保存问题”时才有
};
```

解读文本**不存储**，打开记录时按当前语言重新生成（以记录 id 为种子，保证结果稳定）。引擎升级后，旧记录的措辞可能会变化，这是有意的取舍：存储体积小，且可以切换语言。`engineVersion` 用于在界面上说明这一点，也便于排查问题。

## 9. 部署与成本

**目标：除域名外零运营成本。**

- 主方案：**Cloudflare Workers Static Assets**（`wrangler.jsonc`：`assets.directory = "./out"`、`not_found_handling = "404-page"`、`html_handling = "auto-trailing-slash"`）。免费计划下，纯静态资源请求不计费（以 Cloudflare 当前定价页为准）。
- 等价备选：Cloudflare Pages（免费计划）、GitHub Pages、Netlify。产物是纯 `out/` 目录，可以在这些平台之间迁移。
- 构建：GitHub Actions（公开仓库免费）运行检查 → 构建 → `wrangler deploy`；也可以直接使用 Cloudflare 的 Git 集成构建。部署需要的 API Token 只存在 CI Secret 中，不进入仓库或前端。
- 安全头：通过 `public/_headers` 下发 CSP、`X-Content-Type-Options`、`Referrer-Policy: strict-origin-when-cross-origin`、`Permissions-Policy`。CSP 默认 `default-src 'self'`，只有启用统计时才按 provider 放行对应域名（见 07 §6）。`script-src` 需要 `'unsafe-inline'`，因为 Next.js 静态导出会把每页的 RSC 数据写成内联脚本（D-021）。
- 成本项：域名约每年 ¥70–100（可选；不买域名也能使用平台的免费子域名）。

> ⚠️ **中国大陆访问**：Cloudflare 免费计划在大陆没有节点，访问可能较慢；平台默认子域名（`*.pages.dev`、`*.workers.dev`）在大陆经常无法访问。如果大陆用户是重点人群，**至少要绑定自有域名**。真正的大陆加速需要 ICP 备案和境内托管，会产生成本，不在 v1 范围内，记录在 DECISIONS.md D-010。

## 10. 图片

- 牌面包目录：`public/decks/{deckPackId}/{240|480|960}/{cardId}.webp`，外加原创 SVG 牌背。
- `scripts/images-build.ts` 用 sharp 从原始扫描图生成三种尺寸，并输出宽高信息，防止布局偏移。
- `<CardImage>` 组件输出 `<img srcset sizes width height loading decoding>`：首屏使用 `fetchpriority="high"`，其余懒加载。
- 选牌阶段只显示牌背（一张 SVG），不加载 78 张牌面。
- 牌面包的切换方式见 07 §2。

## 11. 字体

- 中文**不加载 Web 字体**，使用系统字体栈：正文用 PingFang SC / Microsoft YaHei / Noto Sans CJK；标题用 Songti SC / Noto Serif CJK。中文字体文件太大，对成本和性能都不划算。
- 拉丁字母：标题用一款衬线体（如 Cormorant Garamond），正文用系统 sans。通过 `next/font` 在构建时自托管，只取 latin 子集。
- 运行时不请求任何第三方字体。

## 12. 安全

- 用户输入只以文本节点渲染，**禁止** `dangerouslySetInnerHTML`（ESLint 规则强制）。
- 外部链接统一加 `rel="noopener noreferrer"`。
- 导入历史 JSON 时：限制大小（≤ 2 MB），用 zod 严格校验，未知字段丢弃，卡牌 ID 必须在白名单中。
- 不使用第三方脚本（统计 provider 除外，且默认关闭）。CI 中运行 `pnpm audit --prod`。
