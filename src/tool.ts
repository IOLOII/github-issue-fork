import { closeIssue, main, forkIssueComment, forkSourceIssue, searchIssue } from './main'

const type = process.argv[2]
switch (type) {
  case '--close':
    let start = Number(process.argv[3])
    let end = Number(process.argv[4])

    if (!process.argv[3] && !process.argv[4]) {
      process.stdout.write('some variable is undefined or does not have someProperty\n')
      process.exit(1)
    }
    if (!start || !end) {
      closeIssue(process.argv[2])
    } else {
      for (let id = start; id <= end; id++) {
        closeIssue(id.toString())
      }
    }
    break
  case '--comment':
    ;(() => {
      let sourceIssueId = process.argv[3]
      let targetIssueId = process.argv[4]
      if (!process.argv[3] && !process.argv[4]) {
        process.stdout.write('some variable is undefined or does not have someProperty\n')
        process.exit(1)
      }
      forkIssueComment(sourceIssueId, targetIssueId)
    })()
    break
  case '--issue':
    ;(async () => {
      let sourceIssueId = process.argv[3]
      if (!process.argv[3]) {
        process.stdout.write('some variable is undefined or does not have someProperty\n')
        process.exit(1)
      }

      await searchIssue(sourceIssueId).then(issue => forkSourceIssue(issue))
    })()
    break
  case '--help':
    console.log(`
    Usage:
      [npx] tsx src/tool.ts [--default] [--issue] [--comment] [--close] [--help] [--debugger]

        --issue [sourceIssueId]                       now also fork comment after create forked issue
        --comment [sourceIssueId] [targetIssueId]     fork issue comment
        --close [start] [end]                         quick close series issue
        --help
        --debugger                                    show env

    default:
      npm run tool [--default]                        default fork issue
      npm run start                                   default fork issue

      for detail see src/tool.ts
    `)
    break
  default:
    main()
    break
}
