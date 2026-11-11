<script setup lang="ts">
// 详情页关联面板组件（ADR-006 §3 + Q8 已裁混合制路由）
// 根据当前文档的集合类型显示对应的关联分区：
//   research    → 关联 findings（研究结论） + 关联 instructional（教学设计）
//   findings    → sources（来源 research） + instructional（关联教学设计）+ 相关 findings
//   instructional → based_on（引用 findings）+ research（关联研究档案）
//
// Props:
//   current:        当前文档 frontmatter + Content 内置字段
//   currentCollection: 'research' | 'findings' | 'instructional'
//   allResearch / allFindings / allInstructional: 全量查询结果（用于反查）
//
// 路由生成逻辑同 CollectionList：
//   findings 详情用 docId（显式路由绕过小写 path）
//   research / instructional 详情用 slug
//
// 跨文档引用的目标状态徽标（E10 场景）：
//   当 findings/instructional 详情的关联对象状态为 pending-validation 时，
//   面板显示「未成立依据」警示（R12 + 第八批裁定）

const props = defineProps<{
  current: any
  currentCollection: 'research' | 'findings' | 'instructional'
  allResearch: any[]
  allFindings: any[]
  allInstructional: any[]
}>()

// 路由生成（与 CollectionList 保持一致）
// Content v3 的 stem 包含集合前缀（实测 stem = 'research/sample-research'）
// findings 显式路由用 docId（绕过小写 path，F-2）
const itemPath = (collection: string, item: any) => {
  if (collection === 'findings') return `/findings/${item.docId}`
  return `/${item.stem}`
}

// 按 docId 查文档
const findByDocId = (arr: any[], docId: string) =>
  arr.find((d: any) => d.docId === docId)

// 按 ID 数组查全量（自动过滤不存在的，构建阶段应已被 E2 捕获）
const resolve = (arr: any[], ids: string[]) =>
  ids.map((id: string) => findByDocId(arr, id)).filter(Boolean)

// 当前文档的关联数据（computed-like getter，模板直接用）
const relations = () => {
  const c = props.current
  if (props.currentCollection === 'research') {
    return {
      findings: resolve(props.allFindings, c.findings || []),
      instructional: resolve(props.allInstructional, (c.findings || [])
        .flatMap((fId: string) => {
          const f = findByDocId(props.allFindings, fId)
          return f?.instructional || []
        }))
    }
  }
  if (props.currentCollection === 'findings') {
    return {
      sources: resolve(props.allResearch, c.sources || []),
      instructional: resolve(props.allInstructional, c.instructional || []),
      relatedFindings: resolve(props.allFindings, [...(c.instructional || [])]
        .flatMap((ci: string) => {
          const inst = findByDocId(props.allInstructional, ci)
          return inst?.based_on || []
        })
        .filter((id: string) => id !== c.docId))
    }
  }
  // instructional
  return {
    basedOn: resolve(props.allFindings, c.based_on || []),
    research: resolve(props.allResearch, c.research || [])
  }
}

// 是否需要「未成立依据」警示（R12 + 第八批 E10）
const hasPendingValidationWarning = (items: any[]) =>
  items.some((d: any) => d.status === 'pending-validation')
</script>

