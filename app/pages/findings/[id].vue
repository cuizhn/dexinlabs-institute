<script setup lang="ts">
// /findings/[id] 详情页 — 显式路由，绕过 Content v3 path 强制小写（F-2 实测）
// 路由匹配 docId（如 /findings/F-0001），不是 Content 默认小写 path
const route = useRoute()
const docId = route.params.id as string

const [doc, allResearch, allFindings, allInstructional] = await Promise.all([
  queryCollection('findings').where('docId', '=', docId).first(),
  queryCollection('research').all(),
  queryCollection('findings').all(),
  queryCollection('instructional').all()
])

if (!doc) {
  throw createError({ statusCode: 404, statusMessage: `研究结论未找到: ${docId}` })
}

useHead({ title: `${doc.title} · 研究结论 · 得心研究院` })
</script>

<template>
  <article class="detail">
    <header class="detail-header">
      <div class="detail-meta">
        <span class="doc-id">{{ doc.docId }}</span>
        <StatusBadge collection="findings" :status="doc.status" />
      </div>
      <h1>{{ doc.title }}</h1>
      <p v-if="doc.description" class="description">{{ doc.description }}</p>
      <div v-if="doc.scope" class="scope">
        <span class="scope-label">适用范围</span>
        <span>{{ doc.scope }}</span>
      </div>
      <div v-if="doc.tags?.length" class="tags">
        <span v-for="t in doc.tags" :key="t" class="tag">#{{ t }}</span>
      </div>
    </header>

    <div class="detail-body">
      <ContentRenderer :value="doc" />
    </div>

    <RelatedPanels
      :current="doc"
      current-collection="findings"
      :all-research="allResearch"
      :all-findings="allFindings"
      :all-instructional="allInstructional"
    />
  </article>
</template>

<style scoped>
.detail { display: grid; grid-template-columns: minmax(0, 1fr) 18rem; gap: 2rem; }
.detail-header { grid-column: 1 / -1; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #eee; }
.detail-meta { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
.doc-id { font-family: ui-monospace, monospace; font-size: 0.8125rem; color: #888; }
h1 { font-size: 1.5rem; margin: 0.25rem 0 0.5rem; }
.description { color: #666; margin: 0 0 0.75rem; }
.scope {
  font-size: 0.8125rem;
  color: #555;
  background: #f8fafc;
  border-left: 3px solid #cbd5e1;
  padding: 0.375rem 0.625rem;
  margin-bottom: 0.75rem;
}
.scope-label {
  font-weight: 500;
  color: #64748b;
  margin-right: 0.375rem;
}
.tags { margin-top: 0.5rem; }
.tag { font-size: 0.75rem; color: #94a3b8; margin-right: 0.5rem; }
.detail-body { grid-column: 1; min-width: 0; }
@media (max-width: 60rem) { .detail { grid-template-columns: 1fr; } }
</style>
