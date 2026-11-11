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

## 架构文档仓引用总入口

见架构文档仓根目录的 `00-INDEX.md`（交付索引）与 `adr/` 目录。
