---
title: "把 Brave 依赖踢掉：为 OpenClaw 的 search-layer 打造 Exa + Tavily 轮询池（支持 httpie/curl 传输层）"
date: "2026-03-04"
tags: ["OpenClaw", "Search", "Exa", "Tavily", "Python", "httpie", "curl"]
---

这篇文章记录一次很“工程化”的改造：

- 目标：让 OpenClaw 的 `search-layer` **不再依赖 Brave Search**，改为 **Exa + Tavily** 双源。
- 额外目标：在额度/限流不可控时，做一个 **查询轮换池**，让请求自动在两家 API 间分摊。
- 工程要求：尽量 **零依赖、可移植、可诊断**；必要时可切换到本地 `httpie/curl` 作为传输层。

最终我们做到了：

1) `search.py` 无需安装 `requests`（只用 Python 标准库 `urllib`）。
2) 支持 `SEARCH_LAYER_TRANSPORT=cli`：用 `httpie` 或 `curl` 发 HTTP（更贴近你真实环境里的 proxy/TLS）。
3) 支持 `SEARCH_LAYER_ROTATE=rr`：**跨运行 round-robin 轮询池**（并带空结果 failover）。

> 适用读者：OpenClaw 高级用户 / 需要稳定 Web Search 的 Agent 工程同学。

---

## 背景：为什么要“踢掉 Brave 依赖”

在 OpenClaw 的工具链里，`web_search` 默认走 Brave Search API。它的好处是简单直接，但有两个常见现实问题：

- 很多本地部署环境（尤其是个人机器）并没有配置 Brave API Key；
- 即便配置了，单一来源也会遇到：额度、限流、某些地区/网络条件下的可用性问题。

因此更实用的方案是：

- 用 Exa + Tavily 双源，
- 再加一个“轮换池”，让请求在双源之间自动分摊。

---

## 设计目标与取舍

### 目标 1：零第三方 Python 依赖

最开始的报错其实很典型：

- `ModuleNotFoundError: No module named 'requests'`

个人环境里，Python 版本/虚拟环境/依赖状态经常不一致。为了让脚本“开箱即用”，我们直接把 HTTP 请求实现改成标准库 `urllib`。

### 目标 2：可选的 CLI 传输层（httpie/curl）

有些环境里会遇到 TLS 中间人、代理、证书链问题，Python 的 `urllib` 可能比系统 `curl/httpie` 更容易“水土不服”。

所以我们增加了一个开关：

- `SEARCH_LAYER_TRANSPORT=cli` → 使用 `httpie`（优先）或 `curl`

这让“网络层问题”更容易诊断：你可以直接复制那条 curl/http 命令在终端跑。

### 目标 3：轮询池（Round-Robin）

轮询池的核心诉求：

- 不要把所有查询都打到一个源（避免单点额度/限流）
- 在脚本多次运行之间也要记住“上次用到哪家”

因此我们实现一个简单的状态文件：

- `~/.openclaw/state/search-layer/rotate.json`

每次 `mode=fast` 时更新 `rr_index`，做到跨运行轮询。

---

## 最终接口（你实际怎么用）

### 1) Deep 模式：双源并行（覆盖最大）

```bash
python3 ~/.agents/skills/search-layer/scripts/search.py "gold price down because" \
  --mode deep --intent status --freshness pw --num 5
```

### 2) Answer 模式：Tavily only（带 answer）

```bash
python3 ~/.agents/skills/search-layer/scripts/search.py "gold price down because" \
  --mode answer --freshness pd --num 5
```

### 3) Fast 模式：启用轮询池（Exa/Tavily 轮换）

```bash
SEARCH_LAYER_ROTATE=rr \
python3 ~/.agents/skills/search-layer/scripts/search.py "OpenClaw plugins" \
  --mode fast --num 5
```

### 4) 网络环境复杂时：切到 httpie/curl 传输

```bash
cd ~/.agents/skills/search-layer/scripts
SEARCH_LAYER_TRANSPORT=cli SEARCH_LAYER_ROTATE=rr \
python3 search.py "OpenClaw gateway" --mode fast --num 5
```

---

## 实现要点（工程细节）

### A) 轮询池（RR）的原理 & 状态文件

RR（Round-Robin）本质上就是：**维护一个递增的指针**，每次请求取 `pool[index % len(pool)]` 作为本次选用的源，然后 `index += 1`。

这次实现里我们把这个指针持久化到磁盘，从而做到“跨运行轮询”。

状态文件长这样：

```json
{
  "rr_index": 4,
  "updated_at": "2026-03-04T01:21:06.936023+00:00",
  "pool": ["exa", "tavily"]
}
```

关键实现点：

- **线程锁**：保护读写（避免并发写坏文件）
- **原子写入**：写临时文件后 `replace`，避免中途崩溃导致文件半截
- **一致性**：轮询只用于 `mode=fast`（单源），`mode=deep` 仍是双源并行，避免“深度搜索结果忽好忽坏”

### B) Failover 策略（空结果自动切源）

在 `mode=fast` 的轮询下，如果选中的源返回空结果（或被捕获为异常后转空列表），会自动尝试另一个源。

这让轮询池在“某个源临时抽风”时依然可用。

### C) httpie 401 的坑：不要加 `--ignore-stdin`

httpie 如果加了 `--ignore-stdin`，就算你在 subprocess 里传了 stdin，它也不会读。

表现就是：服务端收到空 body → 401（missing api_key）。

最终修复：去掉 `--ignore-stdin`。

---

## 后续增强方向

如果你希望这个轮询池更像“真正的流量调度”，可以继续做：

- 基于 429/5xx 的退避与熔断（比如 5 分钟内某源错误率高就临时踢出池子）
- 针对不同 intent 选择不同池（news/status 更偏 Tavily，resource 更偏 Exa）
- 结果侧的更强合并：不仅 URL 去重，还做语义聚合与高亮抽取

---

## 附录：关键环境变量

- `SEARCH_LAYER_ROTATE=rr`：fast 模式 round-robin（跨运行）
- `SEARCH_LAYER_ROTATE=stable`：fast 模式按 query 稳定分流
- `SEARCH_LAYER_TRANSPORT=cli`：HTTP 请求走 httpie/curl
- `EXA_API_KEY` / `TAVILY_API_KEY`：也可用环境变量注入 key

---

如果你也在做“给 Agent 加一层靠谱的 Web Search”，我的经验是：

- **先消灭依赖不确定性**（requests 这类外部依赖），再谈策略；
- **策略里一定要有 failover**，否则轮换毫无意义；
- **让请求可复现、可诊断**（能直接用 curl/httpie 复现）会极大减少排障时间。
