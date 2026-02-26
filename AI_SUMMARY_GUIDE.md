# AI 文档总结功能使用指南

## 功能概述

AI 文档总结功能已成功集成到 Quartz 博客中，它会自动为每篇文章生成简洁的 AI 总结，显示在文章标题下方。

## 主要特性

✅ **智能缓存** - 基于内容哈希的缓存机制，只在内容变化时重新生成
✅ **优雅降级** - API 调用失败不影响构建流程
✅ **可折叠界面** - 支持可折叠的总结卡片，提升用户体验
✅ **灵活配置** - 支持多种 AI 提供商和自定义配置

## 快速开始

### 1. 配置环境变量

复制环境变量模板：

```bash
cp .env.example .env
```

编辑 `.env` 文件，添加你的 API Key：

```bash
# 启用 AI 总结功能
ENABLE_AI_SUMMARY=true

# OpenRouter API Key (本项目使用 OpenRouter)
OPENAI_API_KEY=sk-or-v1-your-openrouter-key-here
OPENAI_API_BASE=https://openrouter.ai/api/v1

# 或者使用 OpenAI API
# OPENAI_API_KEY=sk-your-openai-key-here
# OPENAI_API_BASE=https://api.openai.com/v1
```

### 2. 构建博客

```bash
# 标准构建
npx quartz build

# 带实时预览的构建
npx quartz build --serve

# 监听文件变化的构建
npx quartz build --watch
```

### 3. 验证功能

- 打开生成的 HTML 文件
- 在文章标题下方应该能看到 "✨ AI 文档总结" 卡片
- 点击卡片可以展开/折叠总结内容

## 配置选项

所有配置都在 `quartz.config.ts` 中的 `aiSummary` 字段：

```typescript
aiSummary: {
  // 是否启用功能
  enabled: process.env.ENABLE_AI_SUMMARY === "true",

  // AI 提供商（目前支持 openai, anthropic, custom）
  provider: "openai",

  // API Key 环境变量名
  apiKeyEnvVar: "OPENAI_API_KEY",

  // API 端点（可选）
  baseUrl: process.env.OPENAI_API_BASE || "https://openrouter.ai/api/v1",

  // 模型名称
  // OpenRouter 推荐: deepseek/deepseek-v3.2, google/gemini-flash-1.5
  // OpenAI 推荐: gpt-4o-mini, gpt-4o
  model: "deepseek/deepseek-v3.2",

  // 提示词模板（{content} 会被替换为文档内容）
  promptTemplate: "请用2-3句话总结这篇文档的核心内容：\n\n{content}",

  // 最大生成 token 数
  maxTokens: 150,

  // 缓存配置
  cache: {
    type: "file",
    path: ".quartz/cache/ai-summaries.json"
  },

  // UI 显示配置
  showInUI: true,          // 是否在 UI 中显示
  collapsible: true,       // 是否可折叠
  defaultCollapsed: false  // 默认是否折叠
}
```

## 缓存机制

### 工作原理

1. **内容哈希** - 使用 SHA256 算法为每篇文档生成唯一哈希值
2. **缓存键** - 格式为 `{文件路径}:{哈希前16位}`
3. **智能检测** - 只有内容变化时才会重新生成总结
4. **本地存储** - 缓存存储在 `.quartz/cache/ai-summaries.json`

### 缓存示例

```json
{
  "content/笔记/2026-02.md:a1b2c3d4e5f6g7h8": "这是一篇关于 Python 学习的笔记...",
  "content/杂谈/2026-01.md:9z8y7x6w5v4u3t2s": "作者分享了关于知识获取的思考..."
}
```

### 清除缓存

如果需要强制重新生成所有总结：

```bash
rm .quartz/cache/ai-summaries.json
npx quartz build
```

## 自定义提示词

你可以修改 `promptTemplate` 来自定义总结的风格：

### 示例 1：简洁总结

```typescript
promptTemplate: "用1-2句话总结：\n\n{content}"
```

### 示例 2：要点列表

```typescript
promptTemplate: "列出这篇文档的3-5个关键要点：\n\n{content}"
```

### 示例 3：技术文档

```typescript
promptTemplate: "总结这篇技术文档的主要概念和使用方法：\n\n{content}"
```

## 使用其他 AI 提供商

### OpenRouter (推荐)

OpenRouter 提供多种 AI 模型的统一接口，支持多种免费和便宜的模型：

```bash
# .env 文件配置
OPENAI_API_KEY=sk-or-v1-your-openrouter-key
OPENAI_API_BASE=https://openrouter.ai/api/v1
```

```typescript
// quartz.config.ts 配置
aiSummary: {
  enabled: true,
  provider: "openai", // OpenRouter 使用 OpenAI 兼容接口
  apiKeyEnvVar: "OPENAI_API_KEY",
  baseUrl: "https://openrouter.ai/api/v1",
  model: "deepseek/deepseek-v3.2", // 或其他模型
  // ... 其他配置
}
```

