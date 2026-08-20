---
name: ba2md
description: "根据 Markdown 需求生成有源码依据的软件详细设计。先读已挂载 wiki；与用户确认变更范围；子代理调研写 briefs；按 templates 写 draft（证据写在稿里）；派结构/证据审查子代理；过则交给用户。用于 $ba2md、BA 转 SDD、既有系统详细设计、wiki+源码调研。不要用来撰写或改写 BA/需求文档。"
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
| 盘点 | `ba2md discover --json` | 已挂载 id + 每个 wiki 的真实目录/页面树（`outline`）。内容搜索前先跑 |
| Wiki | `{WORKSPACE}/wiki/<id>/` | 定位摘要。仅 SUMMARY |
| 源码 | `{WORKSPACE}/sources/<id>/` | FACT 根。仅当没有 `sources/` 时回退 `{WORKSPACE}/souces/` |
| 工作笔记 | `{WORKSPACE}/product/<slug>/research-plan.md` | 主会话备忘：需求锚点、wiki 候选、已确认源。不是证据正文 |
| Briefs | `{WORKSPACE}/product/<slug>/briefs/<unit-id>.md` | 调研子代理笔记。调研后 `briefs/` 为空即失败 |
| 草稿 / 终稿 | `{WORKSPACE}/product/<slug>/<slug>.draft.md` 然后 `<slug>.md` | **唯一设计交付物。** 证据、决策、GAP 都写在稿里 |
| 审查 | `{WORKSPACE}/product/<slug>/reviews/content-review-<round>-<dimension>.md` | 子代理过程文件；审查对象是 draft |
| 模板 | `{SKILL_DIR}/templates/` | 只读。可替换包，布局固定：`sdd.md` + 它点名的 `sections/` |
| 形状 | `{SKILL_DIR}/assets/` | 拷贝后填写 |

不得修改 `templates/`、`requirements/`、`wiki/`、`sources/`、`souces/`。草稿、plan、briefs、reviews 只写 `product/<slug>/`。尊重用户给出的显式路径。默认 slug：文件输入用 `<file-stem>-sdd`，会话输入用 `YYYY-MM-DD-<short-name>-sdd`。冲突则询问。

不写 `wiki-position.md`、`wiki-plan.json`、`evidence-registry.md`。不运行 `ba2md check` 作为流程步骤。

**输出语言。** 交付物与过程产物散文跟 `workspace.yaml` `language:`（缺省 `zh`）。证据锚点、ID、代码标识、API 路径、字段/表/schema 名、配置键、引文一律不译。

进入节点才加载：

- Wiki / 确认范围：`references/wiki.md`
- 调研：`references/research.md`、`assets/research-brief-template.md`。调研不打开 `templates/sections/`。
- 写 Draft / 审查：`references/draft.md`。先读磁盘上的 `templates/sdd.md`，按**需求**判断哪些可选节要写，再只打开那些节对应的 `templates/sections/<file>`。不通读 `sections/`。
- 交给用户：`references/draft.md`

Intake 不加载 `templates/`。内部包整包替换 `templates/` 后，仍只认当时磁盘上的 `sdd.md` 与它点名的节文件——不要依赖本仓库样例里的注释或「适用性」段落。

## 证据词汇

- **REQUIREMENT**：需求 Markdown。目标、范围、规则、验收——不是当前实现。
- **SUMMARY**：wiki。术语、归属、边界。
- **FACT**：规范、ADR、生产源码、配置、schema、部署/运维产物，带精确原文锚点。
- **PROPOSAL / DECISION / ASSUMPTION / GAP / CONFLICT**：目标设计、已选方案、未核实假设、缺失、权威不一致。

当前行为：生产代码/配置/schema 高于 wiki。合同性目标行为：管辖规范高于实现。冲突记下来，不默默合并。

源码分析排除 Java 测试：`test.java`、`**/src/test/**`、`**/*Test.java`、`**/*Tests.java`、`**/*IT.java`。

**证据写在 draft 里。** 承载句旁放原文锚点（`` `sources/<id>/…:L-L` ``）或主张 ID。模板第 5 章（选用源、决策、冲突/缺口、术语）是稿内附录，不是另一份登记册。Brief 是调研笔记，审查 findings 是过程意见——二者都不是终局证据。

## 执行图

```text
1. 分析需求
2. 消费 wiki          # discover 实树 → 从总到分读存在的页
3. 确认范围            # 问用户：这次改哪些仓
4. 调研                # 每个已确认源一个子代理 → briefs/*.md
5. 写 Draft            # 读模板；缺事实可再派调研；证据写进稿
6. 审查                # 按维度派子代理，对象 = 这份 draft
      ├─ WRITE   → 回 5（缺事实必须先调研）
      └─ DELIVER → 交给用户，停轮
7. 等反馈              # 按意见回到确认 / 调研 / 写，再审再交
8. 终稿                # 仅明确「定稿」
```

有界 GAP 是合法 Draft 结果。关键 GAP 挡住终稿，不挡住透明写 Draft。

