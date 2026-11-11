<script setup lang="ts">
// /findings 列表页
const docs = await queryCollection('findings').order('created', 'DESC').all()
const pageTitle = '研究结论'
useHead({ title: `${pageTitle} · 得心研究院` })
</script>

<template>
  <div>
    <h1>研究结论</h1>
    <p class="page-desc">
      研究结论承载可引用的阶段性认知（schema：`findings`）。
      五态成熟度 = pending-validation（待验证） / provisional（暂定） /
      confirmed（已确认） / superseded（已取代） / retracted（已撤回）。
    </p>
    <CollectionList collection="findings" :items="docs" />
  </div>
</template>

<style scoped>
h1 { font-size: 1.5rem; margin: 0 0 0.5rem; }
.page-desc { color: #666; margin: 0 0 1.5rem; font-size: 0.9375rem; }
</style>
