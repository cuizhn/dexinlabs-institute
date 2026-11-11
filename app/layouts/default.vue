<script setup lang="ts">
// 移动端导航折叠（第三档）
// 保持桌面端 nav 结构完全不变，仅新增一个折叠按钮 + navOpen 状态
const navOpen = ref(false)

// 路由变化时自动收起移动端菜单（避免展开停留在目标页）
const route = useRoute()
watch(() => route.path, () => { navOpen.value = false })
</script>

<template>
  <div class="layout">
    <header class="site-header">
      <NuxtLink to="/" class="brand">得心研究院</NuxtLink>

      <!-- 移动端折叠按钮：保持现有 nav 列表结构，不引入新嵌套 -->
      <button
        class="nav-toggle"
        :aria-expanded="navOpen"
        aria-label="切换导航"
        @click="navOpen = !navOpen"
      >
        <span v-if="navOpen" aria-hidden="true">×</span>
        <span v-else aria-hidden="true">☰</span>
      </button>

      <nav class="site-nav" :class="{ open: navOpen }">
        <NuxtLink to="/research">研究档案</NuxtLink>
        <NuxtLink to="/findings">研究结论</NuxtLink>
        <NuxtLink to="/instructional">教学设计</NuxtLink>
        <NuxtLink to="/search" class="nav-search">搜索</NuxtLink>
      </nav>
    </header>
    <main class="site-main">
      <slot />
    </main>
    <footer class="site-footer">
      <span>阶段 1 MVP 骨架 · 三集合状态徽标按集合分列（R11 + 第八批）</span>
    </footer>
  </div>
</template>

<style scoped>
.layout {
  max-width: 72rem;
  margin: 0 auto;
  padding: 0 1.25rem;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ============ 粘性毛玻璃页头（第三档） ============ */
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: baseline;
  gap: 1.5rem;
  padding: 1rem 0;
  border-bottom: 1px solid var(--line);
  background: color-mix(in srgb, var(--bg) 82%, transparent);
  backdrop-filter: blur(8px) saturate(1.4);
  -webkit-backdrop-filter: blur(8px) saturate(1.4);
}
/* color-mix 不被支持时回退（极旧浏览器） */
@supports not (background: color-mix(in srgb, #fff 50%, transparent)) {
  .site-header { background: var(--bg); }
}

.brand {
  font-weight: 600;
  font-size: 1.125rem;
  text-decoration: none;
  color: var(--ink);
}
.site-nav {
  display: flex;
  gap: 1rem;
  font-size: 0.9375rem;
  margin-left: auto;
}
.site-nav a {
  color: var(--ink-2);
  text-decoration: none;
  transition: color 0.12s ease;
}
.site-nav a.router-link-active { color: var(--ink); font-weight: 500; }
.site-nav a:hover { color: var(--ink); }
.nav-search { /* margin-left: auto 已由父级 flex + nav margin-left:auto 处理 */ }

/* 移动端折叠按钮（第三档） */
.nav-toggle {
  display: none;
  margin-left: auto;
  background: none;
  border: 1px solid var(--line);
  border-radius: 4px;
  color: var(--ink-2);
  font-size: 1.125rem;
  line-height: 1;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  font-family: inherit;
}
.nav-toggle:hover { color: var(--ink); border-color: var(--ink-3); }

/* ============ 布局主体（第三档无改动） ============ */
.site-main {
  padding: 2rem 0 4rem;
  flex: 1;
  width: 100%;
}
.site-footer {
  border-top: 1px solid var(--line);
  padding: 1rem 0;
  color: var(--ink-3);
  font-size: 0.75rem;
}

/* ============ 移动端断点：< 52rem ============ */
@media (max-width: 52rem) {
  .site-nav {
    display: none;
    position: absolute;
    top: 100%;
    right: 1.25rem;
    flex-direction: column;
    gap: 0;
    min-width: 10rem;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 6px;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
    padding: 0.375rem 0;
    margin: 0;
  }
  .site-nav.open { display: flex; }
  .site-nav a {
    padding: 0.5rem 0.875rem;
    font-size: 0.875rem;
  }
  .site-nav a.router-link-active {
    background: var(--surface-2);
  }
  .nav-toggle { display: inline-flex; }
  .site-header {
    align-items: center;
  }
}
</style>
