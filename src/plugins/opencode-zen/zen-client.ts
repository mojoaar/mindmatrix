import { getChatUrl, FALLBACK_MODELS } from "./constants";

interface ChatParams {
  apiKey: string;
  model: string;
  systemPrompt?: string;
  messages: { role: string; content: string }[];
}

export class ZenClient {
  async chat(params: ChatParams) {
    const messages = [
      { role: "system", content: params.systemPrompt || "You are a helpful assistant." },
      ...params.messages,
    ];

    const url = getChatUrl(params.model);
    const res = await fetch(url, {
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
      throw new Error((err as any).error?.message || `Zen API error: ${res.status}`);
    }

    const data = await res.json();
    if (data.error) {
      throw new Error(data.error.message || "Zen API returned an error");
    }

    return {
      content: data.choices?.[0]?.message?.content || data.content?.[0]?.text || "",
      model: data.model,
      usage: data.usage,
    };
  }

  async getModels() {
    const res = await fetch("https://opencode.ai/zen/v1/models");
    if (!res.ok) throw new Error("Failed to fetch models");
    const data = await res.json();
    return (data.data || []).map((m: any) => ({
      id: m.id,
      name: m.display_name || m.id,
    }));
  }

  getFallbackModels() {
    return FALLBACK_MODELS;
  }
}
