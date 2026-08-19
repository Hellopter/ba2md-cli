# 研究计划与 Brief

调研找出能让 SDD 可落地的原文事实。Unit 组织调查，不是文档小节。Brief 总结调查，永不替代原文证据。

每个完成的 unit 写 `product/<slug>/briefs/<unit-id>.md`（形状：`{SKILL_DIR}/assets/research-brief-template.md`）。Research 之后 `briefs/` 为空即协议失败。谁写 brief 是本文件里的 **规模** 判断——不是 `SKILL.md` 里的常量。

## 研究计划

写 `product/<slug>/research-plan.md`，包含：

- 需求输入（路径、SHA-256、`R-*`）与解读
- Intake 是否点名了源码仓
- 盘点来源（`ba2md discover --json` 或回退）与 wiki-plan 路径
- **已确认源**（Gate A 之后从 wiki-position 抄入）
- 需求到源的覆盖与已知跨源边界
- 覆盖计划
- 研究 unit 表
- 执行状态

```markdown
## 已确认源（Confirmed sources）
| 角色 | Source ID | Root | 覆盖 |
|------|-----------|------|------|
| owner / collaborator | | `sources/<id>/` | brief 路径 / 折入 `<unit>` / 排除（理由） |

## 覆盖计划（Coverage Plan）
| 节 | 约束文件 | 适用 | 依据 |
|----|----------|------|------|
| （来自 `templates/sdd.md` 的标题） | sdd.md 点名的 `templates/sections/<file>.md` | RELEVANT / N/A | 该文件自己的规则 / IR |

## 研究单元
| Unit ID | Trigger | Source ID / Boundary | Concern | Questions | Expected facts | Brief path | Dependencies | Status |
|---------|---------|----------------------|---------|-----------|----------------|------------|--------------|--------|
| | initial/repair | | | | | `briefs/<unit-id>.md` | | |

## 执行状态
- Current node:
- Resume node:
- Open research units:
- Accepted research units:
- Dirty sections:
- Blocking issues:
- Remaining search hypotheses:
- content_review_round:
- Ready for Draft Review handoff: Yes/No
```

表格保持瘦。一两行加显式 GAP 好过一张空想大表。

读 `templates/sdd.md` 及其点名的 `templates/sections/*.md` 适用性规则（内部包路径相同、正文不同）。必选节默认 `RELEVANT`。条件节跟该文件自己的 `RELEVANT` / `UNKNOWN` / `NOT_APPLICABLE`（或等价中文）。`UNKNOWN` → 一个有界发现 unit，不是整节深挖。`NOT_APPLICABLE` → 不建研究 unit，该节无正文。

Research 完成：每个已确认源行有 brief 路径、折入路径、或排除理由，且 `briefs/` 非空。

## Draft Readiness vs Full Closure

默认 Draft Readiness。动笔前确认：需求锚点存在；内容搜索前已盘点；wiki-plan、wiki-position、已确认源存在；覆盖计划已填；承载当前事实为 `VERIFIED` 或 GAP；已知实质性边界有归属/两端、排除或 GAP。

Full Closure（多服务合同、schema、鉴权、资金、任务、回滚，或用户要求）还要完整已知边界覆盖，以及受影响 API/实体/任务/配置/告警清单。

## Unit 设计

仅当第二关注点需要不同搜索根、或会撑爆同一 brief 时，才按不相交的 `source × concern` 再拆。优先 **每个已确认源 root 一份 brief**。仅对具名集成边界使用跨源 unit。

小节约束决定草稿必须有什么，不决定拆多少 unit。不按模板小节各开一个 unit。

**具名协作者**（已确认）：在该 root 上写 brief，或当那棵树足够小、能放进同一合同时，把边界事实（调用方向、合同、共享数据）折进 owner 的 brief。折入算覆盖；跳过不算。

**可能相关**（wiki-position）：Remaining search hypotheses 或 GAP。仅当 BA 升格或出现具体 path/symbol 时才开 unit。

