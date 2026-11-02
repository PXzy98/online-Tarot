# P1 · 基础工程

**先读**：00-README（守则）、02-ARCHITECTURE、03-UX-DESIGN §2–3、08-TESTING §1–2

## 目标

建好一个可以构建、可以静态导出、带多语言骨架、可以部署的空壳站点。

## 范围

- 初始化 Next.js、TypeScript strict、Tailwind v4、shadcn/ui、motion、next-intl、zod、Vitest、fast-check、Playwright、axe。用 pnpm 锁定版本。
- `next.config`：静态导出相关配置（02 §2）。
- 路由骨架：`(root)` 语言分流页 + `[locale]` 根布局；所有页面先建空壳，标题和导航可用，内容写“正在建设中”。空壳页面带 `data-placeholder` 标记：`pnpm verify:export` 会列出警告，`VERIFY_STRICT=1`（正式发布）时直接失败。
- `i18n/config.ts`、`messages/zh.json`、`messages/en.json`；Header 中的语言切换器（保留路径和查询参数）。
- 设计 Token、字体方案、基础布局（Header、Footer 含免责声明和赞助链接、跳转到主内容链接）。
- `lib/site/site.config.ts` 骨架和各 provider 接口的类型定义（07）。
- ESLint 架构边界规则；禁止 `dangerouslySetInnerHTML`。
- `public/_headers`（CSP 等）、`wrangler.jsonc`、GitHub Actions 工作流（运行 check，在 main 分支上部署；部署用的 Secret 留空并在文档中说明）。
- `scripts/verify-export.ts` 初版。
- README：本地开发、构建、部署步骤。

## 不在范围

塔罗逻辑、内容、动画、业务页面。

## 验收

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm verify:export
pnpm e2e
```

E2E 至少覆盖：访问 `/` 后分流到 `/zh/`；语言切换后路径正确；`<html lang>` 正确；axe 无 serious 违规。

在 DECISIONS.md 中记录实际使用的版本，以及与规格不一致的地方。
