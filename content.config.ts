// 三集合内容模型（R8 正式名称 + 第七批 R13 划分口径）
// 形状定义在 content.schema.mjs（单一事实源），本文件只做 Content 装配。
// 边界：Content 的 schema 只生成 SQL 列、不校验（实测）；E9 由 scripts/validate-content.mjs 执行。
// ID 字段名：`docId`，不用 `id`（`id` 是 Content 保留字段，会覆盖 frontmatter；F-1a 已由 Owner 确认）。
import { defineContentConfig, defineCollection } from '@nuxt/content'
import { schemas, sources } from './content.schema.mjs'

export default defineContentConfig({
  collections: {
    // 研究档案：承载过程、证据与分析
    research: defineCollection({
      type: 'page',
      source: sources.research,
      schema: schemas.research
    }),

    // 研究结论：五态已由第八批裁定
    findings: defineCollection({
      type: 'page',
      source: sources.findings,
      schema: schemas.findings
    }),

    // 教学设计：四态已由 R11 + 第八批裁定；不保存课程正文
    instructional: defineCollection({
      type: 'page',
      source: sources.instructional,
      schema: schemas.instructional
    })
  }
})
