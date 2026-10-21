/**
 * 启动脚本被关掉时，Windows 不会结束它拉起的子进程。
 * 这个进程独立在后台，发现父进程没了就结束当初那几棵进程树。
 */

const { execFileSync } = require('child_process')

const parentPid = Number(process.argv[2])
const roots = process.argv.slice(3).map(Number).filter((pid) => pid > 10)

function parentAlive () {
  try {
    process.kill(parentPid, 0)
    return true
  } catch (err) {
    return err.code === 'EPERM'
  }
}

function decodeOutput (output) {
  if (output.length >= 2 && output[0] === 0xFF && output[1] === 0xFE) return output.toString('utf16le')
  if (output.length >= 4 && output[1] === 0 && output[3] === 0) return output.toString('utf16le')
  return output.toString('utf8')
}

function processLinks () {
  const output = execFileSync('powershell.exe', [
    '-NoProfile',
    '-NonInteractive',
    '-Command',
    'Get-CimInstance Win32_Process -Property ProcessId,ParentProcessId | ForEach-Object { $_.ProcessId.ToString() + \',\' + $_.ParentProcessId.ToString() }'
  ], {
    windowsHide: true,
    timeout: 20000
  })
  const text = decodeOutput(output)
  const childrenOf = new Map()
  for (const line of text.split(/\r?\n/)) {
    const [idText, parentText] = line.trim().split(',')
    const id = Number(idText)
    const parent = Number(parentText)
    if (!id || id < 10) continue
    if (!childrenOf.has(parent)) childrenOf.set(parent, [])
    childrenOf.get(parent).push(id)
  }
  return childrenOf
}

function collectTree (childrenOf) {
  const seen = new Set()
  const stack = roots.slice()
  while (stack.length) {
    const id = stack.pop()
    if (!id || id < 10 || seen.has(id)) continue
    seen.add(id)
    const children = childrenOf.get(id) || []
    for (const child of children) stack.push(child)
  }
  return seen
}

function killTree (pids) {
  for (const pid of pids) {
    if (!pid || pid < 10 || pid === parentPid) continue
    try {
      execFileSync('taskkill', ['/pid', String(pid), '/t', '/f'], {
        stdio: 'ignore',
        windowsHide: true
      })
    } catch (err) {
      // 进程已经退出时 taskkill 会失败
    }
  }
}

function stopChildren () {
  let pids = new Set(roots)
  try {
    const tree = collectTree(processLinks())
    if (tree.size > 0 && tree.size <= 100) pids = tree
  } catch (err) {
    // 查不到进程表时，至少结束当初启动的根进程
  }
  killTree(pids)
  process.exit(0)
}

let stopping = false

function tick () {
  if (stopping || parentAlive()) return
  stopping = true
  stopChildren()
}

tick()
setInterval(tick, 500)
