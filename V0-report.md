# V-0 验证报告：Nuxt 4.6.4 + Content 3.16.2 组合可运行性

**日期**：2026-11-11
**阶段**：P1 骨架门禁
**判定**：**通过**（4/5 判据明确满足；① 有说明性 caveat，不构成失败）
**骨架位置**：`dexinlabs-institute/`（代码仓，GitHub：`cuizhn/dexinlabs-institute`）

---

## 一、版本矩阵（实际锁定）

| 包 | 锁定版本 | engines | 说明 |
| --- | --- | --- | --- |
| Node.js | **24.18.0** | Nuxt 4.6.4 = `^22.22.3 \|\| ^24.15.0 \|\| >=26.0.0` | 落在区间；余量 +0.3 |
| pnpm | **11.9.0** | 无约束 | 有原生脚本安全策略 |
| nuxt | **4.6.4** | — | — |
| @nuxt/content | **3.16.2** | `>=20.19.0`；peer `@nuxt/kit ^4.6.1` | — |
| nitro | **2.13.6** | （随 Nuxt） | — |
| vite | **8.3.7** | （随 Nuxt） | — |
| vue | **3.5.45** | — | — |
| typescript | **6.0.3** | （Q4 候选起点） | — |
| better-sqlite3 | **13.0.3** | Content v3 硬依赖 | **V-0 关键**：Windows 原生编译成功 |
| esbuild | **0.28.2** | Vite 硬依赖 | pnpm 11 安全策略默认忽略，需手动批准 |

---

## 二、判据逐条

### ① `pnpm install` 一次成功，无 node-gyp 编译失败

**结论：通过**

- ✅ `better-sqlite3@13.0.3` 在 Windows 上原生编译成功（pnpm rebuild 通过），无 node-gyp 报错，也无需 VS Build Tools。
- ✅ `esbuild@0.28.2` 同样原生编译成功（同一 rebuild 触发）。
- pnpm 11 默认不执行依赖的 build scripts，需在 `pnpm-workspace.yaml` 的 `allowBuilds` 显式批准（已配置）。
- **2026-11-11 复测**：`pnpm install` exit 0、`pendingBuilds: []`；`pnpm run build` / `pnpm run dev` 均 exit 0，**不需要绕过 pnpm wrapper**。

### ② `pnpm dev` 首页 HTTP 200，无 SSR 报错

**结论：通过**

- `pnpm run dev --port 3001`（2026-11-11 复测）：
  - Nuxt 4.6.4 with Nitro 2.13.6, Vite 8.3.7, Vue 3.5.45
  - Content v3：**Processed 4 collections and 3 files in 286.55ms**
  - Ready in 6.21s → `http://localhost:3001/`
- Nitro preview（`node .output/server/index.mjs`）curl 验证：
  - HTTP 200
  - 页面标题 "得心研究院"、三集合 `<section id="research">/id="findings">/id="instructional">` 全部渲染
  - 无 SSR runtime error（Node 24 + Windows + SSR = 正常）

### ③ `queryCollection` 对三个集合各返回 ≥1 条

**结论：通过**

- 骨架首页用 `queryCollection('research'|'findings'|'instructional').all()` 异步取三条。
- Content v3 日志显示 3 个样例文件全部处理。
- Nitro preview 首页 HTML 有三集合 section 全部渲染。

### ④ `pnpm build` 退出码 0

**结论：通过**

- `pnpm run build`（**2026-11-11 复测通过**，无需绕过 pnpm wrapper）：
  - Build complete in 12.7s
  - Total size: **23.4 MB**（10.4 MB gzip）
  - `.output/server/index.mjs` 完整产出
  - SSR 路由、Content 模块、Prose 组件全部正确打包

### ⑤ 构建日志无 peer dependency 冲突警告

**结论：通过**

- 无 `peer dependency` 字样的 ERROR/WARN。
- 仅有的 warn：Vite `optimizeDeps.include` 条目解析失败（`@nuxtjs/mdc > remark-gfm` 等），属 Nuxt 模块内部的 Vite 预构建建议，**非 peer 冲突**，不影响运行。

---

## 三、发现与修复（属 P1 最小调整，不构成技术栈修改）

