# Painting U 提示词的构建

[English](painting-u-prompt.md) · [演示总览](zh.html#prompt) · [Painting U 交互演示](painting-u/zh.html) · [代表性提示词纯文本](painting-u-representative-prompt.txt)

Painting U 根据具体推理场景所关注的隐私属性构建提示词，并非所有场景共用一个固定提示词。下方代表性实例围绕论文评估中的四个维度展开：**身份**（identity）、**场景**（scene）、**年龄段**（age group）和**金融敏感度**（financial sensitivity）。

提示词首先约束证据归属：在组合与解释恢复出的线索之前，先确定每条线索来自谁。自述角色通常属于说出该角色的人；无法确定归属的片段保持未分配状态。在此基础上，各隐私维度采用相应的推理规则：

| 维度 | 推理规则 |
| --- | --- |
| 身份 | 优先采用明确的身份线索。线索不完整时，仅依据与佩戴者有关且相互印证的证据推断；证据不足时返回“unknown”。 |
| 场景 | 根据上下文判断实际交互或业务场景，避免凭单个关键词确定场景。 |
| 年龄段 | 缺少明确年龄线索时，仅根据有依据的角色与上下文推断粗粒度年龄范围。 |
| 金融敏感度 | 同时考虑财务证据本身、数值金额的大小，以及这些金额在具体上下文中的意义。 |

出于安全考虑，本次公开内容限于提示词构建原则与供学术参考的代表性实例，不发布完整的 Painting U 隐私推理框架，包括全部场景模板、推理规则和提示词编排策略。

## Prompt 构建

本项目提供 Painting U 的 Prompt 构建说明与英文模板。[纯文本版本](painting-u-representative-prompt.txt)包含相同的模板内容。

```text
Painting U: Reconstruction and Privacy Profile Inference

[Task]
1. Reconstruct a plausible dialogue from both streams.
   Complete only information supported by the recovered evidence.
2. Infer the wearer's profile along four attributes:
   identity, scene, age group, and financial sensitivity.

[Reasoning Rules]
- Evidence attribution:
  Attribute each cue to its source before drawing conclusions.
  Self-reported roles normally describe the person who states them.
  Unattributable fragments remain unassigned.

- Identity:
  Prefer explicit identity cues. When such cues are incomplete,
  infer identity only from corroborating evidence concerning the wearer;
  otherwise return "unknown".

- Scene:
  Infer the underlying interaction or business scenario from contextual
  evidence rather than individual keywords.

- Age group:
  When no explicit age cue is available, infer only a coarse age range
  from supported role and contextual evidence.

- Financial sensitivity:
  Consider both the financial evidence itself and the contextual
  significance of numerical amounts.

[Output Constraint]
Return one valid JSON object with no additional text:
{
  "dialogue": "...",
  "identity":
    {"label": "", "confidence": 0.0, "evidence": []},
  "scene":
    {"label": "", "confidence": 0.0, "evidence": []},
  "age_group":
    {"label": "", "confidence": 0.0, "evidence": []},
  "financial_sensitivity":
    {"label": "", "confidence": 0.0, "evidence": []}
}
```

## 输出格式与 Naive 基线

JSON schema 用于统一模型输出，便于自动解析和评估；它属于输出格式约束，本身不构成推理机制。论文评估中的 **Naive** 基线接收相同的恢复证据，并遵循相同的输出 schema，但不接收 Painting U 的证据归属规则、各属性的推理指导或其他推理约束。这一设计控制了输出格式的影响，使评估关注提示词构建本身的贡献。

## 与交互演示的关系

上述研究代表实例与[交互演示](painting-u/zh.html)使用不同的输出 schema。交互演示的[本地服务](painting-u/server.py)在模型模式下执行独立的演示提示词，返回 `dialogue`、`links` 和嵌套的 `profile` 对象。`profile` 除四个隐私维度外还包含 `remote_role`，各字段包含 `label` 与 `evidence`，不含 `confidence`。上述代表实例则将四个属性置于顶层，并包含 `confidence` 字段。

网页中的本地规则分析使用浏览器内的确定性演示逻辑，不执行上述代表性提示词，也不调用 LLM。交互演示接收文本证据，尚未实现从原始 IMU 数据到隐私画像的完整流水线。这些文档用于说明研究代表性提示词，不改变现有交互演示的推理行为。
