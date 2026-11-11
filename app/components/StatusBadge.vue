<script setup lang="ts">
// 状态徽标组件（R11 + 第八批已裁）
// 三套词表不同形不同色，带集合标签，按 collection 分列
// 枚举值来自 content.schema.mjs（单一事实源）
//
// Props:
//   collection: 'research' | 'findings' | 'instructional'
//   status:     schema 对应枚举值
defineProps<{
  collection: 'research' | 'findings' | 'instructional'
  status: string
}>()

// 词表 + 配色。CSS 类名驱动视觉差异（不同形 = 不同 class + 不同 base shape）
const BADGES: Record<string, Record<string, { label: string; cls: string }>> = {
  research: {
    draft:       { label: '草稿',   cls: 'badge-research badge-draft' },
    'in-progress': { label: '进行中', cls: 'badge-research badge-in-progress' },
    concluded:   { label: '已完成', cls: 'badge-research badge-concluded' },
    archived:    { label: '已归档', cls: 'badge-research badge-archived' }
  },
  findings: {
    'pending-validation': { label: '待验证', cls: 'badge-findings badge-pending' },
    provisional:          { label: '暂定',   cls: 'badge-findings badge-provisional' },
    confirmed:            { label: '已确认', cls: 'badge-findings badge-confirmed' },
    superseded:           { label: '已取代', cls: 'badge-findings badge-superseded' },
    retracted:            { label: '已撤回', cls: 'badge-findings badge-retracted' }
  },
  instructional: {
    designing:              { label: '设计中',     cls: 'badge-instructional badge-designing' },
    'ready-for-validation': { label: '待教学验证', cls: 'badge-instructional badge-ready' },
    validated:              { label: '已验证',     cls: 'badge-instructional badge-validated' },
    archived:               { label: '已归档',     cls: 'badge-instructional badge-archived' }
  }
}

// 集合标签（用于带集合标签的场景，R11 执行要求）
const COLLECTION_LABELS: Record<string, string> = {
  research: '研究档案',
  findings: '研究结论',
  instructional: '教学设计'
}
</script>

<template>
  <span
    v-if="BADGES[collection]?.[status]"
    :class="['badge', BADGES[collection][status].cls]"
    :title="`${COLLECTION_LABELS[collection]} · ${BADGES[collection][status].label}`"
  >
    <!-- findings 用实心圆，instructional 用实心方块，research 用实心菱形（不同形） -->
    <span class="dot" />
    {{ BADGES[collection][status].label }}
  </span>
  <span v-else class="badge badge-unknown" :title="`未知状态: ${collection}.${status}`">
    <span class="dot" />
    {{ status }}
  </span>
</template>

<style scoped>
/* 基础 */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  line-height: 1.4;
  white-space: nowrap;
}
.dot {
  width: 0.5rem;
  height: 0.5rem;
  display: inline-block;
}

/* ========== research：纯色 + 菱形 dot ========== */
.badge-research { background: #f3f4f6; color: #4b5563; }
.badge-research .dot { transform: rotate(45deg); }
.badge-draft       { background: #f3f4f6; color: #6b7280; }
.badge-in-progress { background: #dbeafe; color: #1d4ed8; }
.badge-in-progress .dot { background: #3b82f6; }
.badge-concluded   { background: #d1fae5; color: #047857; }
.badge-concluded .dot { background: #10b981; }
.badge-research.badge-archived { background: #e5e7eb; color: #6b7280; }
.badge-research.badge-archived .dot { background: #9ca3af; }

/* ========== findings：实心圆 dot ========== */
.badge-findings { background: #f3f4f6; color: #4b5563; }
.badge-findings .dot { border-radius: 50%; }
.badge-pending     { background: #eff6ff; color: #1d4ed8; }
.badge-pending .dot { background: #3b82f6; }
.badge-provisional { background: #fff7ed; color: #c2410c; }
.badge-provisional .dot { background: #f97316; }
.badge-confirmed   { background: #dcfce7; color: #15803d; }
.badge-confirmed .dot { background: #22c55e; }
.badge-superseded  { background: #f1f5f9; color: #475569; }
.badge-superseded .dot { background: #94a3b8; }
.badge-retracted   { background: #fef2f2; color: #b91c1c; }
.badge-retracted .dot { background: #ef4444; }

/* ========== instructional：实心方块 dot ========== */
.badge-instructional { background: #f3f4f6; color: #4b5563; }
.badge-instructional .dot { border-radius: 0; }
.badge-designing   { background: #f3f4f6; color: #6b7280; }
.badge-designing .dot { background: #9ca3af; }
.badge-ready       { background: #fef3c7; color: #a16207; }
.badge-ready .dot { background: #eab308; }
.badge-validated   { background: #dcfce7; color: #15803d; }
.badge-validated .dot { background: #22c55e; }
.badge-instructional.badge-archived { background: #e5e7eb; color: #6b7280; }
.badge-instructional.badge-archived .dot { background: #9ca3af; }

/* 未知 */
.badge-unknown { background: #fee2e2; color: #991b1b; }
</style>
