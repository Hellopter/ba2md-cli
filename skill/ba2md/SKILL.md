---
name: ba2md
description: "根据 Markdown 需求生成有源码依据的软件详细设计。先消费已挂载 wiki，把需求接到项目上；源码定位不确定时才问用户；子代理按已确认源写 briefs；按 templates 写 draft（证据写在稿里）；派结构/证据审查；过则交给用户。用于 /ba2md、BA 转 SDD、既有系统详细设计、wiki+源码调研。不要用来撰写或改写 BA/需求文档。"
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
| 盘点 | `ba2md discover --json` | 已挂载 id + 每个 wiki 的 `tree`（组织结构）。内容搜索前先跑 |
| Wiki | `{WORKSPACE}/wiki/<id>/` | 桥梁（SUMMARY）：把需求接到项目上 |
| 源码 | `{WORKSPACE}/sources/<id>/` | FACT 根。仅当没有 `sources/` 时回退 `{WORKSPACE}/souces/` |
| 进度 | `{WORKSPACE}/product/<slug>/progress.yaml` | **跨会话游标。** 节点、在等谁、draft/审查哈希。形状：`assets/progress-template.yaml` |
| 工作笔记 | `{WORKSPACE}/product/<slug>/research-plan.md` | 主会话备忘：需求锚点、项目理解、需求落点、已确认源。不是证据正文 |
| Briefs | `{WORKSPACE}/product/<slug>/briefs/<unit-id>.md` | 调研子代理笔记。调研后 `briefs/` 为空即失败 |
| 草稿 / 终稿 | `{WORKSPACE}/product/<slug>/<slug>.draft.md` 然后 `<slug>.md` | **唯一设计交付物。** 证据、决策、GAP 都写在稿里 |
| 审查 | `{WORKSPACE}/product/<slug>/reviews/content-review-<round>-<dimension>.md` | 子代理过程文件；审查对象是 draft |
| 模板 | `{SKILL_DIR}/templates/` | 只读。可替换包，布局固定：`sdd.md` + 它点名的 `sections/` |
| 形状 | `{SKILL_DIR}/assets/` | 拷贝后填写 |

不得修改 `templates/`、`requirements/`、`wiki/`、`sources/`、`souces/`。草稿、plan、briefs、reviews、`progress.yaml` 只写 `product/<slug>/`。尊重用户给出的显式路径。默认 slug：文件输入用 `<file-stem>-sdd`，会话输入用 `YYYY-MM-DD-<short-name>-sdd`。冲突则询问。

不写 `wiki-position.md`、`wiki-plan.json`、`evidence-registry.md`。`progress.yaml` 禁止写入证据 ID、findings、wiki 页清单。新会话可跑 `ba2md check --product product/<slug>` 核对游标与磁盘；check 不是质量门，不替代审查。

## 续跑

每个会话的第一步。不按节点懒加载。

1. 定 slug：用户给出的路径，或 `product/` 下唯一的 `progress.yaml`；多个则问。
2. 没有 `product/<slug>/progress.yaml`：从 `{SKILL_DIR}/assets/progress-template.yaml` 拷过去，填 `slug`，`node: analyze`，继续。
3. 有文件：先读。不要重做更早的节点，除非 `waiting_for: user` 且用户意见被分类回更早节点。
4. 可跑 `ba2md check --product product/<slug>` 核对指针与磁盘。
5. 跳到 `node`，只加载该节点参考（`wiki.md` / `research.md` / `draft.md`）。
6. 每个节点边界、以及停轮之前，更新 `progress.yaml`。子代理不得写该文件。

会话在派遣中途断掉时，看 `waiting_for` 与磁盘：

| `waiting_for` | 续跑 |
|---------------|------|
| `research` | unit 表对 `briefs/*.md`；缺则重派；有则验收并前进 |
| `review` | 本轮审查文件：缺则重派；有则合并文件头 `Result:`，写入 `last_result` 与 `review.draft_sha256` |
| `user` | 不再审。用户问起再复述交卷。按下一条用户消息分类 |

