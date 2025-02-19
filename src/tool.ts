import { closeIssue, main } from './main'

const type = process.argv[2]
switch (type) {
  case '--close':
    let start = Number(process.argv[3])
    let end = Number(process.argv[4])
    if (!start || !end) {
      closeIssue(process.argv[2])
    } else {
      for (let id = start; id <= end; id++) {
        closeIssue(id.toString())
      }
    }
    break
  default:
    main()
    break
}
