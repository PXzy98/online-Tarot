# 04 · 解读引擎方案

## 0. 设计目标

1. **有依据**：每一句关于“牌与牌关系”的话，都对应一个可以说清楚的信号，并区分“传统技法”和“结构性观察”。
2. **不机械**：不是三段牌义拼在一起，而是按牌阵策略组织成叙事。措辞有变体，但同一次占卜每次显示的结果一致。
3. **不宿命**：“未来”“结果”一律用条件式和可能性的语气。不对牌阵打分，不用“正位多 = 好”这种逻辑。
4. **多语言**：引擎只产出结构，所有文字来自各语言的内容库和短语库。新增语言时不改引擎代码。
5. **可测试**：纯函数，给定 `(reading, locale content)` 时输出完全确定。

## 1. 总体流水线

```
ReadingRecord ──┐
                ├─► ① Resolve      取出每张牌的身份 + 当前语言的内容
CardContent ────┤
PhraseBank ─────┘
                    ② Analyze      从牌阵中提取 Signal[]（与语言无关）
                    ③ Plan         牌阵策略决定输出哪些段落、使用哪些信号、按什么顺序
                    ④ Realize      在短语库中选模板并填槽，生成当前语言的文本
                    ⑤ Guard        安全层追加提示；输出前做最终校验（无空槽、无禁用词）
                    ──► ReadingInterpretation
```

其中 ② 和 ③ 只处理 ID 和枚举，**不接触任何自然语言**；④ 是唯一产生文字的地方。

## 2. 输入数据

### 2.1 牌的身份数据（代码中，与语言无关）

```ts
type CardIdentity = {
  id: CardId; slug: string;
  arcana: 'major' | 'minor';
  number: number;                         // 大阿尔卡那 0–21；小阿尔卡那 1–14（11 Page, 12 Knight, 13 Queen, 14 King）
  suit?: 'wands' | 'cups' | 'swords' | 'pentacles';
  rank?: 'ace'|'2'|…|'10'|'page'|'knight'|'queen'|'king';
  element: Element | null;                // 见 §3.1
  goldenDawn?: { kind: 'element'|'planet'|'sign'; value: string }; // 大阿尔卡那的传统对应，供百科展示
};
type Element = 'fire' | 'water' | 'air' | 'earth';
```

### 2.2 牌的内容（每种语言一份，Schema 见 05）

对引擎来说，关键字段如下（每个正逆位各一套）：

| 字段 | 引擎用途 |
|---|---|
| `essence` | **一句话本质**，是可以填进模板的名词短语，例如“刚萌芽、尚未被检验的热情”。是串联叙事的核心材料 |
| `meaning` | 通用牌义段落（逐张解读的主体） |
| `contexts.{category}` | 五个问题类型下的完整段落，`general` 使用 `meaning` |
| `positionHints.{role}` | 这张牌出现在某类位置时的一句专属提示（见 §2.4），可选但强烈建议提供 |
| `advice` | 1–2 条可执行的建议 |
| `questions` | 2 个反思问题 |
| `themes` | 2–4 个主题标签，来自受控词表（§2.5） |
| `reversedMode` | 仅逆位：这张牌逆位时能量变化的主要方式（§2.6） |

### 2.3 牌阵定义（代码中）

```ts
type SpreadDef = {
  id: 'single' | 'past-present-future' | 'situation-challenge-advice';
  cardCount: number;
  positions: Array<{ id: string; role: PositionRole; layout: { x: number; y: number; rotate?: number } }>;
  strategy: StrategyId;     // 对应 §5 的策略实现
};
type PositionRole = 'focus' | 'past' | 'present' | 'future' | 'situation' | 'challenge' | 'advice';
```

位置的名称和含义说明属于 UI 文案，放在 `messages/{locale}.json` 中。

### 2.4 位置角色（PositionRole）

角色是**跨牌阵复用**的语义类别。将来新增牌阵时，只要复用已有角色（或新增少量角色），就能直接使用已有的 `positionHints`。例如凯尔特十字的“根基”可以映射到 `past`，“结果”可以映射到 `future`。

### 2.5 主题受控词表（约 30 个）

`beginning, ending, transition, choice, balance, conflict, communication, intuition, emotion, connection, solitude, rest, effort, discipline, ambition, power, control, freedom, abundance, scarcity, security, loss, healing, hope, illusion, truth, change, patience, learning, celebration`

- 词表在代码中是枚举，文字放在各语言的短语库中。
- 每张牌每个正逆位标注 2–4 个主题。内容校验会检查：标注是否来自词表、各牌之间的分布是否合理（没有某个标签被滥用）。

### 2.6 逆位模式（ReversedMode）

逆位**不等于负面**。每张牌的逆位标注一个主模式：

