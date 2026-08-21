# 调研与 Brief

在 wiki 落点上用源码加深。Brief 是子代理笔记，永不替代 draft 锚点。每个完成 unit 写 `product/<slug>/briefs/<unit-id>.md`（形状：`assets/research-brief-template.md`）。调研之后 `briefs/` 为空即失败。

按已确认源拆 unit，不按模板小节，不打开 `templates/sections/`。

## 工作笔记

`research-plan.md` 只给主会话备忘：需求输入（路径、SHA-256）与解读、是否点名源码仓、盘点来源、项目理解 / 需求落点 / 已读 wiki / 词表 / Wiki GAP、候选源、已确认源、研究 unit 表。执行状态写在 `progress.yaml`。

```markdown
## 已确认源
| 角色 | Source ID | Root | 覆盖 |
|------|-----------|------|------|
| owner / collaborator | | `sources/<id>/` | brief 路径 / 排除（理由） |

## 研究单元
| Unit ID | Trigger | Source ID | Questions | Brief path | Status |
|---------|---------|-----------|-----------|------------|--------|
| | initial/repair | | | `briefs/<unit-id>.md` | |
```

表格保持瘦。一两行加显式 GAP 好过空想大表。

## Unit

每个已确认源 root 一份 brief。仅当第二关注点需要不同搜索根时才再拆。`excluded` 不开。节点 3 仍标 maybe 的先回到 wiki 判断或问用户。

会改变承载标识（API / 表 / 事件 / 鉴权 / 缝）且有具体搜索假设 → 开 unit 或折进本批。

| 阶段 | root | 谁写 |
|------|------|------|
| 调研 | 每个已确认 `sources/<id>/` | 一个子代理，写那份 brief |
| 写稿补搜 | 点名的缺失源 / 符号 | 一个 `repair-*` 子代理 |

主会话可留下它本轮已经打开的那一棵，自己写那份。同一 `sources/<id>`、同一假设 → 一个写者。子代理只写自己的 brief，不写 SDD、不写平行证据库。

## Unit I/O

开工前 brief 已有冻结的 `## Unit Contract`：unit id、trigger、source id、具体 `sources/<id>/…` 根、`R-*` 摘录、有界问题、范围外、不得猜测、输出路径。

过程：只在指定 root（+ 点名的 wiki 页）下搜。只写这一份 brief。不改计划、draft、其他 brief。Java 测试排除同 `SKILL.md`。

完成：Search Log（含空搜）以及 Evidence Candidates 和/或有界 GAP。Brief 里的 FACT 只标 `FOUND`。写 draft 时主会话重开原文锚点。

若派遣：先写好填完合同的 brief。Prompt 含绝对 brief 路径，以及：「只读并更新这一文件。最后动作是保存该 brief。只返回：`BRIEF_WRITTEN <path>` + candidate 计数。」不接受聊天倾倒当 brief。

## 验收

每批之后，用 `briefs/*.md` 对照未完成 unit。缺文件 = `FAILED_NO_BRIEF` — 重派或补写。然后每份 brief：

1. Source ID/root 偏离合同则拒。
2. 抽查将写入 draft 的承载锚点——重开原文，不是每一行 FOUND。
3. 错误候选写明理由后拒。
4. 新的不相交源 → 加入已确认源（仅定位不确定时再问）并为它开覆盖。

同时拒或修：精确标识无原文锚点；代码级主张只有 wiki；当前与拟议行为混写；声称搜过但无日志。

不凭记忆摘要。结论记在 `progress.yaml` 与 unit 表。派遣期间 `waiting_for: research`。本批完成后 `node: draft`。

## 还要调研？

- 新的已确认源、边界、或具体搜索假设 → 再一批
- 写稿或审查点名了缺失标识 → `repair-<short-name>`，一类缺口一个
- 同样的搜索、没有新假设 → 记 GAP 并停

完整盘点加有界搜索仍为空，是合法的否定 GAP。

## ID

写在 draft 里（及 brief 候选表）：

- `R-<REQ>-NNN` REQUIREMENT
- `F-<SOURCE>-NNN` FACT（brief 中为 FOUND；入稿时带原文锚点）
- `S-<WIKI>-NNN` SUMMARY
- `P-` / `D-` / `A-` / `G-` / `C-` / `Q-` 提案、决策、假设、缺口、冲突、用户问题

同一 ID 不复用于不同主张。只有带原文锚点的 FACT 支撑精确当前标识或行为。
