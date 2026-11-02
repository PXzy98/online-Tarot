# P4 · 解读引擎

**先读**：00-README、04-INTERPRETATION-ENGINE（全部）、05-CONTENT-SPEC、06 §6

**前置条件**：P2 和 P3 完成；内容线 C0 完成，并且至少 C1 已到 `checked` 状态；短语库 C12 至少有中文初稿。

## 范围

- `lib/interpret/`：resolve、analyze（04 §3 的全部信号）、三个牌阵策略、realize（短语库与变体选择）、guard。
- `lib/safety/local-keywords.ts`，以及结果页中的求助卡片和领域提示。
- 运行期内容加载器（只请求抽中的牌），包括加载失败和重试状态。
- 结果页完整渲染：总述、逐张解读、联系段（展开查看“依据”）、建议、延伸问题。
- 保存历史（可勾选是否保存问题）、复制摘要（默认不含问题）。
- 测试：08 §3 第 8、12 项；黄金样例约 20 份（快照需人工审读，审读结论写进提交说明）。

## 验收

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm content:check
pnpm build
pnpm e2e
```

E2E 增加 08 §5 的第 4、11 项。

在没有全部 78 张牌内容的情况下，用已完成的批次加 `CONTENT_STRICT=0` 联调。**不得为缺失的牌生成临时文字。**
