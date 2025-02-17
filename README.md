### GitHub Issues Sync Tool Documentation

[English](README.md) | [中文](README.cn.md)

---

#### Overview

This tool is designed to synchronize issues between two GitHub repositories, including the ability to create new issues, update existing ones, and close issues based on their state in the upstream repository. Additionally, it logs all operations for debugging and auditing purposes using a standard logging mechanism that can be viewed with macOS's Console.app.

---

#### Features

1. **Issue Synchronization**: Automatically creates or updates issues in a target repository based on the upstream repository.
2. **State Handling**: Checks if an issue is closed in the upstream repository and reflects this change in the target repository.
3. **Logging**: Records all actions performed by the script into a log file and system logs for easy tracking and debugging.
4. **Environment Configuration**: Uses `.env` files to manage sensitive information such as access tokens securely.

---

#### Setup Instructions

1. **Install Dependencies**

   Ensure you have Node.js installed. Then, install the necessary packages:

   ```bash
   pnpm i
   ```

2. **Create .env File**

   In your project root directory, create a `.env` file with the following content:

   ```bash
   fork_owner =
   fork_repo =
   owner =
   repo =
   github_token = ghp_***
   ```

3. **Run the Script**

   Execute script:

   ```bash
   npm start
   ```

---

#### Usage

The script will automatically handle synchronization of issues from the upstream repository to the target repository. It will also ensure that any issues marked as "closed" in the upstream repository are reflected as such in the target repository.

---

#### Logging

All operations performed by the script are logged into `application.log` located in the same directory as the script. Additionally, logs are outputted to the system log, which can be viewed using macOS's Console.app.

---