| 问题 | 原因 | 修复 |
| --- | --- | --- |
| Content v3 启动报错 "requires better-sqlite3" | `@nuxt/content@3.16.2` 不再把 better-sqlite3 列为 peerDependency，要求手动安装 | `pnpm add better-sqlite3@13.0.3` |
| pnpm 11 忽略原生 build scripts（better-sqlite3 + esbuild） | pnpm 11 默认安全策略 | `pnpm-workspace.yaml` 的 `allowBuilds: {better-sqlite3: true, esbuild: true}`（pnpm 11 官方键名，已从 pnpm.mjs 提示文案核对）；`.npmrc` 已删除（`enable-pre-post-scripts` 与本问题无关） |
| Bash 脚本 node_modules/.bin/nuxt 不能被 Node 直接执行 | pnpm 生成跨平台 wrapper：`.cmd`（Windows）+ 无扩展名（bash） | 改用 `.\node_modules\.bin\nuxt.cmd dev/build` 或 `pnpm exec nuxt dev/build` |
| localhost:3000 命中主仓 dexinlabs 的 dev 服务 | 端口冲突 | 新项目用 3001（dev）+ 3000（preview，避开主仓） |

---

## 四、修复清单执行结果（2026-11-11 复测）

| # | 原清单项 | 执行结果 |
| --- | --- | --- |
| 1 | `.npmrc` 规范化为 `onlyBuiltDependencies` | **已完成（结论修正）**：`.npmrc` 已删除；批准列表实际落在 `pnpm-workspace.yaml` 的 **`allowBuilds`**（pnpm 11 正确键名，`onlyBuiltDependencies` 在本版 dist 中已无匹配）。删除后 `pnpm install` exit 0，`pendingBuilds: []` |
| 2 | `package.json` scripts 修复 | **无需修复（原判断有误）**：`pnpm install` / `pnpm run build` / `pnpm run dev` 三者复测均 exit 0；`pnpm run dev` Ready 6.21s、首页 HTTP 200、三集合 section 全部渲染。此前失败是首次安装阶段的一次性现象，不是脚本本身问题，故 scripts 保持原样 |
| 3 | 字体自托管落地 | **未执行（缺资产）**：仓内无字体文件，`public/fonts/` 与 `@font-face` 注释保持占位；不伪造字体文件。待 Owner 提供后启用 |
| 4 | `content.config.ts` 增加 `surround` | **原方案有误，已改判**：`surround` 是「上一篇/下一篇」导航，与 URL 形态无关。ID 路由由文件命名 + 详情页显式路由决定，属 P4 范围（详见 §五） |

---

## 五、新发现：Content v3 与 ADR-004 的两处落地冲突（P2/P4 前置）

用 `.data/content/contents.sqlite` 实查三集合记录，确认两处与架构规范的偏差：

| # | 现象 | 实查证据 | 影响的规范 | 性质 |
| --- | --- | --- | --- | --- |
| F-1 | **frontmatter `id` 被 Content 保留字段覆盖**，schema 的正则实际上没校验到作者写的 ID | `_content_findings.id = "findings/findings/F-0001.md"`（文件路径型），而作者写的是 `F-0001`；`z.object({ id: /^F-\d{4}$/ })` 未报错 | ADR-004 §3.1 ID 形态、ADR-005 §3.3 E9 单文件校验 | **实现层冲突**，需在 P2 定字段名 |
| F-2 | **path 被强制小写** | `path = "/findings/f-0001"`，非 ADR 要求的 `/findings/F-0001` | ADR-004 §3.1 URL 混合制（结论详情用 ID） | **实现层冲突**，需在 P4 用显式 `[id].vue` 路由 + 自建映射解决 |

**待 Owner 一句话确认的选项（F-1，不自行裁定）**：

- **A（建议）**：frontmatter 字段改名为 `docId`，schema 校验 `docId` 正则；展示与引用仍用 `F-0001`。代价：ADR-004 要补一句「frontmatter 字段名为 `docId`，`id` 为 Content 保留字段」。
- **B**：保留 `id` 字段名，E9 改为校验 `stem`（`findings/F-0001`）而非 frontmatter `id`。代价：E9 依赖平台派生字段，schema 表达力弱。

**F-2 处理**：Content 的 `path` 无法保留大写，但 P4 会用 `pages/findings/[id].vue` 显式匹配 `F-0001` 并 query 查询，规范要求的对外 URL 仍可实现；届时以路由测试为准，不依赖 `path` 字段。

---

**V-0 报告结束。P1 骨架门禁通过（V-0 通过）。P2 开工前置：F-1 字段名需 Owner 确认；F-2 属 P4 路由实现。**
