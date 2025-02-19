require('dotenv').config({ path: ['.env.local', '.env'] })

const { fork_owner, fork_repo, owner, repo, github_token } = process.env

console.dir({ fork_owner, fork_repo, owner, repo, github_token })

;[fork_owner, fork_repo, owner, repo, github_token].some(item => {
  if (!item) {
    console.error('Please set all environment variables.')
    process.exit(1)
  }
})

import axios from 'axios'
import fs from 'fs'
import path from 'path'
import https from 'https'

// 导入 winston 以及 winston-daily-rotate-file
import { createLogger, format, transports } from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'

// 配置授权信息
const authorization = `Bearer ${process.env.github_token}`
// 创建一个自定义的https.Agent来忽略SSL证书验证错误
const agent = new https.Agent({
  rejectUnauthorized: false, // 注意：这会使连接变得不安全，请谨慎使用。
})

// 载入或初始化记录文件
const recordFilePath = path.join(__dirname, 'sync_records.json')
let syncRecords = {} as {
  [key: string]: {
    updated_at: string
    targetIssueId: number
    need_update: boolean
    closed: boolean
  }
}
try {
  syncRecords = JSON.parse(fs.readFileSync(recordFilePath, 'utf8'))
} catch (err) {
  console.log('No existing sync records found or error reading file.')
}

// 设置日志配置
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.printf((info: any) => `${info.timestamp} [${info.level}]: ${info.message}`)
  ),
  transports: [
    new transports.Console(), // 输出到控制台
    new transports.File({ filename: path.join(__dirname, 'application.log') }), // 输出到文件
    new DailyRotateFile({
      filename: path.join(__dirname, 'logs/application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }), // 按日期分割的日志文件
  ],
})
async function fetchIssues(page = 1, since = null) {
  const url =
    `https://api.github.com/repos/${process.env.fork_owner}/${process.env.fork_repo}/issues?state=all&per_page=100&page=${page}` +
    (since ? `&since=${since}` : '')
  const config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: url,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      Authorization: authorization,
    },
    httpsAgent: agent,
  }

  try {
    logger.info(`   Fetching issues for page ${page}`)
    const response = await axios.request(config)
    return response.data
  } catch (error) {
    logger.info(`   Fetching issues for page ${page}`)
    console.error(`Error fetching issues for page ${page}:`, error)
    return []
  }
}

export async function closeIssue(issueId: string) {
  const config = {
    method: 'patch',
    maxBodyLength: Infinity,
    url: `https://api.github.com/repos/${process.env.owner}/${process.env.repo}/issues/${issueId}`,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      Authorization: authorization,
    },
    httpsAgent: agent,
    data: JSON.stringify({ state: 'closed' }),
  }

  try {
    await axios.request(config)
    console.log(`   Successfully closed issue #${issueId}`)
  } catch (error) {
    console.error(`Failed to close issue #${issueId}:`, error)
  }
}

async function createOrUpdateIssue(issue: any) {
  if (issue.pull_request) {
    console.log(`     Skipping pull request #${issue.number}: ${issue.title}`)
    return // 过滤掉 pull request
  }

  const existsInRecords = !!syncRecords[issue.id]
  const targetIssueId = existsInRecords ? syncRecords[issue.id].targetIssueId : null

  if (!existsInRecords) {
    // 创建新的 issue 并检查是否需要关闭
    const data = JSON.stringify({
      title: issue.title,
      body: issue.body + '\n' + issue.html_url,
    })

    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `https://api.github.com/repos/${process.env.owner}/${process.env.repo}/issues`,
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        Authorization: authorization,
      },
      httpsAgent: agent,
      data: data,
    }

    try {
      const response = await axios.request(config)
      console.log(`Successfully created issue #${response.data.number}: ${response.data.title}`)
      syncRecords[issue.id] = {
        updated_at: new Date().toISOString(),
        targetIssueId: response.data.number,
        need_update: false,
        closed: false,
      } // 更新记录

      // 如果上游issue是关闭状态，则同步关闭下游issue
      if (issue.state === 'closed' && syncRecords[issue.id].closed !== true) {
        await closeIssue(response.data.number)
        syncRecords[issue.id].closed = true
      }
    } catch (error) {
      console.error(`Failed to create issue "${issue.title}":`, error)
    }
  } else {
    // 检查并更新已存在的 issue
    // 如果上游issue是关闭状态，则同步关闭下游issue
    if (issue.state === 'closed' && syncRecords[issue.id].closed !== true) {
      await closeIssue(targetIssueId as unknown as string)
      syncRecords[issue.id].closed = true
    } else if (syncRecords[issue.id].need_update) {
      // 更新其他内容
      const data = JSON.stringify({
        title: issue.title,
        body: issue.body + '\n' + issue.html_url,
      })

      const config = {
        method: 'patch',
        maxBodyLength: Infinity,
        url: `https://api.github.com/repos/${process.env.owner}/${process.env.repo}/issues/${targetIssueId}`,
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
          Authorization: authorization,
        },
        httpsAgent: agent,
        data: data,
      }

      try {
        await axios.request(config)
        console.log(`Successfully updated issue #${targetIssueId}: ${issue.title}`)
        syncRecords[issue.id].updated_at = new Date().toISOString()
        syncRecords[issue.id].need_update = false // 重置更新标记
        syncRecords[issue.id].closed = false
      } catch (error) {
        console.error(`Failed to update issue #${targetIssueId}:`, error)
      }
    }
  }
}

export async function main() {
  let page = 1
  let allIssuesFetched = false
  const since = 'YYYY-MM-DDTHH:MM:SSZ' // 根据需要设置或动态获取

  logger.info('Starting the process of copying and updating issues...')
  logger.info(`${process.env.fork_owner}/${process.env.fork_repo} ===> ${process.env.owner}/${process.env.repo}`)

  while (!allIssuesFetched) {
    logger.info(`Starting with page ${page}...`)
    const issues = await fetchIssues(page)

    if (issues.length === 0) {
      logger.info('No more issues found. Ending process.')
      allIssuesFetched = true
      break
    }

    for (const issue of issues) {
      await createOrUpdateIssue(issue)
    }

    page++
  }

  // 保存同步记录
  fs.writeFileSync(recordFilePath, JSON.stringify(syncRecords, null, 2))
  logger.info('Finished copying and updating issues and updated sync records.')
}

// main().catch(error => {
//   console.error('An unexpected error occurred:', error)
// })
