# DSH Drop to Path

**中文** | [English](README.en.md)

[![Release](https://img.shields.io/github/v/release/wakeup595626-cmyk/dsh-drop-to-path)](https://github.com/wakeup595626-cmyk/dsh-drop-to-path/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![DeepSeek Harness](https://img.shields.io/badge/DeepSeek%20Harness-web-4f46e5)](https://github.com/deepseek-ai/deepseek-harness)

把拖入或粘贴进 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的文件转成**工作区文件路径**，让纯文本模型也能读取图片、文档、音视频与压缩包。

把图片、PDF、Office 文档、压缩包、视频或音频拖入输入框（或直接粘贴）。插件会把每个文件写入当前会话工作区的 `.drops/` 目录，并重写待发送的消息，让模型拿到**绝对路径**而不是二进制附件。

- **图片**保留原生附件体验（缩略图、预览、移除）。发送时，每张草稿图片会先上传到 host，再替换为其工作区路径。
- **其余类型**（文档、音视频、压缩包）在附件栏显示为方形 chip，同样以路径形式交给模型。
- host 侧只注册一条精确路由 `POST /_dsh/drop-to-path/import`，负责解码与落盘。

## 演示

![从拖入附件到生成工作区路径](assets/demo-flow.gif)

## 快速开始

```sh
dsh plugin --profile web add github:wakeup595626-cmyk/dsh-drop-to-path
```

该包尚未发布到 npm，请使用上面的 GitHub 安装方式。安装或更新后重启 `dsh web`。

## 使用

1. 把文件拖到输入框上，或从剪贴板直接粘贴图片。
2. 正常写提示词并发送。
3. 模型收到的是工作区文件路径，例如 `<workspace>/.drops/report.pdf`。

文件名会自动去重；同名文件不会覆盖已有草稿。

## 环境要求

- 已安装 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)，并使用 `web` profile
- `@deepseek-ai/cordis` ^4.0.1（已声明为 peer 依赖）

## 数据与安全

- 文件默认写入当前 DSH 会话工作区的 `.drops/`。host 会接受 DSH 客户端传入的绝对工作区路径，因此请只在自己信任的 DSH Web 前端中使用。
- 插件不包含遥测、云端上传或第三方运行时依赖；文件如何被模型读取取决于你使用的模型与 DSH 沙箱配置。
- 工作区中的 `.drops/` 文件会保留，请按需要自行清理或加入忽略规则。

## 兼容性与验证

当前面向 DeepSeek Harness `web` profile。版本升级后建议做一次端到端检查：

1. 拖入一张图片与一份 PDF；
2. 发送消息并确认模型收到 `.drops/` 下的路径；
3. 重新打开会话，确认历史附件仍可解析。

## 第三方声明

本插件没有第三方运行时依赖，全部实现基于 DeepSeek Harness 的 host 与 client API。

详见 [THIRD_PARTY_NOTICES.zh.md](THIRD_PARTY_NOTICES.zh.md)（[English](THIRD_PARTY_NOTICES.md)）。

## 社区与支持

- 通过 [GitHub Issues](https://github.com/wakeup595626-cmyk/dsh-drop-to-path/issues) 报告问题与提问。
- 在 [awesome-dsh-plugin.com](https://awesome-dsh-plugin.com) 浏览更广阔的插件生态。

## 参与贡献

参见 [CONTRIBUTING.zh.md](CONTRIBUTING.zh.md)（[English](CONTRIBUTING.md)）。

## 引用

```bibtex
@misc{dsh-drop-to-path,
  title={dsh-drop-to-path},
  author={wakeup595626-cmyk},
  year={2026},
  publisher={GitHub},
  howpublished={\url{https://github.com/wakeup595626-cmyk/dsh-drop-to-path}},
}
```

## 许可证

[MIT](LICENSE)
