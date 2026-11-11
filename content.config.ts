// 三集合内容模型（R8 正式名称 + 第七批 R13 划分口径）
// 依据：dexinlabs-research-architecture/adr/ADR-003-研究内容模型与文档规范.md §3
//       dexinlabs-research-architecture/adr/ADR-004-结论标识与状态模型.md §3.3
// 边界：Zod 只做「单文件形状校验」（E9）；跨文档目标状态检查由索引/校验脚本执行（E10，R12 警告级）。
import { defineContentConfig, defineCollection, z } from '@nuxt/content'

const base = {
  id: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  created: z.string(),
  updated: z.string().optional(),
  tags: z.array(z.string()).default([])
}

export default defineContentConfig({
  collections: {
    // 研究档案：承载过程与证据（Q6 未裁部分不在此实现 evidence 集合）
    research: defineCollection({
      type: 'page',
      source: 'research/**/*.md',
      schema: z.object({
        ...base,
        id: z.string().regex(/^R-\d{4}$/),
        status: z.enum(['draft', 'in-progress', 'concluded', 'archived'])
      })
    }),

    // 研究结论：五态已由第八批裁定
    findings: defineCollection({
      type: 'page',
      source: 'findings/**/*.md',
      schema: z.object({
        ...base,
        id: z.string().regex(/^F-\d{4}$/),
        status: z.enum([
          'pending-validation',
          'provisional',
          'confirmed',
          'superseded',
          'retracted'
        ]),
        based_on: z.array(z.string()).default([]),
        scope: z.string().optional()
      })
    }),

    // 教学设计：四态已由 R11 + 第八批裁定；不保存课程正文
    instructional: defineCollection({
      type: 'page',
      source: 'instructional/**/*.md',
      schema: z.object({
        ...base,
        id: z.string().regex(/^C-\d{4}$/),
        status: z.enum(['designing', 'ready-for-validation', 'validated', 'archived']),
        based_on: z.array(z.string()).default([])
      })
    })
  }
})
