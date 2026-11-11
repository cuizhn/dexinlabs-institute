<script setup lang="ts">
// P4 首页（升级）：三集合概览卡片 + 状态徽标 + 搜索入口占位
// V-0 判据③（P1）已确认 queryCollection 三集合各返回 ≥1 条
const [research, findings, instructional] = await Promise.all([
  queryCollection('research').order('created', 'DESC').all(),
  queryCollection('findings').order('created', 'DESC').all(),
  queryCollection('instructional').order('created', 'DESC').all()
])
</script>

<template>
  <div class="home">
    <section class="home-hero">
      <h1>得心研究院</h1>
      <p class="hero-sub">
        研究档案 · 研究结论 · 教学设计 — 阶段 1 MVP 骨架
        <NuxtLink to="/search" class="hero-search">进入搜索 →</NuxtLink>
      </p>
    </section>

    <CollectionList collection="research" :items="research" :limit="3" />
    <CollectionList collection="findings" :items="findings" :limit="3" />
    <CollectionList collection="instructional" :items="instructional" :limit="3" />
  </div>
</template>

<style scoped>
.home-hero {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
}
.home-hero h1 {
  font-size: 1.75rem;
  margin: 0 0 0.5rem;
}
.hero-sub {
  color: #666;
  margin: 0;
  font-size: 0.9375rem;
}
.hero-search {
  margin-left: 0.75rem;
  color: #1a56db;
  text-decoration: none;
}
</style>
