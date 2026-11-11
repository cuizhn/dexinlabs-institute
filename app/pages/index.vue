<script setup lang="ts">
// P4 首页（升级）：hero（定位语 + 搜索前置 + 篇数统计）+ 三集合概览卡片
// V-0 判据③（P1）已确认 queryCollection 三集合各返回 ≥1 条
const [research, findings, instructional] = await Promise.all([
  queryCollection('research').order('created', 'DESC').all(),
  queryCollection('findings').order('created', 'DESC').all(),
  queryCollection('instructional').order('created', 'DESC').all()
])

// 首页搜索框前置：提交后跳转 /search?q=...（学术站惯例）
const q = ref('')
const goSearch = () => {
  const query = q.value.trim()
  return navigateTo({ path: '/search', query: query ? { q: query } : {} })
}

const stats = [
  { label: '研究档案', count: research.length, to: '/research' },
  { label: '研究结论', count: findings.length, to: '/findings' },
  { label: '教学设计', count: instructional.length, to: '/instructional' }
]
</script>

<template>
  <div class="home">
    <section class="home-hero">
      <h1>得心研究院</h1>
      <p class="hero-sub">研究档案 · 研究结论 · 教学设计</p>

      <form class="hero-search" role="search" @submit.prevent="goSearch">
        <input
          v-model="q"
          type="search"
          class="hero-search-input"
          placeholder="搜索研究内容，如：有理数、函数图像、教学策略"
          aria-label="搜索研究内容"
        >
        <button type="submit" class="hero-search-btn">搜索</button>
      </form>

      <dl class="hero-stats">
        <NuxtLink v-for="s in stats" :key="s.label" :to="s.to" class="hero-stat">
          <dt>{{ s.label }}</dt>
          <dd>{{ s.count }} <span class="hero-stat-unit">篇</span></dd>
        </NuxtLink>
      </dl>
    </section>

    <CollectionList collection="research" :items="research" :limit="3" />
    <CollectionList collection="findings" :items="findings" :limit="3" />
    <CollectionList collection="instructional" :items="instructional" :limit="3" />
  </div>
</template>

<style scoped>
.home-hero {
  margin-bottom: 2.5rem;
  padding: 1.5rem 0 2rem;
  border-bottom: 1px solid var(--line);
}
.home-hero h1 {
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 700;
  letter-spacing: 0.04em;
  margin: 0 0 0.5rem;
}
.hero-sub {
  color: var(--ink-2);
  margin: 0 0 1.5rem;
  font-size: 1rem;
  letter-spacing: 0.02em;
}

/* 搜索前置 */
.hero-search {
  display: flex;
  gap: 0.5rem;
  max-width: 36rem;
  margin-bottom: 1.75rem;
}
.hero-search-input {
  flex: 1;
  min-width: 0;
  padding: 0.625rem 0.875rem;
  font-size: 0.9375rem;
  border: 1px solid var(--line);
  border-radius: 6px;
  outline: none;
  background: var(--surface);
  color: var(--ink);
}
.hero-search-input:focus {
  border-color: var(--accent-2);
  box-shadow: 0 0 0 3px rgba(44, 82, 130, 0.12);
}
.hero-search-btn {
  padding: 0.625rem 1.25rem;
  font-size: 0.9375rem;
  border: 1px solid var(--accent);
  border-radius: 6px;
  background: var(--accent);
  color: #fff;
  cursor: pointer;
  white-space: nowrap;
}
.hero-search-btn:hover {
  background: var(--accent-2);
  border-color: var(--accent-2);
}

/* 篇数统计 */
.hero-stats {
  display: flex;
  gap: 2.5rem;
  margin: 0;
  padding: 0;
}
.hero-stat {
  text-decoration: none;
  color: inherit;
}
.hero-stat dt {
  font-size: 0.8125rem;
  color: var(--ink-3);
  margin-bottom: 0.125rem;
}
.hero-stat dd {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.hero-stat:hover dd {
  color: var(--accent-2);
}
.hero-stat-unit {
  font-size: 0.8125rem;
  font-weight: 400;
  color: var(--ink-3);
}

@media (max-width: 40rem) {
  .hero-stats { gap: 1.5rem; }
}
</style>
