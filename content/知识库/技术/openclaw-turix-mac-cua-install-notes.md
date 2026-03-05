---
title: "安装与验收 OpenClaw Skill：turix-mac（TuriX CUA）的一次踩坑记录"
date: "2026-03-06"
tags: ["OpenClaw", "turix-mac", "CUA", "macOS", "Automation"]
---

> 目标：把 OpenClaw 的 `turix-mac` Skill 跑通，用它在 macOS 上进行“所见即所得”的桌面自动化，并用 B 站浏览作为验收用例。

## 背景：turix-mac 是什么

`turix-mac` 是一个 **Computer Use Agent (CUA)**：通过截屏理解当前桌面状态，再用键盘/鼠标执行动作。

它和常见的浏览器 DOM 自动化（Playwright/Selenium）不一样：

- **优势**：任何 macOS 应用都能“视觉操作”（包括没有 API/CLI 的软件）。
- **劣势**：对权限、弹窗、窗口焦点更敏感，稳定性取决于环境配置和指令质量。

## 一次完整的安装/接入过程（按时间顺序）

### 1）定位 Skill 与运行入口

在本机环境里，Skill 位于：

- `~/.agents/skills/turix-mac/SKILL.md`
- 运行脚本：`~/.agents/skills/turix-mac/scripts/run_turix.sh`

该脚本的职责是：

1. 写入/更新 TuriX 的 `config.json`（主要更新 `agent.task`、`use_plan`、`use_skills`、resume 信息）
2. 做一些 preflight 检查
3. 启动 TuriX 主程序（`examples/main.py`）

### 2）发现第一个阻塞：脚本里写死了项目路径与 Conda

原脚本默认：

- `PROJECT_DIR="your_dir/TuriX-CUA"`（占位符）
- `CONDA_PATH="/opt/anaconda3/bin/conda"`

但实际项目目录在：

- `/Users/kris4js/starred/TuriX-CUA`

且机器上没有 `conda`。

**结论**：脚本需要适配真实路径，并支持“无 conda 的 venv 启动方式”。

### 3）改造脚本：使用 repo 自带 `.venv`，并显式指定 config

关键改动点：

- `PROJECT_DIR` 改为真实路径 `/Users/kris4js/starred/TuriX-CUA`
- 优先使用：`$PROJECT_DIR/.venv/bin/python`
- 启动参数从：
  - `python examples/main.py`
  改为：
  - `python examples/main.py -c "$CONFIG_FILE"`

原因：TuriX 的 `examples/main.py` 默认会用 `config.json`（相对路径），如果在项目根目录运行并传 `-c examples/config.json`，会导致它解析成 `examples/examples/config.json` 这种错位路径。

> 实测：在项目根目录运行时，正确姿势是 `-c config.json` 或者直接把配置文件放到根目录。

### 4）发现第二个坑：脚本参数解析的“flag 必须写在 task 之前”

脚本在解析参数时，一旦遇到第一个“非 `-xxx` 参数”就停止解析，后续参数都会被当成 task 内容。

因此：

- ✅ 正确：`run_turix.sh --no-plan --dry-run "任务..."`
- ❌ 错误：`run_turix.sh "任务..." --no-plan --dry-run`

这个坑会造成：`--dry-run` 明明写了，但脚本仍然会真实运行，同时把 `--no-plan --dry-run` 写进 `agent.task`。

### 5）验收用例：用它打开 B 站并处理登录弹窗

我用的验收任务（简化版）：

- 打开 Google Chrome
- 访问 https://www.bilibili.com
- 如果出现“登录/注册/手机号/验证码/二维码”弹窗或页面：立即停住等待，不做登录动作
- 若无登录弹窗：搜索“猫咪”，打开第一个视频页，确认封面/播放器区域加载后停止

实测结果：

- Agent 能启动、能截图、能对 Chrome 发快捷键（如 ⌘L）、能输入 URL 并回车
- 进入 B 站后确实出现“登录/注册”相关弹窗，Agent 按安全规则 **停住等待** 并询问是否允许关闭弹窗继续

这符合预期（安全策略生效），说明：

- 基本链路 OK（启动、识别、执行动作、状态判断）
- 任务设计需要明确“遇到登录弹窗是否允许关闭”这类策略，否则会频繁停住

## 权限与稳定性：最常见的失败原因

### 1）辅助功能（Accessibility）

日志曾出现类似提示：

- `This process is not trusted! Input event monitoring will not be possible until it is added to accessibility clients.`

这通常意味着：运行 turix 的终端（Ghostty/Terminal/VSCode 等）没有 **辅助功能** 权限。

表现为：

- 截图能做，但键鼠控制不稳定
- 强制停止热键可能失效

建议：系统设置 → 隐私与安全性 → **辅助功能** + **屏幕录制**，把对应终端勾上。

### 2）屏幕录制（Screen Recording）

没有屏幕录制权限时，截图/识别环节会异常或空白，导致 agent“盲操作”。

## 经验建议（Opinionated）

1. **把 turix 用作“最后一公里 UI 自动化”**：能用 API/CLI/DOM 自动化解决的，优先不用 turix；turix 负责处理必须点 UI 的环节。
2. **任务里提前写清楚“安全停机点”**：登录/付款/验证码/下载等动作默认都应停住并 ask human。
3. **用最小可验证用例验收**：例如“打开一个网址→识别一个弹窗→停止”，比一上来跑复杂流程更容易定位问题。
4. **脚本层面建议做两项增强**：
   - 支持 task 前后都能写 flags（更符合常规 CLI 习惯）
   - 每次运行复制一份临时 config，避免污染 repo 的默认配置（尤其是 `agent.task`）。

## 结语

这次 `turix-mac` 的接入本质上是两件事：

- 把“占位符脚本”改造成“适配本机环境的启动器”（路径 + python runner + config 参数）
- 用一个真实网页场景（B 站）验证：视觉识别、键鼠操作、安全停机逻辑是否按预期工作

一旦跑通，它就会成为 OpenClaw 体系里非常好用的“桌面外挂手”，专治那些没有 API 又必须点 UI 的流程。
