# Wiki 消费与源码选择

Wiki 与源码是两套独立挂载。`wiki/` 给语料定位（身份、归属、边界、术语）。`sources/` 是代码。一条需求可能跨多个源；漏掉协作者是本节点要防的昂贵失败。

Wiki 正文是 `SUMMARY`。当地图读；精确标识只有写进 draft、且带 `sources/<id>` 原文锚点之后才引用。

已确认源是调研必须覆盖的树。调研或写作中若证据显示 import、调用、共享合同、事件或数据归属，则追加为已确认（仅当集合变化且需要用户在多棵新树中选择时再问）。

不写 `wiki-position.md`，不写 `wiki-plan.json`。读完的东西进 `research-plan.md`：已读页、候选表、词表、wiki GAP。确认后的源进同一文件的「已确认源」表。

## 1. 先拿真实结构

按顺序。

1. 跑 `ba2md discover --json`。回退：`ba2md status --json`，再 `workspace.yaml` + `sources/`、`wiki/` 一层 listing。
2. 记下已管理的 `sources/<id>` 与 `wiki/<id>`。
3. 每个 wiki 用返回的 **`outline`**（`dirs` + `pages` + `depth`）当结构真相。磁盘上没有的路径不读。
4. 坏路径与孤儿记下来，不默默丢掉。

根永远是具体的（`sources/<id>`、`wiki/<id>/…`），不用裸的 `sources/` 或 `wiki/`。Discover **不**解析页类型（不是 source/domain/concept）。Skill **不**把某次生成器的目录树当成合同。

## 2. 阅读顺序（理念，不是文件名清单）

对着 outline 里**存在的路径**走。缺了就记 wiki GAP，不发明、不失败整轮。

1. **总揽。** 该 wiki / 逻辑项目根上，名字像总览的页：`overview`、`index`、`README`、`introduction`、中文「总览/概述」等。只读 outline 里有的。`index.md` 当导航扫链接，不当归属或行为的依据。
2. **框架。** 同层或下一层里像架构/边界的页：`architecture`、中文「架构」等，以及总揽页链接出去、且 outline 里存在的邻页。
3. **局部。** 仅当需求用语或上层页点名了某目录/主题时，再打开那一层的落地页，然后才是叶子页。
4. **停。** 没有被点名的深层页不读。没有 `source.md`（或任何其它写死的文件名）不补读、不报协议失败。

候选源码仓来自三处，而不是「每个 source.md」：wiki 正文里实际出现的系统/仓名、`discover` 的 `sources/` 清单、用户 intake 点名。再跟用户确认。

## 3. 写入 research-plan

```markdown
## 已读 wiki 页
| 路径 | 层 |
|------|----|
| `wiki/<id>/…` | 总揽 / 框架 / 局部 |

## Wiki 候选
| 角色 | `sources/<id>` | 依据（实际读过的 wiki 页） |
|------|----------------|----------------------------|
| owner / collaborator / maybe | | |

## 词表
## Wiki GAP
```

- **owner**：wiki 主张这棵树拥有本需求。映射到 `sources/<id>`（第 5 节）。
- **collaborator**：wiki 主张邻居在路径上（上下游、事件、共享数据、鉴权）。或写一行 `none`。
- **maybe**：一笔带过，没有协作主张，也没有 path/symbol。除非用户升格或出现具体 path/symbol，否则不开调研。

**派遣：** 默认主会话读（下一跳要问用户）。多份 `wiki/<id>/` 时，每个 wiki 一个子代理，只返回该 wiki 的候选行 + 词表 + GAP + 已读页。子代理不写 research-plan；主会话合并后写入。

完成：research-plan 有 Wiki 候选表（缺则 `none` 或 wiki GAP）、词表、已读页。无 wiki 覆盖的仓仍合法：记 GAP，交给确认范围。此时尚未源码调研。

## 4. 确认范围

任何 brief 之前填 **已确认源**。出示候选表，然后一问（确认 / 增 / 删）：

| 角色 | `sources/<id>` | 依据（wiki 页） |
|------|----------------|-----------------|
| owner | | |
| collaborator | | |

**要问**（满足任一）：

- Intake 没有点名源码仓（`sources/<id>` 或仓库名）。
- Wiki 候选与 intake 点名不一致（多仓 / 少仓 / 换 owner）。

**不问**：intake 已点名，且与 owner + collaborator 一致。把该集合抄进已确认源，继续。

问用户该拍板的事：本需求要调研哪些已挂载仓。Wiki 措辞与实现细节在语料里查。

完成：已确认源至少有一个可读的 `sources/<id>`。没有该列表不得开源码调研。

之后证据撞上新源：追加到已确认源（仅当用户必须在多棵新树中选择时再问）。

## 5. 把 wiki 名映射到 `sources/<id>`

1. 与 wiki 目录名或正文里的仓名完全相等
2. wiki 元数据里的显式仓库/源链接
3. 规范化名（去掉 `-wiki` / `_wiki`）
4. README 或构建清单中的包/服务身份
5. 域归属 / 集成名称

没有 wiki 覆盖的源仍然合法——记 wiki GAP，并说明需求为何仍指向 `sources/<id>`。

## 6. 护栏

- 结构来自 `discover` 的 outline，不来自 skill 里写死的文件名。
- 不用 grep `sources/**` 或 `wiki/**` 来判断挂了什么。
- 在具体的 `wiki/<id>/…` 与 `sources/<id>` 下搜索。
- 有已确认源之后才调研。
- collaborator 是确认表候选，不是点缀。
- maybe 行保持假设，直到用户升格。
