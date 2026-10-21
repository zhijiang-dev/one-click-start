# one-click-start

在同一个父目录下，一次启动多个本地前端项目。适合本机开发，不发布到 npm。

把本仓库和要启动的项目放在一起：

```text
Projects/
  one-click-start/     本仓库
  app-a/
  app-b/
```

项目路径相对于本仓库的上一级。需要 Node.js 18 或更高版本。

## 启动

在本仓库目录执行。

| 命令 | 效果 |
| --- | --- |
| `npm start` | 在当前终端一起启动。日志带项目名前缀。 |
| `npm run start:cmd` | 每个项目开一个 cmd 窗口。 |
| `npm run start:tabs` | 在 Windows Terminal 里每个项目开一个标签。需要已安装 Windows Terminal。 |

只启动其中几个时，写出配置里的 `app`：

```bash
npm start app-a app-b
npm run start:cmd -- app-a
npm run start:tabs -- app-b
```

`npm start` 的参数会直接传给脚本。`npm run` 需要在参数前加 `--`。

目录里没有 `package.json` 时，启动会停下来并列出找不到的项目。未安装 Windows Terminal 时，`start:tabs` 会退出并提示改用 `npm start`。

## 配置

仓库里的 `config/projects.js` 只保留示例项目。本机要启动的项目写在 `config/projects.local.js`，这个文件已加入 `.gitignore`，不会提交。

```javascript
module.exports = [
  { app: 'app-a', label: 'a', command: 'npm run start' },
  { app: 'app-b', label: 'b', command: 'npm run serve' }
]
```

没有 `projects.local.js` 时，使用 `projects.js` 里的示例。

- `app`：相对父目录的项目路径。
- `label`：日志前缀和窗口标题。
- `command`：在该项目目录中执行的命令。不写时使用 `npm run start`。

## 停止

`npm start`：在当前终端按 `Ctrl+C`，全部子进程会一起停。直接关掉这个终端时，后台监视进程也会结束这些子进程。其中一个项目退出时，其余项目继续跑。

`npm run start:cmd` 和 `npm run start:tabs`：关掉对应的 cmd 窗口或 Windows Terminal 标签。关掉用来执行启动命令的终端，不会停掉已经打开的窗口。
