/**
 * 要启动的项目。目录相对于本仓库的上一级。
 * app：项目目录。label：窗口标题和日志前缀。command：在该目录执行的命令。
 * 本机真实项目写在 config/projects.local.js，该文件不会提交。
 * 某次只启动其中几个：npm start app-a app-b
 */

const fs = require('fs')
const path = require('path')

const projectsRoot = path.resolve(__dirname, '../..')
const defaultCommand = 'npm run start'

const exampleProjects = [
  { app: 'app-a', label: 'a', command: 'npm run start' },
  { app: 'app-b', label: 'b', command: 'npm run start' }
]

function readProjects () {
  const localFile = path.join(__dirname, 'projects.local.js')
  if (!fs.existsSync(localFile)) return exampleProjects
  const localProjects = require(localFile)
  if (!Array.isArray(localProjects) || !localProjects.length) {
    console.error('config/projects.local.js 需要导出非空的项目数组')
    process.exit(1)
  }
  return localProjects
}

const projects = readProjects()
const byApp = new Map(projects.map((project) => [project.app, project]))

function selectApps (argvApps) {
  const apps = Array.isArray(argvApps) && argvApps.length
    ? argvApps
    : projects.map((project) => project.app)
  return apps.map((app) => {
    const known = byApp.get(app)
    return {
      app,
      label: known ? known.label : path.basename(app),
      command: (known && known.command) || defaultCommand,
      dir: path.resolve(projectsRoot, app)
    }
  })
}

function loadProjects (argvApps) {
  const selected = selectApps(argvApps)
  const missing = selected
    .filter((project) => !fs.existsSync(path.join(project.dir, 'package.json')))
    .map((project) => project.app)
  if (missing.length) {
    console.error('找不到这些项目（目录里需要有 package.json）：')
    for (const app of missing) console.error(`  ${app}`)
    process.exit(1)
  }
  return selected
}

module.exports = {
  loadProjects
}
