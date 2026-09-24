# @dsh-external/dsh-drop-to-path

[English](README.md) | 中文

一个 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 插件：把拖入或粘贴的文件转成**工作区文件路径**，让纯文本模型也能读取其内容。

把图片、PDF、Office 文档、压缩包、视频或音频拖入输入框（或直接粘贴）。插件会把每个文件写入当前会话工作区的 `.drops/` 目录，并重写待发送的消息，让模型拿到**绝对路径**而不是二进制附件。

- **图片**保留原生附件体验（缩略图、预览、移除）。发送时，每张草稿图片会先上传到 host，再替换为其工作区路径。
- **其余类型**（文档、音视频、压缩包）在附件栏显示为方形 chip，同样以路径形式交给模型。
- host 侧只注册一条精确路由 `POST /_dsh/drop-to-path/import`，负责解码与落盘。

## 安装

```sh
dsh plugin --profile web add github:wakeup595626-cmyk/dsh-drop-to-path
```

## 使用

1. 把文件拖到输入框上，或从剪贴板直接粘贴图片。
2. 正常写提示词并发送。
3. 模型收到的是工作区文件路径，例如 `<workspace>/.drops/report.pdf`。

## 环境要求

- 已安装 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)，并使用 `web` profile
- `@deepseek-ai/cordis` ^4.0.1（已声明为 peer 依赖）

## 第三方声明

本插件没有任何第三方运行时依赖，全部实现基于 DeepSeek Harness 的 host 与 client API。

See [THIRD_PARTY_NOTICES.zh.md](THIRD_PARTY_NOTICES.zh.md).

## 社区与支持

- Report bugs and ask questions through [GitHub Issues](https://github.com/wakeup595626-cmyk/dsh-drop-to-path/issues).
- Add the [`dsh-plugin`](https://github.com/topics/dsh-plugin) topic to your own plugin repository for discoverability.
- Browse the wider ecosystem at [awesome-dsh-plugin.com](https://awesome-dsh-plugin.com).

## 参与贡献

See [CONTRIBUTING.zh.md](CONTRIBUTING.zh.md).

## 引用

```bibtex
@misc{dsh-drop-to-path,
  title={dsh-drop-to-path},
  author={wakeUp595626-cmyk},
  year={2026},
  publisher={GitHub},
  howpublished={\url{https://github.com/wakeup595626-cmyk/dsh-drop-to-path}},
}
```

## 许可证

[MIT](LICENSE)
