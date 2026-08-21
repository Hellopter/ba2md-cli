---
name: ba2md
description: "根据 Markdown 需求生成有源码依据的软件详细设计。先消费已挂载 wiki，把需求接到项目上；源码定位不确定时才问用户；子代理按已确认源写 briefs；按 templates 写 draft（证据写在稿里）；派结构/证据审查；过则交给用户。用于 /ba2md、BA 转 SDD、既有系统详细设计、wiki+源码调研。不要用来撰写或改写 BA/需求文档。"
---

# 生成有源码依据的详细设计

`{SKILL_DIR}/templates/` 可整包替换：布局固定（`sdd.md` 入口 + 它点名的 `sections/`），正文以磁盘为准。设计对既有系统的最小连贯改动：优先既有缝，未证明旧缝不够之前不发明平行 API / 类 / 表 / 模块 / 任务 / 事件。

## 路径

`{SKILL_DIR}` 为本 skill 目录，`{WORKSPACE}` 为工作区根。

| 类型 | 路径 | 用途 |
|------|------|------|
| 需求 | `{WORKSPACE}/requirements/*.md` | 只读。显式文件、标题/关键词、或扁平队列 |
| 登记 | `{WORKSPACE}/workspace.yaml` | sources / wiki / requirements；`language:` 控制交付物语言（缺省 `zh`） |
| 盘点 | `ba2md discover --json` | 已挂载 id + 每个 wiki 的 `tree`。内容搜索前先跑 |
| Wiki | `{WORKSPACE}/wiki/<id>/` | SUMMARY：把需求接到项目上 |
| 源码 | `{WORKSPACE}/sources/<id>/` | FACT 根。无 `sources/` 时回退 `souces/` |
| 进度 | `{WORKSPACE}/product/<slug>/progress.yaml` | 跨会话游标。形状：`assets/progress-template.yaml` |
| 笔记 | `{WORKSPACE}/product/<slug>/research-plan.md` | 主会话备忘，不是证据正文 |
| Briefs | `{WORKSPACE}/product/<slug>/briefs/<unit-id>.md` | 调研笔记。调研后 `briefs/` 为空即失败 |
| 草稿 / 终稿 | `{WORKSPACE}/product/<slug>/<slug>.draft.md` 然后 `<slug>.md` | 唯一设计交付物 |
| 审查 | `{WORKSPACE}/product/<slug>/reviews/content-review-<round>-<dimension>.md` | 子代理过程文件 |
| 模板 | `{SKILL_DIR}/templates/` | 只读 |
| 形状 | `{SKILL_DIR}/assets/` | 拷贝后填写 |

`templates/`、`requirements/`、`wiki/`、`sources/`、`souces/` 只读。产物只写 `product/<slug>/`。尊重用户显式路径。默认 slug：文件输入 `<file-stem>-sdd`，会话输入 `YYYY-MM-DD-<short-name>-sdd`；冲突则问。

不写 `wiki-position.md`、`wiki-plan.json`、`evidence-registry.md`。`progress.yaml` 禁止写入证据 ID、findings、wiki 页清单。`ba2md check --product product/<slug>` 核对游标，不是质量门。

## 续跑

每个会话第一步：读 `progress.yaml`，跳到当前 `node`，只打开该节点参考。

1. 定 slug：用户路径，或 `product/` 下唯一的 `progress.yaml`；多个则问。
2. 无文件：从 `assets/progress-template.yaml` 拷过去，填 `slug`，`node: analyze`。
3. 有文件：先读。不重做更早节点，除非 `waiting_for: user` 且用户意见被分类回更早节点。
4. 打开该节点参考（见下）。
5. 节点边界和停轮前更新 `progress.yaml`。子代理不得写该文件。

| `node` | 打开 |
|--------|------|
| `analyze` / `confirm` | 本文件对应节点 |
| `wiki` | `references/wiki.md` |
| `research` | `references/research.md`、`assets/research-brief-template.md` |
| `draft` | `references/write.md` |
| `review` | `references/review.md` |
| `wait` / `final` | `references/user.md` |

调研不打开 `templates/sections/`。

派遣中途断掉，看 `waiting_for` 与磁盘：

| `waiting_for` | 续跑 |
|---------------|------|
| `research` | unit 表对 `briefs/*.md`；缺则重派；有则验收并前进 |
| `review` | 本轮审查文件：缺则重派；有则合并文件头 `Result:`，写入 `last_result` 与 `review.draft_sha256` |
| `user` | 不再审。用户问起再复述交卷。按下一条用户消息分类 |

**已审查**当且仅当：`review.last_result` 为 `DELIVER`，本轮 `review.files.*` 由子代理写出，且 `review.draft_sha256 == draft.sha256`（均非空）。聊天 `REVIEW_WRITTEN` 只在本会话有效。磁盘有 `reviews/*.md` 本身不算。`DELIVER` 后 draft 哈希变了 → `node: review`，`last_result: none`，`round` +1，重派。

交付物散文跟 `workspace.yaml` `language:`（缺省 `zh`）。锚点、ID、代码标识、API 路径、字段/表/schema 名、配置键、引文不译。

## 证据

