#!/usr/bin/env node
// 内容校验（E9 + 注册表一致性）
// 退出码契约（09 §三）：错误级 E* 命中 → 非 0，构建/提交应中止；警告级 W* → 仍为 0。
// 依据：ADR-005 §3.3（严重度唯一事实源）、ADR-004 §3.2（registry 五项检查）、Q7/Q10c（分节仅警告）
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
if (!fs.existsSync(REGISTRY)) {
  err('E0 content/registry.yaml 不存在')
}

const registry = fs.existsSync(REGISTRY)
  ? yaml.parse(fs.readFileSync(REGISTRY, 'utf8')) ?? {}
  : {}
const entries = Array.isArray(registry.entries) ? registry.entries : []
const byId = new Map()

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

// ---------- 内容文件 ----------
const seen = new Map()

for (const collection of Object.keys(schemas)) {
  const dir = path.join(CONTENT, collection)
  if (!fs.existsSync(dir)) continue

  const files = fs
    .readdirSync(dir, { recursive: true })
    .filter((f) => f.endsWith('.md'))
    .map((f) => path.join(dir, f))

  for (const file of files) {
    const rel = path.relative(ROOT, file).replaceAll('\\', '/')
    const { data, content } = matter(fs.readFileSync(file, 'utf8'))
    const parsed = schemas[collection].safeParse(data)

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const at = issue.path.length ? issue.path.join('.') : '(root)'
        err(`E9 ${rel} → ${at}: ${issue.message}`)
      }
      continue
    }

    const id = parsed.data.docId
    if (seen.has(id)) {
      err(`E5 ${id} 在多处出现：${seen.get(id)} 与 ${rel}`)
    } else {
      seen.set(id, rel)
    }

    const entry = byId.get(id)
    if (!entry) err(`E2 ${rel} 的 docId ${id} 未在 registry.yaml 登记`)
    else if (entry.type !== collection) {
      err(`E3 ${rel} 属于 ${collection}，但注册表登记为 ${entry.type}`)
    }

    for (const section of sections[collection]) {
      if (!new RegExp(`^#{2,3}\\s+${section}\\s*$`, 'm').test(content)) {
        warn(`W1 ${rel} 缺少「${section}」节（Q7 软约定，不阻断构建）`)
      }
    }
  }
}

// ---------- 输出（两类分栏，警告不计入失败计数）----------
if (errors.length) {
  console.log(`\n[ERROR] ${errors.length} 项（错误级，退出码 1）`)
  for (const e of errors) console.log('  ' + e)
}
if (warnings.length) {
  console.log(`\n[WARN] ${warnings.length} 项（警告级，不阻断）`)
  for (const w of warnings) console.log('  ' + w)
}
if (!errors.length && !warnings.length) console.log('内容校验通过：0 错误 0 警告')

process.exit(errors.length ? 1 : 0)
