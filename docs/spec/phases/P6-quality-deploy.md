# P6 · 质量与部署

**先读**：00-README、02 §9–12、07（全部）、08（全部）

**前置条件**：内容线全部 `reviewed`；DECISIONS.md 中“待你拍板”的各项已经确定。

## 范围

- SEO：每页独立的 title、description、canonical；所有页面输出 hreflang（含 x-default）；OG 信息和 OG 图（78 张牌 × 各语言）；按语言输出 sitemap；robots；结果页、历史页和每日一牌页设置 noindex。
- 无障碍：axe 全量扫描，人工键盘走查，对比度复核。
- 性能：图片尺寸与懒加载、motion 按需加载、包体积分析；Lighthouse 实测并如实记录（08 §6）。
- 安全：CSP 复核（统计 provider 开关两种情况都要测）；`pnpm audit --prod`；确认生产构建中没有测试钩子。
- 版权：`docs/ASSET_LICENSES.md` 逐张核对完毕；关于页显示牌面授权说明；`LICENSE` 文件。
- 文档：README（开发、构建、部署、新增语言、新增牌阵、更换牌面包、启用统计、修改赞助）；`docs/ARCHITECTURE.md`（从规格中提炼出的实际实现说明）。
- 部署：在 CI 中配置 Cloudflare，完成首次部署，并在线上环境冒烟测试（访问根路径和两种语言、完成一次占卜、打开一个卡牌详情页）。

## 验收

```bash
pnpm check
CONTENT_STRICT=1 pnpm build
```

完成线上冒烟测试，并对照 01-PRODUCT §11 的清单逐项勾选，未完成的项目如实标注。
