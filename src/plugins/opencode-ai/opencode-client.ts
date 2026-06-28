import { GO_ENDPOINT, FALLBACK_MODELS } from "./constants";

interface ChatParams {
  apiKey: string;
  model: string;
  systemPrompt?: string;
  messages: { role: string; content: string }[];
}

export class OpenCodeClient {
  async chat(params: ChatParams) {
    const messages = [
      { role: "system", content: params.systemPrompt || "You are a helpful assistant." },
      ...params.messages,
    ];

    const res = await fetch(`${GO_ENDPOINT}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: params.model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: { message?: string } }).error?.message || `OpenCode API error: ${res.status}`);
    }

    const data = await res.json();
    if (data.error) {
      throw new Error(data.error.message || "OpenCode API returned an error");
    }

    return {
      content: data.choices?.[0]?.message?.content || "",
      model: data.model,
      usage: data.usage,
    };
  }

  async getModels() {
    const res = await fetch(`${GO_ENDPOINT}/models`);
    if (!res.ok) throw new Error("Failed to fetch models");
    const data = await res.json();
    return (data.data || []).map((m: { id: string; name?: string }) => ({ id: m.id, name: m.id }));
  }

  getFallbackModels() {
    return FALLBACK_MODELS;
  }
}
