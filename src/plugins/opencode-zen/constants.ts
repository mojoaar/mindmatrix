export const ZEN_ENDPOINT = "https://opencode.ai/zen/v1";
export const ZEN_DOCS_URL = "https://opencode.ai/docs/zen/";

function getChatSubpath(modelId: string): string {
  if (modelId.startsWith("gpt-")) return "responses";
  if (modelId.startsWith("claude-") || modelId.startsWith("qwen")) return "messages";
  return "chat/completions";
}

export function getChatUrl(modelId: string): string {
  const subpath = getChatSubpath(modelId);
  return `${ZEN_ENDPOINT}/${subpath}`;
}

export const FALLBACK_MODELS = [
  { id: "deepseek-v4-pro", name: "DeepSeek V4 Pro" },
  { id: "deepseek-v4-flash", name: "DeepSeek V4 Flash" },
  { id: "deepseek-v4-flash-free", name: "DeepSeek V4 Flash Free" },
  { id: "gpt-5.5", name: "GPT 5.5" },
  { id: "gpt-5.5-pro", name: "GPT 5.5 Pro" },
  { id: "gpt-5.4", name: "GPT 5.4" },
  { id: "gpt-5.4-pro", name: "GPT 5.4 Pro" },
  { id: "gpt-5.4-mini", name: "GPT 5.4 Mini" },
  { id: "gpt-5.4-nano", name: "GPT 5.4 Nano" },
  { id: "gpt-5.3-codex", name: "GPT 5.3 Codex" },
  { id: "gpt-5.3-codex-spark", name: "GPT 5.3 Codex Spark" },
  { id: "gpt-5.2", name: "GPT 5.2" },
  { id: "gpt-5.1", name: "GPT 5.1" },
  { id: "gpt-5", name: "GPT 5" },
  { id: "gpt-5-nano", name: "GPT 5 Nano" },
  { id: "claude-fable-5", name: "Claude Fable 5" },
  { id: "claude-opus-4-8", name: "Claude Opus 4.8" },
  { id: "claude-opus-4-7", name: "Claude Opus 4.7" },
  { id: "claude-opus-4-6", name: "Claude Opus 4.6" },
  { id: "claude-opus-4-5", name: "Claude Opus 4.5" },
  { id: "claude-opus-4-1", name: "Claude Opus 4.1" },
  { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6" },
  { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5" },
  { id: "claude-sonnet-4", name: "Claude Sonnet 4" },
  { id: "claude-haiku-4-5", name: "Claude Haiku 4.5" },
  { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash" },
  { id: "gemini-3.1-pro", name: "Gemini 3.1 Pro" },
  { id: "gemini-3-flash", name: "Gemini 3 Flash" },
  { id: "qwen3.7-max", name: "Qwen3.7 Max" },
  { id: "qwen3.7-plus", name: "Qwen3.7 Plus" },
  { id: "qwen3.6-plus", name: "Qwen3.6 Plus" },
  { id: "qwen3.5-plus", name: "Qwen3.5 Plus" },
  { id: "minimax-m2.7", name: "MiniMax M2.7" },
  { id: "minimax-m2.5", name: "MiniMax M2.5" },
  { id: "glm-5.1", name: "GLM 5.1" },
  { id: "glm-5", name: "GLM 5" },
  { id: "kimi-k2.6", name: "Kimi K2.6" },
  { id: "kimi-k2.5", name: "Kimi K2.5" },
  { id: "grok-build-0.1", name: "Grok Build 0.1" },
  { id: "big-pickle", name: "Big Pickle" },
  { id: "mimo-v2.5-free", name: "MiMo-V2.5 Free" },
  { id: "north-mini-code-free", name: "North Mini Code Free" },
  { id: "nemotron-3-ultra-free", name: "Nemotron 3 Ultra Free" },
];
