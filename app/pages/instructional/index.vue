<script setup lang="ts">
// /instructional 列表页
const docs = await queryCollection('instructional').order('created', 'DESC').all()
const pageTitle = '教学设计'
useHead({ title: `${pageTitle} · 得心研究院` })
</script>

<template>
  <div>
    <h1>教学设计</h1>
    <p class="page-desc">
      教学设计承载基于研究结论的教学方案（schema：`instructional`）。
      四态推进度 = designing / ready-for-validation / validated / archived
      （R11 + 第八批已裁，不再使用 `pending-validation`）。
    </p>
    <CollectionList collection="instructional" :items="docs" />
  </div>
</template>

<style scoped>
h1 { font-size: 1.5rem; margin: 0 0 0.5rem; }
.page-desc { color: #666; margin: 0 0 1.5rem; font-size: 0.9375rem; }
</style>
