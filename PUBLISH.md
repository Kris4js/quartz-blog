# 自动发布指南

本项目提供了自动发布脚本，让你可以快速将内容更新发布到线上。

## 🚀 快速开始

### 方式一：智能发布（推荐用于 Agent）

**自动生成提交信息**（最适合 Agent 使用）：
```bash
npm run publish:auto
```

这个命令会：
- 🔍 自动检测修改的文件
- 📝 智能生成提交信息
- ✅ 构建并验证
- 🚀 推送并触发部署

**示例场景**：
```bash
# 修改了单个文件
npm run publish:auto
# 提交信息: 📝 Update: 我的学习笔记

# 修改了多个文件
npm run publish:auto
# 提交信息: 📝 Update: 笔记1, 笔记2, 笔记3
```

### 方式二：预览模式（安全检查）

在真正发布前，先预览将要执行的操作：
```bash
npm run publish:dry
```

这会显示：
- 将要提交的文件列表
- 自动生成的提交信息
- 推送的目标分支

**不会实际执行任何修改操作**。

### 方式三：交互式发布

```bash
npm run publish
```

或：

```bash
./publish.sh "添加了新文章：我的学习笔记"
```

### 方式四：快速发布

```bash
npm run quick-publish
```

## 🤖 Agent 使用指南

当使用 Claude Code 等 Agent 时，可以这样说：

```
请帮我发布这篇新文章
```

Agent 会自动：
1. 检测是否有内容修改
2. 运行 `npm run publish:auto`
3. 监控发布过程
4. 报告部署状态

**高级用法**：
```
帮我预览一下发布内容（不实际发布）
```
→ Agent 会运行 `npm run publish:dry`

```
发布更新，提交信息是"修复格式问题"
```
→ Agent 会运行 `npm run publish -- "修复格式问题"`

## 📝 完整工作流程

### 推荐流程（带预览）

```bash
# 1. 编辑内容
vim content/我的新文章.md

# 2. 本地预览
npx quartz build --serve

# 3. 预览将要发布的内容
npm run publish:dry

# 4. 确认无误后发布
npm run publish:auto
```

### 快速流程（适合频繁更新）

```bash
# 编辑 → 发布一步到位
vim content/我的新文章.md && npm run publish:auto
```

## 🛠️ 所有可用命令

| 命令 | 说明 | 适用场景 |
|------|------|----------|
| `npm run publish:auto` | 自动生成提交信息并发布 | Agent、快速发布 |
| `npm run publish:dry` | 预览发布内容（不实际发布） | 安全检查 |
| `npm run publish "msg"` | 使用自定义提交信息发布 | 需要详细说明 |
| `npm run quick-publish` | Bash 版快速发布 | 传统方式 |
| `npx quartz build --serve` | 本地预览 | 开发调试 |

## 🌐 部署信息

- **部署平台**: GitHub Pages
- **触发条件**: 推送到 `v4` 分支
- **部署地址**: https://kris4js.github.io/quartz-blog/
- **查看部署状态**: https://github.com/Kris4js/quartz-blog/actions

## 📊 发布脚本对比

### publish.mjs（Node.js 版本）- 推荐 ✨
- ✅ 更好的错误处理
- ✅ 智能提交信息生成
- ✅ 预览模式（dry-run）
- ✅ 彩色输出
- ✅ Agent 友好

### publish.sh（Bash 版本）
- ✅ 简单直接
- ✅ 交互式输入
- ⚠️ 功能较少

### quick-publish.sh（快速版）
- ✅ 自动生成提交信息
- ✅ 快速执行
- ⚠️ Bash 实现

## 🔧 故障排除

### 构建失败

```bash
# 查看详细错误信息
npx quartz build
```

### 推送失败

```bash
# 检查远程连接
git remote -v

# 手动推送
git push origin v4
```

### 权限问题

```bash
# 确保脚本有执行权限
chmod +x publish.sh quick-publish.sh publish.mjs
```

## 💡 最佳实践

### 1. 提交前预览
```bash
npm run publish:dry  # 预览
npm run publish:auto  # 确认无误后再发布
```

### 2. 有意义的提交信息
```bash
npm run publish -- "添加《JavaScript 高级技巧》笔记"
```

### 3. 小步快跑
- 频繁小更新比偶尔大更新更好
- 每次发布专注一个主题

### 4. 本地测试
```bash
# 发布前先本地测试
npx quartz build --serve
# 确认无误后再发布
npm run publish:auto
```

## 🎯 使用场景示例

### 场景 1：写完新文章直接发布
```bash
# 创建新文章
vim content/知识库/JavaScript/新特性.md

# 一键发布
npm run publish:auto
```

### 场景 2：批量更新多个文件
```bash
# 修改多个文件
vim content/知识库/React/*.md

# 预览
npm run publish:dry

# 发布（会显示"Update X documents"）
npm run publish:auto
```

### 场景 3：修复错别字
```bash
# 修复后快速发布
vim content/某文章.md
npm run publish -- "修复错别字"
```

### 场景 4：在 Claude Code 中使用
```
你: 我刚写完了一篇关于 TypeScript 的新文章，帮我发布一下

Claude: 好的，我来帮你发布。
[运行 npm run publish:auto]
✓ 检测到新文件：content/知识库/TypeScript/新特性.md
✓ 自动生成提交信息：📝 Update: 新特性
✓ 构建成功
✓ 已推送到 GitHub
🎉 发布完成！
```

## 📚 相关文档

- [Quartz 官方文档](https://quartz.jzhao.xyz/)
- [GitHub Pages 文档](https://docs.github.com/pages)
- [项目 CLAUDE.md](./CLAUDE.md) - Claude Code 使用指南

---

**提示**: 对于 Agent（如 Claude Code），推荐使用 `npm run publish:auto` 命令，它会自动处理所有步骤。
