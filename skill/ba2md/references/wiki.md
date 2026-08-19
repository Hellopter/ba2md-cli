# Wiki 消费与源码选择

Wiki 与源码是两套独立挂载。`wiki/` 给语料定位（身份、归属、边界、术语）。`sources/` 是代码。一条需求可能跨多个源；漏掉协作者是本节点要防的昂贵失败。

Wiki 正文是 `SUMMARY`。当地图读；精确标识只有来自 `sources/<id>` 的 `FACT` 之后才引用。

已确认源是调研必须覆盖的树。调研中若证据显示 import、调用、共享合同、事件或数据归属，则追加为已确认（仅当集合变化且需要 BA 在多棵新树中选择时再走 Gate A）。

Wiki 生成器拥有目录树。本文件说明如何 *读* 当前布局。生成规则变了就改本 skill，不要把拓扑写进 CLI。

## 1. 搜索前先盘点

按顺序。

1. 跑 `ba2md discover --json`。回退：`ba2md status --json`，再 `workspace.yaml` + `sources/`、`wiki/` 一层 listing。
2. 记下已管理的 `sources/<id>` 与 `wiki/<id>`。盘点是「挂了什么」，不是「读哪些页」。
3. 深度 1 对账磁盘与登记。坏路径与孤儿记下来，不默默丢掉。

根永远是具体的（`sources/<id>`、`wiki/<id>/…`），不用裸的 `sources/` 或 `wiki/`。Discover 不解析 wiki 页类型。按下面布局在每个 `wiki/<id>/` 下走页。

## 2. 布局（v2）

`{WORKSPACE}/wiki/<id>/` 下（路径相对该 wiki）：

```text
wiki/
  index.md                        ← 宿主生成导航；只扫链接；不当 Spec
  overview.md                     ← 必有（_root）
  architecture.md                 ← 可选（_root）
  <source>/                       ← 源码目录原名，原样保留
    index.md                      ← 生成导航；扫一眼
    source.md                     ← 必有：每个 source 一份
    <domain>/
      index.md                    ← 生成导航；扫一眼
      domain.md                   ← 必有：每个 domain 一份
      <concept>/
        index.md                  ← 生成导航；扫一眼
        concept.md                ← 概念首页
        models.md  / models/*.md  ← 数据
        flows.md / sequences.md   ← 流程
        states.md                 ← 状态
        data.md                   ← 数据
        modules.md                ← 模块
```

`<source>` 是源码目录原名。不发明 slug。

每一层 `index.md` 都是生成导航。扫标题和链接；不把它当归属或行为的 SUMMARY，也不放进 wiki-plan。

布局期望但缺失的页是 wiki GAP，不是发明内容或整轮失败的理由。

## 3. 写本需求的 wiki-plan

Intake 之后写：

| 路径 | 内容 |
|------|------|
| `product/<slug>/wiki-plan.json` | `{ "pages": ["overview.md", "billing/source.md", …] }` — wiki 相对路径。工作笔记，不是 CLI schema |
| `product/<slug>/wiki-position.md` | 下列标题。**已确认源** 在 Gate A 填写 |

```markdown
## 拥有源（Owning sources）
## 具名协作者（Named collaborators）
## 可能相关（Maybe-related）
## 已确认源（Confirmed sources）
## 词表（Vocabulary）
## Wiki GAP
```

- **拥有源**：wiki 主张这棵树拥有本 IR。映射到 `sources/<id>`（第 5 节）。
- **具名协作者**：wiki 主张邻居在路径上（上下游、事件、共享数据、鉴权）。或 `none`。这些行进入 Gate A 表。
- **可能相关**：一笔带过，没有协作主张，也没有 path/symbol。留在这里；除非 BA 升格，否则不开 unit。
- **已确认源**：Gate A 完成前为空。

**如何选页**

1. 分析 IR：目标、角色、对象、动词、系统名、范围内外。保留 `R-*` 锚点。
2. 通读 `overview.md`。有则通读 `architecture.md`。
3. 列出直接子目录 `<source>/`。**读每一个 `source.md`。** 这些页便宜，是协作图。跳过一份就会把跨源 IR 钉到错误仓库。
4. 按 IR 用语 **以及** 那些 source 页点名的邻居选 domain/concept。不能只靠关键词。
5. 每个选中的概念集群：读 `domain.md` + `concept.md`。仅当 IR 需要该关注点时再拉 `flows` / `states` / `data` / `modules` / `models/*`。
6. 计划要读的 Spec 页写入 `wiki-plan.json`（不要 `index.md`，不要 `wiki/<id>/` 前缀）。

若 overview/architecture/`source.md` 点名了与 IR 相关的邻居，而具名协作者漏了，补上该 `source.md` 再评估。

完成：wiki-position 能陈述拥有源、具名协作者或 `none`、可能相关、域词表、wiki 未覆盖什么。此时尚未调研。

## 4. Gate A — 确认源码仓

任何 brief 之前填 **已确认源**。出示一张表，然后一问（确认 / 增 / 删）：

| 角色 | `sources/<id>` | 依据（wiki 页） |
|------|----------------|-----------------|
| owner | | `…/source.md` |
| collaborator | | |

**要问**（满足任一）：

- Intake 没有点名源码仓（`sources/<id>` 或仓库名）。
- Wiki 名单与 intake 点名不一致（多仓 / 少仓 / 换 owner）。

**不问**：intake 已点名，且与拥有源 + 具名协作者一致。把该集合抄进已确认源，继续。

问 BA 该拍板的事：本 IR 要调研哪些已挂载仓。Wiki 措辞与实现细节在语料里查。

完成：已确认源至少有一个可读的 `sources/<id>`。没有该列表不得开源码调研。

之后证据撞上新源：追加到已确认源（仅当 BA 必须在多棵新树中选择时再问 Gate A）。

## 5. 把 wiki 名映射到 `sources/<id>`

1. 与 `<source>/` 目录名完全相等
2. wiki 元数据里的显式仓库/源链接
3. 规范化名（去掉 `-wiki` / `_wiki`）
4. README 或构建清单中的包/服务身份
5. 域归属 / 集成名称

没有 wiki 覆盖的源仍然合法——记 wiki GAP，并说明 IR 为何仍指向 `sources/<id>`。

仅高风险变更（多服务合同、schema、鉴权、资金、任务、回滚）或用户要求完整影响时，才用 Full Closure。

## 6. 护栏

- Wiki 页类型规则只在本文件，不在 CLI。
- 盘点之后用列出 `wiki/<id>/*/source.md` 找源，不用 grep `sources/**` 或 `wiki/**` 来判断存在什么。
- 引用 Spec 页，不引用 `index.md`。
- 在具体的 `wiki/<id>/…` 与 `sources/<id>` 下搜索。
- 填拥有 / 具名协作者之前读每一个 `source.md`。
- 有 `wiki-plan.json` **且** 已确认源之后才调研。
- 具名协作者是确认表候选，不是点缀。
- 可能相关行保持假设，直到 BA 升格。