| 模式 | 含义 |
|---|---|
| `blocked` | 能量受阻，难以顺畅表达 |
| `delayed` | 时机未到，正在酝酿 |
| `internalized` | 转向内在，私下进行 |
| `excess` | 过度或失衡 |
| `deficient` | 不足或缺席 |
| `released` | 正在释放或摆脱（常常是积极的） |
| `reconsider` | 需要重新审视 |

引擎用它挑选连接句式。例如“建议”位置上的 `internalized` 逆位，会被表述为“这条建议更多指向内在调整，而不是外在行动”。

## 3. 信号分析（Analyze）

`analyze(reading): Signal[]`，与语言无关。

```ts
type Signal = {
  id: SignalId;                 // 例如 'dignity.pair'
  basis: 'traditional' | 'structural';
  scope: { positions: string[] };
  data: Record<string, string | number>;  // 例如 { a: 'fire', b: 'water', relation: 'opposing' }
  salience: number;             // 0–1，供策略排序，不是吉凶评分
};
```

### 3.1 元素归属（traditional：Golden Dawn）

- 小阿尔卡那：Wands = 火，Cups = 水，Swords = 风，Pentacles = 土。
- 大阿尔卡那：按 Golden Dawn 对应体系。
  - 元素牌：Fool = 风，Hanged Man = 水，Judgement = 火。
  - 星座牌：取所属星座的元素。Emperor（白羊）火 · Hierophant（金牛）土 · Lovers（双子）风 · Chariot（巨蟹）水 · Strength（狮子）火 · Hermit（处女）土 · Justice（天秤）风 · Death（天蝎）水 · Temperance（射手）火 · Devil（摩羯）土 · Star（水瓶）风 · Moon（双鱼）水。
  - 行星牌（Magician、High Priestess、Empress、Wheel、Tower、Sun、World）：`element = null`，不参与元素计算，只作为“大阿尔卡那”信号参与分析。
- 这一套对应关系在百科页中展示时会注明“传统对应（Golden Dawn）”。

### 3.2 信号清单

| ID | 依据 | 触发条件 | 含义（引擎层） |
|---|---|---|---|
| `dignity.pair` | traditional（元素尊贵法） | 相邻或策略指定的两张牌都有元素 | 同元素：**强化**；火–风、水–土：**友好**；火–水、风–土：**对立**；其余：**中性** |
| `element.dominant` | traditional | ≥ 2/3 的牌元素相同 | 整体议题落在该元素的领域（火：行动与意志；水：情感与关系；风：思考与沟通；土：现实与身体） |
| `major.density` | traditional | 统计大阿尔卡那数量 | 0：日常层面；有一部分：其中有更深的课题；全部：更像一段人生阶段的议题 |
| `number.repeat` | traditional（小阿尔卡那数字象征） | 两张及以上的牌数字相同（包括大阿尔卡那与小阿尔卡那同数字时，**不触发**，避免牵强） | 按数字的象征：1 种子 · 2 选择与平衡 · 3 成长与协作 · 4 稳定与结构 · 5 动荡与考验 · 6 调和 · 7 评估与坚持 · 8 推进与熟练 · 9 接近完成 · 10 完成与周期结束 |
| `court.present` | traditional | 出现宫廷牌 | 可能指具体的人，也可能是自己身上的某种面向；按阶级：Page 学习与讯息 · Knight 行动与追求 · Queen 内在掌握 · King 外在掌控 |
| `suit.repeat` | traditional | 同花色 ≥ 2 张 | 与 `element.dominant` 合并表述，不重复 |
| `theme.shared` | structural | 两张牌的主题标签有交集 | 主题呼应 |
| `orientation.position` | structural | 按位置看正逆位，结合该牌的 `reversedMode` | 例如“障碍”位置上的 `released` 逆位：阻力正在减弱 |
| `major.sequence` | structural（愚人之旅的视角） | “过去→未来”方向上有两张大阿尔卡那 | 编号递增：课题向前推进；编号递减：回到更早的课题。**只能以“可以这样看”的方式表述，优先级最低** |
| `category.fit` | structural | 牌的主题与问题类型的关联（映射表配置在代码中） | 例如 `love` 遇到 `connection` / `emotion` 主题时，可以直接呼应 |

明确**不做**的信号：正逆位计数打分、“吉凶指数”、任何数值型结论。

## 4. 输出结构

