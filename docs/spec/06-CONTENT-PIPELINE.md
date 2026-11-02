# 06 · 内容生产流水线

内容线与工程线**相互独立**。内容线产出的是 `content/` 下的源文件，工程线只通过 Schema 和构建脚本消费这些文件。两条线可以由不同的会话、不同的人并行推进。

## 1. 体量估算

每张牌每种语言约 2,500–3,500 字（英文约 1,800–2,500 词）。
78 张 ≈ 每种语言 20–27 万字；两种语言，再加上短语库和页面，总计约 50 万字级别。

这个量**不能在一个会话里一次性生成**，否则后半程必然雷同、质量下降。因此分成小批次，每批都要经过校验和审核。

## 2. 阶段

```
C0  基建      Schema、校验脚本、风格指南、禁用词表、状态表           （一次）
C1–C11 批次   每批 7 张牌：brief → zh → en → 自动校验 → 审核         （11 次）
C12 短语库    引擎短语库（中英文）+ 黄金样例审读                      （一次，可以与批次并行）
C13 页面      guide / about / privacy / support / spreads（中英文）   （一次）
```

### 批次划分

| 批次 | 内容 | 张数 |
|---|---|---|
| C1 | 大阿尔卡那 0–6（Fool → Lovers） | 7 |
| C2 | 大阿尔卡那 7–13（Chariot → Death） | 7 |
| C3 | 大阿尔卡那 14–21（Temperance → World） | 8 |
| C4 | Wands Ace–7 | 7 |
| C5 | Wands 8–King | 7 |
| C6 | Cups Ace–7 | 7 |
| C7 | Cups 8–King | 7 |
| C8 | Swords Ace–7 | 7 |
| C9 | Swords 8–King | 7 |
| C10 | Pentacles Ace–7 | 7 |
| C11 | Pentacles 8–King | 7 |

先做大阿尔卡那，这样 P4 可以尽早用真实内容联调。

## 3. 单个批次的步骤

1. **Brief（语言中立）**：为每张牌写 `content/cards/_briefs/{slug}.md`，内容包括：RWS 画面要素、传统正逆位核心含义（注明来自 Waite 1910 或“通行共识”）、元素 / 数字 / 阶级、主题标签、逆位模式，以及同组其他牌的**区分点**（例如“与 Wands 2 的区别”）。区分点是防止雷同的关键。
2. **中文撰写**：依据 brief 写 `content/cards/zh/{slug}.yaml`。
3. **英文撰写**：依据 brief 原生撰写 `content/cards/en/{slug}.yaml`，不要翻译中文稿。
4. **自动校验**：运行 `pnpm content:check --batch C4`，全部通过后才能进入审核。
5. **审核**：使用 §5 的检查表。审核人可以是你本人，也可以是一个**不同于撰写会话**的“审核模式”会话。问题直接改在 YAML 中。
6. **登记状态**：更新 `content/status.json`：`{ "wands-knight": { "zh": "reviewed", "en": "reviewed", "batch": "C5", "reviewer": "…", "date": "…" } }`。
7. **提交**：一个批次一个提交，提交信息写 `content(C5): wands 8–king zh/en`。

状态流转：`draft → checked → reviewed`。只有 `checked` 能由脚本自动设置；`reviewed` 必须由人工或审核会话显式设置。

## 4. 自动校验（`pnpm content:check`）

| 检查 | 规则 |
|---|---|
| Schema | zod 校验，字段完整，枚举合法 |
| 身份对齐 | `id` / slug 与 `deck.ts` 一致，78 张一一对应 |
| 语言对齐 | 每张牌每种语言都存在；`themes`、`reversedMode` 在各语言间一致 |
| 字数 | 05 §2 中规定的范围 |
| essence 可嵌入 | 中文：无句末标点；英文：首字母小写、无句号；长度在范围内 |
| 占位文本 | TODO / TBD / Lorem / ??? / 待补充 |
| 禁用词 | `content/lint/{locale}.yaml` |
| 雷同 | 同语言下任意两张牌的同一字段计算字符 3-gram Jaccard 相似度，> 0.45 报错，> 0.35 警告；同一张牌的不同 `contexts` 之间 > 0.5 报错 |
| 逆位分布 | 统计 `reversedMode`，某一个模式占比超过 40% 时警告（防止把逆位都写成 blocked） |
| 主题分布 | 某个主题标签被超过 15 张牌使用时警告 |

输出可读的报告，退出码非 0 时 CI 失败。

## 5. 人工审核检查表（每张牌）

- [ ] 传统含义准确，没有与 RWS / Waite 明显冲突
- [ ] 与同组相邻牌有明确区分
- [ ] 逆位不是简单的“负面版正位”，`reversedMode` 合理
- [ ] 五个语境段落各有针对性，不是换词
- [ ] `future` 提示使用条件语气；整体没有宿命论或恐吓
- [ ] `essence` 放进 04 §10 的示例句中读起来通顺（中英文都要试）
- [ ] 建议具体可执行，没有专业领域的指令
- [ ] 英文读起来像原生写作，而不是翻译腔
- [ ] 没有疑似照搬现代版权文本的段落

## 6. 集成（工程侧）

- `pnpm content:build`：YAML → `public/data/{locale}/cards/{id}.json`、`public/data/{locale}/engine.json`、客户端索引 `generated/card-index.ts`。
- 构建门禁：
  - 开发时：缺失或 `draft` 状态的内容会显示明显的开发提示（仅在开发模式），方便联调。
  - **生产构建**（`CONTENT_STRICT=1`，CI 默认开启）：78 张牌 × 全部语言都必须是 `reviewed`，否则构建失败。这样从机制上保证占位内容进不了生产环境。

## 7. 新增语言

1. 在 `i18n/config.ts` 中加一项。
2. 依据**现有 brief** 写 `content/cards/{new}/`，同样走 C1–C11 批次流程。
3. 翻译 `messages/{new}.json`、短语库、页面和禁用词表。
4. 配置安全资源（07 §4）。
5. `content:check` 和语言对齐测试全部通过后上线。

## 8. 使用 AI 辅助撰写时的规则

- 每个会话只做一个批次，并且要先读完本文件、05 和该批次的 brief。
- 撰写和审核**不能在同一个会话中**完成。
- 不得声称内容“已审核”。`reviewed` 状态只能在审核步骤中设置。
- 遇到不确定的传统含义时，在 brief 中标注“存疑”并采用保守表述，不要编造出处。
