/**
 * 每个项目开一个 cmd 窗口，窗口保持打开。
 */

const { spawn } = require('child_process')

function buildCmdLaunch (project) {
  return `start "${project.label}" /D "${project.dir}" cmd /k "${project.command}"`
}

function launchCmdWindows (projects) {
  const comspec = process.env.ComSpec || 'cmd.exe'
  const width = Math.max(...projects.map((project) => project.label.length))
  console.log(`打开 ${projects.length} 个 cmd 窗口`)
  for (const project of projects) {
    console.log(`  ${project.label.padEnd(width)}  ${project.dir}  ${project.command}`)
    const child = spawn(comspec, ['/d', '/c', buildCmdLaunch(project)], {
      detached: true,
      windowsHide: true,
      stdio: 'ignore',
      windowsVerbatimArguments: true
    })
    child.unref()
  }
}

module.exports = {
  buildCmdLaunch,
  launchCmdWindows
}
