#!/usr/bin/env node
// 内容校验（E1–E9 + E10 + W1/W2）
// 退出码契约（09 §三）：错误级 E* 命中 → 非 0；警告级 W*/E10 → 仍为 0。
// 依据：ADR-005 §3.3（严重度唯一事实源）、ADR-004 §3.2（registry 五项）
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import yaml from 'yaml'
import { schemas, sections } from '../content.schema.mjs'

const ROOT = process.cwd()
const CONTENT = path.join(ROOT, 'content')
const REGISTRY = path.join(CONTENT, 'registry.yaml')

const errors = []
const warnings = []
const err = (msg) => errors.push(msg)
const warn = (msg) => warnings.push(msg)

// ---------- 注册表 ----------
if (!fs.existsSync(REGISTRY)) err('E0 content/registry.yaml 不存在')

const registry = fs.existsSync(REGISTRY)
  ? yaml.parse(fs.readFileSync(REGISTRY, 'utf8')) ?? {}
  : {}
const entries = Array.isArray(registry.entries) ? registry.entries : []
const byId = new Map() // id → entry

for (const entry of entries) {
  if (!entry?.id) {
    err('E1 注册表存在缺少 id 的条目')
    continue
  }
  if (byId.has(entry.id)) err(`E1 注册表中 ${entry.id} 重复登记`)
  byId.set(entry.id, entry)
  if (!entry.path || !fs.existsSync(path.join(ROOT, entry.path))) {
    err(`E4 ${entry.id} 已登记但文件不存在：${entry.path ?? '(缺 path)'}`)
  }
  if (!['research', 'findings', 'instructional'].includes(entry.type)) {
    err(`E3 ${entry.id} 的 type 非法：${entry.type}`)
  }
}

// ---------- 第一遍：收集（schema 通过的文档才入索引）----------
const docs = new Map() // id → { type, status, rel, refsOut:{R,F,C} }
const seenId = new Map()

for (const collection of Object.keys(schemas)) {
  const dir = path.join(CONTENT, collection)
  if (!fs.existsSync(dir)) continue

  for (const file of fs
    .readdirSync(dir, { recursive: true })
    .filter((f) => f.endsWith('.md'))
    .map((f) => path.join(dir, f))) {
    const rel = path.relative(ROOT, file).replaceAll('\\', '/')
    const { data, content } = matter(fs.readFileSync(file, 'utf8'))
    const parsed = schemas[collection].safeParse(data)

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const at = issue.path.length ? issue.path.join('.') : '(root)'
        err(`E9 ${rel} → ${at}: ${issue.message}`)
      }
      continue // schema 不通过 = 单文件放弃，跨文档规则不再检查
    }

    const d = parsed.data
    const id = d.docId

    // E5：docId 重复（同一类型或跨类型）
    if (seenId.has(id)) {
      err(`E5 ${id} 在多处出现：${seenId.get(id)} 与 ${rel}`)
    } else {
      seenId.set(id, rel)
    }

    // E3：注册表类型不符（此处把 registry 叫 E3，A1 schema 正则不重复报）
    const entry = byId.get(id)
    if (!entry) err(`E4 ${rel} 的 docId ${id} 未在 registry.yaml 登记`)
    else if (entry.type !== collection) {
      err(`E3 ${rel} 属于 ${collection}，但注册表登记为 ${entry.type}`)
    }

    let refs_out = []
    if (collection === 'research') refs_out.push(...d.findings, ...d.related)
    if (collection === 'findings') {
      refs_out.push(...d.sources, ...d.evidence, ...d.instructional)
      if (d.superseded_by) refs_out.push(d.superseded_by)
    }
    if (collection === 'instructional') refs_out.push(...d.based_on, ...d.research)

    const refsClean = refs_out
      .map((x) => String(x).trim())
      .filter((x) => x.length)

    docs.set(id, {
      type: collection,
      status: d.status,
      rel,
      data: d,
      content,
      refsOut: refsClean
    })

    for (const section of sections[collection]) {
      if (!new RegExp(`^#{2,3}\\s+${section}\\s*$`, 'm').test(content)) {
        warn(`W3 ${rel} 缺少「${section}」节（Q7 软约定，不阻断构建）`)
      }
    }
  }
}

