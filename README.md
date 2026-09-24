# @dsh-external/dsh-drop-to-path

English | [中文](README.zh.md)

A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugin that turns dropped or pasted files into **workspace file paths**, so a text-only model can reach their contents.

Drop or paste images, PDFs, office documents, archives, video or audio into the composer. The plugin writes each file into the `.drops/` directory of the active session workspace, then rewrites the outgoing message so the model receives the resulting **absolute paths** instead of a binary attachment.

- **Images** keep the native attachment experience (thumbnail, preview, remove). On submit, every draft image is uploaded to the host and replaced by its workspace path.
- **Everything else**  documents, media, archives  appears as a square chip in the attachment rail and is delivered as a path as well.
- The host side registers a single exact route, `POST /_dsh/drop-to-path/import`, and performs the decode-and-write.

## Install

```sh
dsh plugin --profile web add github:wakeup595626-cmyk/dsh-drop-to-path
```

## Usage

1. Drag files onto the composer, or paste an image from the clipboard.
2. Write your prompt and send it as usual.
3. The model receives workspace file paths such as `<workspace>/.drops/report.pdf`.

## Requirements

- A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) installation with the `web` profile
- `@deepseek-ai/cordis` ^4.0.1 (declared as a peer dependency)

## Third-party notices

This plugin has no third-party runtime dependencies. Everything it does is implemented against the DeepSeek Harness host and client APIs.

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Community and support

- Report bugs and ask questions through [GitHub Issues](https://github.com/wakeup595626-cmyk/dsh-drop-to-path/issues).
- Add the [`dsh-plugin`](https://github.com/topics/dsh-plugin) topic to your own plugin repository for discoverability.
- Browse the wider ecosystem at [awesome-dsh-plugin.com](https://awesome-dsh-plugin.com).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Citation

```bibtex
@misc{dsh-drop-to-path,
  title={dsh-drop-to-path},
  author={wakeUp595626-cmyk},
  year={2026},
  publisher={GitHub},
  howpublished={\url{https://github.com/wakeup595626-cmyk/dsh-drop-to-path}},
}
```

## License

[MIT](LICENSE)
