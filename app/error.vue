<script setup lang="ts">
// 覆盖 Nuxt 默认错误页（第四档：中文 404 + 通用错误）
// Nuxt 4 约定文件名 error.vue；props 由框架注入（error.statusCode / error.statusMessage）
const props = defineProps<{
  error: {
    statusCode: number
    statusMessage?: string
    message?: string
  }
}>()

const is404 = props.error?.statusCode === 404
const title = is404 ? '页面未找到' : '出错了'
const detail = is404
  ? '您访问的页面不存在，或已被移动。'
  : props.error?.statusMessage || props.error?.message || '服务器暂无法处理请求。'
</script>

<template>
  <NuxtLayout>
    <div class="err-page">
      <div class="err-code">{{ error.statusCode }}</div>
      <h1>{{ title }}</h1>
      <p class="err-detail">{{ detail }}</p>
      <div class="err-actions">
        <NuxtLink to="/" class="err-btn">返回首页</NuxtLink>
        <NuxtLink to="/search" class="err-btn err-btn-secondary">进入搜索</NuxtLink>
      </div>
    </div>
  </NuxtLayout>
</template>

<style scoped>
.err-page {
  text-align: center;
  padding: 4rem 1rem;
  max-width: 32rem;
  margin: 0 auto;
}
.err-code {
  font-family: var(--font-mono);
  font-size: clamp(3.5rem, 10vw, 5.5rem);
  font-weight: 700;
  color: var(--ink-3);
  line-height: 1;
  margin-bottom: 0.75rem;
  font-variant-numeric: tabular-nums;
}
.err-page h1 {
  font-size: 1.375rem;
  margin: 0 0 0.75rem;
}
.err-detail {
  color: var(--ink-2);
  margin: 0 0 1.75rem;
  font-size: 0.9375rem;
}
.err-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
}
.err-btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  text-decoration: none;
  font-size: 0.9375rem;
  background: var(--accent);
  color: #fff;
}
.err-btn:hover { background: var(--accent-2); }
.err-btn-secondary {
  background: var(--surface);
  color: var(--ink);
  border: 1px solid var(--line);
}
.err-btn-secondary:hover { background: var(--surface-2); }
</style>
