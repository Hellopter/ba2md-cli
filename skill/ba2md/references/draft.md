# Draft、内容审查与 BA 循环

## 写作

按此顺序读文件，然后写 `{slug}.draft.md`。模板提供结构，不提供事实。

1. 打开 `product/<slug>/research-plan.md` 里的覆盖计划。
2. 读 `{SKILL_DIR}/templates/sdd.md`（内部包保持此路径；正文可能不同）。
3. 每个 RELEVANT 行：读 sdd.md 点名的 `{SKILL_DIR}/templates/sections/<file>`，按该文件的输出格式写（`Output Format` / `输出格式`）。
4. N/A 节：一行理由或按约束省略。
5. 草稿头写 `Constraints read:`（`sdd.md` + 读过的每个节文件）。无清单则本步未完成，不得进入审查。

前置：wiki-plan/position 与已确认源存在；覆盖计划已填；必做 unit 已验收或 GAP；registry 为当前；没有承载当前事实仍停在 `FOUND` / `STALE` / `REJECTED`。

每个 RELEVANT 模板项：当前 FACT、目标 PROPOSAL，还是 DECISION？当前事实需要 `VERIFIED` 锚点。否则 GAP 或有主的 PROPOSAL。不因为有标题就编造。

当前（`F-*`）、目标（`P-*`）、决策（`D-*`）分开。优先 `REUSE` / `MODIFY` / `EXTEND`。每个 `ADD` 列出检查过的缝及为何不够。

覆盖 IR 实际需要的维度：入口/鉴权/校验；编排/状态；持久化/事务；接口字段/错误；事件/任务；日志/指标/告警；迁移/发布/回滚；测试。

缺承载事实（路由、字段、符号、schema、权限、限额、告警、边界任一端）则停该节并补研究。有界研究收敛为空则记 GAP。事实 GAP 留在草稿里，不是拿去问 BA 的 trivia。

承载句旁放证据或主张 ID。

## 机械预检（从属）

```bash
ba2md check --product product/<slug>
```

检查：已验收 unit 则 `briefs/` 非空；有 draft 则有 `reviews/content-review-*.md`。不解析 wiki 布局，不评判设计质量。本地修 `ERROR` 再跑。check PASS 不能授权交给 BA。

## 内容审查（循环 A）— 必须派子代理

每个可读草稿都要跑。审查员只写 findings——不改草稿、不提升 FACT、不选业务结果、不定终稿。

**主会话不写审查 findings。** 草稿作者写的 `content-review-*.md` 不算完成本步。

每轮并行派 **两个** 孩子。先把 `{SKILL_DIR}/assets/content-review-report-template.md` 拷到各路径，填好合同（角色、路径、轮次）。

| 角色 | 输出 | 打开 | 打什么 |
|------|------|------|--------|
| 结构 | `reviews/content-review-<round>-structure.md` | 覆盖计划、`templates/sdd.md`、每个 RELEVANT `templates/sections/*.md`、草稿 | 每个 RELEVANT 节符合该文件 Output Format / 输出格式；每条 Quality Gate / 质量门成立或有 finding；未读约束或空的 RELEVANT 节 → `REVISION_REQUIRED`。填 Coverage gates。 |
| 证据 | `reviews/content-review-<round>-evidence.md` | 草稿、registry、覆盖计划；仅当 ID 不在 registry 时打开对应 brief | 精确标识有 `VERIFIED` 锚点；未把 wiki/REQUIREMENT 写成当前实现；`ADD` 写了检查过的缝；brief 主张能对上 registry/draft。抽查草稿里的 ID。只在指定产物路径下搜；本角色不 grep `sources/`（那是调研）。 |

每个孩子的 prompt 含绝对输出路径，以及：「只读并更新这一文件。只返回：`REVIEW_WRITTEN <path>` + finding 计数。」

高风险 / Full Closure / 用户要求：允许第三孩子 `adversarial-refuter` → `content-review-<round>-adversarial.md`。同样派遣，仍不是主会话。

完成：本轮两份 `REVIEW_WRITTEN` 存在（以及可选第三份）。按并集合并；按 `(section, problem fingerprint)` 去重。主代理复核引用文件后仍成立的 Critical 不能清洁交卷。