- **REQUIREMENT**：需求 Markdown。目标、范围、规则、验收——不是当前实现。
- **SUMMARY**：wiki。术语、归属、边界。
- **FACT**：规范、ADR、生产源码、配置、schema、部署/运维产物，带精确原文锚点。
- **PROPOSAL / DECISION / ASSUMPTION / GAP / CONFLICT**：目标设计、已选方案、未核实假设、缺失、权威不一致。

生产代码/配置/schema 高于 wiki。合同性目标行为：管辖规范高于实现。冲突记下来，不默默合并。

源码分析排除 Java 测试：`test.java`、`**/src/test/**`、`**/*Test.java`、`**/*Tests.java`、`**/*IT.java`。

证据写在 draft 里：承载句旁放原文锚点（`` `sources/<id>/…:L-L` ``）或主张 ID。第 5 章是稿内附录。精确当前标识以稿内锚点为准；brief / findings 是过程产物。

## 执行图

```text
1. 分析需求
2. 消费 wiki          # 每个可能相关的 wiki 按 wiki.md 走完
3. 锁定源              # owner + 相关进已确认源；待定才问
4. 调研                # 每个已确认源派遣一个子代理 → briefs/*.md
5. 写 Draft            # 读模板；缺事实再派 repair-*；证据写进稿
6. 审查                # 派遣结构 / 证据子代理。WRITE → 5；DELIVER → 7
7. 等反馈              # 按意见回到 3/4/5，再审再交
8. 终稿                # 仅明确「定稿」
```

有界 GAP 是合法 Draft 结果。关键 GAP 挡住终稿，不挡住写 Draft。

## 节点

### 1. 分析需求

用户不必粘贴正文。支持显式文件、标题/关键词、以及 `requirements/*.md` 扁平队列（不递归）。先索引 frontmatter/H1/H2，只通读选中单元。`README.md` / `index.md` 当导航，除非正文本身是需求。

路径、SHA-256、选择理由写入 `research-plan.md`。目标、角色、行为、约束、验收、非目标只从需求正文推导。记下用户是否点名了源码仓。

完成：选中需求有路径与哈希，且已写「是否点名源码仓」。`intake` 已填，`node: wiki`。

### 2. 消费 wiki

跑 `ba2md discover --json`（回退：`workspace.yaml` + 一层 listing），读 `references/wiki.md`，按它走完。

完成：`research-plan.md` 写清项目是什么、这条需求落在哪 / 不落在哪，每个可能相关的源有判断（owner / 相关 / 无关 / 待定）。`node: confirm`。尚未打开 `sources/` 做调研。只锁定一个 owner、maybe 未读 wiki，不算完成。

### 3. 锁定源

节点 2 的 owner + 相关 → **已确认源**（`progress.yaml` 角色：owner / collaborator）。无关标 `excluded`。默认不问。

**确定：** owner 唯一且对得上已挂载源；相关源已用 wiki 判过。工作区只有一个 `sources/<id>` 时它就是已确认源。

**不确定（一问，只问待定点，`waiting_for: user`）：** 读过对应 wiki 仍待定；0 个可对上的已挂载源；两个以上都像 owner；wiki 与 intake 点名冲突；需求指向的系统未挂载且无 wiki。

完成：已确认源表非空，已抄进 `confirmed_sources`，`node: research`。没有该表不得开源码调研。待定不要默默跳过。

### 4. 调研

读 `references/research.md`。为每个已确认源派遣一个子代理写 `briefs/<unit-id>.md`。按已确认源拆 unit，不按模板小节。

完成：每个已确认源有子代理写入的 brief（合同 + Search Log 或有界 GAP）或显式排除；`briefs/` 非空。验收后更新 `research.accepted` / `open` 与源 `status`，`node: draft`。派遣期间 `waiting_for: research`。

### 5. 写 Draft

读 `references/write.md`。先读磁盘 `templates/sdd.md`，按需求判断可选节，只打开要写的节文件。

完成：要写的节有正文或 GAP；不写的节有 N/A 或已省略。填 `draft.path` 与 `draft.sha256`，`node: review`。

### 6. 审查

读 `references/review.md`。派遣结构与证据两个子代理。主会话本步：拷模板、写 prompt、合并文件头 `Result:`。

完成：本轮各维度审查文件由子代理写出，合并结果写入 `review.last_result`、`review.draft_sha256`、`review.files`。`WRITE` → `node: draft`（缺事实则 `waiting_for: research`）。`DELIVER` → `node: wait`，`waiting_for: user`。派遣期间 `waiting_for: review`。

### 7. 交给用户

`DELIVER` 后读 `references/user.md`，交草稿路径、已确认源、关键 GAP/待决，然后停轮。下一条用户消息按该文件分类。仅明确 `定稿` / `LGTM` / `确认终稿` 后写 `{slug}.md`，`node: final`，`final: true`。沉默不是确认。

## 硬规则

- 从 `ba2md discover --json` 开始；只在具体的 `sources/<id>` 与 `wiki/<id>/…` 下搜索。
- 精确当前标识只来自稿内带原文锚点的 FACT。无依据记 GAP；不编造，不让用户猜事实。
- 每个 `ADD` 需要旧缝不足的证据。
- 审查对象是 draft；是否完成看 `last_result` + draft 哈希，不看聊天回执。
- `sections/` 里有文件不等于必须写。
- 终稿挡住：未解的关键 GAP/CONFLICT、未清的改动节、审查未 `DELIVER` 或哈希不一致、缺少明确确认。
- 除非用户明确要求，否则不 commit / push。