<template>
  <aside class="related-panels">
    <!-- research 详情：关联研究结论 + 关联教学设计 -->
    <template v-if="currentCollection === 'research'">
      <section class="rp-section" v-if="relations().findings.length">
        <h4>关联研究结论</h4>
        <ul>
          <li v-for="f in relations().findings" :key="f.docId">
            <NuxtLink :to="itemPath('findings', f)">
              <span class="rp-id">{{ f.docId }}</span> {{ f.title }}
            </NuxtLink>
            <StatusBadge collection="findings" :status="f.status" />
          </li>
        </ul>
      </section>
      <section class="rp-section" v-if="relations().instructional.length">
        <h4>关联教学设计</h4>
        <ul>
          <li v-for="c in relations().instructional" :key="c.docId">
            <NuxtLink :to="itemPath('instructional', c)">
              <span class="rp-id">{{ c.docId }}</span> {{ c.title }}
            </NuxtLink>
            <StatusBadge collection="instructional" :status="c.status" />
          </li>
        </ul>
      </section>
    </template>

    <!-- findings 详情：来源研究 + 关联教学设计 + 相关结论 -->
    <template v-else-if="currentCollection === 'findings'">
      <section class="rp-section" v-if="relations().sources.length">
        <h4>来源研究</h4>
        <ul>
          <li v-for="r in relations().sources" :key="r.docId">
            <NuxtLink :to="itemPath('research', r)">
              <span class="rp-id">{{ r.docId }}</span> {{ r.title }}
            </NuxtLink>
            <StatusBadge collection="research" :status="r.status" />
          </li>
        </ul>
      </section>
      <section class="rp-section" v-if="relations().instructional.length">
        <h4>关联教学设计</h4>
        <ul>
          <li v-for="c in relations().instructional" :key="c.docId">
            <NuxtLink :to="itemPath('instructional', c)">
              <span class="rp-id">{{ c.docId }}</span> {{ c.title }}
            </NuxtLink>
            <StatusBadge collection="instructional" :status="c.status" />
          </li>
        </ul>
      </section>
    </template>

    <!-- instructional 详情：引用研究结论（based_on）+ 关联研究档案 -->
    <template v-else>
      <section class="rp-section" v-if="relations().basedOn.length">
        <h4>依据研究结论</h4>
        <ul>
          <li v-for="f in relations().basedOn" :key="f.docId">
            <NuxtLink :to="itemPath('findings', f)">
              <span class="rp-id">{{ f.docId }}</span> {{ f.title }}
            </NuxtLink>
            <StatusBadge collection="findings" :status="f.status" />
            <span v-if="f.status === 'pending-validation'" class="e10-warn">未成立依据</span>
          </li>
        </ul>
        <p v-if="hasPendingValidationWarning(relations().basedOn)" class="e10-note">
          以上引用含 <code>status = pending-validation</code> 的结论——E10 警告级，仅可作讨论参考，不得视为已成立研究依据。
        </p>
      </section>
      <section class="rp-section" v-if="relations().research.length">
        <h4>关联研究档案</h4>
        <ul>
          <li v-for="r in relations().research" :key="r.docId">
            <NuxtLink :to="itemPath('research', r)">
              <span class="rp-id">{{ r.docId }}</span> {{ r.title }}
            </NuxtLink>
            <StatusBadge collection="research" :status="r.status" />
          </li>
        </ul>
      </section>
    </template>

    <section v-if="Object.values(relations()).every(v => !v || v.length === 0)"
             class="rp-section rp-empty">
      <p>暂无关联</p>
    </section>
  </aside>
</template>

<style scoped>
.related-panels {
  background: var(--surface);
  border-left: 1px solid var(--line);
  padding: 1rem 1.25rem;
  min-width: 16rem;
}
.rp-section { margin-bottom: 1.25rem; }
.rp-section h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--ink-2);
  margin: 0 0 0.5rem;
  text-transform: none;
}
.rp-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.rp-section li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0;
  border-bottom: 1px dashed var(--line);
  font-size: 0.875rem;
  flex-wrap: wrap;
}
.rp-id {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--ink-3);
  min-width: 4rem;
}
.rp-section a {
  color: var(--accent-2);
  text-decoration: none;
  flex: 1;
}
.rp-section a:hover { text-decoration: underline; }
.rp-empty p {
  color: var(--ink-3);
  font-size: 0.8125rem;
  margin: 0;
}
.e10-warn {
  font-size: 0.75rem;
  background: #fef3c7;
  color: #a16207;
  padding: 0.0625rem 0.375rem;
  border-radius: 3px;
  font-weight: 500;
}
.e10-note {
  font-size: 0.75rem;
  color: #a16207;
  background: #fffbeb;
  padding: 0.5rem 0.625rem;
  border-radius: 4px;
  margin: 0.5rem 0 0;
  border: 1px solid #fde68a;
}
.e10-note code {
  font-family: ui-monospace, monospace;
  font-size: 0.6875rem;
  background: #fef3c7;
  padding: 0 0.25rem;
  border-radius: 2px;
}
</style>
