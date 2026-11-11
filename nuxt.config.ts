// 架构依据：
// - 技术栈与渲染形态：dexinlabs-research-architecture/adr/ADR-002-技术栈与Nuxt-Content选型.md §3
// - 页面结构与阅读体验：dexinlabs-research-architecture/adr/ADR-006-页面结构与阅读体验.md
// 本文件只做运行配置，不复制规范正文。
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  // Q17 已裁方向：SSR（不是技术验证结论，最终取值随 Q15 spike 审视）
  ssr: true,

  modules: ['@nuxt/content'],

  css: ['~/assets/css/main.css'],

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
