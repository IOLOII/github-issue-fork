### GitHub Issues Sync Tool Documentation

[English](README.md) | [中文](README.cn.md)

---

#### 概述

此工具旨在同步两个 GitHub 仓库之间的 issues，包括创建新 issue、更新现有 issue 以及根据上游仓库中的状态关闭 issue。此外，它使用标准日志机制记录所有操作，这些日志可以通过 macOS 的 Console.app 查看。

---

#### 功能

1. **Issues 同步**：基于上游仓库自动在目标仓库中创建或更新 issues。
2. **状态处理**：检查上游仓库中的 issue 是否关闭，并在目标仓库中反映这一变化。
3. **日志记录**：将脚本执行的所有动作记录到日志文件和系统日志中，以便于跟踪和调试。
4. **环境配置**：使用`.env`文件安全地管理如访问令牌等敏感信息。

---

#### 设置指南

1. **安装依赖**

   确保已安装 Node.js。然后，安装必要的包：

   ```bash
   pnpm i
   ```

2. **创建.env 文件**

   在项目根目录下创建一个名为`.env`的文件，内容如下：

   ```bash
   fork_owner =
   fork_repo =
   owner =
   repo =
   github_token = ghp_***
   ```

3. **运行脚本**

   执行脚本：

   ```bash
   npm start
   ```

4. ** 增加了命令行工具 **
   ```
   npx tsx src/tool.ts --help
   ```

---

#### 使用说明

脚本会自动处理从上游仓库到目标仓库的 issues 同步。同时确保任何在上游仓库中标记为“关闭”的 issues 在目标仓库中也相应地被关闭。

---

#### 日志记录

脚本执行的所有操作都会记录到与脚本同一目录下的`application.log`文件中。此外，日志还会输出到系统日志，这些日志可以通过 macOS 的 Console.app 查看。

通过这种方式，您可以方便地管理和审计脚本的操作行为，同时也保证了敏感信息的安全性。

---

#### 计划

- [ ] 🚀
