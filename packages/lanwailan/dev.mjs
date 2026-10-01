#!/usr/bin/env node
// 带上 packages/lanwailan/cordis.yml 里的插件启动 dsh，其余参数原样转给 `pnpm dsh`：
//   node packages/lanwailan/dev.mjs            # 等同于 web
//   node packages/lanwailan/dev.mjs web --dump-config
import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { constants, tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '../..')

// loader 只接受绝对路径：把 `name: './...'` 换成本目录下的绝对路径。
const overlay = readFileSync(join(here, 'cordis.yml'), 'utf8')
  .replace(/^(\s*(?:-\s+)?name:\s*)(['"]?)\.\//gm, (_, key, quote) => `${key}${quote}${here}/`)
const tmp = mkdtempSync(join(tmpdir(), 'lanwailan-'))
const patch = join(tmp, 'cordis.yml')
writeFileSync(patch, overlay)
process.on('exit', () => rmSync(tmp, { recursive: true, force: true }))

const args = process.argv.slice(2)
const child = spawn('pnpm', ['dsh', ...(args.length ? args : ['web']), '--patch', patch], {
  cwd: root,
  stdio: 'inherit',
})
// 终端的 Ctrl+C 会同时发给 dsh，这里只等它退出；其他信号转发过去。
process.on('SIGINT', () => {})
for (const sig of ['SIGTERM', 'SIGHUP']) process.on(sig, () => child.kill(sig))
child.on('exit', (code, signal) => process.exit(code ?? 128 + (constants.signals[signal] ?? 0)))
