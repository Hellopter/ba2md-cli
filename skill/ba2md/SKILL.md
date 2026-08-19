---
name: ba2md
description: "根据 Markdown 需求生成有源码依据的软件详细设计。先读已挂载 wiki；intake 未点名源码仓时向 BA 确认；briefs 落盘；按 templates/sdd.md 与 sections/ 写稿；派结构/证据审查子代理；再交给 BA。用于 $ba2md、BA 转 SDD、既有系统详细设计、wiki+源码调研。不要用来撰写或改写 BA/需求文档。"
---

# 生成有源码依据的详细设计

`{SKILL_DIR}/templates/` 可整包替换为内部模板：**目录结构不变**（`sdd.md` 为入口，`sections/` 为它点名的约束文件），只换各 md 正文。读磁盘上的正文，不要假设本仓库样例措辞。

设计对既有系统的最小连贯改动。优先既有缝；未证明旧缝不够之前，不发明平行的 API、类、表、模块、任务或事件。

## 路径

`{SKILL_DIR}` 为本 skill 目录，`{WORKSPACE}` 为工作区根。

| 类型 | 路径 | 用途 |
|------|------|------|
| 需求输入 | `{WORKSPACE}/requirements/*.md` | 只读。显式文件、标题/关键词匹配、或扁平目录队列 |
| 工作区登记 | `{WORKSPACE}/workspace.yaml` | sources / wiki / requirements；`language:` 控制交付物语言（缺省 `zh`） |
| 盘点 | `ba2md discover --json` | 已挂载 id 与浅层布局。内容搜索前先跑 |
| 绊线 | `ba2md check --product product/<slug>` | 已验收 unit 则 briefs 非空；有 draft 则有审查文件 |
| Wiki | `{WORKSPACE}/wiki/<id>/` | 定位摘要。仅 SUMMARY |
| 源码 | `{WORKSPACE}/sources/<id>/` | FACT 根。仅当没有 `sources/` 时回退 `{WORKSPACE}/souces/` |
| Wiki 计划 | `{WORKSPACE}/product/<slug>/wiki-plan.json` | 本 IR 将读的 wiki 相对页。源码调研前必须有 |
| Wiki 定位 | `{WORKSPACE}/product/<slug>/wiki-position.md` | 拥有源 / 具名协作者 / 可能相关 / **已确认源** |
| 研究计划 | `{WORKSPACE}/product/<slug>/research-plan.md` | 覆盖计划、unit、执行状态 |
| Briefs | `{WORKSPACE}/product/<slug>/briefs/<unit-id>.md` | 冻结合同 + 搜索日志 + FOUND。Research 后 `briefs/` 为空即失败 |
| 登记册 | `{WORKSPACE}/product/<slug>/evidence-registry.md` | 证据、主张、问题、Decision Map |
| 审查 | `{WORKSPACE}/product/<slug>/reviews/content-review-<round>-structure.md` 与 `-evidence.md` | 子代理写；主会话不写 |
| 草稿 / 终稿 | `{WORKSPACE}/product/<slug>/<slug>.draft.md` 然后 `<slug>.md` | 仅在 BA 明确定稿后出终稿 |
| 模板 | `{SKILL_DIR}/templates/` | 可替换包，布局固定：`sdd.md` + 它点名的 `sections/` |
| 形状 | `{SKILL_DIR}/assets/` | 拷贝后填写 |

不得修改 `requirements/`、`wiki/`、`sources/`、`souces/`。尊重用户给出的显式路径。默认 slug：文件输入用 `<file-stem>-sdd`，会话输入用 `YYYY-MM-DD-<short-name>-sdd`。冲突则询问。

**输出语言。** 交付物与过程产物散文跟 `workspace.yaml` `language:`（缺省 `zh`）。证据锚点、ID、代码标识、API 路径、字段/表/schema 名、配置键、引文一律不译。

进入节点才加载：

- Wiki / Gate A：`references/wiki.md`
- 研究计划 → Brief 验收：`references/research.md`、`assets/research-brief-template.md`、`templates/sdd.md`（覆盖计划：只读各 `sections/*` 的适用性；不按节拆 unit）
- Draft：`references/draft.md`，然后 `templates/sdd.md` 与覆盖计划中每个 RELEVANT 的 `templates/sections/*.md`。完成：草稿头有 `Constraints read:`，每个 RELEVANT 节有正文或 GAP/N/A
- 内容审查（循环 A）：`references/draft.md`、`assets/content-review-report-template.md`。派结构 + 证据子代理。完成：两份 `REVIEW_WRITTEN`
- Handoff / BA / 终稿（循环 B）：`references/draft.md`。完成：已交菜单且本轮不再提问

Intake 不加载 `templates/`。

## 证据词汇

- **REQUIREMENT**：需求 Markdown。目标、范围、规则、验收——不是当前实现。
- **SUMMARY**：wiki。术语、归属、边界。
- **FACT**：规范、ADR、生产源码、配置、schema、部署/运维产物，带精确原文锚点。
- **PROPOSAL / DECISION / ASSUMPTION / GAP / CONFLICT**：目标设计、已选方案、未核实假设、缺失、权威不一致。

当前行为：生产代码/配置/schema 高于 wiki。合同性目标行为：管辖规范高于实现。冲突记下来，不默默合并。

源码分析排除 Java 测试：`test.java`、`**/src/test/**`、`**/*Test.java`、`**/*Tests.java`、`**/*IT.java`。

## 执行图

