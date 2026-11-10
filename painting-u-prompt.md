# The Painting U Prompt

[简体中文](painting-u-prompt-zh.md) · [Demo overview](index.html#prompt) · [Painting U Studio](painting-u/) · [Representative prompt as plain text](painting-u-representative-prompt.txt?v=five-dimensions)

Painting U instantiates its prompt according to the privacy attributes considered in a particular inference scenario. It does not use a single fixed prompt for every scenario. The representative instance below covers five dimensions: **identity**, **scene**, **age group**, **financial sensitivity**, and **privacy information**.

Prompt construction starts with evidence attribution. Attribute each cue, then actively connect wearer and loudspeaker evidence across turns. Propose evidence-backed interpretations even when no single fragment states them explicitly. Leave cues with an unclear source unassigned. Attribute-specific reasoning rules then guide inference:

| Dimension | Reasoning guidance |
| --- | --- |
| Identity | Prefer explicit identity cues. Use corroborating evidence concerning the wearer when explicit cues are incomplete, and return “unknown” when evidence is insufficient. |
| Scene | Use contextual evidence to infer the underlying interaction or business scenario. An individual keyword alone does not establish the scene. |
| Age group | Without an explicit age cue, infer only a coarse age range supported by role and contextual evidence. |
| Financial sensitivity | Consider the financial evidence, the magnitude of numerical amounts, and what those amounts mean in context. |
| Privacy information | Connect wearer and loudspeaker cues across turns. Report each privacy finding with an evidence status and references to the supporting fragments. |

For security considerations, this release provides the prompt construction principles and a representative instance for academic reference. It does not release the complete Painting U privacy inference framework, including the full set of scenario-specific templates, inference rules, and prompt orchestration strategies.

## Prompt Construction

This project provides the construction principles and an English prompt template for Painting U. The [plain-text version](painting-u-representative-prompt.txt?v=five-dimensions) contains the same template.

```text
Painting U: Reconstruction and Privacy Profile Inference

[Task]
1. Reconstruct a plausible dialogue from both streams.
   Complete only information supported by the recovered evidence.
2. Analyze the dialogue along five dimensions: identity, scene, age group,
   financial sensitivity, and privacy information.

[Reasoning Rules]
- Evidence attribution:
  Attribute each cue to its source before drawing conclusions.
  Leave fragments with an unclear source unassigned.

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

- Privacy information:
  Actively combine evidence across the wearer and loudspeaker streams and
  across turns. Consider plausible interpretations based on speaker attribution,
  timing, and context, including findings no single fragment states explicitly.
  Report the best-supported conclusions and cite the contributing segment IDs.
  Use "supported" for clear findings and "possible" for plausible findings that
  remain unresolved. Omit findings without evidence. When context and units are
  clear, state supported non-credential numbers directly in the dialogue summary.
  Report authentication and private identifier exposure by category and evidence.
  For each item in privacy_information, include "category", "status", and
  "evidence" (segment IDs). Use an empty array if there are no findings.

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
    {"label": "", "confidence": 0.0, "evidence": []},
  "privacy_information": []
}
```

## Output format and the Naive baseline

The JSON schema standardizes model output for automatic parsing and evaluation. It is an output-format constraint, rather than part of the reasoning mechanism itself. The public template uses `privacy_information` for its fifth dimension. In the paper’s four-attribute evaluation, the **Naive** baseline receives the same recovered evidence and uses the same output schema. It does not receive Painting U's evidence-attribution rules, attribute-specific reasoning guidance, or other inference constraints. This controls for output formatting when evaluating the contribution of prompt construction.

## Relationship to the interactive demonstration

The representative research instance above and the [interactive studio](painting-u/) use different output schemas. The studio's [local server](painting-u/server.py) executes a separate demonstration prompt in model mode. Its result contains `dialogue`, `links`, `privacy_information`, and a nested `profile` object. The profile includes `remote_role` as well as the four privacy dimensions, and each field contains `label` and `evidence` without a `confidence` field. The representative instance instead places the four attributes at the top level and includes `confidence`.

The studio's browser-only rule analysis uses deterministic demonstration logic and does not execute this representative prompt or an LLM. The studio accepts text evidence; it does not run a complete pipeline from raw IMU measurements to a privacy profile. These materials document the representative research prompt without changing the studio's existing inference behavior.
