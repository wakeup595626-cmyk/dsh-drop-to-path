# 回滚说明（一键恢复）

本插件当前为**永久安装**状态（v0.2.1）：已写入 profile 装配文件，重启自动加载。
回滚仍是干净、可一步到位的——对我说一句话即可。

## 用户操作

在 DSH 对话里直接对我说（任意措辞都行）：

> **"回滚上传插件"** / **"卸载 drop-to-path"** / **"把插件恢复原样"**

## 回滚执行内容（我会按顺序全部做完）

1. `dev_uninject_plugin` match=`dsh-drop-to-path`
   - 卸载 host fiber：HTTP 路由 `/_dsh/drop-to-path/import` 注销
   - 卸载 client fiber：paste/drop 监听、sendSession 包装、方块栏全部移除
   - 删除 profile junction `profiles/web/node_modules/@dsh-external/dsh-drop-to-path`
   - 写 profile patch `disabled` 条目（阻断自装配）
2. **清理永久装配写入**（uninject 不管这两行，需手动）：
   - `profiles/web/package.json` → `dependencies` 删除 `"@dsh-external/dsh-drop-to-path": "link:..."`
   - 同文件 → `dsh.profile.bundles` 数组删除 `"@dsh-external/dsh-drop-to-path"`
3. （可选）删除插件源目录 `C:\Users\25653\.dsh\external\dsh-drop-to-path`
4. （可选）删除已上传文件 `<工作区>\.drops\`

完成后刷新页面即回到插件安装前的原生状态；第 1、2 步都做完后重启也不会复活。

## 影响面清单（插件做过的所有事）

| 类型 | 内容 | 回滚方式 |
|---|---|---|
| HTTP 路由 | `POST /_dsh/drop-to-path/import` | 步骤 1 注销 |
| 页面监听 | document 级 paste/drop（capture） | 步骤 1 移除 |
| 原型包装 | `conversation.sendSession` prototype | 步骤 1 fiber dispose 恢复 |
| 页面 DOM | 文件方块栏（data-drop-to-path-chips） | 步骤 1 移除 |
| 持久配置 | profile `package.json` 的 dependencies + bundles | **步骤 2 手动删除** |
| 磁盘文件 | `~/.dsh/external/dsh-drop-to-path/`、工作区 `.drops/` | 步骤 3、4（可选） |

## 版本来源

- 底座：[`loudMore/dsh-drop-to-path`](https://github.com/loudMore/dsh-drop-to-path)（MIT）
- 本地改造（v0.2.x）：文件夹递归拖入（webkitGetAsEntry）、粘贴文件夹检测与引导提示、
  HTML data-URI 图片粘贴（浏览器/微信"复制图片"）、host 支持 relpath/batch 结构化落盘、
  适配新版 Lexical 输入框（data-composer-card / data-input-scroll 锚点 + 方块自愈守卫）
