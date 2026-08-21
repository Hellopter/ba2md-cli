# 内容审查报告：<slug> #<n>

- Reviewer role: structure / evidence / adversarial-refuter
- Draft path:
- 读过的 brief（证据角色；仅抽查锚点时）：
- 实际打开过的约束文件（结构角色；证据角色可空）：
- Result: WRITE / DELIVER
- needs_research: yes / no

续跑时主会话只读本文件头的 `Result` / `needs_research` 做合并，写入 `progress.yaml`。不要把 findings 抄进 progress。

## 结构检查（结构角色必填；证据角色整表写 n/a）

`sdd.md` 列出的每一节占一行。先读需求和 `sdd.md`，按需求判断要不要写，不要因为 `sections/` 里有文件就要求写。

| 节 | 约束文件 | 这次要写吗 | 过了？ | Finding IDs |
|----|----------|------------|--------|-------------|
| | `templates/sections/...` | 写 / 不写 | yes / no / n/a | |

怎么判「过了」：

- 不写：草稿有 N/A 理由，或 `sdd.md` 允许省略 → yes。不要打开约束文件。
- 要写：打开约束文件，读它要求的输出格式（表格长什么样、必须有哪些内容）和文末质量要求，对照草稿一项一项查。缺列、该有的内容空着又没 GAP、或某条质量要求没做到 → no，finding 写明是约束文件哪一条没满足。
- 只有标题、没有约束文件：有标题 → n/a。

## Findings

| Finding ID | Type | Severity | 约束文件 | 问题 | 依据（draft 锚点或 brief） | 受影响节 | needs_research | Status |
|------------|------|----------|----------|------|---------------------------|----------|----------------|--------|

## 必须回写

- 该写却空、不该写却写成正文、要写的节漏了约束要求的内容：
- 无依据标识 / 把 wiki 当现状 / 空节缺事实：

## 交给用户时的待决（仅用户可决）

| Question ID | 问题 | 为何用户该拍板 |
|-------------|------|----------------|
