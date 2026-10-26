# Painting U workspace

A bilingual workspace for inspecting time-stamped wearer keywords and reconstructed remote speech, linking evidence, and reviewing tentative profiles.

## Connect a model API online

Open [English](https://vib2eve.github.io/painting-u/index.html#analysis) or [简体中文](https://vib2eve.github.io/painting-u/zh.html#analysis). Under **Model API configuration**, enter your OpenAI-compatible API URL, model name, and API key. Add or load evidence, then select **Run model analysis**.

The API URL can be a base path ending in `/v1` or the complete `/chat/completions` endpoint. Use HTTPS for remote APIs. The browser sends a non-streaming Chat Completions request to the endpoint you enter; the provider must allow cross-origin browser requests (CORS). Requests time out after 70 seconds. Authentication, quota, network, and output-format errors appear in the workspace; a failed model request does not produce a rule result.

The API key remains in the current page and request. The application does not write it to browser storage or include it in evidence/result exports. **Clear key** removes it immediately; leaving the page clears the field. Evidence and the key go to your configured provider. The public website has no shared API key or hosted inference proxy.

## Use the local proxy

If your API does not allow browser requests, run the optional proxy with Python 3.9+ and no extra packages. From this directory:

```sh
python3 server.py
```

Open `http://127.0.0.1:8765/` or `http://127.0.0.1:8765/painting-u/zh.html`. The workspace detects the proxy, labels the connection **Local proxy ready**, and sends model requests through it. Use `python3 server.py --port 8766` if the default port is occupied. Stop with `Ctrl+C`.

The proxy binds to `127.0.0.1`, accepts same-origin requests, and refuses API redirects. Remote endpoints require HTTPS; HTTP is allowed only for loopback endpoints. A generic static HTTP server uses browser API mode instead of the proxy.

## Demonstration scope

The workspace accepts recovered text evidence. **Run rule demo** uses preset browser rules without calling a language model. It illustrates the workspace flow and requires no API. **Run model analysis** sends the evidence to your model with the workspace's demonstration prompt. Both modes return the same workspace schema: `dialogue`, `links`, and a `profile` containing `remote_role`, `identity`, `scene`, `age_group`, and `financial_sensitivity`. Labels cite input segment IDs; unsupported fields remain undetermined. Valid references establish provenance, not correctness.

The staged account-verification example illustrates source attribution. It is not research data or an experimental result. The workspace does not execute the complete pipeline from raw IMU measurements to a privacy profile. The demonstration prompt remains separate from the representative research prompt in the project documentation.

## Release scope

This public directory contains the bilingual workspace, its assets, this guide, and the optional local proxy. It excludes paper sources, research datasets, model weights, and API credentials.

---

## 在线连接模型 API

打开[中文工作台](https://vib2eve.github.io/painting-u/zh.html#analysis)或[英文工作台](https://vib2eve.github.io/painting-u/index.html#analysis)，在“**模型 API 配置**”中填写兼容 OpenAI 的接口地址、模型名称和 API 密钥。录入或加载证据后，点击“**运行模型分析**”。

地址可填写以 `/v1` 结尾的基础路径或完整 `/chat/completions` 路径。远程接口须使用 HTTPS。网页会直接向您填写的接口发送非流式 Chat Completions 请求，因此服务商需要允许浏览器跨域（CORS）请求。请求等待上限为 70 秒；认证、额度、网络及响应格式错误会在页面显示，调用失败不会自动替换成规则结果。

密钥仅保留在当前页面和请求中，本程序不写入浏览器存储，也不包含在证据或结果导出文件中。点击“清除密钥”可立即移除；离开页面会清空密钥字段。证据和密钥发送至您配置的服务商。公开网站没有共用密钥或托管的推理代理。

## 使用本地代理

如果接口不允许浏览器跨域请求，请在本目录运行 `python3 server.py`，然后打开 `http://127.0.0.1:8765/painting-u/zh.html`。需要 Python 3.9 或更新版本，无需额外依赖。工作台检测到服务后显示“本地代理已就绪”，模型请求通过代理转发。端口占用时使用 `python3 server.py --port 8766`，按 `Ctrl+C` 停止。

代理仅监听本机地址，接受同源请求并拒绝 API 重定向。远程接口须使用 HTTPS，HTTP 仅支持本机回环地址。使用普通静态 HTTP 服务时，工作台采用浏览器直连模式。

## 演示范围

工作台接收恢复后的文本证据。“运行规则演示”仅用预设浏览器规则展示操作流程，不调用大模型，无需 API；“运行模型分析”使用独立的工作台演示 Prompt 调用您配置的模型。两种模式均输出 `dialogue`、`links` 和包含五个字段的 `profile`，并检查引用的片段 ID。缺少有效证据引用的属性返回“无法确定”；有效引用仅说明证据出处，不保证判断正确。

账户验证示例用于说明证据归属，不属于研究数据或实验结果。网页不执行从原始 IMU 信号到隐私画像的完整流程。演示 Prompt 与项目文档中的代表性研究 Prompt 保持独立。本公开目录不包含论文源码、研究数据、训练权重或 API 密钥。
