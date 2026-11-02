# P2 · 塔罗核心引擎

**先读**：00-README、01-PRODUCT §4、02-ARCHITECTURE §4、§6–8、04 §2.1 与 §3.1、08 §3–4

## 目标

不依赖任何 UI，完成合法抽牌、状态管理和本地存储。

## 范围

- `lib/tarot/deck.ts`：由代码生成 78 张牌的身份数据（ID、slug、arcana、number、suit、rank、element、goldenDawn）。
- `lib/tarot/random.ts`：`RandomSource`、crypto 实现、可设种子的实现、无偏 `randomInt`。
- `lib/tarot/shuffle.ts`：Fisher–Yates。
- `lib/tarot/spreads.ts`：三种牌阵（含 role 和 layout）。
- `lib/tarot/reading.ts`：`createDeckState`、状态机 reducer（02 §7 的完整事件表），以及“仅正位”选项。
- `lib/storage/*`：StorageService、信封和迁移、内存降级、各个键的读写接口、历史记录的上限与删除、导入导出（含校验）。
- `lib/tarot/daily.ts`：每日一牌逻辑（可注入 `now` 和随机源）。
- 单元测试覆盖 08 §3 的第 1–7、9–11 项；`test:stats` 统计测试。

## 不在范围

UI、内容文本、解读。

## 验收

```bash
pnpm typecheck
pnpm lint
pnpm test
```

另外提供一段 Node 脚本或测试演示：创建牌局 → 选 3 个下标 → 得到 `ReadingRecord` → 序列化后再读回，结果一致。
