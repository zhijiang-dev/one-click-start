/**
 * 在 Windows Terminal 里每个项目一个标签。
 * 只打开其中几个：npm run start:tabs -- app-a
 */

const { loadProjects } = require('./projects')
const { launchTabs } = require('./run-tabs')

launchTabs(loadProjects(process.argv.slice(2)))
