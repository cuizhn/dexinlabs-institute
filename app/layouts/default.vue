<template>
  <div class="layout">
    <header class="site-header">
      <NuxtLink to="/" class="brand">得心研究院</NuxtLink>
      <nav class="site-nav">
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
.site-header {
  display: flex;
  align-items: baseline;
  gap: 1.5rem;
  padding: 1.25rem 0;
  border-bottom: 1px solid var(--line);
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
}
.site-nav a {
  color: var(--ink-2);
  text-decoration: none;
}
.site-nav a.router-link-active { color: var(--ink); font-weight: 500; }
.nav-search { margin-left: auto; }
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
</style>
