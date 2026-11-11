<script setup lang="ts">
// V-0 判据③：queryCollection 对三个集合各返回 ≥1 条
const [research, findings, instructional] = await Promise.all([
  queryCollection('research').order('created', 'DESC').all(),
  queryCollection('findings').order('created', 'DESC').all(),
  queryCollection('instructional').order('created', 'DESC').all()
])

const groups = [
  { key: 'research', label: '研究档案', items: research },
  { key: 'findings', label: '研究结论', items: findings },
  { key: 'instructional', label: '教学设计', items: instructional }
]
</script>

<template>
  <div>
    <h1>得心研究院</h1>
    <p class="intro">
      阶段 1（MVP）骨架。三集合状态词表按集合分列，不交叉解释。
    </p>

    <section v-for="group in groups" :id="group.key" :key="group.key" class="group">
      <h2>{{ group.label }}（{{ group.items.length }}）</h2>
      <ul v-if="group.items.length">
        <li v-for="item in group.items" :key="item.id">
          <span>{{ item.id }} · {{ item.title }}</span>
          <span class="status">{{ item.status }}</span>
        </li>
      </ul>
      <p v-else class="empty">暂无内容</p>
    </section>
  </div>
</template>

<style scoped>
h1 {
  font-size: 1.75rem;
  margin: 0 0 0.5rem;
}
.intro {
  color: #666;
  margin: 0 0 2rem;
}
.group {
  margin-bottom: 2rem;
}
.group h2 {
  font-size: 1.125rem;
  margin: 0 0 0.75rem;
  padding-bottom: 0.375rem;
  border-bottom: 1px solid #eee;
}
.group ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.group li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px dashed #f0f0f0;
}
.group a {
  color: #1a56db;
  text-decoration: none;
}
.status {
  color: #888;
  font-size: 0.8125rem;
  font-family: ui-monospace, monospace;
}
.empty {
  color: #999;
  margin: 0;
}
</style>
