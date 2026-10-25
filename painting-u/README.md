# Painting U Studio

A bilingual workspace for inspecting time-stamped wearer keywords and reconstructed remote speech, linking evidence, and reviewing tentative profiles.

## Demonstration scope

The workspace accepts text evidence. Its staged account-verification example illustrates source attribution; it is not research data or an experimental result. Browser analysis uses deterministic rule logic, not a trained model. The hosted site does not execute the complete pipeline from raw IMU measurements to a privacy profile.

## Run locally

Requires Python 3.9+ and no extra packages. From this directory, run:

```sh
python3 server.py
```

Open `http://127.0.0.1:8765/` or `http://127.0.0.1:8765/painting-u/zh.html`. For the static browser demonstration, open `index.html` or `zh.html` directly and keep `assets/` beside them. GitHub Pages supports the browser demonstration only.

## Model API mode

The optional local proxy accepts a user-configured OpenAI-compatible endpoint, model name, and API key. The supplied evidence is sent to that endpoint. The key is held in memory for the current page/request and is not written to disk. The proxy binds to `127.0.0.1`, accepts same-origin requests, and refuses redirects.

## Release scope

This public directory contains only the bilingual workspace, its assets, this documentation, and the optional local proxy. It excludes paper sources, research datasets, model weights, and API credentials.

---

## 中文说明

Painting U 双语工作台用于查看带时间戳的佩戴者关键词与远端语音片段、梳理证据关联，并检查暂定画像。页面接收文本证据；账户验证示例用于说明证据归属，不属于研究数据或实验结果。网页内规则分析采用确定性演示逻辑，不是训练模型；GitHub Pages 仅运行浏览器演示，不执行从原始 IMU 数据到隐私画像的完整流程。

### 本地运行

需要 Python 3.9 或更新版本，无需安装其他依赖。在本目录运行 `python3 server.py`，然后打开 `http://127.0.0.1:8765/` 或中文版 `http://127.0.0.1:8765/painting-u/zh.html`。静态规则演示也可直接打开 `index.html` 或 `zh.html`，并保留旁边的 `assets/` 目录。

### 模型接口

可选本地代理支持用户配置的 OpenAI 兼容接口、模型名称和 API 密钥；输入证据会发送给该接口。密钥只在当前页面和请求中保留，不写入磁盘。代理仅监听本机地址、接受同源请求并拒绝重定向。

### 发布范围

本公开目录只包含双语工作台、网页资源、本说明和可选本地代理，不包含论文源码、研究数据、模型权重或 API 密钥。
