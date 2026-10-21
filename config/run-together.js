/**
 * 在当前终端一起启动。每个项目的输出带前缀。
 * Ctrl+C 会停止全部。直接关掉终端时，由 watch-parent.js 结束子进程。
 * 其中一个退出时，其余项目继续跑。
 */

const path = require('path')
const { spawn, execFileSync } = require('child_process')

const colors = ['\x1b[36m', '\x1b[32m', '\x1b[33m', '\x1b[35m']
const reset = '\x1b[0m'

function consumeOutput (state, chunk) {
  state.buf += chunk
  const lines = []
  while (state.buf.length) {
    const newlineAt = state.buf.indexOf('\n')
    const carriageAt = state.buf.indexOf('\r')
    if (newlineAt === -1 && carriageAt === -1) break
    if (carriageAt !== -1 && (newlineAt === -1 || carriageAt < newlineAt)) {
      if (state.buf[carriageAt + 1] === '\n') {
        lines.push(state.buf.slice(0, carriageAt))
        state.buf = state.buf.slice(carriageAt + 2)
        continue
      }
      state.buf = state.buf.slice(carriageAt + 1)
      continue
    }
    lines.push(state.buf.slice(0, newlineAt))
    state.buf = state.buf.slice(newlineAt + 1)
  }
  return lines
}

function killTree (pid) {
  if (!pid) return
  try {
    execFileSync('taskkill', ['/pid', String(pid), '/t', '/f'], {
      stdio: 'ignore',
      windowsHide: true
    })
  } catch (err) {
    // 进程已经退出时 taskkill 会返回非 0
  }
}

function bindStream (stream, onLine) {
  const state = { buf: '' }
  stream.setEncoding('utf8')
  stream.on('data', (chunk) => {
    for (const line of consumeOutput(state, chunk)) onLine(line)
  })
  stream.on('end', () => {
    if (state.buf) {
      onLine(state.buf)
      state.buf = ''
    }
  })
}

function spawnCommand (command, cwd, env) {
  return spawn(process.env.ComSpec || 'cmd.exe', ['/d', '/c', command], {
    cwd,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true
  })
}

function startGuard (rootPids) {
  const pids = rootPids.filter((pid) => pid > 10)
  if (!pids.length) return
  const guard = spawn(process.execPath, [
    path.join(__dirname, 'watch-parent.js'),
    String(process.pid),
    ...pids.map(String)
  ], {
    detached: true,
    windowsHide: true,
    stdio: 'ignore'
  })
  guard.unref()
}

function runTogether ({
  projects,
  exitProcess = false,
  handleSignals = true,
  guard = exitProcess,
  stdout = process.stdout
}) {
  const width = Math.max(...projects.map((project) => project.label.length))
  const colored = projects.map((project, index) => ({
    ...project,
    padded: project.label.padEnd(width),
    color: colors[index % colors.length]
  }))
  const children = []
  let running = colored.length
  let exitCode = 0
  let stopped = false
  let finished = false
  let resolveDone
  const done = new Promise((resolve) => {
    resolveDone = resolve
  })

  function writeLine (project, line) {
    stdout.write(`${project.color}[${project.padded}]${reset} ${line}\n`)
  }

  function finish (code) {
    if (finished) return
    finished = true
    if (handleSignals) {
      process.off('SIGINT', stop)
      process.off('SIGTERM', stop)
      process.off('exit', onParentExit)
    }
    const numeric = typeof code === 'number' ? code : 1
    resolveDone(numeric)
    if (exitProcess) process.exit(numeric)
  }

  function settle (code) {
    if (typeof code === 'number' && code !== 0) exitCode = exitCode || code
    running -= 1
    if (running === 0) finish(exitCode)
  }

  function stop () {
    if (stopped) return
    stopped = true
    for (const child of children) killTree(child.pid)
    if (!children.length) finish(0)
  }

  function onParentExit () {
    if (finished || stopped) return
    stop()
  }

  stdout.write(`一起启动 ${colored.length} 个项目，Ctrl+C 或关闭终端都会停止\n`)
  for (const project of colored) {
    stdout.write(`  ${project.padded}  ${project.dir}  ${project.command}\n`)
  }

  for (const project of colored) {
    const child = spawnCommand(project.command, project.dir, {
      ...process.env,
      FORCE_COLOR: process.env.FORCE_COLOR || '1'
    })
    children.push(child)
    let settled = false
    const onLine = (line) => writeLine(project, line)
    bindStream(child.stdout, onLine)
    bindStream(child.stderr, onLine)
    const onDone = (code) => {
      if (settled) return
      settled = true
      writeLine(project, `已退出 code=${typeof code === 'number' ? code : 1}`)
      settle(code)
    }
    child.on('error', (err) => {
      writeLine(project, err.message)
      onDone(1)
    })
    child.on('exit', (code) => onDone(code))
  }

  if (guard) startGuard(children.map((child) => child.pid))

  if (handleSignals) {
    process.on('SIGINT', stop)
    process.on('SIGTERM', stop)
    process.on('exit', onParentExit)
  }

  done.stop = stop
  done.done = done
  return done
}

module.exports = {
  consumeOutput,
  runTogether
}
