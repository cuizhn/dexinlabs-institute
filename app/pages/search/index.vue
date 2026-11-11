<script setup lang="ts">
// /search 占位页 — Q15 未定（方向暂定首选 B，须 V-1/V-2 spike 证据）
// T9 明确禁止：在 Q15 未定前实现搜索逻辑
useHead({ title: '搜索 · 得心研究院' })
</script>

<template>
  <div class="search-placeholder">
    <h1>搜索</h1>
    <div class="ph-card">
      <h2>⏸ 搜索方案待定（Q15）</h2>
      <p>
        搜索的最终方案须等 V-1（FTS5 中文实测）和 V-2（Intl.Segmenter 切词质量）spike
        完成后再定案。方向暂定首选
        <a href="#" class="ph-link">方案 B</a>
        （queryCollectionSearchSections + MiniSearch + Intl.Segmenter），
        最终取值仍以 Owner 裁定为准。
      </p>
      <p class="ph-note">
        本占位页只提供入口，<strong>不</strong>实现搜索逻辑、不接入任何搜索库。
        正式搜索在 P5 技术验证（V-1～V-5）完成后进入 P6-P7 落地。
      </p>
      <div class="ph-spike">
        <strong>Q15 相关 spike</strong>
        <ul>
          <li>V-1：Nuxt Content 内置 FTS5 中文检索能力实测</li>
          <li>V-2：Intl.Segmenter 中文分词质量实测</li>
          <li>V-3：公式索引范围与锚点冲突实测</li>
          <li>V-4：SSR 部署下 MiniSearch 运行形态实测</li>
          <li>V-5：结果高亮与跳转位置实测</li>
        </ul>
      </div>
      <NuxtLink to="/" class="ph-back">← 返回首页</NuxtLink>
    </div>
  </div>
</template>

<style scoped>
h1 { font-size: 1.5rem; margin: 0 0 1rem; }
.ph-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  max-width: 36rem;
}
.ph-card h2 {
  font-size: 1rem;
  margin: 0 0 0.75rem;
  color: #334155;
}
.ph-card p { color: #475569; font-size: 0.9375rem; line-height: 1.6; }
.ph-link { color: #1a56db; }
.ph-note {
  background: #fffbeb;
  border-left: 3px solid #fde68a;
  padding: 0.5rem 0.75rem;
  border-radius: 0 4px 4px 0;
  margin-top: 0.75rem;
  font-size: 0.875rem;
  color: #854d0e;
}
.ph-spike {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px dashed #cbd5e1;
}
.ph-spike strong {
  font-size: 0.875rem;
  color: #475569;
  display: block;
  margin-bottom: 0.5rem;
}
.ph-spike ul { padding-left: 1.25rem; margin: 0; }
.ph-spike li {
  font-size: 0.8125rem;
  color: #64748b;
  padding: 0.125rem 0;
}
.ph-back {
  display: inline-block;
  margin-top: 1rem;
  font-size: 0.875rem;
  color: #1a56db;
  text-decoration: none;
}
</style>
