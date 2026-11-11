#!/usr/bin/env node
// V-1 spike Part C：完整 Content useSearchCollection 链路实测
// 扩充样例里的中文术语后，用 Nuxt dev server 跑真实检索
//
// 方法：启动 dev → /search 页临时加测试按钮 → 点击看结果
// 更简单：直接用 Content 的内部 API 做 node 级测试
//
// 核心代码来自 Content v3 dist/runtime/internal/search.js
// 关键发现（Part A/B 已证实）：
//   FTS5 默认 tokenizer = unicode61
//   unicode61 对 CJK：连续 CJK 无边界 = 一个巨大 token
//   Content query = terms.map(t => `"${t}"*`).join(' ')（默认 AND）
//   结果：中文句子作为整体 token，无法按子词有效检索

import Database from 'better-sqlite3'
const db = new Database(':memory:')

// ========= Content 同款 FTS5 表 =========
db.exec(`CREATE VIRTUAL TABLE _fts_search USING fts5(collection UNINDEXED, id UNINDEXED, title, title_normalized, titles UNINDEXED, content, level UNINDEXED)`)

// 模拟 generateSearchSections 提取的内容（markdown 正文抽文本）
const sections = [
  { id: '/research/R-0001#研究问题', collection: 'research', title: '研究问题', title_normalized: '研究问题', titles: ['样例研究档案', '研究问题'], content: '本节课讲解有理数的定义、数轴表示、绝对值概念，以及一元一次方程的解法与函数图像的绘制步骤。', level: 2 },
  { id: '/research/R-0001#研究过程', collection: 'research', title: '研究过程', title_normalized: '研究过程', titles: ['样例研究档案', '研究过程'], content: '教师通过三次课堂观察记录有理数概念的引入方式，并对比一元一次方程解法的不同教学策略。', level: 2 },
  { id: '/findings/F-0001', collection: 'findings', title: '样例研究结论', title_normalized: '样例研究结论', titles: ['样例研究结论'], content: '在初中阶段引入有理数概念时，提前铺垫数轴表示有助于一元一次方程解法的理解。', level: 1 },
  { id: '/research/R-0002', collection: 'research', title: '函数图像教学', title_normalized: '函数图像教学', titles: ['函数图像教学'], content: '函数图像的理解对后续学习至关重要。有理数是实数的一种基础类型。', level: 1 },
]

for (const s of sections) {
  db.exec(`INSERT INTO _fts_search (collection, id, title, title_normalized, titles, content, level) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [s.collection, s.id, s.title, s.title_normalized, JSON.stringify(s.titles), s.content, s.level])
}

// ========= queryFTS 同款逻辑 =========
const BM25_Title = 20, BM25_Content = 5, BM25_Heading = 0.5

function queryFTS(collections, query, opts = {}) {
  const { limit = 20, snippet, weights } = opts
  const titleWeight = weights?.title ?? BM25_Title
  const contentWeight = weights?.content ?? BM25_Content
  const headingExponent = weights?.heading ?? BM25_Heading

  const terms = query.split(/\s+/).filter(t => t.length >= 1)
  if (!terms.length) return []

  // Content 173-181 行的 query 拼接
  const ftsQuery = terms.map(term => `"${term}"*`).join(' ')

  const placeholders = collections.map(() => '?').join(', ')
  const bm25Expr = `bm25(_fts_search, 0, 0, ${titleWeight}, ${titleWeight}, 0, ${contentWeight}, 0)`
  const rankExpr = headingExponent > 0 ? `(${bm25Expr} / pow(level, ${headingExponent}))` : bm25Expr

  const sql = `SELECT collection, id, title, content, level, ${rankExpr} as rank
    FROM _fts_search WHERE _fts_search MATCH ? AND collection IN (${placeholders})
    ORDER BY rank LIMIT ?`

  const rows = db.prepare(sql).all(ftsQuery, ...collections, limit)
  return rows
}

// ========= V-1 验证集 =========
console.log('='.repeat(60))
console.log('V-1：Content 内置 FTS5（unicode61）中文检索能力')
console.log('='.repeat(60))

const queries = [
  // 术语 8 条（V-1 方法里的建议）
  '有理数',
  '一元一次方程',
  '函数图像',
  '数轴表示',
  '绝对值',
  '实数',
  '代数',
  '教学策略',
  // 子词 6 条（连续 CJK 在 unicode61 下是一个 token，子词应该都只命中句子前缀）
  '有理 数',          // 空格拆分
  '方程 解',          // 空格拆分
  '函数 图像',        // 空格拆分
  '引入 方式',
  '基础 类型',
  '理解',             // 单/双子词
  // 多词组合 6 条
  '有理数 方程',
  '函数 教学',
  '一次 解法',
  '教师 课堂',
  '数轴 基础',
  '图像 理解',
]

console.log('\n查询集执行结果：\n')
const results = []
for (const q of queries) {
  const rows = queryFTS(['research', 'findings', 'instructional'], q)
  results.push({ query: q, hits: rows.length, rows })
  console.log(`  "${q}" → ${rows.length} 命中：`)
  for (const r of rows) {
    console.log(`      [${r.collection}] ${r.title} (rank=${r.rank.toFixed(3)})`)
    console.log(`        content: ${r.content.slice(0, 60)}...`)
  }
}

console.log('\n' + '='.repeat(60))
console.log('结果统计')
console.log('='.repeat(60))

const expected = {
  // 这些词在样例里明确出现过（至少一篇）
  '有理数': 4, '一元一次方程': 2, '函数图像': 2, '数轴表示': 1,
  '绝对值': 1, '实数': 1, '教学策略': 1,
}

let hits = 0
for (const { query, hits: h } of results) {
  const expectedHits = expected[query]
  if (h > 0) hits++
}
console.log(`总查询数: ${queries.length}`)
console.log(`有命中的查询数: ${hits}/${queries.length}`)
console.log(`术语 8 条平均命中: ${results.slice(0, 8).reduce((a,b) => a + b.hits, 0) / 8}`)
console.log(`子词 6 条平均命中: ${results.slice(8, 14).reduce((a,b) => a + b.hits, 0) / 6}`)
console.log(`多词组合 6 条平均命中: ${results.slice(14).reduce((a,b) => a + b.hits, 0) / 6}`)

console.log('\n=== 关键失败模式 ===')
console.log('1) 连续 CJK 长句 = 一个巨大 token，子词无法命中')
console.log('   例："本节课讲解有理数的定义" 整体是一个 token')
console.log('   "有理"* 不能命中此句（"有理数"不是前缀）')
console.log('2) 多词 AND：Content 的 "term"* "term"* 是 AND')
console.log('   必须同时命中两个大 token，在短样例中几乎必失败')
console.log('3) unicode61 没有真正的中文分词')

console.log('\n=== 结论 ===')
console.log('Content 内置 FTS5（unicode61）对中文检索基本不可用：')
console.log('  ✓ 句首词可命中（prefix phrase 模式）')
console.log('  ✗ 句中/句尾词完全不可命中（整句是一个大 token）')
console.log('  ✗ 多词 AND 组合几乎必失败')
console.log('  → A 路径（Content 内置 FTS5）不可用作方案')
