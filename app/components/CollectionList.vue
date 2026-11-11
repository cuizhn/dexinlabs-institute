<script setup lang="ts">
// 集合列表卡片组件（P4 页面骨架，ADR-006 §3）
// 用在首页三集合概览 + /research /findings /instructional 列表页
//
// Props:
//   collection: 'research' | 'findings' | 'instructional'
//   items:      queryCollection 返回的数组
//   limit:      首页概览时取前 N 条（默认 3），null  = 全部
//
// Collection slug/ID 规则（Q8 已裁混合制）：
//   - findings  → 用 docId（/findings/F-0001）
//   - research  → 用 slug（/research/<slug>）
//   - instructional → 用 slug（/instructional/<slug>）
//   详情页路由显式处理 findings（绕过 Content 小写 path）

const props = withDefaults(defineProps<{
  collection: 'research' | 'findings' | 'instructional'
  items: any[]
  limit?: number | null
}>(), {
  limit: null
})

const LABELS: Record<string, string> = {
  research: '研究档案',
  findings: '研究结论',
  instructional: '教学设计'
}

// 详情路由生成
const detailPath = (item: any) => {
  // findings 显式路由用 docId（绕过 Content 小写 path，F-2）
  if (item.docId?.startsWith('F-')) {
    return `/findings/${item.docId}`
  }
  // Content v3 的 stem 包含集合前缀（实测 stem = 'research/sample-research'）
  // 所以直接用 stem 拼路由，不要再加集合路径前缀
  return `/${item.stem}`
}

const displayItems = () =>
  props.limit != null ? props.items.slice(0, props.limit) : props.items
</script>

<template>
  <div class="collection-list">
    <div class="cl-header">
      <h3>{{ LABELS[collection] }}（{{ items.length }}）</h3>
      <NuxtLink v-if="limit != null && items.length > limit"
                :to="`/${collection}`" class="cl-more">查看全部 →</NuxtLink>
    </div>
    <ul class="cl-items">
      <li v-for="item in displayItems()" :key="item.docId">
        <NuxtLink :to="detailPath(item)" class="cl-item">
          <span class="cl-id">{{ item.docId }}</span>
          <span class="cl-main">
            <span class="cl-title">{{ item.title }}</span>
            <span v-if="item.description" class="cl-desc">{{ item.description }}</span>
          </span>
          <time v-if="item.created" class="cl-date">{{ item.created }}</time>
          <StatusBadge :collection="collection" :status="item.status" />
        </NuxtLink>
      </li>
      <li v-if="items.length === 0" class="cl-empty">暂无内容</li>
    </ul>
  </div>
</template>

<style scoped>
.collection-list { margin-bottom: 2rem; }
.cl-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.75rem;
  padding-bottom: 0.375rem;
  border-bottom: 1px solid var(--line);
}
.cl-header h3 {
  font-size: 1rem;
  margin: 0;
  color: var(--ink);
}
.cl-more {
  font-size: 0.8125rem;
  color: var(--accent-2);
  text-decoration: none;
}
.cl-items {
  list-style: none;
  padding: 0;
  margin: 0;
}
.cl-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.5rem 0.5rem 0;
  border-bottom: 1px dashed var(--line);
  text-decoration: none;
  color: inherit;
  position: relative;
}
/* hover 指示条：左侧出现主色竖条 + 标题变色，替代整行浅灰 */
.cl-item::before {
  content: '';
  position: absolute;
  left: -0.5rem;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 0;
  background: var(--accent);
  border-radius: 2px;
  transition: height 0.15s ease;
}
.cl-item:hover::before { height: 60%; }
.cl-item:hover .cl-title { color: var(--accent-2); }
.cl-id {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--ink-3);
  flex-shrink: 0;
  min-width: 4rem;
}
.cl-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}
.cl-title {
  font-size: 0.9375rem;
  color: var(--ink);
}
.cl-desc {
  font-size: 0.8125rem;
  color: var(--ink-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cl-date {
  font-size: 0.75rem;
  color: var(--ink-3);
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}
.cl-empty {
  color: var(--ink-3);
  padding: 0.5rem 0;
}
</style>
