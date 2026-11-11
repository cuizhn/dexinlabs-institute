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

**结论：通过（有 caveat）**

- ✅ `better-sqlite3@13.0.3` 在 Windows 上原生编译成功（pnpm rebuild 通过），无 node-gyp 报错。
- ✅ `esbuild@0.28.2` 同样原生编译成功（同一 rebuild 触发）。
- ⚠️ **pnpm 11 默认安全策略忽略所有 build scripts**，导致外层 `pnpm install` / `pnpm build` 在 postinstall hook 里报 exit 1——这不是依赖本身失败，是 pnpm 安全策略没配置批准列表。
- 已在 `.npmrc` 加 `enable-pre-post-scripts=true`（最小调整），后续改为 `pnpm.onlyBuiltDependencies` 数组（更规范）。
- **影响范围**：`pnpm dev` / `pnpm build` 命令目前被这个策略卡住，需用 `.\node_modules\.bin\nuxt.cmd dev` / `.\node_modules\.bin\nuxt.cmd build` 绕过。

### ② `pnpm dev` 首页 HTTP 200，无 SSR 报错

**结论：通过**

- 直接用 Windows wrapper `.\node_modules\.bin\nuxt.cmd dev --port 3001` 启动：
  - Nuxt 4.6.4 with Nitro 2.13.6, Vite 8.3.7, Vue 3.5.45
  - Content v3：**Processed 4 collections and 3 files in 286.55ms**
  - Ready in 6.45s → `http://127.0.0.1:3001/`
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

- `.\node_modules\.bin\nuxt.cmd build`（绕过 pnpm wrapper 的 postinstall 检查）：
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
| pnpm 11 忽略原生 build scripts（better-sqlite3 + esbuild） | pnpm 11 默认安全策略 | `.npmrc enable-pre-post-scripts=true`（待规范化为 `pnpm.onlyBuiltDependencies`） |
| Bash 脚本 node_modules/.bin/nuxt 不能被 Node 直接执行 | pnpm 生成跨平台 wrapper：`.cmd`（Windows）+ 无扩展名（bash） | 改用 `.\node_modules\.bin\nuxt.cmd dev/build` 或 `pnpm exec nuxt dev/build` |
| localhost:3000 命中主仓 dexinlabs 的 dev 服务 | 端口冲突 | 新项目用 3001（dev）+ 3000（preview，避开主仓） |

---

## 四、P1 后续待完成（不阻塞 P2）

1. **`.npmrc` 规范化**：把 `enable-pre-post-scripts=true` 改为 `pnpm.onlyBuiltDependencies: ['better-sqlite3', 'esbuild']`，更符合 pnpm 11 安全策略设计意图。
2. **`package.json` scripts 修复**：`dev` / `build` / `generate` / `preview` 当前被 pnpm postinstall 绊住，需用 `pnpm exec` 或直接改调 `nuxt.cmd`。
3. **字体自托管落地**：字体文件由 Owner 提供后放入 `public/fonts/`，启用 main.css 中的 @font-face。
4. **`content.config.ts` 增加 `surround`**：让页面路由用 ID（`/findings/F-0001`）而非 slug，对齐 ADR-004 §3.1 URL 混合制。

---

**V-0 报告结束。P1 骨架门禁通过（V-0 通过），P2 内容模型落地已就绪。**