| 合并结果 | 下一步（仍在循环 A，不见 BA） |
|----------|--------------------------------|
| `RESEARCH_REQUIRED` | 针对点名的缺失标识补研究 → 再派审查 |
| `REVISION_REQUIRED` | 用已有 briefs/registry 改稿 → 再派审查 |
| `RECONCILE_REQUIRED` | 修 registry → 再派审查 |
| `PASS` / `PASS_WITH_DISCUSSION` | 循环 B（Handoff） |
| `BLOCKED`（没有剩余假设） | 循环 B，带 blocker 包 |

`content_review_round` 上限 3。第一轮已含两个角色。只要 Critical 且代理可搜/可修就继续。到顶没有新假设：`BLOCKED`。`PASS_WITH_DISCUSSION` 只用于用户该拍板的积压或非关键讨论。

结构失败 → `REVISION_REQUIRED`（用已有证据填）。证据失败且点出缺失标识 → `RESEARCH_REQUIRED`。两角色都过、只剩 BA 该拍板的 → `PASS_WITH_DISCUSSION`。

IR/范围/源/证据/API/schema/鉴权/数据/事件/回滚变化后：两角色全审。仅措辞：只派结构。终稿候选前必须两角色。

## 与 BA 互动

三道门。不是嵌套 skill。

### Gate A — 确认源码仓

见 `references/wiki.md`。Intake 未点名仓，或 wiki 名单与 intake 不一致时确认 `sources/<id>` 列表。

### Gate B — 现在卡住

调研/写作中，仅用户该拍板的产品分叉才打断：两种设计产品影响不同、缺验收、接受关键 GAP。API 路径与标识在语料里查。

### Gate C — Handoff（循环 B）

仅当内容审查结果 ∈ `{PASS, PASS_WITH_DISCUSSION, BLOCKED}` 时进入。

一次交卷，然后 **停轮**：

- 草稿路径与门结果
- 已确认源与建议方向
- 关键证据与 `REUSE/MODIFY/EXTEND/ADD`
- GAP/CONFLICT 及是否挡住终稿
- 关键积压做成 **菜单**（仅承载、仅用户可决）——先不问第一项

完成：本轮不再提问。BA 主导。自由评论高于代理积压。BA 可以推翻框架、改范围、点菜单、要求调研、改措辞、或确认候选。

BA 咬住分叉时，**一轮一问**，推荐项在前，已知 FACT/GAP/CONFLICT，各选项影响。事实在 wiki/sources/briefs/registry/draft 里查。

### 问什么

问：IR 含义、范围内外、哪些产品/系统（Gate A）、已调研设计中的选择、风险接受、会翻转可见决策的口味。

去查而不是问：路径、字段名、类名、阈值、配置键、权限码、wiki 页对不对、语料里找得到的一切。

### 分类 BA 意见（循环 B）

| 类型 | 回到 |
|------|------|
| 需求理解 | Intake，可能重做 wiki-plan |
| 范围 / 错项目 | Wiki + Gate A；只补新的/漏的已确认源；**复用已有 brief** |
| 缺事实 | Repair Research（一类缺口一个 unit） |
| 设计分叉 | Decision Map → 只重写受影响小节 |
| 措辞 | 局部改稿 |

每条写入 Decision Map（`Q-*` 或 `FREEFORM`，状态、用户选择、推荐项、理由、证据 ID、受影响节、是否要新调研、返回节点）。这些节标 `DIRTY`。

再跑 `ba2md check` 并 **派** 对应审查（全量两角色，或措辞后只派结构）。用 **delta**（改了什么、已解决、还剩什么）再进 Handoff。

未点的积压项保持列出。它们不解锁终稿，也不授权盘问。

## 终稿

仅当下列全部成立时创建 `{slug}.md` 并设 `status: final`：

- BA 见过最新过门候选及其变更摘要
- 每个 BA 已咬住的关键决策已确认、作为非终稿推迟、或被替代
- 每个 `DIRTY` 节已重写
- check 通过且派出去的内容审查为 `PASS` / `PASS_WITH_DISCUSSION`（或 BA 把透明 `BLOCKED` 接受为非终稿——则不定稿）
- BA 明确确认（`定稿` / `LGTM` / `确认终稿` / `finalize`）

沉默、「看起来还行」、或空积压都不是确认。
