# Agent 发布指南

这个文件专门为 AI Agent（如 Claude Code）提供发布指导。

## 快速发布命令

### 标准发布流程（推荐）

当用户要求发布内容时，使用以下命令：

```bash
npm run publish:auto
```

这个命令会：
1. 自动检测所有修改的文件
2. 智能生成提交信息
3. 构建项目验证无误
4. 提交并推送到 GitHub
5. 触发自动部署

### 安全预览（可选）

如果需要先检查将要发布的内容，使用：

```bash
npm run publish:dry
```

这会显示将要提交的文件和提交信息，但不会实际执行。

## 常见场景

### 场景 1：用户说"发布这篇文章"
```
用户: 我写完了，帮我发布这篇文章

Agent 操作:
1. 运行: npm run publish:auto
2. 等待构建和推送完成
3. 报告: "✅ 已成功发布！网站将在几分钟内更新。"
```

### 场景 2：用户想先预览
```
用户: 帮我看看要发布什么内容

Agent 操作:
1. 运行: npm run publish:dry
2. 显示: 修改的文件列表和提交信息
3. 询问: "是否继续发布？"
```

### 场景 3：用户指定提交信息
```
用户: 发布更新，说"添加了 TypeScript 教程"

Agent 操作:
1. 运行: npm run publish -- "添加了 TypeScript 教程"
2. 等待完成
3. 报告结果
```

## 发布流程详解

当运行 `npm run publish:auto` 时：

1. **文件检查**
   - 扫描所有修改、新增、删除的文件
   - 显示文件列表

2. **构建验证**
   - 运行 `npx quartz build`
   - 确保没有构建错误
   - 如果失败，停止并报告错误

3. **提交信息生成**
   - 单个文件: `📝 Update: 文件名`
   - 2-3个文件: `📝 Update: 文件1, 文件2, 文件3`
   - 多个文件: `📝 Update X documents`

4. **Git 操作**
   - `git add -A`
   - `git commit -m "message"`
   - `git push origin v4`

5. **自动部署**
   - GitHub Actions 自动触发
   - 构建并部署到 GitHub Pages

## 部署信息

- **网站地址**: https://kris4js.github.io/quartz-blog/
- **查看部署**: https://github.com/Kris4js/quartz-blog/actions
- **目标分支**: v4
- **部署平台**: GitHub Pages

## 错误处理

### 如果构建失败
```
1. 运行: npx quartz build
2. 查看详细错误信息
3. 告知用户需要先修复错误
```

### 如果推送失败
```
1. 检查网络连接
2. 检查 Git 权限
3. 尝试: git push origin v4
```

### 如果没有变更
```
告知用户: "当前没有需要发布的更改"
建议: "请先添加或修改内容"
```

## 最佳实践

1. **发布前确认**: 如果改动较大，先运行 `npm run publish:dry` 预览
2. **本地测试**: 建议用户先运行 `npx quartz build --serve` 本地预览
3. **小步快跑**: 鼓励频繁发布小更新，而不是积累大更新
4. **清晰反馈**: 发布后告知用户部署状态和网站地址

## 完整示例

```
用户: 我刚写完了一篇关于 React Hooks 的文章，帮我发布

Agent:
好的，我来帮你发布这篇新文章。

[执行: npm run publish:auto]

✓ 检测到新文件: content/知识库/React/Hooks详解.md
✓ 自动生成提交信息: 📝 Update: Hooks详解
✓ 构建成功
✓ 已提交更改
✓ 已推送到 GitHub

🎉 发布成功！

你的文章已经发布到 GitHub，GitHub Actions 正在自动构建和部署。
预计 1-2 分钟后就可以访问了。

📍 网站地址: https://kris4js.github.io/quartz-blog/
📊 查看部署状态: https://github.com/Kris4js/quartz-blog/actions
```

## 相关命令速查

| 命令 | 用途 | 何时使用 |
|------|------|----------|
| `npm run publish:auto` | 自动发布 | 用户要求发布时 |
| `npm run publish:dry` | 预览发布 | 用户想先检查时 |
| `npm run publish "msg"` | 自定义消息 | 用户指定消息时 |
| `npx quartz build --serve` | 本地预览 | 用户想本地测试时 |

## 注意事项

- ⚠️ 确保在项目根目录执行
- ⚠️ 确保有 Git 推送权限
- ⚠️ 确保在 v4 分支（脚本会警告其他分支）
- ✅ 构建失败会自动中止发布
- ✅ 提供清晰的错误信息

---

**记住**: 对于 Agent 来说，最简单可靠的方式就是运行 `npm run publish:auto`！
