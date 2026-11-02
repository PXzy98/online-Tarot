# 决策记录

格式：编号 · 决策 · 理由 · 备选 · 如何更换。新的决策追加在末尾，不修改历史条目；被取代时注明“由 D-xxx 取代”。

| # | 决策 | 理由 | 备选 / 更换方式 |
|---|---|---|---|
| D-001 | 产品名：静观 / Still Tarot | 气质安静克制，避免“Free / Web”这类功能性命名 | 名称集中在 `messages/*.json` 与 `site.config.ts` 中，更换只改这两处 |
| D-002 | Next.js App Router + 静态导出 | 你已指定；生态成熟，SSG 适合 78 个详情页 | Astro 的客户端 JS 更少；目前不更换 |
| D-003 | 部署到 Cloudflare Workers Static Assets（Pages 作为等价备选） | 免费计划下静态请求不计费，除域名外零成本 | 产物是纯静态的 `out/`，可迁移到 Pages、GitHub Pages、Netlify |
| D-004 | 多语言：URL 前缀 `/{locale}/`，根路径做客户端分流 | 静态导出不能用 middleware；URL 前缀对 SEO 最友好 | 新增语言见 02 §3.2 |
| D-005 | next-intl 只承载 UI 文案；卡牌内容用自建加载器按牌按需加载 | 避免把约 50 万字内容打进客户端包 | next-intl 在 export 模式下如果有问题，可以退回自建的类型化字典（接口不变） |
| D-006 | 牌局在“确认洗牌”时一次性确定，用户选择的是下标 | 动画与结果彻底分离，概率均等可证明 | — |
| D-007 | 每日一牌个人随机，存储在本地 | 你的选择 | 改为全站统一时，用日期作为种子调用 `seededSource` 即可，接口不变 |
| D-008 | 选牌时 78 张全部可选：移动端用横向牌带或网格视图 | 你的要求：必须全量 | — |
| D-009 | 内容全量、不降级，分 11 个批次生产，生产构建要求全部 reviewed | 你的要求；分批可以防止质量下滑 | — |
| D-010 | v1 不做中国大陆加速，只建议绑定自有域名 | 大陆加速需要 ICP 备案和境内托管，有成本 | 需要时增加一个境内对象存储加 CDN 的部署目标（产物相同） |
| D-011 | 中文不加载 Web 字体 | CJK 字体文件过大，影响成本和性能 | 将来可以引入子集化的标题字体 |
| D-012 | 解读引擎：信号分析 + 牌阵策略 + 多语言短语库 | 有依据、可测试、与语言无关 | `InterpretationProvider` 接口允许增加其他实现 |
| D-013 | 元素尊贵法与 Golden Dawn 对应作为 traditional 信号；行星大阿尔卡那元素为 null | 有明确的传统出处，不需要编造 | — |
| D-014 | 历史记录只存 ID，解读文本在渲染时重新生成 | 体积小，可以切换语言 | 如果需要固定文本，可以在记录中增加 `snapshot` 字段（schemaVersion 加 1 并迁移） |
| D-015 | 牌面：默认 `rws-1909`（公共领域扫描），备用 `still-minimal`（原创 SVG） | 合规优先，并且可以随时替换 | 07 §2 牌面包机制 |
| D-016 | 安全检查：本地关键词 | 不上传问题 | `SafetyProvider` 接口 |
| D-017 | 赞助：Patreon 链接 + 支付宝收款码（静态图），不接入任何 SDK | 你的要求；零成本，也不需要放宽 CSP | 07 §5，配置中增删 provider |
| D-018 | 统计默认关闭，可选 Cloudflare Web Analytics | 隐私优先 | 07 §6 |
| D-019 | v1 就提供“仅正位”开关 | 实现成本几乎为零，对新手友好 | — |
| D-020 | 不设财务类问题类型 | 降低风险面 | 安全层仍会识别财务话题并追加提示 |
| D-021 | CSP 的 `script-src` 包含 `'unsafe-inline'` | Next.js 静态导出把每页的 RSC 数据写成内联 `<script>`，内容逐页不同，无法用 nonce（需要服务器）或维护哈希列表 | 其余指令保持严格：`default-src 'self'`、`object-src 'none'`、`frame-ancestors 'none'`。用户输入一律以文本渲染（ESLint 强制），XSS 风险由此控制 |
| D-022 | P1 实际版本：Next.js 16.4.4、React 19.3.1、next-intl 4.14.9、Tailwind 4.3.3、motion 14.9.0、zod 4.6.7、Vitest 5.1.0、Playwright 1.63.0、wrangler 4.156.2 | 安装时的最新稳定版，`.npmrc` 设置 `save-exact` 锁定 | 升级时运行 `pnpm check` 全部通过后再提交 |
| D-023 | TypeScript 用 5.9.3，而不是最新的 7.x | 7.x 是 Go 重写版，typescript-eslint 和 Next.js 工具链依赖的 JS API 尚未就绪 | 工具链支持后再升级 |
| D-024 | ESLint 用 9.39.5，而不是 10.x | eslint-config-next 依赖的 react、jsx-a11y、import 插件尚未声明支持 ESLint 10 | 插件支持后再升级 |
| D-025 | @playwright/test 固定为 1.63.0 | 与开发容器预装的 Chromium 版本一致；CI 中通过 `playwright install` 安装同版本浏览器 | 升级时同步升级浏览器 |
| D-026 | 多根布局：`app/(root)` 与 `app/[locale]`；404 使用 `global-not-found.tsx`（实验特性 `experimental.globalNotFound`） | 根路径需要独立的极简布局；没有统一根布局时，Next.js 文档推荐用 global-not-found 处理全局 404 | 如果该实验特性被移除，改为在 `[locale]` 下提供 not-found，并在托管端把未知路径指向 `/zh/404` |
| D-027 | 英文标题字体 Cormorant Garamond 通过 `@fontsource` 包自托管，只加载 latin 500 | 构建时不依赖 Google Fonts 网络请求，运行时不请求第三方 | — |
| D-028 | 根路径分流用客户端脚本，不支持 JS 时显示语言链接 | 静态导出不能读取 Accept-Language；Cloudflare 免费的 `_redirects` 也不能按语言跳转 | 将来如果需要无闪烁分流，可以加一个极小的 Worker 脚本（会增加少量请求计费） |
| D-029 | 本地 E2E 使用自写的 `scripts/serve-out.ts`，模拟 Cloudflare 的尾斜杠、404 和 `_headers` | E2E 能在真实 CSP 下验证页面，不额外引入依赖 | — |
| D-030 | 免责声明只放在页脚（每页都有），首页不再重复 | 同一屏出现两次显得冗余 | 修改 `messages/*.json` 中的 `footer.disclaimer` |

## 待你拍板

- [ ] 代码与内容的开源许可证（07 §3）
- [ ] 域名
- [ ] 各语言的求助热线清单（需要人工核实）
- [ ] 支付宝收款码图片和 Patreon 账号地址
