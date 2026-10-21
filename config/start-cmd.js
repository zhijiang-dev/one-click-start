/**
 * 每个项目一个 cmd 窗口。关掉启动用的终端不会结束这些窗口。
 * 只打开其中几个：npm run start:cmd -- app-a
 */

const { loadProjects } = require('./projects')
const { launchCmdWindows } = require('./run-cmd')

launchCmdWindows(loadProjects(process.argv.slice(2)))
