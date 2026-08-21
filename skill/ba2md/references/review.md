# 审查

对象是这份 draft。进入本步即派遣。审查员 = 子代理：只更新自己的审查文件（findings 与文件头 `Result:`）。主会话本步：拷模板、写 prompt、合并文件头、更新 `progress.yaml`。

先把 `{SKILL_DIR}/assets/content-review-report-template.md` 拷到各输出路径，填好合同（角色、路径、轮次）。

派遣结构 + 证据两个子代理。高风险或用户要求：可再派 `adversarial-refuter`（写入 `review.files` 的额外键）。

| 维度 | 输出 | 打开 |
|------|------|------|
| 结构 | `reviews/content-review-<round>-structure.md` | 需求、`sdd.md`、该写节的约束文件、草稿 |
| 证据 | `reviews/content-review-<round>-evidence.md` | **草稿**；抽查时打开对应 brief |

结构：先读需求和 `sdd.md`，按需求判断大纲里每一节这次要不要写（不要因为 `sections/` 里有文件就要求写）。

- 要写：打开对应的 `templates/sections/…`，把它要求稿子长什么样、文末质量要求是什么，一项一项拿到草稿里核对。缺了、空了又没 GAP、或质量要求没做到 → 记 finding，结果 `WRITE`。缺源码事实 → `needs_research`。
- 不要写：草稿有 N/A 理由，或 `sdd.md` 允许省略 → 过。不要打开约束文件。
- `sdd.md` 有标题但没有约束文件：有标题即可。

证据：精确标识在稿内有原文锚点；未把 wiki/需求写成当前实现；`ADD` 写了检查过的缝。缺锚点 / 锚点对不上 → `WRITE` 且 `needs_research`。

每个子代理的 prompt 含绝对输出路径，以及：「只读并更新这一文件。只返回：`REVIEW_WRITTEN <path>` + finding 计数。审查对象是 draft。」派遣期间 `waiting_for: review`。

完成：本轮各维度审查文件由子代理写出。按并集合并文件头 `Result:`；按 `(section, problem fingerprint)` 去重。合并结果写入 `progress.yaml`：`review.last_result`、`review.files`、`review.draft_sha256`（= 当前 `draft.sha256`）。已审查定义见 SKILL 续跑。

| 合并结果 | 下一步 |
|----------|--------|
| `WRITE`（含 `needs_research`） | `node: draft`，`waiting_for: research`。先派 `repair-*`，再改稿，再审。 |
| `WRITE`（仅结构/格式，证据已在稿内） | `node: draft`。用已有 briefs 改稿，再审。改的时候发现缺 FACT → 先派 `repair-*`。 |
| `DELIVER` | `node: wait`，`waiting_for: user`。进入节点 7。 |
| `DELIVER` 但有用户该拍板的分叉 | 同上；问题列入节点 7 的菜单。 |

`review.round` 上限 3。到顶仍有可搜的缺失标识：`WRITE` 并派 `repair-*`。没有新假设：带着 GAP `DELIVER`。