**已审查**当且仅当：`review.last_result` 为 `DELIVER`，本轮 `review.files.*` 由子代理写出，且 `review.draft_sha256 == draft.sha256`（均非空）。聊天里的 `REVIEW_WRITTEN` 只在本会话有效。磁盘上有 `reviews/*.md` 本身不算已审查。`DELIVER` 之后 draft 哈希变了 → 审查过期：`node: review`，`last_result: none`，`round` +1，重派。

**输出语言。** 交付物与过程产物散文跟 `workspace.yaml` `language:`（缺省 `zh`）。证据锚点、ID、代码标识、API 路径、字段/表/schema 名、配置键、引文一律不译。

进入节点才加载：

- 消费 wiki：`references/wiki.md`
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
2. 消费 wiki          # 建桥：每个可能相关的 wiki 按 wiki.md 走完
3. 锁定源              # owner + 相关进已确认源并调研；待定才问
4. 调研                # 在落点上用源码加深；每个已确认源一个子代理 → briefs/*.md
5. 写 Draft            # 读模板；缺事实可再派调研；证据写进稿
6. 审查                # 按维度派子代理，对象 = 这份 draft
      ├─ WRITE   → 回 5（缺事实必须先调研）
      └─ DELIVER → 交给用户，停轮
7. 等反馈              # 按意见回到锁定源 / 调研 / 写，再审再交
8. 终稿                # 仅明确「定稿」
```

有界 GAP 是合法 Draft 结果。关键 GAP 挡住终稿，不挡住透明写 Draft。

## 节点

### 1. 分析需求

用户不必粘贴正文。支持显式文件、标题/关键词、以及 `requirements/*.md` 扁平队列（不递归）。先索引 frontmatter/H1/H2，只通读选中单元。`README.md` / `index.md` 当导航，除非正文本身是需求。

路径、SHA-256、选择理由写入 `research-plan.md`。目标、角色、行为、约束、验收、非目标只从需求正文推导。队列中各单元独立。

记下用户是否 **点名了源码仓**（`sources/<id>` 或仓库名）。该标记参与锁定源。

完成：选中需求有路径与哈希，且已写「是否点名源码仓」。`progress.yaml` 的 `intake` 已填，`node: wiki`。

### 2. 消费 wiki

1. 跑 `ba2md discover --json`（回退：`workspace.yaml` + 一层 listing），拿到每个 wiki 的 `tree`。
2. 读 `references/wiki.md`，按它走完。

完成：`research-plan.md` 写清 **项目是什么**、**这条需求落在哪 / 不落在哪**，并且每个可能相关的源有判断（owner / 相关 / 无关 / 待定）。`progress.yaml` `node: confirm`。尚未打开 `sources/` 做调研。只锁定一个 owner、maybe 未读 wiki，不算完成。

### 3. 锁定源

把节点 2 的 **owner + 相关** 抄进 **已确认源**（`progress.yaml` 角色：owner / collaborator）。无关标 `excluded`。默认不问。

**确定（直接前进）：** owner 唯一且对得上已挂载源；相关源已用 wiki 判过。collaborator 一并调研。工作区只有一个 `sources/<id>` 时，它就是已确认源。

**不确定（一问，只问待定点，`waiting_for: user`）：** 读过对应 wiki 仍待定；0 个可对上的已挂载源；两个以上都像 owner；wiki 与 intake 点名冲突；需求指向的系统未挂载且无 wiki。

完成：`research-plan.md` 的 **已确认源** 表非空（owner，以及 wiki 判为相关的仓），且已抄进 `progress.yaml` `confirmed_sources`，`node: research`。没有该表不得开源码调研。定位已确定时 `waiting_for` 保持 `none`。待定不要默默跳过。

### 4. 调研

读 `references/research.md` 与 brief 形状。不按模板小节拆 unit，不打开 `templates/sections/`。

**每个已确认 `sources/<id>/` 一个子代理**，写那份 `briefs/<unit-id>.md`。主会话可留下它已经打开的那一棵。不按 concern、不按模板小节、不估规模。

完成：每个已确认源有 brief 路径或显式排除；且 `briefs/` 非空。`progress.yaml` 的 `research.accepted` / `open` 与源 `status` 已更新，`node: draft`。派遣期间 `waiting_for: research`。

### 5. 写 Draft

读 `references/draft.md`。顺序固定：

1. 读磁盘上的 `{SKILL_DIR}/templates/sdd.md`（大纲 + 它点名的节文件）。
2. **按需求**判断哪些可选节需要写（有没有前端、接口、库表、集成……以需求为准，不以 `sections/` 里有没有文件为准）。
3. 只打开判定要写的那些 `templates/sections/<file>`，按其输出格式写。不写的节：一行 N/A 理由，或按当时 `sdd.md` 允许省略。

缺承载事实：停该节，**再派调研子代理**，把锚点写进稿；有界搜索仍空则记 GAP。禁止用措辞填洞。

每个 `ADD` 写明检查过的旧缝及为何不够。草稿头 `Constraints read:` 列出 `sdd.md` 与实际打开过的节文件。

完成：判定要写的节有正文或 GAP；不写的节有 N/A 或已省略。无 `Constraints read:` 不得进入审查。写完后填 `draft.path` 与 `draft.sha256`（文件 SHA-256），`node: review`。

### 6. 审查

读 draft 参考，**派**子代理审这份 draft。默认两个维度：结构、证据。需要时可再派。主会话不写审查 findings。

合并结果只分两路：`WRITE`（回写；缺事实必须先调研）或 `DELIVER`（交给用户）。

完成：本轮各维度审查文件存在且由子代理写出，合并为 `WRITE` 或 `DELIVER`，并写入 `progress.yaml`：`review.last_result`、`review.draft_sha256`（= 当前 `draft.sha256`）、`review.files`。`WRITE` → `node: draft`（缺事实则 `waiting_for: research`）。`DELIVER` → `node: wait`，`waiting_for: user`。主会话手写的审查文件不算。派遣期间 `waiting_for: review`。

### 7. 交给用户

`DELIVER` 后交草稿路径、已确认源、关键 GAP/待决问题，然后 **停轮**。

完成：本轮不再提问。`progress.yaml` `node: wait`，`waiting_for: user`。下一条用户消息按 draft 参考分类。仅在明确 `定稿` / `LGTM` / `确认终稿` 后写 `{slug}.md`，并设 `node: final`、`final: true`。沉默或「看起来还行」不是确认。

## 硬规则

- `requirements/`、`templates/`、`wiki/`、`sources/` 只读。
- 散文跟工作区语言；标识符保持原文。
- 从 `ba2md discover --json` 开始；只在具体的 `sources/<id>` 与 `wiki/<id>/…` 下搜索。
- Wiki 是桥梁（SUMMARY）：每个可能相关的 `wiki/<id>/` 都走主干 + grep。相关的源进调研。精确当前标识只来自稿内带原文锚点的 FACT。
- 有 **已确认源** 才开源码调研。
- 无依据记 GAP；不编造，不让用户猜事实。
- 优先既有缝；每个 `ADD` 需要旧缝不足的证据。
- 调研：每个已确认源一个子代理。写阶段缺事实可再派。
- `progress.yaml` 是游标；子代理不写。审查是否完成看 `last_result` + draft 哈希，不看聊天回执。
- 审查对象是 draft；不过回写，过了交给用户。
- 写作/审查：先读 `sdd.md`，再按需求打开对应节文件。`sections/` 里有文件不等于必须写。
- 终稿挡住：未解的关键 GAP/CONFLICT、未清的改动节、审查未 `DELIVER` 或 draft 哈希与 `review.draft_sha256` 不一致、缺少明确确认。
- 除非用户明确要求，否则不 commit / push。