```ts
type ReadingInterpretation = {
  title: string;                       // 例如“现状 · 障碍 · 建议 — 关于事业”
  summary: Paragraph;                  // 总述
  cards: Array<{
    positionId: string; cardId: CardId; orientation: Orientation;
    keywords: string[];
    positionLine: string;              // 位置提示：positionHints 或通用位置框架
    body: string;                      // contexts[category] 或 meaning
  }>;
  connections: Paragraph[];            // 每段对应 1–2 个信号
  advice: string[];                    // 2–4 条
  reflectionQuestions: string[];       // 2–4 个
  notices: Notice[];                   // 安全提示（来自 Guard）
  meta: { engineVersion: string; locale: string; signals: SignalId[] };
};
type Paragraph = { text: string; basis: Array<{ signal: SignalId; kind: 'traditional' | 'structural' }> };
```

`basis` 用于在结果页展开“依据”，让用户清楚每句话从何而来。

## 5. 牌阵策略（Plan）

```ts
interface SpreadStrategy {
  plan(reading: ResolvedReading, signals: Signal[]): InterpretationPlan;
}
```

`InterpretationPlan` 是一份由“段落槽位 → 短语键 + 填充数据”组成的列表，不包含任何文字。

### 5.1 `single` 单张牌

- **总述**：`summary.single.{orientation}`，填入 `essence`。如果用户选择了问题类型，再接一句 `category.fit` 的呼应。
- **逐张**：位置行使用 `positionHints.focus`，正文使用 `contexts[category]`。
- **联系段**：单张牌没有牌与牌的关系，改为输出“这张牌与你的问题类型”段（`category.bridge.{category}`），加上逆位时的 `reversedMode` 说明，或大阿尔卡那 / 宫廷牌的身份说明（如果适用）。
- **建议**：牌的 `advice`，加 1 条类型通用建议（`advice.category.{category}`）。
- **反思问题**：牌的 `questions`，加 1 个类型问题。

### 5.2 `past-present-future` 过去—现在—未来

叙事主线是**一条正在延续的轨迹**，而不是三个孤立的时间点。

- **总述**：`summary.ppf`：“从 {past.essence} 走到 {present.essence}，如果维持现在的方向，可能会走向 {future.essence}。”（多种措辞变体，都必须是条件语气。）
- **联系段**（按 salience 选 2–3 段）：
  1. **过去 → 现在**：`dignity.pair(past, present)`，表述为延续、推动、张力或转折。
  2. **现在 → 未来**：`dignity.pair(present, future)` 加上 `orientation.position(future)`。如果“未来”位置是逆位，结合 `reversedMode` 表述为“这个方向还没有成形 / 需要调整”，而不是“坏结局”。
  3. 全局信号中最显著的一个：`major.density` / `element.dominant` / `number.repeat` / `theme.shared` / `major.sequence`（优先级依次递减）。
- **建议**：现在位置牌的 `advice`（“此刻能做的”）；再加一句由“现在→未来”关系生成的建议，例如“希望延续就……，不希望这样发展就……”。
- **反思问题**：一个关于过去的问题（“哪些经历仍在影响你”）、现在位置牌的 `questions[0]`、一个关于未来的问题（“你希望改变哪一部分走向”）。

### 5.3 `situation-challenge-advice` 现状—障碍—建议

核心是**障碍与建议之间的关系**，这一段必须出现，而且必须放在联系部分的第一段。

- **总述**：`summary.sca`：“眼下的议题围绕 {situation.essence}，卡住的地方在 {challenge.essence}，牌面给出的方向是 {advice.essence}。”
- **联系段**：
  1. **障碍 × 建议（必选）**：查元素关系表 `pair.{a}.{b}.challengeAdvice`，这是一个 4×4 的有序元素对表（16 组 × 每组 3 种变体 × 每种语言）。例如障碍 = 风、建议 = 土：“当思绪在原地打转时，答案可能不在想得更清楚，而在做出一个具体可触的小动作。”
     - 同元素：“建议与障碍来自同一股力量，关键在于方向和用法，而不是换一种力量。”
     - 有一方是行星大阿尔卡那（元素为 null）时，改用 `major.challengeAdvice` 或 `theme.shared` 表述。
     - 建议位置逆位时，结合其 `reversedMode` 修饰（例如 `internalized`：先在内部完成调整）。
  2. **现状 → 障碍**：元素关系加主题呼应，说明阻力从何而来（“阻力就长在现状里” vs “阻力来自外部的另一股力量”）。
  3. 全局信号中最显著的一个（同 5.2）。
- **建议**：建议位置牌的 `advice`（结合问题类型）+ 一条由“障碍×建议”元素对生成的行动建议 +（如果有宫廷牌）一句人际相关的提示。
- **反思问题**：障碍位置牌的 `questions[0]` + 建议位置牌的 `questions[0]` + 一个元素对问题（`pair.{a}.{b}.question`）。

### 5.4 新增牌阵

新牌阵 = 一份 `SpreadDef` + 复用或新写一个 `SpreadStrategy` + 新角色对应的位置文案。抽牌和信号分析代码都不用改。

