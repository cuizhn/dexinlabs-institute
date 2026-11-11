// 架构依据：
// - 技术栈与渲染形态：dexinlabs-research-architecture/adr/ADR-002-技术栈与Nuxt-Content选型.md §3
// - 页面结构与阅读体验：dexinlabs-research-architecture/adr/ADR-006-页面结构与阅读体验.md
// 本文件只做运行配置，不复制规范正文。
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  // Q17 已裁方向：SSR（不是技术验证结论，最终取值随 Q15 spike 审视）
  ssr: true,

  modules: ['@nuxt/content'],

  // 公式渲染已落地（V-6 已验证 Content v3 兼容）
  // Content v3 的插件配置在 content.build.markdown，且为 name → options 映射
  content: {
    build: {
      markdown: {
        remarkPlugins: { 'remark-math': {} },
        rehypePlugins: { 'rehype-katex': {} }
      }
    }
  },

  css: ['~/assets/css/main.css', 'katex/dist/katex.min.css'],

  // 字体自托管（ADR-006 §3.4，禁 Google Fonts）；字体文件由 Owner 提供后放入 public/fonts/
  app: {
    head: {
      htmlAttrs: { lang: 'zh-CN' },
      title: '得心研究院',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }]
    }
  },

  // 阶段 1 禁止：不引入独立业务数据库 / 独立 API / 在线编辑
  // 部署：Vercel Git 集成构建，Nitro 自动识别，不写 vercel.json（09 §5.3）
})
