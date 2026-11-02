# 05 · 卡牌内容规范

内容质量是这个网站的核心价值。本文件规定**写什么**；**怎么生产**见 06。

## 1. 原则

- **全量，不降级**：78 张牌 × 正逆位 × 5 个问题类型，全部是完整段落。
- **原创**：参考来源仅限公共领域文献（A. E. Waite《The Pictorial Key to the Tarot》1910 年版）和通行的传统牌义共识。**不得改写、摘抄现代受版权保护的塔罗书籍或网站**。
- **每种语言原生写作**：中英文都基于同一份语言中立的“牌卡简报”（brief）各自撰写，而不是逐句互译。两种语言在事实层面（关键词含义、主题标签、逆位模式）保持一致，措辞各自自然。
- **逆位不等于负面**：逆位要体现受阻、延迟、内化、过度、不足、释放、重新审视等不同面向，并标注 `reversedMode`。
- **不宿命、不绝对**：用“可能”“倾向”“值得留意”，不用“注定”“一定会”。
- **不制造恐惧**：Death、Tower、Devil、十宝剑等牌要准确传达传统含义（结束、剧变、束缚、终结），但不渲染灾难，不预言具体事件。
- **语境要有区分度**：同一张牌在感情、事业、学业、人际、成长中的解释，必须真正针对该领域，不能只替换几个名词。

## 2. 文件与 Schema

每张牌每种语言一个 YAML 文件：`content/cards/{locale}/{slug}.yaml`。牌的身份信息（编号、花色、元素）**不在**内容文件中，以代码 `lib/tarot/deck.ts` 为唯一来源。

```yaml
id: wands-knight                 # 必须与 deck.ts 一致
name: 权杖骑士
aliases: [权杖武士]              # 可选，用于搜索
description: >                   # 牌面描述：画面里有什么（120–220 字 / 80–150 words）
symbols:                         # 4–6 条，每条“象征物：含义”
  - { item: 跃起的马, meaning: … }
summary: >                       # 卡牌简介：这张牌整体讲什么（80–150 字 / 60–100 words）
upright:
  keywords: [冲劲, 冒险, 热情, 出发, 魅力]   # 5–8 个
  essence: 说走就走、带着热度向前冲的勇气   # 名词短语，可嵌入句子，无句末标点；10–30 字 / 4–14 words
  meaning: >                     # 通用牌义（general 语境）：180–300 字 / 120–200 words
  contexts:                      # 每段 100–180 字 / 70–120 words
    love: >
    career: >
    study: >
    relationships: >
    growth: >
  positionHints:                 # 每条 1 句，30–70 字 / 20–45 words
    focus: …
    past: …
    present: …
    future: …                    # 必须用条件或可能性语气
    situation: …
    challenge: …
    advice: …
  advice: [ …, … ]               # 1–2 条，具体可执行
  questions: [ …, … ]            # 2 个反思问题，开放式
  themes: [effort, freedom]      # 2–4 个，来自 04 §2.5 的受控词表
reversed:
  # 结构与 upright 相同，另加：
  reversedMode: excess           # 04 §2.6 枚举之一
```

字数范围：中文按字符计，英文按词计。由 `content:check` 自动校验。

## 3. 各字段写作要点

| 字段 | 要点 |
|---|---|
| `description` | 只写画面中客观可见的内容（RWS 原画），为“象征”做铺垫 |
| `symbols` | 解释象征物的传统含义，不要编造出处 |
| `essence` | **引擎串联的核心材料**。必须能嵌入“眼下的议题围绕___”“from ___ toward ___”这类句子。英文用小写开头并带冠词或限定词（“a restless urge to prove yourself”） |
| `meaning` | 先讲核心含义，再讲可能的表现，最后讲值得留意的地方 |
| `contexts.*` | 写这个领域里**具体可能的样子**，并给出一个反思角度。不做预言（不写“你会遇到某个人”），而是写“可能表现为……” |
| `positionHints.future` | 只能写“如果延续当前方向，可能……” |
| `positionHints.challenge` | 指出阻力的形态，不指责用户 |
| `positionHints.advice` | 把这张牌当作一种可以采取的姿态或行动 |
| `advice` | 具体、可在一周内尝试的小行动；不涉及医疗、法律、投资方面的指令 |
| `questions` | 开放式问题，不能用“是 / 否”回答；不带诱导 |

## 4. 禁止项（自动检查加人工检查）

- 占位文字：TODO、TBD、Lorem、`???`、“待补充”、“略”。
- 禁用词表：`content/lint/{locale}.yaml`。例如“注定”“一定会”“必然”“诅咒”“厄运降临”“will definitely”“guaranteed”“doomed”“curse”。
- 具体的医疗、法律、投资断言（“会生病”“会离婚”“股票会涨”）。
- 不同牌之间高度雷同的段落（相似度阈值见 06 §4）。
- 照搬受版权保护的现代文本。

## 5. 引擎短语库与页面内容

- 短语库：`content/engine/{locale}/*.yaml`，键名和变体数量要求见 04 §6，同样适用本规范的语气要求和禁用词。
- 静态页面（guide / about / privacy / support / spreads）：`content/pages/{locale}/*.md`，构建时渲染为 HTML，不打进客户端 JS。
- UI 文案：`messages/{locale}.json`（next-intl）。

## 6. 双语一致性规则

- 同一张牌：`themes`、`reversedMode`、关键词的**含义**两种语言一致（翻译可以不逐字对应）。
- 同一字段：两种语言都必须存在，不允许一种语言缺失。
- 牌名：中文采用通行译名，例如权杖、圣杯、宝剑、星币，侍从（Page）、骑士、皇后、国王；大阿尔卡那用通行译名（愚者、魔术师、女祭司、皇后、皇帝、教皇、恋人、战车、力量、隐士、命运之轮、正义、倒吊人、死神、节制、恶魔、高塔、星星、月亮、太阳、审判、世界）。别名放进 `aliases`。