// ---------- 第二遍：跨文档规则 ----------
// 建立反向索引（谁引用了谁）
const incoming = new Map() // targetId → [{sourceId, field}]
function addIncoming(targetId, sourceId, field) {
  if (!incoming.has(targetId)) incoming.set(targetId, [])
  incoming.get(targetId).push({ sourceId, field })
}
for (const [sourceId, src] of docs) {
  if (src.type === 'findings') {
    for (const t of src.data.sources ?? []) addIncoming(t, sourceId, 'sources')
    for (const t of src.data.evidence ?? []) addIncoming(t, sourceId, 'evidence')
    for (const t of src.data.instructional ?? []) addIncoming(t, sourceId, 'instructional')
  }
  if (src.type === 'instructional') {
    for (const t of src.data.based_on ?? []) addIncoming(t, sourceId, 'based_on')
    for (const t of src.data.research ?? []) addIncoming(t, sourceId, 'research')
  }
  if (src.type === 'research') {
    for (const t of src.data.findings ?? []) addIncoming(t, sourceId, 'findings')
    for (const t of src.data.related ?? []) addIncoming(t, sourceId, 'related')
  }
}

for (const [id, doc] of docs) {
  const { type, data, rel } = doc

  if (type === 'findings' && data.status === 'superseded') {
    if (!data.superseded_by) err(`E7 ${rel} status=superseded 但 superseded_by 缺失`)
    else {
      const tgt = docs.get(data.superseded_by)
      if (!tgt) err(`E7 ${rel} superseded_by=${data.superseded_by} 指向不存在的 finding`)
      else if (tgt.type !== 'findings') err(`E7 ${rel} superseded_by 应指向 findings，实际是 ${tgt.type}`)
    }
  }

  // E2 + E5（引用类型错误） + E10/W2（警告级）
  const refs = []
  if (type === 'research') refs.push(['findings', data.findings, 'findings', 'F'])
  if (type === 'research') refs.push(['related', data.related, null, null])
  if (type === 'findings') refs.push(['sources', data.sources, 'research', 'R'])
  if (type === 'findings') refs.push(['evidence', data.evidence, 'research', 'R'])
  if (type === 'findings') refs.push(['instructional', data.instructional, 'instructional', 'C'])
  if (type === 'findings' && data.superseded_by) refs.push(['superseded_by', [data.superseded_by], 'findings', 'F'])
  if (type === 'instructional') refs.push(['based_on', data.based_on, 'findings', 'F'])
  if (type === 'instructional') refs.push(['research', data.research, 'research', 'R'])

  for (const [field, arr, expectedType, idPrefix] of refs) {
    for (const target of arr ?? []) {
      const tgtStr = String(target).trim()

      // 证据锚点 R-0001#ev-01 的锚点部分暂不校验（E6 待实现，属构建脚本）
      const base = tgtStr.split('#')[0]

      // E2 悬空引用
      if (!docs.has(base)) {
        err(`E2 ${rel} 的 ${field} 引用了不存在的 ID：${tgtStr}`)
        continue
      }

      const tgt = docs.get(base)

      // E5 引用类型错误（按字段语义硬校验）
      if (expectedType && tgt.type !== expectedType) {
        err(`E5 ${rel} 的 ${field} 应引用 ${expectedType}，实际引用 ${tgt.type}（${base}）`)
      }

      // E10（警告级）：instructional.based_on → pending-validation finding
      if (type === 'instructional' && field === 'based_on' && tgt.type === 'findings') {
        if (tgt.status === 'pending-validation') {
          warn(
            `E10 ${rel} 的 based_on 引用 ${base}（status=pending-validation）——未成立依据，R12 警告级，不阻断构建；页面须显示「未成立依据」警示`
          )
        }
      }

      // W2（警告级）：引用 superseded / retracted 结论
      if (tgt.type === 'findings' && ['superseded', 'retracted'].includes(tgt.status)) {
        warn(
          `W2 ${rel} 的 ${field} 引用 ${base}（status=${tgt.status}）——已被取代/撤回，页面须显示取代链/撤回警示`
        )
      }
    }
  }
}

// ---------- 输出 ----------
const bar = ''.padEnd(54, '─')
if (errors.length) {
  console.log(`\n[ERROR] ${errors.length} 项（错误级，退出码 1）\n${bar}`)
  for (const e of errors) console.log('  ' + e)
}
if (warnings.length) {
  console.log(`\n[WARN] ${warnings.length} 项（警告级，不阻断）\n${bar}`)
  for (const w of warnings) console.log('  ' + w)
}
if (!errors.length && !warnings.length) {
  console.log('内容校验通过：0 错误 0 警告')
}

process.exit(errors.length ? 1 : 0)