**推荐模型**（性价比高）：
- `deepseek/deepseek-v3.2` - 性能强，价格便宜
- `google/gemini-flash-1.5` - 速度快，部分免费
- `meta-llama/llama-3-8b-instruct:free` - 完全免费

### OpenAI 官方

```bash
# .env 文件配置
OPENAI_API_KEY=sk-your-openai-key
OPENAI_API_BASE=https://api.openai.com/v1
```

```typescript
// quartz.config.ts 配置
aiSummary: {
  enabled: true,
  provider: "openai",
  apiKeyEnvVar: "OPENAI_API_KEY",
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-4o-mini", // 或 gpt-4o
  // ... 其他配置
}
```

### Anthropic Claude

```bash
# .env 文件配置
ANTHROPIC_API_KEY=sk-ant-your-key
```

```typescript
// quartz.config.ts 配置
aiSummary: {
  enabled: true,
  provider: "anthropic",
  apiKeyEnvVar: "ANTHROPIC_API_KEY",
  baseUrl: "https://api.anthropic.com/v1",
  model: "claude-3-5-sonnet-20241022",
  // ... 其他配置
}
```

### 自定义提供商

```typescript
aiSummary: {
  enabled: true,
  provider: "custom",
  apiKeyEnvVar: "CUSTOM_API_KEY",
  baseUrl: "https://your-api-endpoint.com/v1",
  model: "your-model-name",
  // ... 其他配置
}
```

## 成本优化建议

1. **使用轻量模型** - `gpt-4o-mini` 比 `gpt-4` 便宜 10-20 倍
2. **控制 Token 数量** - `maxTokens: 150` 足够生成简洁总结
3. **利用缓存** - 只在内容变化时才调用 API
4. **内容截断** - 只发送文档前 8000 字符给 API

## 故障排查

### 问题 1：总结不显示

**检查清单：**
- ✅ `.env` 文件中 `ENABLE_AI_SUMMARY=true`
- ✅ API Key 正确设置
- ✅ `showInUI: true` 在配置中
- ✅ 构建过程没有错误

### 问题 2：API 调用失败

**可能原因：**
- ❌ API Key 无效或过期
- ❌ API 配额已用完
- ❌ 网络连接问题
- ❌ API 端点配置错误

**解决方法：**
- 检查 API Key 是否正确
- 查看构建日志中的错误信息
- 验证 `baseUrl` 配置

### 问题 3：总结质量不佳

**优化建议：**
- 调整 `promptTemplate` 提示词
- 增加 `maxTokens` 以获得更详细的总结
- 尝试不同的 AI 模型

## 技术架构

### 文件结构

```
quartz-blog/
├── quartz/
│   ├── cfg.ts                          # 类型定义
│   ├── plugins/transformers/
│   │   ├── ai-summary.ts               # Transformer 插件
│   │   └── frontmatter.ts              # Frontmatter 类型扩展
│   └── components/
│       ├── AIDocumentSummary.tsx       # UI 组件
│       └── index.ts                    # 组件导出
├── quartz.config.ts                    # 配置文件
├── quartz.layout.ts                    # 布局配置
├── .env                                # 环境变量
├── .env.example                        # 环境变量模板
└── .quartz/cache/
    └── ai-summaries.json               # 缓存文件
```

### 工作流程

1. **构建阶段** (Transformer 插件)
   - 读取 Markdown 文件
   - 计算内容哈希
   - 检查缓存
   - 调用 AI API（如需要）
   - 将总结写入 frontmatter

2. **渲染阶段** (Display 组件)
   - 从 frontmatter 读取总结
   - 渲染可折叠卡片
   - 应用 CSS 样式

## 注意事项

⚠️ **重要提示：**

1. **不要提交 `.env` 文件到 Git** - 已添加到 `.gitignore`
2. **缓存文件不应提交** - `.quartz/cache/` 已添加到 `.gitignore`
3. **API 调用有成本** - 首次构建会为每篇文章调用 API
4. **GitHub Actions 部署** - 需要在仓库 Secrets 中设置 `OPENAI_API_KEY`

## GitHub Actions 部署

在 GitHub 仓库中配置 Secrets：

1. 进入仓库 Settings → Secrets and variables → Actions
2. 添加 Repository secrets：
   - `ENABLE_AI_SUMMARY`: `true`
   - `OPENAI_API_KEY`: 你的 API Key
3. 可选：`OPENAI_API_BASE` 自定义端点

GitHub Actions 会自动读取这些环境变量并启用 AI 总结功能。

## 未来扩展

计划中的功能：

- [ ] Redis 缓存支持
- [ ] 批量并行 API 调用
- [ ] 多语言自动检测
- [ ] 自定义总结图标
- [ ] API 速率限制
- [ ] 流式生成进度显示

## 反馈与支持

如有问题或建议，请在项目中提交 Issue。