```text
需求 Intake                 # 记下用户是否点名了源码仓
  → 消费 Wiki               # wiki-plan → wiki-position（拥有 / 协作 / 可能相关）
  → Gate A                  # 确认源码仓；intake 未点名则必须问
  → 研究计划 + 调研          # 覆盖计划来自 sdd.md + sections/；按规模派子代理
       ↺ 还要调研？
  → 写 Draft                # sdd.md + 每个 RELEVANT sections/*.md
  → 内容审查                # 派结构 + 证据子代理；主会话不审
       ↺ 修复 / 改稿        # 循环 A：不见 BA
  → Handoff                 # 交菜单，停轮
       ↺ BA 意见            # 循环 B：最早节点 → 再审 → delta
  → 终稿                    # 仅明确「定稿」
```

有界 GAP 是合法 Draft 结果。关键 GAP 挡住终稿，不挡住透明写 Draft。

## 节点

### 1. 接收需求

用户不必粘贴正文。支持显式文件、标题/关键词、以及 `requirements/*.md` 扁平队列（不递归）。先索引 frontmatter/H1/H2，只通读选中单元。`README.md` / `index.md` 当导航，除非正文本身是需求。

路径、SHA-256、选择理由、行锚点写入 `research-plan.md` 与 `evidence-registry.md`，作 `R-<REQ>-NNN`。目标、角色、行为、约束、验收、非目标只从 `VERIFIED REQUIREMENT` 推导。队列中各单元独立，证据 ID 不混用。

记下用户是否 **点名了源码仓**（`sources/<id>` 或仓库名）。该标记驱动 Gate A。

完成：选中 IR 有路径、哈希、`R-*`，且已写「是否点名源码仓」。

### 2. 消费 Wiki

读 `references/wiki.md`。**第一步：** `ba2md discover --json`（回退：`workspace.yaml` + 一层 listing）。

写 `wiki-plan.json` 与 `wiki-position.md`：拥有源、具名协作者（或 `none`）、可能相关、词表、wiki GAP。读每一个 `source.md`。布局在 wiki 参考里，不在 CLI。

完成：上述标题存在，且至少一个拥有源 `sources/<id>` 可解析。此时尚未调研。

### 3. Gate A — 确认源码仓

读 wiki 参考中的 Gate A。Intake 未点名仓，或 wiki 名单与点名不一致时：出示候选表，一问确认 / 增 / 删。

完成：`wiki-position.md`（或研究计划）有 **已确认源**。没有该列表不得开源码调研。

### 4. 计划并执行调研

读 `references/research.md` 与 brief 形状。读 `templates/sdd.md` 及各节适用性，先写覆盖计划，再拆 unit。小节约束决定草稿必须有什么，不决定拆多少 unit。谁写 brief 见 research 参考中的规模规则。

完成：每个 **已确认源** 有 brief 覆盖、折入另一 brief 的边界行、或计划中的显式排除；且 `briefs/` 非空。

### 5. 写 Draft

读 `references/draft.md`。打开覆盖计划。读 `{SKILL_DIR}/templates/sdd.md`，再读每个 RELEVANT `templates/sections/*.md`，按该文件的输出格式写。N/A：一行理由或按约束省略。

承载句旁放证据/主张 ID。缺承载事实则停该节并补研究；否则记 GAP。每个 `ADD` 写明检查过的旧缝及为何不够。

完成：草稿头 `Constraints read:` 列出 `sdd.md` 与每个 RELEVANT 节文件，且每个 RELEVANT 节有正文或 GAP/N/A。无清单不得进入审查。

### 6. 内容审查（循环 A）

跑 `ba2md check --product product/<slug>`。读 draft 参考，**派**结构审查员与证据审查员。主会话不写审查 findings。

`RESEARCH_REQUIRED` / `REVISION_REQUIRED` / `RECONCILE_REQUIRED`：主代理修，再派审查。本循环不见 BA。

完成：本轮两份 `REVIEW_WRITTEN` 存在，合并结果为 `PASS`、`PASS_WITH_DISCUSSION` 或 `BLOCKED`。主会话手写的审查文件不算完成。

### 7. Handoff（循环 B）

读 draft 参考 Gate C。交审查包与关键问题菜单，然后 **停轮**。

完成：本轮不再提问。按下一条 BA 消息按 draft 参考分类；修完再派审查，用 **delta** 再交。仅在明确 `定稿` / `LGTM` / `确认终稿` 后写 `{slug}.md`。沉默或「看起来还行」不是确认。

## 硬规则

- `requirements/` 只读。先索引；队列单元彼此独立。
- 散文跟工作区语言；标识符保持原文。
- 从 `ba2md discover --json` 开始；只在具体的 `sources/<id>` 与 `wiki/<id>/…` 下搜索。
- 有 `wiki-plan.json`、`wiki-position.md` 和 **已确认源** 才开源码调研。
- 锁定拥有/协作源之前，读挂载 wiki 下每一个 `source.md`。
- Wiki 是 SUMMARY；精确当前标识与行为只来自 `VERIFIED` FACT。
- Brief 与审查 findings 是输入，不是终局证据。
- 无依据记 GAP；不编造，不让 BA 猜事实。
- 优先既有缝；每个 `ADD` 需要旧缝不足的证据。
- 实质性跨源边界核两端，否则 GAP。
- 调研覆盖每个已确认源。按 `references/research.md` 的规模规则派孩子（按不相交 root，不按模板小节）。
- 读磁盘上的 `templates/sdd.md` 与其点名的 `sections/`；内部包布局相同、正文不同。
- 内容审查是派出去的结构 + 证据；`ba2md check` 是从属绊线。
- BA 草稿评审：交关键菜单后停轮。仅当 BA 咬住分叉时一轮一问。
- 每条决议走 Decision Map 与最早受影响节点；每轮改完用 delta 再交。
- 终稿挡住：未解的关键 GAP/CONFLICT、已咬住但未确认的决策、未清的 `DIRTY` 节、缺少子代理审查文件、check 失败、缺少明确确认。
- 除非用户明确要求，否则不 commit / push。
