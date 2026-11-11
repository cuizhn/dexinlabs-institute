// 搜索索引 API（Q15 已裁 B 路径）
// 链路：queryCollectionSearchSections（Content 生成带 anchor 的 section）
//      → Intl.Segmenter 中文分词 → MiniSearch 索引 → 序列化返回
// 客户端只加载一次索引，本地检索（ADR-007 §3）
import MiniSearch from 'minisearch'

const FIELDS = ['title', 'titlesText', 'content']
const STORE_FIELDS = [
  'id', 'docId', 'collection', 'title', 'titles',
  'content', 'status', 'domain', 'level'
]

const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'word' })

function tokenize(text: string): string[] {
  if (!text) return []
  return Array.from(segmenter.segment(text), s => s.segment)
    .map(s => s.trim())
    .filter(Boolean)
}

// 公式只索引周边文字，不索引公式体（ADR-007 §3 / V-3）
function stripMath(text: string): string {
  if (!text) return ''
  return text
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\$[^$\n]*\$/g, ' ')
}

let cache: { index: unknown; domains: string[]; sections: number } | null = null
let building: Promise<NonNullable<typeof cache>> | null = null

async function buildIndex(event: any) {
  const [research, findings, instructional] = await Promise.all([
    queryCollectionSearchSections(event, 'research', { extraFields: ['docId', 'status', 'domain'] }),
    queryCollectionSearchSections(event, 'findings', { extraFields: ['docId', 'status'] }),
    queryCollectionSearchSections(event, 'instructional', { extraFields: ['docId', 'status'] })
  ])

  const sections = [
    ...research.map(s => ({ ...s, collection: 'research' })),
    ...findings.map(s => ({ ...s, collection: 'findings' })),
    ...instructional.map(s => ({ ...s, collection: 'instructional' }))
  ].map((s, i) => ({
    uid: `${s.collection}:${s.id}`,
    id: s.id,
    docId: (s as any).docId || '',
    collection: s.collection,
    title: s.title || '',
    titles: s.titles || [],
    titlesText: (s.titles || []).join(' '),
    content: stripMath(s.content || ''),
    status: (s as any).status || '',
    domain: (s as any).domain || '',
    level: s.level || 1,
    _order: i
  }))

  const mini = new MiniSearch({
    idField: 'uid',
    fields: FIELDS,
    storeFields: STORE_FIELDS,
    tokenize
  })
  mini.addAll(sections)

  const domains = [...new Set(sections.map(s => s.domain).filter(Boolean))].sort()

  return { index: mini.toJSON(), domains, sections: sections.length }
}

export default defineEventHandler(async (event) => {
  if (cache) return cache
  if (!building) building = buildIndex(event)
  cache = await building
  return cache
})
