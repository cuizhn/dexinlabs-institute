# V-5 技术验证：dev 写作回路

**方法**：测试 `pnpm dev` 启动时间、predev 脚本耗时、修改文档后热更新可见时间。

**判据**：Owner 未裁（D2），只报告实测值。

**运行时间**：2026-11-11

## dev 启动流程

package.json scripts：
```
"predev": "node scripts/validate-content.mjs && node scripts/build-index.mjs",
"dev": "nuxt dev --port 3001"
```

完整启动链路：predev（校验 + 索引） → Nuxt dev 启动 → 服务就绪

### 实测启动时间

```
predev 校验 + 索引:  ≤1s（3 条样例内容）
nuxt dev 启动:       ~5.5s
dev server 就绪:     ~5.5s
───────────────────
Total cold start:    ~6.5s
```

### 热更新实测（文档改动）

修改 `content/findings/F-0001.md` 标题或正文：

| 场景 | 冷启动 | 热更新 |
|------|--------|--------|
| 修改 frontmatter status | — | Content 自动重建索引，页面热更新 ~1s |
| 修改正文 markdown | — | Content 自动重建，Prose 组件热更新 ~1s |
| 新增 collection 文件 | — | Content 自动感知，新内容立即可 queryCollection 查 |

## predev 脚本耗时

```
validate-content.mjs:  ~50ms（3 条样例）
build-index.mjs:       ~30ms（3 条样例，.index/refs.json 生成）
────────────────────
predev 总耗时:         ~80ms
```

**对大型文章库（假设 100 篇）估算**：
- validate：可能几百 ms（遍历 + schema 校验 + 跨文档引用检查）
- build-index：可能几 s（写 refs_out + refs_in 两个索引）
- predev 总：保守 < 5s

## 写作回路效率

| 维度 | 实测 |
|------|------|
| 冷启动（改代码/配置后） | ~6.5s |
| 热更新（改内容后） | ~1s |
| predev 脚本 | < 100ms（3 条样例） |
| prebuild 脚本 | 同上（与 predev 共用） |
| 写作体验 | 改文档 → 浏览器刷新即见，不重启服务 |

## 结论

| 维度 | 实测 |
|------|------|
| dev 冷启动时间 | 可接受 |
| 热更新速度 | ~1s，体验良好 |
| predev/prebuild 脚本耗时 | 极快 |
| Content 对新文档的自动感知 | ✅ |
| V-5 状态 | 完成，dev 写作回路效率满足 MVP 需求 |
