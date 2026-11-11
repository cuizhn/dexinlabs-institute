<script setup lang="ts">
// /search 正式检索页（Q15 已裁：B 路径 — MiniSearch + Intl.Segmenter）
// 索引由 /api/search-index 提供（Content sections + 中文分词 + MiniSearch），
// 客户端只加载一次，检索在本地完成（ADR-007 §3）
import MiniSearch from 'minisearch'
import type { SearchResult } from 'minisearch'

useHead({ title: '搜索 · 得心研究院' })

const COLLECTIONS = [
  { value: 'all', label: '全部' },
  { value: 'research', label: '研究档案' },
  { value: 'findings', label: '研究结论' },
  { value: 'instructional', label: '教学设计' }
] as const

const STATUS_OPTIONS: Record<string, { value: string; label: string }[]> = {
  research: [
    { value: 'draft', label: '草稿' },
    { value: 'in-progress', label: '进行中' },
    { value: 'concluded', label: '已完成' },
    { value: 'archived', label: '已归档' }
  ],
  findings: [
    { value: 'pending-validation', label: '待验证' },
    { value: 'provisional', label: '暂定' },
    { value: 'confirmed', label: '已确认' },
    { value: 'superseded', label: '已取代' },
    { value: 'retracted', label: '已撤回' }
  ],
  instructional: [
    { value: 'designing', label: '设计中' },
    { value: 'ready-for-validation', label: '待教学验证' },
    { value: 'validated', label: '已验证' },
    { value: 'archived', label: '已归档' }
  ]
}

const COLLECTION_LABELS: Record<string, string> = {
  research: '研究档案',
  findings: '研究结论',
  instructional: '教学设计'
}

const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'word' })
function tokenize(text: string): string[] {
  if (!text) return []
  return Array.from(segmenter.segment(text), s => s.segment)
    .map(s => s.trim())
    .filter(Boolean)
}

const query = ref('')
const collection = ref<string>('all')
const status = ref('')
const domain = ref('')
const loading = ref(true)
const errorMsg = ref('')
const domains = ref<string[]>([])
const sectionCount = ref(0)

let mini: MiniSearch | null = null

onMounted(async () => {
  try {
    const data = await $fetch('/api/search-index')
    mini = MiniSearch.loadJSON(JSON.stringify(data.index), {
      idField: 'uid',
      fields: ['title', 'titlesText', 'content'],
      storeFields: ['id', 'docId', 'collection', 'title', 'titles', 'content', 'status', 'domain', 'level'],
      tokenize
    })
    domains.value = data.domains || []
    sectionCount.value = data.sections || 0
  } catch (e: any) {
    errorMsg.value = e?.message || '索引加载失败'
  } finally {
    loading.value = false
  }
})

watch(collection, () => { status.value = '' })

const results = computed<SearchResult[]>(() => {
  const q = query.value.trim()
  if (!mini || !q) return []
  return mini.search(q, {
    prefix: true,
    combineWith: 'AND',
    boost: { title: 3, titlesText: 2, content: 1 },
    filter: (r: any) => {
      if (collection.value !== 'all' && r.collection !== collection.value) return false
      if (status.value && r.status !== status.value) return false
      if (domain.value && r.domain !== domain.value) return false
      return true
    }
  }).slice(0, 50)
})

const statusChoices = computed(() =>
  collection.value === 'all' ? [] : STATUS_OPTIONS[collection.value] || []
)

