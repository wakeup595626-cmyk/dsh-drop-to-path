# DSH Drop to Path

[中文](README.md) | **English**

[![Release](https://img.shields.io/github/v/release/wakeup595626-cmyk/dsh-drop-to-path)](https://github.com/wakeup595626-cmyk/dsh-drop-to-path/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![DeepSeek Harness](https://img.shields.io/badge/DeepSeek%20Harness-web-4f46e5)](https://github.com/deepseek-ai/deepseek-harness)

A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugin that turns dropped or pasted files into **workspace file paths**, so a text-only model can reach images, documents, media and archives.

Drop or paste images, PDFs, office documents, archives, video or audio into the composer. The plugin writes each file into the `.drops/` directory of the active session workspace, then rewrites the outgoing message so the model receives the resulting **absolute paths** instead of a binary attachment.

- **Images** keep the native attachment experience (thumbnail, preview, remove). On submit, every draft image is uploaded to the host and replaced by its workspace path.
- **Everything else** — documents, media, archives — appears as a square chip in the attachment rail and is delivered as a path as well.
- The host side registers a single exact route, `POST /_dsh/drop-to-path/import`, and performs the decode-and-write.

## Demo

![Dropping an attachment and receiving a workspace path](assets/demo-flow.gif)

## Quick start

```sh
dsh plugin --profile web add github:wakeup595626-cmyk/dsh-drop-to-path
```

The package is not published on npm yet; use the GitHub installation command above. Restart `dsh web` after installing or updating it.

## Usage

1. Drag files onto the composer, or paste an image from the clipboard.
2. Write your prompt and send it as usual.
3. The model receives workspace file paths such as `<workspace>/.drops/report.pdf`.

Duplicate filenames are disambiguated automatically, so existing drafts are not overwritten.

## Requirements

- A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) installation with the `web` profile
- `@deepseek-ai/cordis` ^4.0.1 (declared as a peer dependency)

## Data and security

- Files are written into the active session workspace's `.drops/` by default. The host accepts an absolute workspace path supplied by the DSH client, so only run this with a trusted DSH web frontend.
- The plugin has no telemetry, cloud upload or third-party runtime dependency. How the model reads the resulting file is governed by your model and DSH sandbox configuration.
- Files in `.drops/` remain on disk; clean them up or add them to your ignore rules when appropriate.

## Compatibility and verification

This release targets the DeepSeek Harness `web` profile. After upgrading DSH, run a quick end-to-end check:

1. drop one image and one PDF into the composer;
2. send the message and confirm the model receives both `.drops/` paths;
3. reopen the session and confirm the historical attachments still resolve.

## Third-party notices

The plugin has no third-party runtime dependencies. Everything it does is implemented against the DeepSeek Harness host and client APIs.

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Community and support

- Report bugs and ask questions through [GitHub Issues](https://github.com/wakeup595626-cmyk/dsh-drop-to-path/issues).
- Browse the wider ecosystem at [awesome-dsh-plugin.com](https://awesome-dsh-plugin.com).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Citation

```bibtex
@misc{dsh-drop-to-path,
  title={dsh-drop-to-path},
  author={wakeup595626-cmyk},
  year={2026},
  publisher={GitHub},
  howpublished={\url{https://github.com/wakeup595626-cmyk/dsh-drop-to-path}},
}
```

## License

[MIT](LICENSE)