## 节点

### 1. 分析需求

用户不必粘贴正文。支持显式文件、标题/关键词、以及 `requirements/*.md` 扁平队列（不递归）。先索引 frontmatter/H1/H2，只通读选中单元。`README.md` / `index.md` 当导航，除非正文本身是需求。

路径、SHA-256、选择理由写入 `research-plan.md`。目标、角色、行为、约束、验收、非目标只从需求正文推导。队列中各单元独立。

记下用户是否 **点名了源码仓**（`sources/<id>` 或仓库名）。该标记驱动确认范围。

完成：选中需求有路径与哈希，且已写「是否点名源码仓」。

### 2. 消费 wiki

读 `references/wiki.md`。**第一步：** `ba2md discover --json`（回退：`workspace.yaml` + 一层 listing）。用返回的 `outline` 当结构真相，不要假设 `source.md` 存在。

按从总到分读 **outline 里实际有的页**：总揽 → 框架 → 被需求或上层页点到的局部。没有的文件跳过，记 wiki GAP。

主会话读 wiki（下一跳要问用户）。多份 `wiki/<id>/` 时，每个 wiki 可派一个子代理，只返回候选仓 + 词表 + GAP。

完成：`research-plan.md` 有 Wiki 候选（owner / collaborator / maybe，缺则 `none` 或 wiki GAP）、词表、已读页。此时尚未源码调研。

### 3. 确认范围

出示候选仓表，一问确认 / 增 / 删。Intake 未点名仓，或 wiki 候选与点名不一致时 **必须问**。已点名且与 owner + collaborator 一致则抄进已确认源，继续。

完成：`research-plan.md` 的 **已确认源** 表非空。没有该表不得开源码调研。

### 4. 调研

读 `references/research.md` 与 brief 形状。不按模板小节拆 unit，不打开 `templates/sections/`。

**每个已确认 `sources/<id>/` 一个子代理**，写那份 `briefs/<unit-id>.md`。主会话可留下它已经打开的那一棵。不按 concern、不按模板小节、不估规模。

完成：每个已确认源有 brief 路径或显式排除；且 `briefs/` 非空。

### 5. 写 Draft

读 `references/draft.md`。顺序固定：

1. 读磁盘上的 `{SKILL_DIR}/templates/sdd.md`（大纲 + 它点名的节文件）。
2. **按需求**判断哪些可选节需要写（有没有前端、接口、库表、集成……以需求为准，不以 `sections/` 里有没有文件为准）。
3. 只打开判定要写的那些 `templates/sections/<file>`，按其输出格式写。不写的节：一行 N/A 理由，或按当时 `sdd.md` 允许省略。

缺承载事实：停该节，**再派调研子代理**，把锚点写进稿；有界搜索仍空则记 GAP。禁止用措辞填洞。

每个 `ADD` 写明检查过的旧缝及为何不够。草稿头 `Constraints read:` 列出 `sdd.md` 与实际打开过的节文件。

完成：判定要写的节有正文或 GAP；不写的节有 N/A 或已省略。无 `Constraints read:` 不得进入审查。

### 6. 审查

读 draft 参考，**派**子代理审这份 draft。默认两个维度：结构、证据。需要时可再派。主会话不写审查 findings。

合并结果只分两路：`WRITE`（回写；缺事实必须先调研）或 `DELIVER`（交给用户）。不运行 `ba2md check`。

完成：本轮各维度 `REVIEW_WRITTEN` 存在，合并为 `WRITE` 或 `DELIVER`。主会话手写的审查文件不算。

### 7. 交给用户

`DELIVER` 后交草稿路径、已确认源、关键 GAP/待决问题，然后 **停轮**。

完成：本轮不再提问。下一条用户消息按 draft 参考分类。仅在明确 `定稿` / `LGTM` / `确认终稿` 后写 `{slug}.md`。沉默或「看起来还行」不是确认。

## 硬规则

- `requirements/`、`templates/`、`wiki/`、`sources/` 只读。
- 散文跟工作区语言；标识符保持原文。
- 从 `ba2md discover --json` 开始；只在具体的 `sources/<id>` 与 `wiki/<id>/…` 下搜索。
- Wiki 按 outline 从总到分读存在的页；不写死必读某个文件名。
- 有 **已确认源** 才开源码调研。
- Wiki 是 SUMMARY；精确当前标识只来自稿内带原文锚点的 FACT。
- 无依据记 GAP；不编造，不让用户猜事实。
- 优先既有缝；每个 `ADD` 需要旧缝不足的证据。
- 调研：每个已确认源一个子代理。写阶段缺事实可再派。
- 审查对象是 draft；不过回写，过了交给用户。
- 写作/审查：先读 `sdd.md`，再按需求打开对应节文件。`sections/` 里有文件不等于必须写。
- 终稿挡住：未解的关键 GAP/CONFLICT、未清的改动节、审查未 `DELIVER`、缺少明确确认。
- 除非用户明确要求，否则不 commit / push。
