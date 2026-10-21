/**
 * 在当前终端一起启动。Ctrl+C 停止全部。
 * 只启动其中几个：npm start app-a app-b
 * 三个 cmd 窗口：npm run start:cmd
 * Windows Terminal 标签：npm run start:tabs
 */

const { loadProjects } = require('./projects')
const { runTogether } = require('./run-together')

runTogether({
  projects: loadProjects(process.argv.slice(2)),
  exitProcess: true,
  handleSignals: true
})
