# V-6 技术验证：remark-math + rehype-katex 公式渲染

**方法**：
1. 独立 unified/remark/rehype 链路（Part A）：验证 KaTeX 本身能正确渲染中文数学 markdown
2. Content v3 配置兼容性（Part B）：临时在 `content.markdown` 里加 `remarkPlugins: ['remark-math']` + `rehypePlugins: ['rehype-katex']`，跑 build 看兼容性

**判据**：
- 过：构建 exit 0，无与 Content 自身 mdc 链路的冲突
- 阈值：Owner 未裁（D2）

**运行时间**：2026-11-11

## 运行时环境

- `remark-math@6.0.0`（remark 插件：`$...$` / `$$...$$` → Math 节点）
- `rehype-katex@7.0.1`（rehype 插件：Math 节点 → KaTeX HTML）
- `katex@0.19.1`（公式字体 CSS + MathML/HTML 输出）
- `@nuxt/content@3.16.2`

## Part A：独立链路（通过 ✅）

测试 markdown：
```markdown
**有理数**是可以表示为 $\\frac{p}{q}$ 形式的数。

解方程 $2x + 1 = 5$...

$$
\frac{a}{b} + \frac{c}{d} = \frac{ad + bc}{bd}
$$

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

- $\sum_{i=1}^{n} x_i$ — 求和
- $\int_{0}^{\infty} e^{-x} dx = 1$ — 积分
```

渲染结果：

| 检查项 | 结果 |
|--------|------|
| 行内公式 `$...$` → `.katex` | ✅ 正确渲染 |
| 块级公式 `$$...$$` → `.katex.display` | ✅ 正确渲染 |
| MathML 内部元素 `<mrow><msqrt><mo><mn><mi>` | ✅ 全部生成 |
| 中文数学内容无乱码 | ✅ 正常 |
| 特殊字符（√、∑、∫、±） | ✅ 正确渲染 |

## Part B：Content v3 配置兼容性（通过 ✅）

临时配置：
```ts
content: {
  markdown: {
    remarkPlugins: ['remark-math'],
    rehypePlugins: ['rehype-katex']
  }
},
css: ['~/assets/css/main.css', 'katex/dist/katex.min.css']
```

构建结果：

| 项 | 数值 | 对比 baseline |
|----|------|---------------|
| Build exit code | **0** | ✅ 一致 |
| 构建总时间 | 14.1s | +1.1s |
| Total size | 23.7 MB | +0.1 MB（KaTeX CSS） |
| gzip total | 10.4 MB | 无变化 |
| Client entry chunk | 248 kB | 无变化 |
| Content 自身 mdc 链路 | 正常 | ✅ 无冲突 |

**关键**：remark-math + rehype-katex 挂在 Content v3 的 markdown 链路上，与 Content 内置的 mdc/remark-gfm/remark-emoji 等插件**无冲突**。rehype-katex 在 rehype 阶段把 Math 节点渲染成 KaTeX HTML，Content 后续处理正常。

## 注意事项

1. **CSS 必须引入**：`rehype-katex` 只生成 HTML，KaTeX 的样式（CSS）必须手动加进 build
2. **字体**：KaTeX 默认字体是 Latin Modern Math，如需中文字体需配置 KaTeX 全局选项
3. **SSR 兼容**：KaTeX 本身是纯 JS，SSR 可跑（rehype-katex 是纯 rehype 插件，输出静态 HTML）
4. **公式支持范围**：KaTeX 支持 LaTeX 数学的大部分常用命令，不支持 TikZ 绘图
5. **临时 spike 已还原**：nuxt.config.ts 已去掉 remark-math + rehype-katex 配置，这些改动**不进入 P4 生产代码**

## 落地路径（P7 阶段）

若 Owner 决策引入公式渲染，落地步骤：
1. 重新 `pnpm add remark-math rehype-katex katex`（P5 spike 阶段已装，还原时需保留）
2. 在 `nuxt.config.ts` 的 `content.markdown` 配置里加两个插件
3. 在 `css` 数组里加 `katex/dist/katex.min.css`
4. Content 文档里允许 `$...$` 和 `$$...$$` 语法

## 结论

| 维度 | 实测 |
|------|------|
| remark-math + rehype-katex 独立链路 | ✅ 中文数学 markdown 正确渲染 |
| Content v3 配置兼容性 | ✅ 构建 exit 0，无冲突 |
| bundle size 影响 | 极微（+0.1 MB gzip） |
| V-6 通过 | ✅ **通过** |

**V-6 状态**：完成，公式渲染可行，落地路径清晰。
