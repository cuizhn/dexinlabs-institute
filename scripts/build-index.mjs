#!/usr/bin/env node
// 静态索引（Q14，已裁 A：gitignore 生成物，predev/prebuild 重建）
// 验收口径：干净 clone 必须能完整重建
// 依据：ADR-005 §3.2、09 §五.2
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import yaml from 'yaml'

const ROOT = process.cwd()
const CONTENT = path.join(ROOT, 'content')
const OUT = path.join(ROOT, '.index', 'refs.json')
const collections = ['research', 'findings', 'instructional']

fs.mkdirSync(path.dirname(OUT), { recursive: true })

const registryPath = path.join(CONTENT, 'registry.yaml')
const registry = fs.existsSync(registryPath)
  ? yaml.parse(fs.readFileSync(registryPath, 'utf8')) ?? {}
  : {}

const entities = {}

for (const col of collections) {
  const dir = path.join(CONTENT, col)
  if (!fs.existsSync(dir)) continue

  for (const file of fs
    .readdirSync(dir, { recursive: true })
    .filter((f) => f.endsWith('.md'))
    .map((f) => path.join(dir, f))) {
    const { data } = matter(fs.readFileSync(file, 'utf8'))
    const id = data.docId
    if (!id) continue

    const refsOut = []
    if (col === 'research') refsOut.push(...(data.findings ?? []), ...(data.related ?? []))
    if (col === 'findings') {
      refsOut.push(...(data.sources ?? []), ...(data.evidence ?? []), ...(data.instructional ?? []))
      if (data.superseded_by) refsOut.push(data.superseded_by)
    }
    if (col === 'instructional') refsOut.push(...(data.based_on ?? []), ...(data.research ?? []))

    const ext = path.extname(file)
    const stem = path.basename(file, ext)
    entities[id] = {
      type: col,
      title: data.title,
      status: data.status,
      file: path.relative(ROOT, file).replaceAll('\\', '/'),
      path: col === 'findings' ? `/findings/${id}` : `/${col}/${stem}`,
      refs_out: refsOut
    }
  }
}

// 反向引用派生（refs_in 不是事实源，从 refs_out 反转）
for (const id of Object.keys(entities)) entities[id].refs_in = []
for (const [id, ent] of Object.entries(entities)) {
  for (const ref of ent.refs_out) {
    const target = ref.split('#')[0]
    if (entities[target]) entities[target].refs_in.push(id)
  }
}

const out = {
  generated_at: new Date().toISOString(),
  registry_version: registry.generated_at ?? null,
  entities
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 2))
console.log(`索引已生成：${OUT}（${Object.keys(entities).length} 条）`)
