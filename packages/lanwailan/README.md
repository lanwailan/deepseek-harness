# lanwailan 自有功能

这个目录放自己开发的功能，全部以 Cordis 插件的形式挂到官方扩展点上，不修改官方文件，这样同步官方更新时不会冲突。

## 目录

| 路径 | 作用 |
|---|---|
| `hello/` | 示例插件包，注册一个 `greet` 工具；新功能可以复制它改名 |
| `cordis.yml` | 自己插件的 overlay，叠加在官方 profile 之上 |
| `dev.mjs` | 带上 overlay 启动 `pnpm dsh` |
| `sync-upstream.sh` | 同步官方更新 |

## 分支

- `master`：官方代码的纯镜像，只做快进，不在上面提交。
- `dev`：自己的主分支，定期合并 `master`。
- `feature/*`：每个功能单独开分支，做完合回 `dev`。

## 运行

```sh
pnpm install
pnpm run build                      # 首次或同步官方后
node packages/lanwailan/dev.mjs     # 等同于 pnpm dsh web，附带自己的插件
```

启动日志里出现 `[lanwailan-hello] plugin loaded` 说明插件已加载。

## 新增一个功能

1. 复制 `hello/` 为 `packages/lanwailan/<功能名>/`，改 `package.json` 的 `name`（保持 `@lanwailan/` scope，官方的别名生成脚本只处理 `@deepseek-ai/dsh-*`，不会因此改动 `tsconfig.base.json`）。
2. 在 `cordis.yml` 的 `insert` 下加一行，`name` 写 `'./<功能名>/src/index.ts'`。
3. 用到别的官方包时，在 `package.json` 的 `dependencies` 里加 `"@deepseek-ai/<包名>": "workspace:^"`，在 `tsconfig.json` 的 `references` 里加对应目录，然后 `pnpm install`。
4. 类型检查：`pnpm --filter @lanwailan/<包名> typecheck`。官方的 `pnpm run typecheck` 只检查官方列出的文件，不包含这里。

能挂的扩展点（工具、钩子、系统提示词、UI、LLM 适配器等）见 [扩展插件形态](../../docs/cookbook/extension-cookbook.zh.md) 的“功能→机制映射”表，入门教程见 [第一个插件](../../docs/user/develop/basic/index.zh.md)。

## 同步官方更新

```sh
packages/lanwailan/sync-upstream.sh
```

脚本会把 `upstream/master` 快进到 `master` 并推送，再把 `master` 合并进 `dev`。`pnpm-lock.yaml` 冲突时自动取官方版本并重新生成；其他冲突需要手工解决。合并完成后先 `pnpm run build` 确认能跑，再 `git push origin dev`。

`dev` 上用 merge 而不是 rebase：`dev` 已推送到 GitHub，rebase 需要 force push，还会逐个提交重复解决同样的冲突。本仓库已开启 `rerere`，同样的冲突解决过一次后会自动复用。

确实需要改官方代码时，改动越小越好、单独提交并写清原因；更好的做法是给官方提 PR 加一个扩展点，合入后删掉自己的补丁。
