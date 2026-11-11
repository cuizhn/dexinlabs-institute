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

**结论：通过（附说明）**

- 构建期无 peer dependency ERROR。
- 但 `pnpm peers check` 报 2 项未满足 peer（均来自 Nuxt 4.6.4 → unctx@3.0.1 的依赖树，非本项目直接引入）：
  - `oxc-parser` 已装 0.139.0，期望 `>=0.140.0`
  - `unplugin` 已装 2.3.11，期望 `^3.3.0`
- 影响评估：`pnpm install` / `build` / `dev` 均正常，暂未见运行影响；按 Q4 精确 pin 纪律，**不擅自升级**，仅登记待观察。

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

| # | 现象 | 实查证据 | 影响的规范 | 处置 |
| --- | --- | --- | --- | --- |
| F-1 | **frontmatter `id` 被 Content 保留字段覆盖** | `_content_findings.id = "findings/findings/F-0001.md"`（文件路径型）；schema 正则未生效 | ADR-004 §3.1、ADR-005 §3.3 E9 | **已裁 F-1a（Owner 2026-11-11）：字段改 `docId`**；ADR-003/ADR-004 已回写，代码与样例已改 |
| F-2 | **path 被强制小写** | `path = "/findings/f-0001"` | ADR-004 §3.1 URL 混合制 | 对外 URL 由 P4 `pages/findings/[id].vue` 显式路由实现，不依赖 `path` |
| F-3 | **Content 3.16.2 的 `schema` 不做校验** | 坏例 `docId: F-999`、`status: done`、`sources: []`、`scope: ''` 写入后：<br>① `pnpm build` 仍 exit 0；<br>② `.data/content/contents.sqlite` 中原样保留 `status = "done"`，可被 `queryCollection` 读出；<br>③ 在 `@nuxt/content` dist 中搜不到 `safeParse` / `parseAsync` | ADR-008 §3.1.1「Zod 做单文件校验」、R12/E9 | **E9 改由脚本执行**：`content.schema.mjs` 为单一事实源，`scripts/validate-content.mjs` 复用同一 schema；已接入 `dev`/`build` 前置。坏例实测 exit 1（4 条 E9），删后 exit 0 |

**F-3 的规范含义（不改裁定，只补实现口径）**：E9 的「Zod 单文件形状校验」成立，但**执行位置**必须是我们自己的校验脚本，不能寄望 Content 内置校验或构建失败。Zod 若失效，非法状态会被静默存储并在页面上渲染，属高危静默失败。

---

**V-0 报告结束。P1 骨架门禁通过（V-0 通过）。P2 已通过（schema 单一事实源 + registry + 模板 + 样例 + E9 脚本）；P3 部分通过（E9/registry 已实现，E10 与索引未做）。**
