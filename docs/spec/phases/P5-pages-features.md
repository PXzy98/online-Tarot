# P5 · 内容页面与附加功能

**先读**：00-README、01-PRODUCT §6–7、§10、03 §8、07 §5

## 范围

- `/cards/`：分类（大阿尔卡那与小阿尔卡那）、花色筛选、中英文名称和别名搜索（在任何语言下都可以搜英文名）、缩略图懒加载。
- `/cards/{slug}/`：SSG，展示图片、名称、类型和编号、元素与 Golden Dawn 对应（标注“传统对应”）、牌面描述、象征、正逆位、关键词、五个语境；上一张和下一张导航；返回牌库。
- `/daily/`：个人随机每日一牌、跨天检查、存储说明。
- `/history/`：列表（按时间倒序）、打开、删除、清空（需确认）、导入导出 JSON、本地存储说明。
- `/spreads/`、`/guide/`、`/about/`、`/privacy/`、`/support/`：内容来自 `content/pages/{locale}/*.md`（C13）。
- 赞助：在 `/support/`、页脚和结果页底部按 07 §5 实现（支付宝二维码图片和 Patreon 链接由你提供；在提供之前，赞助页不在导航中出现，并且生产构建检查会提示）。
- 分享：Canvas 生成分享图（默认不含问题；牌面加牌名、总述摘要、站点名）、Web Share API（不支持时退回到下载）。
- “复制为 AI 提示词”。

## 验收

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm verify:export
pnpm e2e
```

E2E 增加 08 §5 的第 5、6 项。
