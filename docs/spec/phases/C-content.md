# C 系列 · 内容线任务单

**先读**：00-README、04-INTERPRETATION-ENGINE §2（字段用途）、05-CONTENT-SPEC、06-CONTENT-PIPELINE

---

## C0 · 内容基建（一次）

- `lib/content/schema.ts`（zod）：卡牌、短语库、页面 frontmatter、安全词表的 Schema。
- `scripts/content-check.ts`：实现 06 §4 中的全部检查，支持 `--batch` 和 `--locale` 参数。
- `scripts/content-build.ts`：生成 06 §6 中列出的产物。
- `content/lint/{zh,en}.yaml` 禁用词表初版；`content/status.json`；`content/safety/{zh,en}.yaml` 骨架（热线信息留空待核实）。
- 风格指南 `content/STYLE.md`：中英文各给出一张牌（建议 The Star）的完整示范稿，作为后续批次的标杆。示范稿本身也要走审核流程。

验收：`pnpm content:check` 能对示范稿给出全部通过，也能对一份故意写错的样本逐条报错（这份错误样本放在测试中，不放进 content 目录）。

---

## C1–C11 · 卡牌批次（每次一个批次）

使用方式：开一个新会话，告诉它“执行 C-content.md 中的批次 C{n}”。

步骤严格遵循 06 §3：

1. 为本批次每张牌写 brief，包括与相邻牌的区分点。
2. 中文撰写。
3. 英文原生撰写。
4. `pnpm content:check --batch C{n}` 全部通过，将状态设为 `checked`。
5. 提交：`content(C{n}): … zh/en (checked)`。

**审核**：另开一个会话，告诉它“审核批次 C{n}”。审核会话按照 06 §5 的检查表逐张检查、直接修改，然后把状态设为 `reviewed` 并提交：`content(C{n}): review`。

---

## C12 · 引擎短语库（一次，可以与批次并行）

- 按照 04 §5–§7 列出所有短语键：summary.*、position.*.generic、pair.{a}.{b}.*（16 组有序元素对 × 每组 challengeAdvice / flow / question）、signal.*、category.*、advice.category.*、fallback.*、ai-prompt.*。
- 中英文各自撰写，满足最少变体数量的要求。
- 与 P4 配合审读黄金样例的输出。

---

## C13 · 页面内容（一次）

`content/pages/{zh,en}/`：guide（塔罗入门、如何提问、正逆位、如何看待解读）、spreads（三种牌阵的说明）、about（含牌面授权说明）、privacy（按 07 §1 如实撰写）、support（按 07 §5）。
