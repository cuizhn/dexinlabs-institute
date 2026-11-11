# 得心研究院 · 代码仓（`dexinlabs-institute`）

本仓承载研究院研究站的运行代码、内容与构建配置（**Nuxt 4 + Nuxt Content v3**，详见架构文档 §三）。

## 架构规范的权威位置

**架构规范不在本仓**，唯一权威来源是独立的架构文档仓：

> `dexinlabs-research-architecture/`（与本仓同级目录）

该仓包含：00-INDEX 至 10 共 11 份 Markdown、`adr/ADR-001～008` 八项架构决定、Q10–Q12 裁定报告。**本仓不复制、不镜像、不建立竞争的规范副本**。

## 仓库关系（D0 已裁，2026-11-11）

| 仓 | 定位 | 权威 |
| --- | --- | --- |
| `dexinlabs-research-architecture` | 架构规范、ADR、裁定记录 | 唯一规范权威源 |
| `dexinlabs-institute`（本仓） | Nuxt 4 + Content v3 运行代码、内容、构建配置 | 运行与内容权威源 |

两仓独立；本仓不使用 Git Submodule 绑定架构文档；若代码发现与规范不一致，**回到架构文档仓提修订，不在本仓就地改**。

## 引用方式

本仓代码、README 与注释中引用架构规范时，一律以**架构文档仓的文件/段落路径**引用，例如：

- 退出码契约 → `dexinlabs-research-architecture/09-初始化执行计划与最终验收清单.md §三`
- 校验规则 → `dexinlabs-research-architecture/adr/ADR-005-关联机制.md §3.3`
- 三集合内容模型 → `dexinlabs-research-architecture/adr/ADR-003-研究内容模型与文档规范.md §3`

**不以本仓内复制品的形式存储规范**。

## 本仓 `docs/` 的范围

- 运行命令、开发回路、校验说明（`README.md`）
- 项目内部必要文档（如部署说明、团队协作约定）
- **不含架构规范、ADR、裁定记录**——这些一律放在架构文档仓并通过路径引用

## 运行命令

前提：Node `^22.22.3 || ^24.15.0 || >=26.0.0`（`engines` 已锁）、pnpm `>=11.9.0`（`packageManager` 已锁）。

```bash
pnpm install --frozen-lockfile   # 按 lockfile 精确安装
pnpm dev                         # 开发服务器（predev 先跑校验 + 建索引）
pnpm build                       # 生产构建（prebuild 先跑校验 + 建索引）
pnpm preview                     # 预览构建产物
pnpm validate                    # 只跑内容校验（scripts/validate-content.mjs）
pnpm index                       # 只重建静态索引（.index/refs.json）
```

`.index/`、`.data/`、`.nuxt/`、`.output/` 均为派生生成物，**不入库**（Q14）；删除后由 `predev` / `prebuild` 重建。

## 写作回路

1. **先登记 ID**：在 `content/registry.yaml` 追加条目（`id` / `type` / `title` / `created` / `path` / `retired`），取号只向未来取号，不回填退役编号（ADR-004 §3.2）。
2. **再复制模板**：从 `docs/templates/` 取对应模板（`research-template.md` / `finding-template.md` / `instructional-template.md`），保留全部二级标题。
3. **改 frontmatter**：`docId` 必须与注册表 `id` 一致（字段名 `docId`，F-1a）；`status` 必须取**本集合**枚举值。
4. **跑 dev**：`pnpm dev` 期间改文件即触发重建；校验失败会以非 0 退出码挡住构建。
5. **状态变更留痕**：`pending-validation → provisional` 由研究者自行升格并留痕；`provisional → confirmed` 须 Owner 显式裁定并引用出处（Q11）；`superseded` 必填 `superseded_by`；`retracted` 必留撤回原因。

## 校验说明

`scripts/validate-content.mjs` 的退出码契约以架构文档仓 `09-初始化执行计划与最终验收清单.md §三` 为唯一口径：

| 级别 | 规则 | 退出码 |
| --- | --- | --- |
| 错误级 | E1、E2、E3、E4、E5、E7、E9 | 非 0（阻断构建） |
| 警告级 | E10、W2、W3 | 0（不阻断，仅报告） |

- 规则定义与严重度以架构文档仓 `adr/ADR-005-关联机制.md §3.3` 为单一事实源。
- `E10`：`instructional.based_on` 指向 `pending-validation` 结论——报告含「未成立依据」字样，页面同时显示强警示，**不得**升级为阻断（R12）。
- **E6（证据锚点存在性）与 E8（confirmed 裁定记录标记）尚未实现**，属已知缺口，见 `docs/v-reports/` 与 P7 收口记录。

## 架构文档仓引用总入口

见架构文档仓根目录的 `00-INDEX.md`（交付索引）与 `adr/` 目录。