## 6. 文本实现（Realize）

### 6.1 短语库格式（`content/engine/{locale}/*.yaml`）

```yaml
summary.sca:
  - "眼下的议题围绕{situation.essence}；真正卡住你的，是{challenge.essence}。牌面给出的方向是{advice.essence}。"
  - "如果把现状概括为{situation.essence}，那么阻力来自{challenge.essence}，而可以尝试的路是{advice.essence}。"
  - "……"
pair.air.earth.challengeAdvice:
  - "当{challenge.card}让思绪反复打转时，{advice.card}提醒你：答案可能不在想得更清楚，而在一个具体可触的小动作里。"
  - …
```

- 槽位语法：`{position.field}`，其中 field 可以是 `card`（本地化牌名，自动附加逆位标记）、`essence`、`position`（位置名）、`category`（问题类型名）。
- 每个键至少 3 种变体（`summary.*` 和 `pair.*` 至少 4 种）。
- **语法安全**：`essence` 在内容规范中要求是可以直接嵌入句子的名词短语（中文不带句末标点；英文带冠词、小写开头）。模板只围绕它组句，不对它做变形，从而避开各语言的语法差异。

### 6.2 变体选择

`variantIndex = hash(record.id + ':' + phraseKey) % variants.length`

同一条记录每次渲染结果相同，不同记录之间措辞自然不同。同一次解读中，同一个键不会重复使用同一个变体。

### 6.3 逐张解读的拼法

```
positionLine = card.positionHints[role] ?? phrase(`position.${role}.generic`, { card, essence })
body         = category === 'general' ? card.meaning : card.contexts[category]
```

## 7. Guard（安全与最终校验）

1. `safety.check(question, locale)` 返回 `{ level: 'none' | 'sensitive' | 'crisis', domains: ('medical'|'legal'|'financial'|'selfharm'|…)[] }`，检测逻辑和词表见 07 §4。
   - `sensitive`：在 `notices` 中加入对应领域的提示（“这类问题请以专业意见为准”）。解读照常进行。
   - `crisis`：结果页**最先**显示求助资源卡片。解读折叠在“仍然查看解读”之后。
2. 输出校验：没有未填充的 `{…}`，没有 `undefined` / 空串，长度在范围内，不含禁用词表（每种语言一份，例如“注定”“一定会”“必然发生”“will definitely”“destined to”）。校验失败时，在开发模式下抛错；在生产模式下回退到 `fallback.*` 中性句式，并记录到控制台。

## 8. 质量保障

| 层 | 手段 |
|---|---|
| 单元 | 每个信号的触发条件；元素对表 16 组完整；变体选择稳定 |
| 属性测试（fast-check） | 任意合法 reading × 任意 category × 任意 locale → 通过 Guard 校验，所有段落非空，`connections` 中第一段的信号为 `dignity.pair(challenge, advice)`（仅限 SCA） |
| 穷举 | 单张牌阵：78 × 2 × 6 × locales，全部生成并校验 |
| 黄金样例 | `tests/fixtures/readings/*.json` 约 20 份人工挑选的典型牌局（覆盖每种元素对、全大阿尔卡那、全逆位、宫廷牌、重复数字）。输出存为快照，**人工审读后**才提交；措辞变动会在快照 diff 中暴露 |
| 内容 | 短语库也走 06 的内容校验流程 |

## 9. 扩展接口

```ts
interface InterpretationProvider {
  id: string;
  interpret(record: ReadingRecord, locale: Locale): Promise<ReadingInterpretation>;
}
```

v1 只有 `ruleBasedProvider`。“复制为 AI 提示词”（`lib/share/ai-prompt.ts`）是独立的导出功能，不属于 provider。它的模板同样放在各语言的短语库中，问题只有在用户勾选后才会包含。

## 10. 示例（现状—障碍—建议 · 事业 · 中文，仅示意语气）

> 现状：宝剑三（正位）· 障碍：权杖骑士（逆位，excess）· 建议：星币四（正位）
>
> **总述**：眼下的议题围绕一次真实的失落或刺痛；真正卡住你的，是想立刻冲出去证明点什么的急躁。牌面给出的方向是先守住手里已有的东西。
>
> **障碍 × 建议**（依据：火–土，中性关系；逆位模式：过度）：权杖骑士的冲劲在这里用过了头。星币四并不是让你停下，而是请你先把资源、精力和底线清点清楚，再决定往哪里用力。
>
> **现状 → 障碍**（依据：风–火，友好关系）：失落带来的念头在为急躁添柴。阻力并不完全来自外部，有一部分来自你想尽快摆脱这种感受。

（正式文案以内容批次审核后的版本为准。）
