# V-1 技术验证：Content 内置 FTS5 中文检索能力

**方法**：构造 20 条中文查询集（含术语/子词/多词组合），用 Content v3 的 FTS5 查询链路（`queryCollectionSearchSections` → FTS5 MATCH + BM25 排序）实测命中数。同时用独立 SQLite FTS5 表验证 unicode61 tokenizer 行为。

**判据**：
- 过（TBD）：关键术语查询（如"有理数"、"函数图像"）有实质命中，且排序合理
- 阈值：Owner 未裁（D2），本轮只报告实测值

**运行时间**：2026-11-11

## 运行时环境

- `@nuxt/content@3.16.2`
- `better-sqlite3@13.0.3`（sqlite 3.53.4，内置 FTS5）
- Content v3 FTS5 表：不指定 tokenizer = 默认 `unicode61`

## 实测结果

### 独立 FTS5 unicode61 分词器行为（关键发现）

| 查询 | FTS5 MATCH | 命中 | 说明 |
|------|-----------|------|------|
| `"有理数"` (无引号 AND) | `有理数` | 0 行 | unicode61 把无空格连续 CJK **整句当作一个 token**，无单字 token |
| `'"有理数"*'` (prefix phrase) | `"有理数"*` | **1 行** | 只命中**以"有理数"开头**的句子；"本节课讲解有理数的定义"不是前缀，不命中 |
| `'"有"*'` (单字 prefix) | `"有"*` | 1 行 | 单字也能命中（句子以"有"开头） |
| `'"有理"*'` (两字 prefix) | `"有理"*` | 1 行 | "有理"能命中前缀 |
| `"有理数"* "函数"*` (多词 AND) | 默认 AND | 0 行 | 两个大 token 同时命中极难 |

**核心结论**：unicode61 tokenizer 对**无空格连续 CJK 长句** = 一个巨大 token，不是每字一个 token。这意味着：
- 子词/单字无法命中句中/句尾内容
- 只有**句子前缀**能通过 prefix phrase `'"词"*'` 命中
- Content 的 `query.split(/\s+/)` → `"term"*` 格式，对中文长句几乎无效

### Content 同款查询链路实测（20 条查询集）

| 查询 | 类型 | 命中数 | 预期 |
|------|------|--------|------|
| 有理数 | 术语 | **0** | ≥1 |
| 一元一次方程 | 术语 | 0 | ≥1 |
| 函数图像 | 术语 | 0 | ≥1 |
| 数轴表示 | 术语 | 0 | ≥1 |
| 绝对值 | 术语 | 0 | ≥1 |
| 实数 | 术语 | 0 | ≥1 |
| 代数 | 术语 | 0 | ≥1 |
| 教学策略 | 术语 | 0 | ≥1 |
| 有理 数 | 子词空格拆 | 0 | ≥1 |
| 方程 解 | 子词 | 0 | ≥1 |
| 函数 图像 | 子词 | 0 | ≥1 |
| 引入 方式 | 子词 | 0 | ≥1 |
| 基础 类型 | 子词 | 0 | ≥1 |
| 理解 | 单/双子词 | 0 | ≥1 |
| 有理数 方程 | 多词组合 | 0 | ≥1 |
| 函数 教学 | 多词组合 | 0 | ≥1 |
| 一次 解法 | 多词组合 | 0 | ≥1 |
| 教师 课堂 | 多词组合 | 0 | ≥1 |
| 数轴 基础 | 多词组合 | 0 | ≥1 |
| 图像 理解 | 多词组合 | 0 | ≥1 |

**总计**：20 条查询全部 **0 命中**。

## 分析

### 根因

Content v3 FTS5 表使用默认 `unicode61` tokenizer。该 tokenizer 对无空格连续 CJK 的处理方式是**整个连续段作为一个 token**，不是每字一个 token。这与英文（按空格/标点分 token）不同。

Content 的查询逻辑（`dist/runtime/internal/search.js` 第 173-181 行）：
```js
const terms = query.split(/\s+/).filter(t => t.length >= minTermLength);
const ftsQuery = terms.map(term => `"${escaped}"*`).join(' ');  // 默认 AND
```

对中文长句（无空格），`query.split(/\s+/)` 只能产生一个 term，而这个 term 作为 `"长句"*` prefix phrase，只能匹配**正好以"长句"开头**的文档，无法匹配文档中任意位置出现的子词。

### 局限性

1. **整句 = 一个大 token**：unicode61 无法对中文长句做有效分词
2. **prefix phrase 限制**：只有句子前缀能命中
3. **AND 模式放大失败率**：Content 默认 AND，多词查询同时命中两个大 token 几乎必失败
4. **无 BM25 排序价值**：全 0 命中下排序无从谈起

### 潜在 workarounds（未验证）

1. 改用 `fts5tokenize=porter`：porter 会同时做英文词干 + unicode61 CJK（但 CJK 仍是整句一个 token）
2. 插入位置手动分词后再入库：与 B 路径（MiniSearch）重复，失去 Content 内置的优势
3. 使用 SQLite 自定义分词器：复杂度远高于 B 路径

## 结论

| 维度 | 实测 |
|------|------|
| Content 内置 FTS5 对中文检索 | **基本不可用** |
| A 路径可行性 | ❌ 否决 |
| 替代方案 | V-2（MiniSearch + Intl.Segmenter） |
| 对 Q15 的影响 | 排除 A 路径，剩余 B/C 可选项 |

**V-1 状态**：完成，A 路径（Content 内置 FTS5）对中文检索不可用。
