<script setup lang="ts">
// /research/[slug] 详情页 — Content 自动生成 slug 路由
const route = useRoute()
const slug = route.params.slug as string

const [doc, allResearch, allFindings, allInstructional] = await Promise.all([
  // Content v3 的 stem 包含集合前缀（实测 stem = 'research/sample-research'）
  queryCollection('research').where('stem', '=', `research/${slug}`).first(),
  queryCollection('research').all(),
  queryCollection('findings').all(),
  queryCollection('instructional').all()
])

if (!doc) {
  throw createError({ statusCode: 404, statusMessage: `研究档案未找到: ${slug}` })
}

useHead({ title: `${doc.title} · 研究档案 · 得心研究院` })
</script>

<template>
  <article class="detail">
    <header class="detail-header">
      <div class="detail-meta">
        <span class="doc-id">{{ doc.docId }}</span>
        <StatusBadge collection="research" :status="doc.status" />
        <span v-if="doc.domain" class="domain-tag">{{ doc.domain }}</span>
      </div>
      <h1>{{ doc.title }}</h1>
      <p v-if="doc.description" class="description">{{ doc.description }}</p>
      <div v-if="doc.tags?.length" class="tags">
        <span v-for="t in doc.tags" :key="t" class="tag">#{{ t }}</span>
      </div>
    </header>

    <div class="detail-body">
      <ContentRenderer :value="doc" />
    </div>

    <RelatedPanels
      :current="doc"
      current-collection="research"
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
.domain-tag {
  font-size: 0.6875rem;
  background: #f1f5f9;
  color: #475569;
  padding: 0.0625rem 0.375rem;
  border-radius: 3px;
}
h1 { font-size: 1.5rem; margin: 0.25rem 0 0.5rem; }
.description { color: #666; margin: 0 0 0.75rem; }
.tags { margin-top: 0.5rem; }
.tag {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-right: 0.5rem;
}
.detail-body { grid-column: 1; min-width: 0; }
@media (max-width: 60rem) { .detail { grid-template-columns: 1fr; } }
</style>
