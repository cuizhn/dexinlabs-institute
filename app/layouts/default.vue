<template>
  <div class="layout">
    <header class="site-header">
      <NuxtLink to="/" class="brand">得心研究院</NuxtLink>
      <nav class="site-nav">
        <a href="/#research">研究档案</a>
        <a href="/#findings">研究结论</a>
        <a href="/#instructional">教学设计</a>
      </nav>
    </header>
    <main class="site-main">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.layout {
  max-width: 72rem;
  margin: 0 auto;
  padding: 0 1.25rem;
}
.site-header {
  display: flex;
  align-items: baseline;
  gap: 1.5rem;
  padding: 1.25rem 0;
  border-bottom: 1px solid #e5e5e5;
}
.brand {
  font-weight: 600;
  font-size: 1.125rem;
  text-decoration: none;
  color: #111;
}
.site-nav {
  display: flex;
  gap: 1rem;
  font-size: 0.9375rem;
}
.site-nav a {
  color: #555;
  text-decoration: none;
}
.site-main {
  padding: 2rem 0 4rem;
}
</style>
