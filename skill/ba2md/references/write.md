# 写稿、审查与用户循环

## 写作

按此顺序读文件，然后写 `{slug}.draft.md`。模板提供结构，不提供事实。证据写在稿里。

1. 读 `{SKILL_DIR}/templates/sdd.md`：文档大纲，以及它点名的 `sections/<file>`。
2. **按需求**判断哪些可选节要写（改不改页面 / 内部接口 / 外部接口 / 库表 / 集成 / 扩展……），不是「`sections/` 目录里有没有这个文件」。
3. 只打开判定要写的那些节文件，按该文件的 `Output Format` / `输出格式`（或包内等价标题）写。
4. 判定不写的节：一行 N/A 理由，或按当时 `sdd.md` 允许省略。不要打开它的节文件。
5. `sdd.md` 里没有对应节文件的标题：保持标题，允许空白。
6. 写完后更新 `progress.yaml`：`draft.path`、`draft.sha256`（文件 SHA-256），`node: review`。

草稿和终稿只写设计。不要把读过哪些模板文件列进稿里。

前置：已确认源存在；已有 brief 或写阶段将补调研。

判定要写的节：当前 FACT、目标 PROPOSAL，还是 DECISION？当前事实需要原文锚点。否则 GAP 或有主的 PROPOSAL。不因为有标题就编造。

当前（`F-*`）、目标（`P-*`）、决策（`D-*`）分开。优先 `REUSE` / `MODIFY` / `EXTEND`。每个 `ADD` 列出检查过的缝及为何不够。

草稿骨架跟当时的 `sdd.md` 走。不要另搞一份「框架结构」或「维度清单」来指导写作。

缺承载事实（路由、字段、符号、schema、权限、限额、告警、边界任一端）则 **停该节并派调研子代理**（见 `references/research.md` 的 `repair-*`）。有界研究收敛为空则记 GAP。禁止用已有句子改写来冒充新事实。

承载句旁放锚点或主张 ID，例如 `` `sources/<id>/Foo.java:80-112` ``。决策、冲突、缺口写入稿内第 5 章。

不得修改 `templates/`。

## 审查 — 对象是这份详细设计

每个可读草稿都要跑。审查员只写 findings——不改草稿、不定终稿。主会话不写审查 findings。草稿作者写的 `content-review-*.md` 不算完成本步。

按维度派子代理。默认两个，需要时可加。先把 `{SKILL_DIR}/assets/content-review-report-template.md` 拷到各路径，填好合同（角色、路径、轮次）。

| 维度 | 输出 | 打开 | 打什么 |
|------|------|------|--------|
| 结构 | `reviews/content-review-<round>-structure.md` | 需求、`sdd.md`、判定要写的节约束、草稿 | 先读 `sdd.md` 和需求，自己判断哪些可选节该写，再只打开那些节文件。该写的节符合该文件输出格式；不该写的节有 N/A 或省略即过。不得因「sections/ 里有这个文件」要求写满。该写却空、且无 GAP → `WRITE`；缺事实则 `needs_research`。 |
| 证据 | `reviews/content-review-<round>-evidence.md` | **草稿**；抽查时打开对应 brief | 精确标识在稿内有原文锚点；未把 wiki/需求写成当前实现；`ADD` 写了检查过的缝。本角色不 grep `sources/`（那是调研）。缺锚点 / 锚点对不上 → `WRITE` 且 `needs_research`。 |

每个子代理的 prompt 含绝对输出路径，以及：「只读并更新这一文件。只返回：`REVIEW_WRITTEN <path>` + finding 计数。审查对象是 draft。」派遣期间 `waiting_for: review`。

高风险 / 用户要求：允许第三子代理 `adversarial-refuter`（写入 `review.files` 的额外键）。

完成：本轮各维度审查文件存在且由子代理写出。按并集合并文件头 `Result:`；按 `(section, problem fingerprint)` 去重。合并结果写入 `progress.yaml`：`review.last_result`、`review.files`、`review.draft_sha256`（= 当前 `draft.sha256`）。聊天 `REVIEW_WRITTEN` 只在本会话有效。已审查定义见 SKILL 续跑。

| 合并结果 | 下一步 |
|----------|--------|
| `WRITE`（含 `needs_research`） | `node: draft`，`waiting_for: research`。先派 `repair-*`，再改稿，再审。禁止只改措辞补事实。 |
| `WRITE`（仅结构/格式，证据已在稿内） | `node: draft`。用已有 briefs 改稿，再审。改的时候发现缺 FACT → 升级为先调研。 |
| `DELIVER` | `node: wait`，`waiting_for: user`。交给用户，停轮 |
| `DELIVER` 但有用户该拍板的分叉 | 同上；问题放进菜单，不停下来盘问 |

`review.round` 上限 3。到顶仍有可搜的缺失标识：继续 `WRITE` 补调研。没有新假设：带着 GAP `DELIVER`，由用户决定是否接受。

仅措辞改动：可只派结构。范围/源/证据/API/schema 变化后：两维度都派。交给用户前必须两维度。

## 与用户互动

锁定源见 SKILL 节点 3：owner + wiki 判为相关的仓直接锁定并调研；只问读完 wiki 仍待定的点。

写作中途仅用户该拍板的产品分叉才打断：两种设计产品影响不同、缺验收、接受关键 GAP。API 路径与标识在语料里查。

### 交给用户

仅当审查合并为 `DELIVER` 时进入。一次交卷，然后停轮：

- 草稿路径
- 已确认源与建议方向
- 关键 `REUSE/MODIFY/EXTEND/ADD` 与稿内锚点
- GAP/CONFLICT 及是否挡住终稿
- 仅用户可决的问题做成菜单——先不问第一项

完成：本轮不再提问。用户主导。自由评论高于代理积压。

用户咬住分叉时，一轮一问，推荐项在前。事实在 wiki/sources/briefs/draft 里查。

问：需求含义、范围内外、哪些产品/系统、已调研设计中的选择、风险接受。

去查而不是问：路径、字段名、类名、阈值、配置键、权限码、wiki 页对不对、语料里找得到的一切。

### 分类用户意见

| 类型 | 回到 |
|------|------|
| 需求理解 | 分析需求，重读 wiki |
| 范围 / 错项目 | 锁定源；只补新的/漏的已确认源；**复用已有 brief** |
| 缺事实 | 写阶段 `repair-*` 调研，再改稿 |
| 设计分叉 | 只重写受影响小节（决策记在稿内第 5 章） |
| 措辞 | 局部改稿 |

改完后更新 `draft.sha256`，再派对应审查（全量两维度，或措辞后只派结构）。用 delta 再交。旧审查因哈希不一致作废。

## 终稿

仅当下列全部成立时创建 `{slug}.md` 并设 `status: final`：

- 用户见过最新 `DELIVER` 候选及其变更摘要
- 每个用户已咬住的关键决策已确认、推迟、或被替代
- 每个改过的节已重写
- 最近一次审查为 `DELIVER` 且 `review.draft_sha256` 等于当前 draft 哈希（或用户把透明 GAP 接受为非终稿——则不定稿）
- 用户明确确认（`定稿` / `LGTM` / `确认终稿` / `finalize`）

写 `{slug}.md` 后：`node: final`，`final: true`。沉默、「看起来还行」、或空积压都不是确认。