function resultLink(r: any): string {
  const [rawPath, anchor] = String(r.id).split('#')
  let path = rawPath
  if (r.collection === 'findings' && r.docId) path = `/findings/${r.docId}`
  return anchor ? `${path}#${anchor}` : path
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function meaningfulTokens(): string[] {
  return tokenize(query.value)
    .filter(t => /[\p{L}\p{N}]/u.test(t))
    .sort((a, b) => b.length - a.length)
}

// 截取命中附近的一段，并高亮
function snippet(content: string): string {
  const text = content || ''
  if (!text) return ''
  const tokens = meaningfulTokens()
  const lower = text.toLowerCase()
  let start = 0
  for (const t of tokens) {
    const idx = lower.indexOf(t.toLowerCase())
    if (idx >= 0) { start = Math.max(0, idx - 40); break }
  }
  let out = text.slice(start, start + 160)
  if (start > 0) out = '…' + out
  if (start + 160 < text.length) out += '…'
  let html = escapeHtml(out)
  for (const t of tokens) {
    if (!t) continue
    const re = new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    html = html.replace(re, '<mark>$1</mark>')
  }
  return html
}
</script>

<template>
  <div class="search-page">
    <h1>搜索</h1>
    <p class="page-desc">
      检索范围：三集合全部段落（{{ sectionCount }} 个段落索引）。
      采用 MiniSearch + Intl.Segmenter 中文分词（Q15 已裁 B 路径）。
      公式体不入索引，只索引公式周边文字。
    </p>

    <div class="search-bar">
      <input
        v-model="query"
        type="search"
        placeholder="输入关键词，如：有理数、函数图像、教学策略"
        class="search-input"
        autofocus
      >
    </div>

    <div class="filters">
      <div class="filter-group">
        <span class="filter-label">集合</span>
        <button
          v-for="c in COLLECTIONS"
          :key="c.value"
          :class="['filter-btn', { active: collection === c.value }]"
          @click="collection = c.value"
        >{{ c.label }}</button>
      </div>

      <div v-if="statusChoices.length" class="filter-group">
        <span class="filter-label">状态</span>
        <select v-model="status" class="filter-select">
          <option value="">全部状态</option>
          <option v-for="s in statusChoices" :key="s.value" :value="s.value">{{ s.label }}</option>
        </select>
      </div>

      <div v-if="domains.length" class="filter-group">
        <span class="filter-label">领域</span>
        <select v-model="domain" class="filter-select">
          <option value="">全部领域</option>
          <option v-for="d in domains" :key="d" :value="d">{{ d }}</option>
        </select>
      </div>
    </div>

    <p v-if="loading" class="hint">索引加载中…</p>
    <p v-else-if="errorMsg" class="hint error">索引加载失败：{{ errorMsg }}</p>

    <template v-else>
      <p v-if="!query.trim()" class="hint">输入关键词开始检索。</p>
      <p v-else-if="results.length === 0" class="hint">没有匹配结果。</p>
      <p v-else class="hint">命中 {{ results.length }} 个段落（最多显示 50 条）。</p>

      <ul class="results">
        <li v-for="r in results" :key="r.id" class="result">
          <div class="result-head">
            <NuxtLink :to="resultLink(r)" class="result-title">{{ r.title }}</NuxtLink>
            <span class="result-coll">{{ COLLECTION_LABELS[r.collection] }}</span>
            <StatusBadge :collection="r.collection" :status="r.status" />
          </div>
          <div v-if="r.titles?.length" class="result-crumb">
            {{ r.titles.join(' / ') }}
          </div>
          <p class="result-snippet" v-html="snippet(r.content)" />
        </li>
      </ul>
    </template>
  </div>
</template>

<style scoped>
h1 { font-size: 1.5rem; margin: 0 0 0.5rem; }
.page-desc { color: #666; margin: 0 0 1.25rem; font-size: 0.9375rem; line-height: 1.6; }

.search-bar { margin-bottom: 0.75rem; }
.search-input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  font-size: 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  outline: none;
}
.search-input:focus { border-color: #1a56db; box-shadow: 0 0 0 3px rgba(26, 86, 219, 0.12); }

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.25rem;
}
.filter-group { display: flex; align-items: center; gap: 0.375rem; }
.filter-label { font-size: 0.8125rem; color: #6b7280; }
.filter-btn {
  font-size: 0.8125rem;
  padding: 0.25rem 0.625rem;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #4b5563;
  border-radius: 999px;
  cursor: pointer;
}
.filter-btn.active { background: #1a56db; border-color: #1a56db; color: #fff; }
.filter-select {
  font-size: 0.8125rem;
  padding: 0.25rem 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: #fff;
  color: #374151;
}

.hint { color: #6b7280; font-size: 0.875rem; margin: 0 0 0.75rem; }
.hint.error { color: #b91c1c; }

.results { list-style: none; padding: 0; margin: 0; }
.result {
  padding: 0.875rem 0;
  border-bottom: 1px solid #f0f0f0;
}
.result-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.25rem;
}
.result-title { font-size: 1rem; color: #1a56db; text-decoration: none; font-weight: 500; }
.result-title:hover { text-decoration: underline; }
.result-coll {
  font-size: 0.6875rem;
  color: #64748b;
  background: #f1f5f9;
  padding: 0.0625rem 0.375rem;
  border-radius: 3px;
}
.result-crumb { font-size: 0.75rem; color: #94a3b8; margin-bottom: 0.25rem; }
.result-snippet { margin: 0; font-size: 0.875rem; color: #374151; line-height: 1.6; }
.result-snippet :deep(mark) { background: #fef08a; color: inherit; padding: 0 0.125rem; border-radius: 2px; }
</style>
