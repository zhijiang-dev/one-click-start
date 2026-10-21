/**
 * 用 Windows Terminal 给每个项目开一个标签。
 * wt 打开窗口后就会退出，标签里的进程继续跑。
 */

const { spawn } = require('child_process')

function buildWtArgs (projects) {
  const args = ['-w', '-1']
  projects.forEach((project, index) => {
    if (index > 0) args.push(';', 'new-tab')
    args.push('--title', project.label, '-d', project.dir, 'cmd', '/k', project.command)
  })
  return args
}

function launchTabs (projects) {
  const width = Math.max(...projects.map((project) => project.label.length))
  console.log(`打开 Windows Terminal，共 ${projects.length} 个标签`)
  for (const project of projects) {
    console.log(`  ${project.label.padEnd(width)}  ${project.dir}  ${project.command}`)
  }

  const child = spawn('wt', buildWtArgs(projects), {
    detached: true,
    stdio: 'ignore'
  })
  child.on('error', (err) => {
    if (err.code === 'ENOENT') {
      console.error('没有找到 Windows Terminal (wt)。可以改用 npm start，在当前终端一起启动。')
    } else {
      console.error(err.message)
    }
    process.exit(1)
  })
  child.on('spawn', () => {
    child.unref()
    process.exit(0)
  })
}

module.exports = {
  buildWtArgs,
  launchTabs
}