会改变承载标识（API / 表 / 事件 / 鉴权 / 缝）**且**有具体搜索假设（path、符号、source id）→ 开 unit 或折进本批。

## 规模：谁写 brief

根据已确认源与当前窗口判断再派遣。孩子数量是这张表的输出，不是别处写死的上限。

| 规模 | 何时 | 谁写 |
|------|------|------|
| 小 | 1 个已确认源，且问题能在当前窗口做完 | 主代理写这一份 brief |
| 中 | 2+ 个不相交的已确认 root，**或** 1 个 root 大会挤掉 wiki/IR | **每个不相交 source root 一个孩子**（不按 concern、不按小节）。主代理可留下自己已打开的那一棵 |
| 大 / Full Closure | 多个已确认 root + 具名边界 | 同中，按不相交 root 分批。主代理可留下已持有的 root |

始终：

- 同一 `sources/<id>`、同一假设 → 一个写者，不为重试再派第二个孩子。
- Unit 跟着模板小节走 → 合并；按 root 派。
- 孩子只写自己的 brief。不写 Recommended Change、SDD、registry。
- 小的具名协作者可与 owner 共用 brief（合同里第二个 root）。大且不相交的协作者自己的 root 自己的写者。

## Unit I/O

每个 unit 以文件为据。

**开工前** brief 已有冻结的 `## Unit Contract`：unit id、trigger、source id 或边界 id、具体 `sources/<id>/…` 根（折入小协作者时可选第二 root）、允许的 wiki 页、`R-*` 摘录、有界问题、期望事实类型、范围外、不得猜测、输出路径。

**过程：** 只在指定 root（+ 点名的 wiki 页）下搜。只写这一份 brief。不改计划、registry、draft、其他 brief。

**完成：** brief 有 Search Log（含空搜）以及 Evidence Candidates 和/或有界 GAP 行。Brief 里的 FACT 只标 `FOUND`。主代理升 `VERIFIED`。Recommended Change 可选。

**若派遣：** 先写好填完合同的 brief。Prompt 必须含绝对 brief 路径，以及：「只读并更新这一文件。最后动作是保存该 brief。只返回：`BRIEF_WRITTEN <path>` + candidate 计数。」不接受聊天倾倒当 brief。

Java 测试排除同 `SKILL.md`。

## Brief 验收

每批之后，用 `briefs/*.md` 对照未完成 unit。缺文件 = `FAILED_NO_BRIEF` — 重派或补写。然后每份 brief：

1. Source ID/root 偏离合同则拒。
2. 重开将出现在 draft 里的承载原文锚点（符号、路径、表名）——抽查，不是每一行 FOUND。
3. 接受的 FOUND → 在 `evidence-registry.md` 升 `VERIFIED`（仅主代理）。
4. 错误候选写明理由后拒。
5. 新的不相交源或边界 → 加入已确认源（若需 BA 选择则 Gate A）并为它开覆盖。

同时拒或修：精确标识无原文锚点；代码级主张只有 wiki；当前与拟议行为混写；`ADD` 未检查旧缝；边界只核一端；声称搜过但无日志。

先合并不相交源，再合并边界 unit。不凭记忆摘要——重开每份 brief。验收记在 registry 与研究计划，不抄进每份 brief。

## 还要调研？

验收之后：

- 新的已确认源、边界、或具体搜索假设 → 再一批
- 同样的搜索、没有新假设 → 记 GAP 并停

完整盘点加有界搜索仍为空，是合法的否定 GAP。

修复 unit 名为 `repair-<trigger>-<short-name>`，一类缺失事实一个，仅在新的具体 path/符号/归属/源/边界时再开另一个。

## ID

- `R-<REQ>-NNN` REQUIREMENT
- `F-<SOURCE>-NNN` FACT
- `S-<WIKI>-NNN` SUMMARY
- `P-` / `D-` / `A-` / `G-` / `C-` / `Q-` 提案、决策、假设、缺口、冲突、BA 问题

同一 ID 不复用于不同主张。只有 `VERIFIED` FACT 支撑精确当前标识或行为。
