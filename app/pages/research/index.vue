<script setup lang="ts">
// /research 列表页
const docs = await queryCollection('research').order('created', 'DESC').all()
const pageTitle = '研究档案'
useHead({ title: `${pageTitle} · 得心研究院` })
</script>

<template>
  <div>
    <h1>研究档案</h1>
    <p class="page-desc">
      研究档案承载研究过程、证据与分析（schema：`research`）。
      每条有稳定 ID（R-NNNN）与四态完成度。
    </p>
    <CollectionList collection="research" :items="docs" />
  </div>
</template>

<style scoped>
h1 { font-size: 1.5rem; margin: 0 0 0.5rem; }
.page-desc { color: var(--ink-2); margin: 0 0 1.5rem; font-size: 0.9375rem; }
</style>
