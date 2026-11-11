// 三集合 frontmatter 形状的单一事实源（E9）
// 依据：dexinlabs-research-architecture/adr/ADR-003-研究内容模型与文档规范.md §3.1–§3.3
//       dexinlabs-research-architecture/adr/ADR-004-结论标识与状态模型.md §3.1/§3.3
//
// 注意（V-0/P2 实测）：Config v3 的 `schema` 只用于生成 SQL 列，不做校验；
// 非法取值会被原样存入并可通过 queryCollection 读出。因此运行时校验由
// scripts/validate-content.mjs 复用本文件的 schema 执行（E9），不能依赖构建失败。
import { z } from 'zod'

const ID = {
  research: /^R-\d{4}$/,
  findings: /^F-\d{4}$/,
  instructional: /^C-\d{4}$/,
  // 可带证据锚点的 research 引用：R-0001 或 R-0001#ev-01（E6 校验锚点存在性）
  researchWithAnchor: /^R-\d{4}(#ev-\d+)?$/
}

const common = {
  docId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  created: z.string(),
  updated: z.string().optional(),
  tags: z.array(z.string()).default([])
}

export const schemas = {
  research: z.object({
    ...common,
    docId: z.string().regex(ID.research),
    domain: z.enum(['textbook', 'pedagogy', 'structure', 'learning', 'diagnosis']),
    status: z.enum(['draft', 'in-progress', 'concluded', 'archived']),
    findings: z.array(z.string().regex(ID.findings)).default([]),
    related: z.array(z.string()).default([])
  }),

  findings: z.object({
    ...common,
    docId: z.string().regex(ID.findings),
    status: z.enum(['pending-validation', 'provisional', 'confirmed', 'superseded', 'retracted']),
    sources: z.array(z.string().regex(ID.researchWithAnchor)).min(1),
    evidence: z.array(z.string()).default([]),
    scope: z.string().min(1),
    instructional: z.array(z.string().regex(ID.instructional)).default([]),
    superseded_by: z.string().nullable().default(null)
  }),

  instructional: z.object({
    ...common,
    docId: z.string().regex(ID.instructional),
    status: z.enum(['designing', 'ready-for-validation', 'validated', 'archived']),
    based_on: z.array(z.string().regex(ID.findings)).min(1),
    research: z.array(z.string().regex(ID.research)).default([]),
    target: z
      .object({
        topic: z.string(),
        chapter: z.string(),
        lesson: z.string()
      })
      .optional()
  })
}

// 正文分节：Q7 软约定（只出 lint 警告，不阻断构建）
export const sections = {
  research: ['研究问题', '研究过程', '研究证据', '研究分析', '研究结论', '待解决问题', '关联研究'],
  findings: ['结论陈述', '研究依据', '推导过程', '适用范围', '限制与反例', '参考文献', '状态与修订记录'],
  // Q10c：三节是 designing → ready-for-validation 的转换前置条件，此处只做 lint 提示
  instructional: ['设计目标', '设计依据', '教学结构']
}

export const sources = {
  research: 'research/**/*.md',
  findings: 'findings/**/*.md',
  instructional: 'instructional/**/*.md'
}
